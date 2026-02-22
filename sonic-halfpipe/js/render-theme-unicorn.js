// render-theme-unicorn.js — Unicorn Academy theme for Sonic Half-Pipe.
// Unicorn riders on a magical rainbow half-pipe.
// Depends on: state.js (gameState, CONFIG), render.js (loaded first)

// ── Unicorn player mesh ───────────────────────────────────────────────
//
// Each player is a unicorn with a rider on its back.
// P1: white body, hot-pink mane, gold horn
// P2: cream body, orchid mane, silver horn

function buildUnicornPlayerMesh(playerIndex) {
    const isP1 = playerIndex === 0;

    // Material palette
    const bodyMat = new THREE.MeshStandardMaterial({
        color:    isP1 ? 0xFFF0F5 : 0xFAF0E6,   // rose white / linen
        emissive: isP1 ? 0x220011 : 0x1A0020,
        roughness: 0.45,
        metalness: 0.05,
    });
    const maneMat = new THREE.MeshStandardMaterial({
        color:    isP1 ? 0xFF69B4 : 0xDA70D6,   // hot pink / orchid
        emissive: isP1 ? 0x441133 : 0x330044,
        roughness: 0.5,
    });
    const hornMat = new THREE.MeshStandardMaterial({
        color:    isP1 ? 0xFFD700 : 0xC0C0C0,   // gold / silver
        emissive: isP1 ? 0x443300 : 0x333333,
        roughness: 0.15,
        metalness: 0.8,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2E0854 });   // deep indigo
    const eyeHighMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0xC9A87C, roughness: 0.6 });
    const riderBodyMat = new THREE.MeshStandardMaterial({
        color:    isP1 ? 0x6A0DAD : 0x003399,   // purple / royal blue
        emissive: isP1 ? 0x220044 : 0x001133,
        roughness: 0.4,
    });
    const riderSkinMat = new THREE.MeshStandardMaterial({ color: 0xFFDBAC, roughness: 0.6 });
    const hatMat = new THREE.MeshStandardMaterial({
        color:    isP1 ? 0xFF1493 : 0x9400D3,
        emissive: isP1 ? 0x440033 : 0x220044,
        roughness: 0.4,
    });
    const trailMat = new THREE.MeshBasicMaterial({
        color: isP1 ? 0xFF69B4 : 0xDA70D6,
        transparent: true,
        opacity: 0.38,
    });

    const group = new THREE.Group();

    // ── Unicorn body (elongated, facing -Z = forward) ─────────────────
    const body = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 12), bodyMat);
    body.scale.set(0.85, 0.88, 1.25);
    group.add(body);

    // ── Neck ─────────────────────────────────────────────────────────
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, 20, 10), bodyMat);
    neck.rotation.x = -0.55;
    neck.position.set(0, 14, -14);
    group.add(neck);

    // ── Head ─────────────────────────────────────────────────────────
    const head = new THREE.Mesh(new THREE.SphereGeometry(11, 12, 10), bodyMat);
    head.scale.set(0.9, 0.85, 1.15);
    head.position.set(0, 22, -26);
    group.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), bodyMat);
    snout.scale.set(0.7, 0.55, 0.8);
    snout.position.set(0, 18, -34);
    group.add(snout);

    // ── Horn ─────────────────────────────────────────────────────────
    const horn = new THREE.Mesh(new THREE.ConeGeometry(3, 24, 8), hornMat);
    horn.rotation.x = -0.3;
    horn.position.set(0, 33, -26);
    group.add(horn);

    // ── Ears ─────────────────────────────────────────────────────────
    const earGeo = new THREE.ConeGeometry(3.5, 10, 6);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    earL.position.set(-7, 31, -22);
    earL.rotation.z = 0.25;
    group.add(earL);
    const earR = earL.clone();
    earR.position.set(7, 31, -22);
    earR.rotation.z = -0.25;
    group.add(earR);

    // ── Eyes ─────────────────────────────────────────────────────────
    const eyeGeo = new THREE.SphereGeometry(3, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-6, 23, -34);
    group.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.set(6, 23, -34);
    group.add(eyeR);

    // Eye highlights
    const hiGeo = new THREE.SphereGeometry(1.2, 6, 6);
    const hiL = new THREE.Mesh(hiGeo, eyeHighMat);
    hiL.position.set(-5.5, 24.2, -36.5);
    group.add(hiL);
    const hiR = hiL.clone();
    hiR.position.set(6.5, 24.2, -36.5);
    group.add(hiR);

    // ── Mane (sphere cluster along neck and head) ─────────────────────
    const manePositions = [
        [0, 28, -18], [-5, 25, -20], [4, 24, -22],
        [-4, 20, -17], [3, 18, -15], [0, 15, -12],
    ];
    const maneGeo = new THREE.SphereGeometry(1, 8, 6);
    manePositions.forEach(([mx, my, mz], i) => {
        const s = 3.5 + (i % 3) * 1.5;
        const m = new THREE.Mesh(maneGeo, maneMat);
        m.scale.setScalar(s);
        m.position.set(mx, my, mz);
        group.add(m);
    });

    // ── Tail puff ────────────────────────────────────────────────────
    const tailColors = [0xFF69B4, 0xFFD700, 0x87CEEB, 0x98FB98, 0xDA70D6];
    tailColors.forEach((c, i) => {
        const tMat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 });
        const t = new THREE.Mesh(new THREE.SphereGeometry(4 + i * 0.5, 8, 6), tMat);
        t.position.set((i % 2 === 0 ? -1 : 1) * (i * 1.5), -2 + i * 2.5, 26 + i * 2);
        group.add(t);
    });

    // ── Legs (4 cylinders) ────────────────────────────────────────────
    const legGeo = new THREE.CylinderGeometry(3.5, 3, 20, 8);
    const legPositions = [[-10, -18, -9], [10, -18, -9], [-10, -18, 9], [10, -18, 9]];
    legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, bodyMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
        // Hoof
        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.2, 5, 8), hoofMat);
        hoof.position.set(lx, ly - 12, lz);
        group.add(hoof);
    });

    // ── Rider (sitting on back) ───────────────────────────────────────
    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 16, 8), riderBodyMat);
    torso.position.set(0, 28, 4);
    group.add(torso);

    // Head
    const riderHead = new THREE.Mesh(new THREE.SphereGeometry(7, 10, 8), riderSkinMat);
    riderHead.position.set(0, 40, 0);
    group.add(riderHead);

    // Wizard/Academy hat (pointy sparkle hat)
    const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(7, 8, 5, 8), hatMat);
    hatBase.position.set(0, 46, 0);
    group.add(hatBase);
    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(7, 18, 8), hatMat);
    hatCone.position.set(0, 57, 0);
    group.add(hatCone);

    // Arms
    const armGeo = new THREE.CylinderGeometry(3, 2.5, 14, 6);
    const armL = new THREE.Mesh(armGeo, riderBodyMat);
    armL.rotation.z = 0.6;
    armL.position.set(-12, 28, 0);
    group.add(armL);
    const armR = new THREE.Mesh(armGeo, riderBodyMat);
    armR.rotation.z = -0.6;
    armR.position.set(12, 28, 0);
    group.add(armR);

    // ── Rainbow sparkle trail ─────────────────────────────────────────
    const trail = new THREE.Mesh(new THREE.ConeGeometry(22, 110, 10), trailMat);
    trail.rotation.x = Math.PI / 2;
    trail.position.z = 60;   // behind the unicorn (positive Z = toward camera)
    group.add(trail);

    // Second thinner trail layer for depth
    const trailMat2 = trailMat.clone();
    trailMat2.color.set(isP1 ? 0xFFD700 : 0x87CEEB);
    trailMat2.opacity = 0.18;
    const trail2 = new THREE.Mesh(new THREE.ConeGeometry(14, 130, 8), trailMat2);
    trail2.rotation.x = Math.PI / 2;
    trail2.position.z = 65;
    group.add(trail2);

    return group;
}

