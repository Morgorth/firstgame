// render-particles.js — Particle mesh pool and per-frame update.
// Depends on: state.js (gameState)

const _particleMat = new THREE.MeshBasicMaterial({ color: 0xFFD700, transparent: true });

function getParticleMesh(color) {
    const mat = _particleMat.clone();
    mat.color.set(color);
    return new THREE.Mesh(new THREE.SphereGeometry(5, 6, 6), mat);
}

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
