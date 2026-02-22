// Three.js rendering for Sonic Half-Pipe.
// Builds the pipe, player meshes, obstacles, rings, and particles.

// ── Per-theme visual constants ────────────────────────────────────────
//
// Add a new entry here and a matching render-theme-*.js to add a theme.
// Fields mirror Wave Assault's RENDER_THEME for consistency.
const RENDER_THEME = {
    default: {
        pipeColor:       0x112244,
        pipeEmissive:    0x001133,
        wireColor:       0x0066ff,
        wireOpacity:     0.25,
        fogColor:        0x000011,
        clearColor:      0x000011,
        neonA:           0x00ffff,   // left neon point light
        neonB:           0xff00ff,   // right neon point light
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
        wireColor:       0xFF69B4,   // hot pink lattice
        wireOpacity:     0.32,
        fogColor:        0x0A0018,
        clearColor:      0x0A0018,
        neonA:           0xFF69B4,   // pink
        neonB:           0xDA70D6,   // orchid
        ringColor:       0xFF69B4,   // magic pink rings
        ringEmissive:    0x441133,
        bumperColor:     0x667788,   // storm cloud gray
        bumperEmissive:  0x223344,
        bombColor:       0x2D5A27,   // bramble green
        bombEmissive:    0x0A1A08,
        barrierColor:    0x4B0082,   // dark magic purple
        barrierEmissive: 0x1A0030,
        starColor:       0xFFCCEE,   // pink-tinted sparkles
        ambientColor:    0x442255,
    },
};