// ── Unicorn-theme obstacle meshes ─────────────────────────────────────

function buildUnicornObstacleMesh(type) {
    if (type === 'bumper') {
        // Storm cloud — gray sphere with swirling ring
        const group = new THREE.Group();
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0x778899,
            emissive: 0x223344,
            roughness: 0.9,
        });
        const core = new THREE.Mesh(new THREE.SphereGeometry(CONFIG.obstacles.bumperRadius, 16, 12), cloudMat);
        group.add(core);
        // Smaller cloud puffs
        const puffPositions = [[20, 10, 0], [-18, 12, 0], [5, 20, 10], [-8, -12, 5]];
        puffPositions.forEach(([px, py, pz]) => {
            const puff = new THREE.Mesh(new THREE.SphereGeometry(16, 10, 8), cloudMat);
            puff.position.set(px, py, pz);
            group.add(puff);
        });
        // Lightning bolt (yellow cylinder + tilt)
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

    if (type === 'bomb') {
        // Bramble / thorn ball — dark green spiky sphere
        const group = new THREE.Group();
        const brambleMat = new THREE.MeshStandardMaterial({
            color: 0x2D5A27,
            emissive: 0x0A1A08,
            roughness: 0.85,
        });
        const core = new THREE.Mesh(new THREE.SphereGeometry(CONFIG.obstacles.bombRadius, 16, 12), brambleMat);
        group.add(core);
        // Thorns
        const thornMat = new THREE.MeshStandardMaterial({ color: 0x1A3A14, roughness: 0.7 });
        const thornCount = 12;
        for (let t = 0; t < thornCount; t++) {
            const theta = (t / thornCount) * Math.PI * 2;
            const phi = Math.PI / 3 + (t % 3) * (Math.PI / 3);
            const r = CONFIG.obstacles.bombRadius;
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

    // barrier → Dark magic barrier with glowing rune ring
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

    // Glowing rune rings on the barrier
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xAA00FF });
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

// ── Unicorn-theme ring (magic star ring) ─────────────────────────────

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

    // Small star orbs orbiting the ring (evenly spaced on the torus path)
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
