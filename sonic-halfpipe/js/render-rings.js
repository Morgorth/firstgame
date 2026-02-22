// render-rings.js — Ring mesh builder and per-frame mesh update.
// Depends on: render.js (getTheme, RENDER_THEME), render-theme-unicorn.js (buildUnicornRingMesh),
//             state.js (gameState, CONFIG), game.js (laneToPosition)

function buildRingMesh() {
    const T = getTheme();

    // Unicorn theme uses a custom decorated ring
    if (T.isUnicorn) return buildUnicornRingMesh();

    const mat = new THREE.MeshStandardMaterial({
        color:     T.theme.ringColor,
        emissive:  T.theme.ringEmissive,
        roughness: 0.2,
        metalness: 0.8,
    });
    const geo = new THREE.TorusGeometry(CONFIG.rings.outerRadius, CONFIG.rings.tubeRadius, 8, 24);
    return new THREE.Mesh(geo, mat);
}

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
        const pos      = laneToPosition(ring.lane);
        const halfArc  = (CONFIG.pipe.arcDegrees / 2) * Math.PI / 180;
        const t        = ring.lane / (CONFIG.pipe.laneCount - 1);
        const angle    = -halfArc + t * 2 * halfArc;
        const surfaceY = CONFIG.pipe.radius - Math.cos(angle) * CONFIG.pipe.radius;
        // Inward normal — consistent with render-player.js and render-obstacles.js
        const nx = -Math.sin(angle);
        const ny =  Math.cos(angle);
        // Float rings a ring-radius above surface so they are easy to see and run through
        const floatOffset = CONFIG.rings.outerRadius + CONFIG.rings.tubeRadius + 8;
        ring.mesh.position.set(
            pos.x    + nx * floatOffset,
            surfaceY + ny * floatOffset,
            ring.z
        );
        ring.spin += CONFIG.rings.spinSpeed;
        // No x-tilt: torus default orientation lies in XY plane, hole facing +Z
        // (toward camera), which is the classic Sonic "run through the ring" look.
        ring.mesh.rotation.set(0, ring.spin, 0);
    }
}
