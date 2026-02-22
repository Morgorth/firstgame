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
        pipeColor:       0x1A0030,
        pipeEmissive:    0x0F001E,
        wireColor:       0xFF69B4,
        wireOpacity:     0.32,
        fogColor:        0x0A0018,
        clearColor:      0x0A0018,
        neonA:           0xFF69B4,
        neonB:           0xDA70D6,
        ringColor:       0xFF69B4,
        ringEmissive:    0x441133,
        bumperColor:     0x667788,
        bumperEmissive:  0x223344,
        bombColor:       0x2D5A27,
        bombEmissive:    0x0A1A08,
        barrierColor:    0x4B0082,
        barrierEmissive: 0x1A0030,
        starColor:       0xFFCCEE,
        ambientColor:    0x442255,
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

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 6000);
    camera.position.set(0, CONFIG.pipe.radius * 0.12, 280);
    camera.lookAt(0, CONFIG.pipe.radius * 0.06, -800);

    _ambientLight = new THREE.AmbientLight(T.theme.ambientColor, 1.2);
    scene.add(_ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(300, 600, 300);
    scene.add(dirLight);

    _neonLightA = new THREE.PointLight(T.theme.neonA, 2.5, 800);
    _neonLightA.position.set(-200, 50, -600);
    scene.add(_neonLightA);
    _neonLightB = new THREE.PointLight(T.theme.neonB, 2.5, 800);
    _neonLightB.position.set(200, 50, -600);
    scene.add(_neonLightB);

    gameState.scene    = scene;
    gameState.camera   = camera;
    gameState.renderer = renderer;

    buildPipePool();
    buildPlayerMeshes();
    buildStarfield();

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
    const T     = getTheme();
    const count = 1800;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 8000;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 4000 + 1000;
        pos[i * 3 + 2] = -Math.random() * 6000;
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    _starfieldMat = new THREE.PointsMaterial({ color: T.theme.starColor, size: 3, sizeAttenuation: true });
    gameState.scene.add(new THREE.Points(geo, _starfieldMat));
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
    if (_starfieldMat) _starfieldMat.color.set(T.theme.starColor);

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
