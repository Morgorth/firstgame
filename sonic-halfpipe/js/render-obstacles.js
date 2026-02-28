// render-obstacles.js — Obstacle mesh builders and per-frame mesh update.
// Depends on: render.js (getTheme, RENDER_THEME), render-theme-unicorn.js (buildUnicornObstacleMesh),
//             state.js (gameState, CONFIG), game.js (laneToPosition)

function buildObstacleMesh(type) {
    const T = getTheme();

    // Unicorn theme uses fully custom obstacle geometry
    if (T.isUnicorn) return buildUnicornObstacleMesh(type);

    // Default theme
    const tex  = getTextures();
    const mats = {
        bumper:  new THREE.MeshStandardMaterial({ color: T.theme.bumperColor,  emissive: T.theme.bumperEmissive,  map: tex.bumper,  roughness: 0.4 }),
        bomb:    new THREE.MeshStandardMaterial({ color: T.theme.bombColor,    emissive: T.theme.bombEmissive,    map: tex.bomb,    roughness: 0.7 }),
        barrier: new THREE.MeshStandardMaterial({ color: T.theme.barrierColor, emissive: T.theme.barrierEmissive, map: tex.barrier, roughness: 0.4 }),
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

    // Bombs get a "fuse" spike
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
        const pos      = laneToPosition(obs.lane);
        const halfArc  = (CONFIG.pipe.arcDegrees / 2) * Math.PI / 180;
        const t        = obs.lane / (CONFIG.pipe.laneCount - 1);
        const angle    = -halfArc + t * 2 * halfArc;
        const surfaceY = CONFIG.pipe.radius - Math.cos(angle) * CONFIG.pipe.radius;
        // Inward normal — same convention as render-player.js
        const nx = -Math.sin(angle);
        const ny =  Math.cos(angle);
        // Lift each obstacle type by its own collision radius so it sits on surface
        const typeOffset = obs.type === 'bumper'  ? CONFIG.obstacles.bumperRadius
                         : obs.type === 'bomb'    ? CONFIG.obstacles.bombRadius
                         : CONFIG.obstacles.barrierHeight * 0.5;
        obs.mesh.position.set(
            pos.x    + nx * typeOffset,
            surfaceY + ny * typeOffset,
            obs.z
        );
        obs.mesh.rotation.y += 0.02;
    }
}
