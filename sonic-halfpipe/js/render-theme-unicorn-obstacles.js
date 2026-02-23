// render-theme-unicorn-obstacles.js — Unicorn obstacle meshes for Sonic Half-Pipe.
// Exports: buildUnicornObstacleMesh(type)
// Depends on: THREE (global), CONFIG (global via config.js)

// ── Storm cloud bumper ────────────────────────────────────────────────

function _buildUnicornBumper() {
    const group = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0x778899,
        emissive: 0x223344,
        roughness: 0.9,
    });

    const core = new THREE.Mesh(
        new THREE.SphereGeometry(CONFIG.obstacles.bumperRadius, 16, 12),
        cloudMat
    );
    group.add(core);

    // Smaller cloud puffs
    const puffPositions = [[20, 10, 0], [-18, 12, 0], [5, 20, 10], [-8, -12, 5]];
    puffPositions.forEach(([px, py, pz]) => {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(16, 10, 8), cloudMat);
        puff.position.set(px, py, pz);
        group.add(puff);
    });

    // Lightning bolts
    const boltMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 1.5, 30, 6), boltMat);
    bolt.rotation.z = 0.4;
    bolt.position.set(8, -18, 5);
    group.add(bolt);

    const bolt2 = new THREE.Mesh(new THREE.CylinderGeometry(2, 1, 22, 6), boltMat);
    bolt2.rotation.z = -0.5;
    bolt2.position.set(-4, -32, 5);
    group.add(bolt2);

    return group;
}

// ── Bramble / thorn bomb ──────────────────────────────────────────────

function _buildUnicornBomb() {
    const group = new THREE.Group();
    const brambleMat = new THREE.MeshStandardMaterial({
        color: 0x2D5A27,
        emissive: 0x0A1A08,
        roughness: 0.85,
    });

    const core = new THREE.Mesh(
        new THREE.SphereGeometry(CONFIG.obstacles.bombRadius, 16, 12),
        brambleMat
    );
    group.add(core);

    // Thorns
    const thornMat = new THREE.MeshStandardMaterial({ color: 0x1A3A14, roughness: 0.7 });
    const thornCount = 12;
    const r = CONFIG.obstacles.bombRadius;
    for (let t = 0; t < thornCount; t++) {
        const theta = (t / thornCount) * Math.PI * 2;
        const phi   = Math.PI / 3 + (t % 3) * (Math.PI / 3);
        const thorn = new THREE.Mesh(new THREE.ConeGeometry(4, 20, 6), thornMat);
        thorn.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
        thorn.lookAt(
            thorn.position.x * 2,
            thorn.position.y * 2,
            thorn.position.z * 2
        );
        group.add(thorn);
    }

    return group;
}

// ── Dark magic barrier ────────────────────────────────────────────────

function _buildUnicornBarrier() {
    const group = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x2E0057,
        emissive: 0x1A0030,
        roughness: 0.5,
        metalness: 0.3,
    });

    const wall = new THREE.Mesh(new THREE.BoxGeometry(
        CONFIG.obstacles.barrierWidth,
        CONFIG.obstacles.barrierHeight,
        CONFIG.obstacles.barrierDepth
    ), wallMat);
    group.add(wall);

    // Glowing rune rings
    const runeMat  = new THREE.MeshBasicMaterial({ color: 0xAA00FF });
    const runeRing = new THREE.Mesh(
        new THREE.TorusGeometry(CONFIG.obstacles.barrierHeight * 0.38, 3, 6, 16),
        runeMat
    );
    runeRing.position.set(-40, 0, 14);
    group.add(runeRing);

    const runeRing2 = runeRing.clone();
    runeRing2.position.set(40, 0, 14);
    group.add(runeRing2);

    return group;
}

// ── Public API ────────────────────────────────────────────────────────

function buildUnicornObstacleMesh(type) {
    if (type === 'bumper') return _buildUnicornBumper();
    if (type === 'bomb')   return _buildUnicornBomb();
    return _buildUnicornBarrier();
}