// Returns the active RENDER_THEME entry plus boolean helpers.
// Call once per frame and pass the result down.
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
    const T = getTheme();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(T.theme.clearColor);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(T.theme.fogColor, 1200, 4800);

    // Camera: sits slightly behind and above the player
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 6000);
    camera.position.set(0, CONFIG.pipe.radius * 0.12, 280);
    camera.lookAt(0, CONFIG.pipe.radius * 0.06, -800);

    // Ambient + directional light
    _ambientLight = new THREE.AmbientLight(T.theme.ambientColor, 1.2);
    scene.add(_ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(300, 600, 300);
    scene.add(dirLight);

    // Neon point lights — stored for live theme updates
    _neonLightA = new THREE.PointLight(T.theme.neonA, 2.5, 800);
    _neonLightA.position.set(-200, 50, -600);
    scene.add(_neonLightA);
    _neonLightB = new THREE.PointLight(T.theme.neonB, 2.5, 800);
    _neonLightB.position.set(200, 50, -600);
    scene.add(_neonLightB);

    gameState.scene = scene;
    gameState.camera = camera;
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

// ── Half-pipe geometry ───────────────────────────────────────────────

function buildPipeSegment(zOffset) {
    const cfg = CONFIG.pipe;
    const halfArc = (cfg.arcDegrees / 2) * (Math.PI / 180);
    const radialSegs = 48;
    const lengthSegs = 6;

    // Hollow half-pipe using CylinderGeometry with open ends, clipped to arc
    // Instead, use TubeGeometry along a straight path with custom cross-section.
    const points = [];
    for (let i = 0; i <= radialSegs; i++) {
        const t = i / radialSegs;
        const angle = -halfArc + t * 2 * halfArc;
        points.push(new THREE.Vector2(
            Math.sin(angle) * cfg.radius,
            -Math.cos(angle) * cfg.radius
        ));
    }
    const shape = new THREE.BufferGeometry();
    const verts = [];
    const uvs = [];
    const indices = [];

    for (let seg = 0; seg <= lengthSegs; seg++) {
        const z = zOffset + (seg / lengthSegs) * cfg.segmentLength;
        for (let i = 0; i <= radialSegs; i++) {
            const p = points[i];
            verts.push(p.x, p.y + cfg.radius, -z);
            uvs.push(i / radialSegs, seg / lengthSegs);
        }
    }

    for (let seg = 0; seg < lengthSegs; seg++) {
        const base = seg * (radialSegs + 1);
        for (let i = 0; i < radialSegs; i++) {
            const a = base + i;
            const b = base + i + 1;
            const c = base + (radialSegs + 1) + i;
            const d = base + (radialSegs + 1) + i + 1;
            indices.push(a, c, b, b, c, d);
        }
    }

    shape.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    shape.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    shape.setIndex(indices);
    shape.computeVertexNormals();

    // Neon grid material — colours driven by current theme
    const T = getTheme();
    const mat = new THREE.MeshStandardMaterial({
        color:    T.theme.pipeColor,
        emissive: T.theme.pipeEmissive,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.BackSide,
        wireframe: false,
    });
    const mesh = new THREE.Mesh(shape, mat);

    // Wireframe overlay for the retro neon-grid look
    const wireMat = new THREE.MeshBasicMaterial({
        color:       T.theme.wireColor,
        wireframe:   true,
        transparent: true,
        opacity:     T.theme.wireOpacity,
    });
    const wire = new THREE.Mesh(shape.clone(), wireMat);
    const group = new THREE.Group();
    group.add(mesh);
    group.add(wire);
    return group;
}

function buildPipePool() {
    const cfg = CONFIG.pipe;
    gameState.pipeSegments = [];
    for (let i = 0; i < cfg.segmentCount; i++) {
        const seg = buildPipeSegment(i * cfg.segmentLength);
        gameState.scene.add(seg);
        gameState.pipeSegments.push(seg);
    }
}

function updatePipePool() {
    // Scroll pipe segments and recycle
    const cfg = CONFIG.pipe;
    const spd = gameState.speed;
    for (const seg of gameState.pipeSegments) {
        // Move the segment towards the camera along Z
        seg.position.z += spd;
        if (seg.position.z > cfg.segmentLength * 1.5) {
            seg.position.z -= cfg.segmentCount * cfg.segmentLength;
        }
    }
}

// ── Starfield ────────────────────────────────────────────────────────

function buildStarfield() {
    const T = getTheme();
    const count = 1800;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * 8000;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 4000 + 1000;
        pos[i * 3 + 2] = -Math.random() * 6000;
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    _starfieldMat = new THREE.PointsMaterial({ color: T.theme.starColor, size: 3, sizeAttenuation: true });
    gameState.scene.add(new THREE.Points(geo, _starfieldMat));
}

// ── Player meshes ────────────────────────────────────────────────────

// Default-theme player mesh builder (the original blob + eyes + trail).
function _buildDefaultPlayerMesh(playerIndex) {
    const colors = [
        { body: 0x00ffff, emissive: 0x006666, trail: 0x00ffff },
        { body: 0xff00ff, emissive: 0x660066, trail: 0xff00ff },
    ];
    const c = colors[playerIndex];
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
        color: c.body, emissive: c.emissive, roughness: 0.3,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(28, 16, 12), bodyMat);
    body.scale.set(0.9, 1.15, 0.9);
    group.add(body);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 8), eyeMat);
    leftEye.position.set(-9, 8, 24);
    group.add(leftEye);
    const rightEye = leftEye.clone();
    rightEye.position.set(9, 8, 24);
    group.add(rightEye);

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const lPupil = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 6), pupilMat);
    lPupil.position.set(-9, 8, 30);
    group.add(lPupil);
    const rPupil = lPupil.clone();
    rPupil.position.set(9, 8, 30);
    group.add(rPupil);

    const trailMat = new THREE.MeshBasicMaterial({
        color: c.trail, transparent: true, opacity: 0.3,
    });
    const trail = new THREE.Mesh(new THREE.ConeGeometry(18, 90, 8), trailMat);
    trail.rotation.x = Math.PI / 2;
    trail.position.z = -50;
    group.add(trail);

    return group;
}

// Builds (or rebuilds) both player meshes using the current theme.
// Safely removes any existing meshes from the scene first.
function buildPlayerMeshes() {
    const T = getTheme();

    for (let i = 0; i < 2; i++) {
        // Remove existing mesh from scene
        if (gameState.players[i].mesh) {
            gameState.scene.remove(gameState.players[i].mesh);
            gameState.players[i].mesh = null;
        }

        // Build theme-appropriate mesh
        let group;
        if (T.isUnicorn) {
            group = buildUnicornPlayerMesh(i);
        } else {
            group = _buildDefaultPlayerMesh(i);
        }

        gameState.players[i].mesh = group;
        if (i < gameState.playerCount) {
            gameState.scene.add(group);
        }
    }
}

