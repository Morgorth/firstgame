// render-theme-unicorn-player.js — Unicorn player mesh for Sonic Half-Pipe.
// Exports: buildUnicornPlayerMesh(playerIndex)
// Depends on: THREE (global), CONFIG (global via config.js)

// ── Material palette ──────────────────────────────────────────────────

function _makeUnicornMaterials(isP1) {
    return {
        bodyMat: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFFF0F5 : 0xFAF0E6,
            emissive: isP1 ? 0x220011 : 0x1A0020,
            roughness: 0.45,
            metalness: 0.05,
        }),
        maneMat: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFF69B4 : 0xDA70D6,
            emissive: isP1 ? 0x441133 : 0x330044,
            roughness: 0.5,
        }),
        hornMat: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFFD700 : 0xC0C0C0,
            emissive: isP1 ? 0x443300 : 0x333333,
            roughness: 0.15,
            metalness: 0.8,
        }),
        eyeMat:      new THREE.MeshBasicMaterial({ color: 0x2E0854 }),
        eyeHighMat:  new THREE.MeshBasicMaterial({ color: 0xffffff }),
        hoofMat:     new THREE.MeshStandardMaterial({ color: 0xC9A87C, roughness: 0.6 }),
        riderBodyMat: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0x6A0DAD : 0x003399,
            emissive: isP1 ? 0x220044 : 0x001133,
            roughness: 0.4,
        }),
        riderSkinMat: new THREE.MeshStandardMaterial({ color: 0xFFDBAC, roughness: 0.6 }),
        hatMat: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFF1493 : 0x9400D3,
            emissive: isP1 ? 0x440033 : 0x220044,
            roughness: 0.4,
        }),
        trailMat: new THREE.MeshBasicMaterial({
            color: isP1 ? 0xFF69B4 : 0xDA70D6,
            transparent: true,
            opacity: 0.38,
        }),
    };
}

// ── Unicorn body (head, neck, body, legs, mane, tail) ────────────────

function _addUnicornBody(group, mats) {
    const { bodyMat, maneMat, hornMat, eyeMat, eyeHighMat, hoofMat } = mats;

    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 12), bodyMat);
    body.scale.set(0.85, 0.88, 1.25);
    group.add(body);

    // Neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, 20, 10), bodyMat);
    neck.rotation.x = -0.55;
    neck.position.set(0, 14, -14);
    group.add(neck);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(11, 12, 10), bodyMat);
    head.scale.set(0.9, 0.85, 1.15);
    head.position.set(0, 22, -26);
    group.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), bodyMat);
    snout.scale.set(0.7, 0.55, 0.8);
    snout.position.set(0, 18, -34);
    group.add(snout);

    // Horn
    const horn = new THREE.Mesh(new THREE.ConeGeometry(3, 24, 8), hornMat);
    horn.rotation.x = -0.3;
    horn.position.set(0, 33, -26);
    group.add(horn);

    // Ears
    const earGeo = new THREE.ConeGeometry(3.5, 10, 6);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    earL.position.set(-7, 31, -22);
    earL.rotation.z = 0.25;
    group.add(earL);
    const earR = earL.clone();
    earR.position.set(7, 31, -22);
    earR.rotation.z = -0.25;
    group.add(earR);

    // Eyes
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

    // Mane (sphere cluster along neck)
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

    // Tail puff (rainbow)
    const tailColors = [0xFF69B4, 0xFFD700, 0x87CEEB, 0x98FB98, 0xDA70D6];
    tailColors.forEach((c, i) => {
        const tMat = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 });
        const t = new THREE.Mesh(new THREE.SphereGeometry(4 + i * 0.5, 8, 6), tMat);
        t.position.set((i % 2 === 0 ? -1 : 1) * (i * 1.5), -2 + i * 2.5, 26 + i * 2);
        group.add(t);
    });

    // Legs + hooves
    const legGeo = new THREE.CylinderGeometry(3.5, 3, 20, 8);
    const legPositions = [[-10, -18, -9], [10, -18, -9], [-10, -18, 9], [10, -18, 9]];
    legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, bodyMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.2, 5, 8), hoofMat);
        hoof.position.set(lx, ly - 12, lz);
        group.add(hoof);
    });
}

// ── Rider (sitting on unicorn's back) ────────────────────────────────

function _addUnicornRider(group, mats) {
    const { riderBodyMat, riderSkinMat, hatMat } = mats;

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 16, 8), riderBodyMat);
    torso.position.set(0, 28, 4);
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(7, 10, 8), riderSkinMat);
    head.position.set(0, 40, 0);
    group.add(head);

    // Wizard / academy hat
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
}

// ── Rainbow sparkle trail ────────────────────────────────────────────

function _addUnicornTrail(group, mats, isP1) {
    const { trailMat } = mats;

    const trail = new THREE.Mesh(new THREE.ConeGeometry(22, 110, 10), trailMat);
    trail.rotation.x = Math.PI / 2;
    trail.position.z = 60;
    group.add(trail);

    const trailMat2 = trailMat.clone();
    trailMat2.color.set(isP1 ? 0xFFD700 : 0x87CEEB);
    trailMat2.opacity = 0.18;
    const trail2 = new THREE.Mesh(new THREE.ConeGeometry(14, 130, 8), trailMat2);
    trail2.rotation.x = Math.PI / 2;
    trail2.position.z = 65;
    group.add(trail2);
}

// ── Public API ────────────────────────────────────────────────────────

function buildUnicornPlayerMesh(playerIndex) {
    const isP1 = playerIndex === 0;
    const mats  = _makeUnicornMaterials(isP1);
    const group = new THREE.Group();

    _addUnicornBody(group, mats);
    _addUnicornRider(group, mats);
    _addUnicornTrail(group, mats, isP1);

    return group;
}
