// render.js — Three.js scene orchestrator for Sonic Half-Pipe.
// Owns: RENDER_THEME constants, getTheme(), scene/lights init, starfield,
//       applyThemeToScene(), clearSceneItems(), and the renderFrame() loop.
// Sub-modules loaded after this file supply all build/update functions:
//   render-pipe.js, render-theme-unicorn.js, render-player.js,
//   render-obstacles.js, render-rings.js, render-particles.js

// ── Per-theme visual constants ────────────────────────────────────────
//
// Add a new entry here and a matching render-theme-*.js to add a theme.
const RENDER_THEME = {
    default: {
        pipeColor:       0x112244,
        pipeEmissive:    0x001133,
        wireColor:       0x0066ff,
        wireOpacity:     0.25,
        fogColor:        0x000011,
        clearColor:      0x000011,
        neonA:           0x00ffff,
        neonB:           0xff00ff,
        ringColor:       0xFFD700,
        ringEmissive:    0x554400,
        bumperColor:     0xff6600,
        bumperEmissive:  0x331100,
        bombColor:       0x222222,
        bombEmissive:    0x111111,
        barrierColor:    0xff0044,
        barrierEmissive: 0x330011,
        starColor:       0xffffff,
        ambientColor:    0x334466,
    },
    unicorn: {
        pipeColor:       0x220045,   // deep purple pipe
        pipeEmissive:    0x16002c,
        wireColor:       0xFF44CC,   // vivid hot-pink neon grid
        wireOpacity:     0.44,       // more visible rainbow grid
        fogColor:        0x0A0018,
        clearColor:      0x0A0018,
        neonA:           0xFF00CC,   // vivid magenta point light
        neonB:           0x9900FF,   // vivid violet point light
        ringColor:       0xFFD700,   // gold rings — pop against pink pipe
        ringEmissive:    0x554400,
        bumperColor:     0x667788,
        bumperEmissive:  0x223344,
        bombColor:       0x2D5A27,
        bombEmissive:    0x0A1A08,
        barrierColor:    0x6600CC,   // bright purple barrier
        barrierEmissive: 0x220066,
        starColor:       0xFFCCEE,   // fallback (vertex colours used instead)
        ambientColor:    0x551166,   // richer ambient purple
    },
};

// Returns the active RENDER_THEME entry plus boolean helpers.
function getTheme() {
    const theme = RENDER_THEME[gameTheme] || RENDER_THEME.default;
    return {
        isUnicorn: gameTheme === 'unicorn',
        isDefault: !RENDER_THEME[gameTheme] || gameTheme === 'default',
        theme,
    };
}

// ── Module-level refs for live theme updates ─────────────────────────
let _neonLightA   = null;
let _neonLightB   = null;
let _ambientLight = null;
let _starfieldMat = null;
let _starfieldPts = null;   // tracked so it can be rebuilt on theme change

// ── Scene initialisation ─────────────────────────────────────────────

function initScene() {
    const canvas = document.getElementById('gameCanvas');
    const T      = getTheme();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(T.theme.clearColor);

    const scene = new THREE.Scene();
    scene.fog   = new THREE.Fog(T.theme.fogColor, 1200, 4800);

    const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 1, 6000);
    // Inside-the-bowl perspective — camera sits within the pipe walls, looking forward and slightly down.
    camera.position.set(0, CONFIG.pipe.radius * 0.55, 580);
    camera.lookAt(0, -CONFIG.pipe.radius * 0.15, -280);

    _ambientLight = new THREE.AmbientLight(T.theme.ambientColor, 1.2);
    scene.add(_ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(300, 600, 300);
    scene.add(dirLight);

    const neonIntensity = T.isUnicorn ? 3.5 : 2.5;
    _neonLightA = new THREE.PointLight(T.theme.neonA, neonIntensity, 900);
    _neonLightA.position.set(-200, 50, -600);
    scene.add(_neonLightA);
    _neonLightB = new THREE.PointLight(T.theme.neonB, neonIntensity, 900);
    _neonLightB.position.set(200, 50, -600);
    scene.add(_neonLightB);

    gameState.scene    = scene;
    gameState.camera   = camera;
    gameState.renderer = renderer;

    buildPipePool();
    buildPlayerMeshes();
    buildStarfield();

    if (T.isUnicorn) showUnicornBackground();

    window.addEventListener('resize', onResize);
}

