// render-theme-unicorn-rings.js — Unicorn ring mesh for Sonic Half-Pipe.
// Exports: buildUnicornRingMesh()
// Depends on: THREE (global), CONFIG (global via config.js)

function buildUnicornRingMesh() {
    const group = new THREE.Group();

    // Main torus in hot pink
    const ringMat = new THREE.MeshStandardMaterial({
        color: 0xFF69B4,
        emissive: 0x441133,
        roughness: 0.15,
        metalness: 0.5,
    });
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(CONFIG.rings.outerRadius, CONFIG.rings.tubeRadius, 8, 24),
        ringMat
    );
    group.add(ring);

    // Small star orbs evenly spaced on the torus path
    const starMat = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
    const starGeo = new THREE.SphereGeometry(3, 6, 6);
    for (let s = 0; s < 5; s++) {
        const a = (s / 5) * Math.PI * 2;
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(
            Math.cos(a) * CONFIG.rings.outerRadius,
            Math.sin(a) * CONFIG.rings.outerRadius,
            0
        );
        group.add(star);
    }

    return group;
}
