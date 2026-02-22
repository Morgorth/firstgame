// Three.js rendering for Sonic Half-Pipe.
// Builds the pipe, player meshes, obstacles, rings, and particles.

// ── Scene initialisation ─────────────────────────────────────────────

function initScene() {
    const canvas = document.getElementById('gameCanvas');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    renderer.setClearColor(0x000011);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000011, 1200, 4800);

    // Camera: sits slightly behind and above the player
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 6000);
    camera.position.set(0, CONFIG.pipe.radius * 0.12, 280);
    camera.lookAt(0, CONFIG.pipe.radius * 0.06, -800);

    // Ambient + directional light
    scene.add(new THREE.AmbientLight(0x334466, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(300, 600, 300);
    scene.add(dirLight);

    // Neon point lights that travel with the scene
    const neonA = new THREE.PointLight(0x00ffff, 2.5, 800);
    neonA.position.set(-200, 50, -600);
    scene.add(neonA);
    const neonB = new THREE.PointLight(0xff00ff, 2.5, 800);
    neonB.position.set(200, 50, -600);
    scene.add(neonB);

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

    // Neon grid material
    const mat = new THREE.MeshStandardMaterial({
        color: 0x112244,
        emissive: 0x001133,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.BackSide,
        wireframe: false,
    });
    const mesh = new THREE.Mesh(shape, mat);

    // Add a wireframe overlay for the retro neon-grid look
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0x0066ff,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
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
    const count = 1800;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 8000;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 4000 + 1000;
        pos[i * 3 + 2] = -Math.random() * 6000;
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 3, sizeAttenuation: true });
    gameState.scene.add(new THREE.Points(geo, mat));
}

// ── Player meshes ────────────────────────────────────────────────────

const _playerMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x006666, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0x660066, roughness: 0.3 }),
];

function buildPlayerMeshes() {
    for (let i = 0; i < 2; i++) {
        const group = new THREE.Group();

        // Body
        const body = new THREE.Mesh(
            new THREE.SphereGeometry(28, 16, 12),
            _playerMaterials[i]
        );
        body.scale.set(0.9, 1.15, 0.9);
        group.add(body);

        // Eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 8), eyeMat);
        leftEye.position.set(-9, 8, 24);
        group.add(leftEye);
        const rightEye = leftEye.clone();
        rightEye.position.set(9, 8, 24);
        group.add(rightEye);

        // Pupils
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const lPupil = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 6), pupilMat);
        lPupil.position.set(-9, 8, 30);
        group.add(lPupil);
        const rPupil = lPupil.clone();
        rPupil.position.set(9, 8, 30);
        group.add(rPupil);

        // Trail
        const trailMat = new THREE.MeshBasicMaterial({
            color: i === 0 ? 0x00ffff : 0xff00ff,
            transparent: true,
            opacity: 0.3,
        });
        const trail = new THREE.Mesh(
            new THREE.ConeGeometry(18, 90, 8),
            trailMat
        );
        trail.rotation.x = Math.PI / 2;
        trail.position.z = -50;
        group.add(trail);

        gameState.players[i].mesh = group;
        if (i < gameState.playerCount) {
            gameState.scene.add(group);
        }
    }
}

// ── Obstacle mesh builders ───────────────────────────────────────────

const _obstacleMats = {
    bumper: new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x331100, roughness: 0.4 }),
    bomb: new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x111111, roughness: 0.7 }),
    barrier: new THREE.MeshStandardMaterial({ color: 0xff0044, emissive: 0x330011, roughness: 0.4 }),
};

function buildObstacleMesh(type) {
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
    const mesh = new THREE.Mesh(geo, _obstacleMats[type]);

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

const _ringMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    emissive: 0x554400,
    roughness: 0.2,
    metalness: 0.8,
});

function buildRingMesh() {
    const geo = new THREE.TorusGeometry(
        CONFIG.rings.outerRadius,
        CONFIG.rings.tubeRadius,
        8, 24
    );
    return new THREE.Mesh(geo, _ringMat);
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