function onResize() {
    const r = gameState.renderer;
    if (!r) return;
    r.setSize(window.innerWidth, window.innerHeight);
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
}

// ── Starfield ────────────────────────────────────────────────────────

function buildStarfield() {
    // Remove existing starfield so it can be rebuilt on theme switch
    if (_starfieldPts) {
        gameState.scene.remove(_starfieldPts);
        _starfieldPts = null;
        _starfieldMat = null;
    }

    const T     = getTheme();
    const count = T.isUnicorn ? 2400 : 1800;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 8000;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 4000 + 1000;
        pos[i * 3 + 2] = -Math.random() * 6000;
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));

    if (T.isUnicorn) {
        // Rainbow vertex colours for a magical sparkle field
        const palette = [
            [1.00, 0.79, 0.94],  // hot pink
            [1.00, 0.85, 1.00],  // light violet
            [0.87, 0.80, 1.00],  // lavender
            [1.00, 0.87, 0.53],  // gold
            [1.00, 1.00, 1.00],  // white
            [0.62, 0.92, 1.00],  // sky blue
            [0.85, 1.00, 0.75],  // mint
        ];
        const cols = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const c       = palette[Math.floor(Math.random() * palette.length)];
            cols[i * 3]   = c[0];
            cols[i * 3 + 1] = c[1];
            cols[i * 3 + 2] = c[2];
        }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        _starfieldMat = new THREE.PointsMaterial({
            vertexColors:    true,
            size:            3.8,
            sizeAttenuation: true,
        });
    } else {
        _starfieldMat = new THREE.PointsMaterial({
            color:           T.theme.starColor,
            size:            3,
            sizeAttenuation: true,
        });
    }

    _starfieldPts = new THREE.Points(geo, _starfieldMat);
    gameState.scene.add(_starfieldPts);
}

// ── Main render frame ────────────────────────────────────────────────

function renderFrame() {
    if (!gameState.renderer) return;

    updatePipePool();
    updatePlayerMeshes();
    updateObstacleMeshes();
    updateRingMeshes();
    updateParticleMeshes();

    gameState.renderer.render(gameState.scene, gameState.camera);
}

// ── Live theme application ───────────────────────────────────────────
// Called by ui.js:selectTheme() and at the start of each game.
// Updates all long-lived scene objects without a full reinitialisation.

function applyThemeToScene() {
    if (!gameState.scene) return;
    const T = getTheme();

    if (gameState.scene.fog) {
        gameState.scene.fog.color.set(T.theme.fogColor);
    }
    if (gameState.renderer) {
        gameState.renderer.setClearColor(T.theme.clearColor);
    }

    if (_neonLightA)   _neonLightA.color.set(T.theme.neonA);
    if (_neonLightB)   _neonLightB.color.set(T.theme.neonB);
    if (_ambientLight) _ambientLight.color.set(T.theme.ambientColor);

    // Update neon light intensity per theme
    const neonIntensity = T.isUnicorn ? 3.5 : 2.5;
    if (_neonLightA) _neonLightA.intensity = neonIntensity;
    if (_neonLightB) _neonLightB.intensity = neonIntensity;

    // Rebuild starfield (unicorn uses vertex colours, default uses a single colour)
    buildStarfield();

    // Show / hide the unicorn castle background
    if (T.isUnicorn) {
        showUnicornBackground();
    } else {
        hideUnicornBackground();
    }

    // Rebuild pipe pool with new colours
    for (const seg of gameState.pipeSegments) {
        gameState.scene.remove(seg);
    }
    gameState.pipeSegments = [];
    buildPipePool();

    buildPlayerMeshes();

    document.body.className = gameTheme === 'default' ? '' : 'theme-' + gameTheme;
}

// ── Dispose on game reset ────────────────────────────────────────────

function clearSceneItems() {
    for (const obs of gameState.obstacles) {
        if (obs.mesh) gameState.scene.remove(obs.mesh);
    }
    for (const ring of gameState.ringItems) {
        if (ring.mesh) gameState.scene.remove(ring.mesh);
    }
    for (const pt of gameState.particles) {
        if (pt.mesh) gameState.scene.remove(pt.mesh);
    }
}
