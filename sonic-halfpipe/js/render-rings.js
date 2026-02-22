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
        const pos     = laneToPosition(ring.lane);
        const halfArc = (CONFIG.pipe.arcDegrees / 2) * Math.PI / 180;
        const t       = ring.lane / (CONFIG.pipe.laneCount - 1);
        const angle   = -halfArc + t * 2 * halfArc;
        const surfaceY = CONFIG.pipe.radius - Math.cos(angle) * CONFIG.pipe.radius;
        ring.mesh.position.set(
            pos.x + Math.sin(angle) * -50,
            surfaceY + Math.cos(angle) * 50,
            ring.z
        );
        ring.spin += CONFIG.rings.spinSpeed;
        ring.mesh.rotation.y = ring.spin;
        ring.mesh.rotation.x = Math.PI / 2; // face the player
    }
}