// ── Obstacle mesh builders ───────────────────────────────────────────

function buildObstacleMesh(type) {
    const T = getTheme();

    // Unicorn theme uses fully custom obstacle geometry
    if (T.isUnicorn) return buildUnicornObstacleMesh(type);

    // Default theme
    const mats = {
        bumper:  new THREE.MeshStandardMaterial({ color: T.theme.bumperColor,  emissive: T.theme.bumperEmissive,  roughness: 0.4 }),
        bomb:    new THREE.MeshStandardMaterial({ color: T.theme.bombColor,    emissive: T.theme.bombEmissive,    roughness: 0.7 }),
        barrier: new THREE.MeshStandardMaterial({ color: T.theme.barrierColor, emissive: T.theme.barrierEmissive, roughness: 0.4 }),
    };

    let geo;
    if (type === 'bumper') {
        geo = new THREE.SphereGeometry(CONFIG.obstacles.bumperRadius, 16, 12);
    } else if (type === 'bomb') {
        geo = new THREE.SphereGeometry(CONFIG.obstacles.bombRadius, 16, 12);
    } else {
        geo = new THREE.BoxGeometry(
            CONFIG.obstacles.barrierWidth,
            CONFIG.obstacles.barrierHeight,
            CONFIG.obstacles.barrierDepth
        );
    }
    const mesh = new THREE.Mesh(geo, mats[type]);

    // For bombs add a "fuse" spike
    if (type === 'bomb') {
        const fuse = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 20, 6),
            new THREE.MeshBasicMaterial({ color: 0x888888 })
        );
        fuse.position.y = CONFIG.obstacles.bombRadius + 10;
        mesh.add(fuse);
    }
    return mesh;
}

// ── Ring mesh builder ────────────────────────────────────────────────

function buildRingMesh() {
    const T = getTheme();

    // Unicorn theme uses a custom decorated ring
    if (T.isUnicorn) return buildUnicornRingMesh();

    const mat = new THREE.MeshStandardMaterial({
        color:    T.theme.ringColor,
        emissive: T.theme.ringEmissive,
        roughness: 0.2,
        metalness: 0.8,
    });
    const geo = new THREE.TorusGeometry(CONFIG.rings.outerRadius, CONFIG.rings.tubeRadius, 8, 24);
    return new THREE.Mesh(geo, mat);
}

// ── Particle mesh pool ───────────────────────────────────────────────

const _particleMat = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true });

function getParticleMesh(color) {
    const mat = _particleMat.clone();
    mat.color.set(color);
    return new THREE.Mesh(new THREE.SphereGeometry(5, 6, 6), mat);
}

// ── Main render update ───────────────────────────────────────────────

function renderFrame() {
    if (!gameState.renderer) return;

    updatePipePool();
    updatePlayerMeshes();
    updateObstacleMeshes();
    updateRingMeshes();
    updateParticleMeshes();

    gameState.renderer.render(gameState.scene, gameState.camera);
}

// ── Player mesh update ───────────────────────────────────────────────

function updatePlayerMeshes() {
    for (let i = 0; i < gameState.playerCount; i++) {
        const p = gameState.players[i];
        const mesh = p.mesh;
        if (!mesh) continue;

        const pos = laneToPosition(p.lane);
        const jumpOff = jumpHeightAt(p.jumpFrame);

        // Normal vector on the half-pipe surface (points inward)
        const halfArc = (CONFIG.pipe.arcDegrees / 2) * Math.PI / 180;
        const t = p.lane / (CONFIG.pipe.laneCount - 1);
        const angle = -halfArc + t * 2 * halfArc;
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);

        const surfaceY = CONFIG.pipe.radius - Math.cos(angle) * CONFIG.pipe.radius;

        mesh.position.set(
            pos.x + nx * (32 + jumpOff),
            surfaceY + ny * (32 + jumpOff),
            0
        );

        // Tilt to match pipe curvature
        mesh.rotation.z = -angle;

        // Crouch squash
        const crouchScale = p.crouching ? CONFIG.player.crouchScaleY : 1;
        mesh.scale.y += (crouchScale - mesh.scale.y) * 0.25;

        // Invincible flash
        mesh.visible = !(p.invincible > 0 && Math.floor(p.invincible / 6) % 2 === 0);
    }
}

// ── Obstacle mesh update ─────────────────────────────────────────────

function updateObstacleMeshes() {
    for (const obs of gameState.obstacles) {
        if (!obs.active) {
            if (obs.mesh) { gameState.scene.remove(obs.mesh); obs.mesh = null; }
            continue;
        }
        if (!obs.mesh) {
            obs.mesh = buildObstacleMesh(obs.type);
            gameState.scene.add(obs.mesh);
        }
        const pos = laneToPosition(obs.lane);
        const halfArc = (CONFIG.pipe.arcDegrees / 2) * Math.PI / 180;
        const t = obs.lane / (CONFIG.pipe.laneCount - 1);
        const angle = -halfArc + t * 2 * halfArc;
        const surfaceY = CONFIG.pipe.radius - Math.cos(angle) * CONFIG.pipe.radius;
        obs.mesh.position.set(
            pos.x + Math.sin(angle) * -40,
            surfaceY + Math.cos(angle) * 40,
            obs.z
        );
        obs.mesh.rotation.y += 0.02;
    }
}

// ── Ring mesh update ─────────────────────────────────────────────────

function updateRingMeshes() {
    for (const ring of gameState.ringItems) {
        if (!ring.active) {
            if (ring.mesh) { gameState.scene.remove(ring.mesh); ring.mesh = null; }
            continue;
        }
        if (!ring.mesh) {
            ring.mesh = buildRingMesh();
            gameState.scene.add(ring.mesh);
        }
        const pos = laneToPosition(ring.lane);
        const halfArc = (CONFIG.pipe.arcDegrees / 2) * Math.PI / 180;
        const t = ring.lane / (CONFIG.pipe.laneCount - 1);
        const angle = -halfArc + t * 2 * halfArc;
        const surfaceY = CONFIG.pipe.radius - Math.cos(angle) * CONFIG.pipe.radius;
        ring.mesh.position.set(
            pos.x + Math.sin(angle) * -50,
            surfaceY + Math.cos(angle) * 50,
            ring.z
        );
        ring.spin += CONFIG.rings.spinSpeed;
        ring.mesh.rotation.y = ring.spin;
        // Face the player
        ring.mesh.rotation.x = Math.PI / 2;
    }
}

// ── Particle mesh update ─────────────────────────────────────────────

function updateParticleMeshes() {
    for (const pt of gameState.particles) {
        if (!pt.mesh) {
            pt.mesh = getParticleMesh(pt.color);
            gameState.scene.add(pt.mesh);
        }
        pt.mesh.position.set(pt.x, pt.y, pt.z);
        pt.mesh.material.opacity = Math.max(0, pt.life);
        if (pt.life <= 0) {
            gameState.scene.remove(pt.mesh);
            pt.mesh = null;
        }
    }
}

// ── Live theme application ───────────────────────────────────────────
//
// Called by ui.js:selectTheme() when the player picks a theme on the
// title screen, and also at the start of each game to guarantee
// consistency.  Updates all long-lived scene objects without a full
// Three.js reinitialisation.

function applyThemeToScene() {
    if (!gameState.scene) return;
    const T = getTheme();

    // Fog + clear colour
    if (gameState.scene.fog) {
        gameState.scene.fog.color.set(T.theme.fogColor);
    }
    if (gameState.renderer) {
        gameState.renderer.setClearColor(T.theme.clearColor);
    }

    // Neon point lights
    if (_neonLightA) _neonLightA.color.set(T.theme.neonA);
    if (_neonLightB) _neonLightB.color.set(T.theme.neonB);
    if (_ambientLight) _ambientLight.color.set(T.theme.ambientColor);

    // Starfield tint
    if (_starfieldMat) _starfieldMat.color.set(T.theme.starColor);

    // Rebuild pipe pool with new colours
    for (const seg of gameState.pipeSegments) {
        gameState.scene.remove(seg);
    }
    gameState.pipeSegments = [];
    buildPipePool();

    // Rebuild player meshes with new theme shapes
    buildPlayerMeshes();

    // Apply CSS body class for UI theming
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
