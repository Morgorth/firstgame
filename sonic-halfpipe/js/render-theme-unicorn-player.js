// render-theme-unicorn-player.js — Unicorn Academy-style player mesh for Sonic Half-Pipe.
// Exports: buildUnicornPlayerMesh(playerIndex)
// Depends on: THREE (global), CONFIG (global via config.js)

// ── Material palette ──────────────────────────────────────────────────

function _makeUnicornMaterials(isP1) {
    const tex = getTextures();
    return {
        bodyMat: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFFF5FA : 0xF5F0FF,
            emissive: isP1 ? 0x180010 : 0x100018,
            map:      isP1 ? tex.playerBody0 : tex.playerBody1,
            roughness: 0.30,
            metalness: 0.12,
        }),
        maneMat1: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFF4DA6 : 0xAA44FF,
            emissive: isP1 ? 0x660033 : 0x440088,
            roughness: 0.4,
        }),
        maneMat2: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFF9DE2 : 0xCC99FF,
            emissive: isP1 ? 0x440022 : 0x330066,
            roughness: 0.4,
        }),
        maneMat3: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFFD700 : 0x00CFFF,
            emissive: isP1 ? 0x442200 : 0x003344,
            roughness: 0.4,
        }),
        hornMat: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFFE566 : 0xDDABFF,
            emissive: isP1 ? 0x554400 : 0x330055,
            roughness: 0.1,
            metalness: 0.9,
        }),
        // Anime-style large eye: deep teal/violet iris
        eyeWhiteMat:  new THREE.MeshBasicMaterial({ color: 0xFFFFFF }),
        eyeIrisMat:   new THREE.MeshBasicMaterial({ color: isP1 ? 0x006688 : 0x5500AA }),
        eyePupilMat:  new THREE.MeshBasicMaterial({ color: 0x0A0020 }),
        eyeHighMat:   new THREE.MeshBasicMaterial({ color: 0xFFFFFF }),
        eyeShimMat:   new THREE.MeshBasicMaterial({ color: isP1 ? 0x88EEFF : 0xCCAAFF }),
        eyeLashMat:   new THREE.MeshBasicMaterial({ color: 0x1A0030 }),
        noseMat:      new THREE.MeshStandardMaterial({ color: isP1 ? 0xFFAACC : 0xDDB8FF, roughness: 0.6 }),
        hoofMat:      new THREE.MeshStandardMaterial({ color: isP1 ? 0xFFD0E8 : 0xE0C8FF, roughness: 0.4, metalness: 0.3 }),
        // Rider outfit — academy jacket style
        riderBodyMat: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0x7B1FA2 : 0x1565C0,
            emissive: isP1 ? 0x2A0040 : 0x00204A,
            roughness: 0.3,
        }),
        riderAccentMat: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFF80D5 : 0x80D8FF,
            emissive: isP1 ? 0x440033 : 0x003344,
            roughness: 0.35,
        }),
        riderSkinMat: new THREE.MeshStandardMaterial({ color: isP1 ? 0xFFD5B0 : 0xFFE0C8, roughness: 0.55 }),
        // Hair — vibrant, flowing
        hairMat1: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFF2D78 : 0x6600FF,
            emissive: isP1 ? 0x550022 : 0x220055,
            roughness: 0.45,
        }),
        hairMat2: new THREE.MeshStandardMaterial({
            color:    isP1 ? 0xFF9DE2 : 0xAA77FF,
            emissive: isP1 ? 0x330011 : 0x220044,
            roughness: 0.45,
        }),
        starMat: new THREE.MeshBasicMaterial({
            color:    isP1 ? 0xFFE566 : 0xAAEEFF,
            transparent: true,
            opacity: 0.92,
        }),
        trailMat: new THREE.MeshBasicMaterial({
            color: isP1 ? 0xFF4DA6 : 0xAA44FF,
            transparent: true,
            opacity: 0.42,
        }),
    };
}

// ── Helper: anime-style large almond eye ─────────────────────────────
// Produces layered eye at origin; caller must position/rotate.

function _makeAnimeEye(mats, flip) {
    const g = new THREE.Group();

    // White sclera — flattened oval
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(5.2, 12, 10), mats.eyeWhiteMat);
    sclera.scale.set(flip ? -0.85 : 0.85, 1.3, 0.35);
    g.add(sclera);

    // Iris — large, covers most of sclera
    const iris = new THREE.Mesh(new THREE.SphereGeometry(3.8, 10, 10), mats.eyeIrisMat);
    iris.scale.set(flip ? -0.9 : 0.9, 1.2, 0.45);
    iris.position.z = 1.2;
    g.add(iris);

    // Pupil — tall oval
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), mats.eyePupilMat);
    pupil.scale.set(flip ? -0.7 : 0.7, 1.1, 0.55);
    pupil.position.z = 2.2;
    g.add(pupil);

    // Top shimmer stripe (anime sparkle band across iris)
    const shim = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), mats.eyeShimMat);
    shim.scale.set(flip ? -1.6 : 1.6, 0.45, 0.5);
    shim.position.set(0, 1.5, 3.0);
    g.add(shim);

    // Main highlight dot
    const hi = new THREE.Mesh(new THREE.SphereGeometry(1.1, 6, 6), mats.eyeHighMat);
    hi.position.set(flip ? -1.0 : 1.0, 1.8, 3.4);
    g.add(hi);

    // Small secondary highlight
    const hi2 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 5, 5), mats.eyeHighMat);
    hi2.position.set(flip ? 0.8 : -0.8, -1.2, 3.4);
    g.add(hi2);

    // Upper lash bar (thick top lid line)
    const lash = new THREE.Mesh(new THREE.SphereGeometry(5.5, 10, 6), mats.eyeLashMat);
    lash.scale.set(flip ? -0.82 : 0.82, 0.25, 0.3);
    lash.position.set(0, 4.6, 0.5);
    g.add(lash);

    return g;
}

// ── Unicorn body ──────────────────────────────────────────────────────

function _addUnicornBody(group, mats) {
    const { bodyMat, maneMat1, maneMat2, maneMat3, hornMat, noseMat, hoofMat } = mats;

    // ── Main body — slightly elongated, rounded ───────────────────────
    const body = new THREE.Mesh(new THREE.SphereGeometry(22, 20, 16), bodyMat);
    body.scale.set(0.88, 0.92, 1.3);
    group.add(body);

    // ── Neck — graceful curve ─────────────────────────────────────────
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(8, 11, 22, 12), bodyMat);
    neck.rotation.x = -0.6;
    neck.position.set(0, 15, -15);
    group.add(neck);

    // ── Head — larger, rounder (anime proportion) ─────────────────────
    const head = new THREE.Mesh(new THREE.SphereGeometry(13, 16, 14), bodyMat);
    head.scale.set(0.92, 0.95, 1.05);
    head.position.set(0, 24, -28);
    group.add(head);

    // ── Snout — gentle muzzle ─────────────────────────────────────────
    const snout = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 10), bodyMat);
    snout.scale.set(0.68, 0.52, 0.75);
    snout.position.set(0, 19, -37);
    group.add(snout);

    // Nostrils — pink blush dots
    const nostrilGeo = new THREE.SphereGeometry(1.6, 6, 6);
    const nL = new THREE.Mesh(nostrilGeo, noseMat);
    nL.position.set(-2.8, 18, -40.5);
    group.add(nL);
    const nR = nL.clone();
    nR.position.set(2.8, 18, -40.5);
    group.add(nR);

    // ── Horn — elegant spiral (stacked tapering discs) ────────────────
    const hornSegments = 10;
    for (let i = 0; i < hornSegments; i++) {
        const t = i / hornSegments;
        const r = 3.8 * (1 - t * 0.88);
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r, 3.5, 8), hornMat);
        seg.position.set(
            Math.sin(t * Math.PI * 2.5) * 0.8,
            35 + i * 3.2,
            -26
        );
        seg.rotation.z = Math.sin(t * Math.PI) * 0.08;
        group.add(seg);
    }
    // Horn tip glow
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xFFFFAA, transparent: true, opacity: 0.85 });
    const tip = new THREE.Mesh(new THREE.SphereGeometry(2.2, 8, 8), tipMat);
    tip.position.set(0, 68, -27);
    group.add(tip);

    // ── Ears ──────────────────────────────────────────────────────────
    const earGeo = new THREE.ConeGeometry(4, 11, 8);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    earL.position.set(-8, 34, -24);
    earL.rotation.z = 0.28;
    group.add(earL);
    // Inner ear color
    const innerEarGeo = new THREE.ConeGeometry(2.2, 7, 8);
    const earInL = new THREE.Mesh(innerEarGeo, noseMat);
    earInL.position.set(-8, 34.5, -23.8);
    earInL.rotation.z = 0.28;
    group.add(earInL);
    const earR = earL.clone();
    earR.position.set(8, 34, -24);
    earR.rotation.z = -0.28;
    group.add(earR);
    const earInR = earInL.clone();
    earInR.position.set(8, 34.5, -23.8);
    earInR.rotation.z = -0.28;
    group.add(earInR);

    // ── Anime eyes ────────────────────────────────────────────────────
    const eyeL = _makeAnimeEye(mats, false);
    eyeL.position.set(-7, 25, -38);
    eyeL.rotation.y = -0.18;
    group.add(eyeL);
    const eyeR = _makeAnimeEye(mats, true);
    eyeR.position.set(7, 25, -38);
    eyeR.rotation.y = 0.18;
    group.add(eyeR);

    // ── Mane — voluminous layered puffs along neck and forehead ───────
    const maneData = [
        // [x, y, z, scale, matIndex]
        [0,  32, -22, 4.5, 0],   // forehead puff (large)
        [-5, 29, -20, 3.8, 1],
        [5,  28, -21, 3.5, 2],
        [-6, 26, -18, 4.2, 0],
        [5,  24, -17, 3.9, 1],
        [-4, 21, -15, 4.0, 2],
        [4,  19, -14, 3.6, 0],
        [-5, 16, -12, 3.8, 1],
        [3,  14, -10, 3.5, 2],
        [0,  12, -8,  3.2, 0],
        // Wider puffs on sides of neck
        [-8, 22, -16, 3.0, 1],
        [8,  20, -15, 3.0, 2],
    ];
    const maneGeoBase = new THREE.SphereGeometry(1, 10, 8);
    const maneMats = [maneMat1, maneMat2, maneMat3];
    maneData.forEach(([mx, my, mz, s, mi]) => {
        const m = new THREE.Mesh(maneGeoBase, maneMats[mi]);
        m.scale.setScalar(s);
        // Slight squish for fluffiness
        m.scale.z *= 0.75;
        m.position.set(mx, my, mz);
        group.add(m);
    });

    // ── Tail — rainbow puff cluster ───────────────────────────────────
    const tailPuffs = [
        [0,   2,  26, 5.5, 0],
        [-4,  5,  28, 4.8, 1],
        [4,   7,  30, 4.5, 2],
        [-5,  10, 31, 4.2, 0],
        [3,   13, 33, 4.0, 1],
        [-2,  16, 35, 3.8, 2],
        [4,   19, 36, 3.5, 0],
        [-3,  22, 38, 3.2, 1],
        [1,   24, 39, 2.8, 2],
        // Flowing strands
        [-6,  4,  27, 3.0, 2],
        [6,   6,  29, 3.0, 0],
        [-4,  14, 34, 2.5, 1],
        [4,   18, 37, 2.5, 2],
    ];
    tailPuffs.forEach(([tx, ty, tz, s, mi]) => {
        const t = new THREE.Mesh(maneGeoBase, maneMats[mi]);
        t.scale.setScalar(s);
        t.scale.z *= 0.7;
        t.position.set(tx, ty, tz);
        group.add(t);
    });

    // ── Legs — slender, tapered ───────────────────────────────────────
    const legGeo = new THREE.CylinderGeometry(3, 3.8, 22, 10);
    const legPositions = [[-10, -19, -10], [10, -19, -10], [-10, -19, 10], [10, -19, 10]];
    legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, bodyMat);
        leg.position.set(lx, ly, lz);
        group.add(leg);
        // Hoof — pearlescent
        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.2, 5.5, 10), hoofMat);
        hoof.position.set(lx, ly - 13, lz);
        group.add(hoof);
    });

    // ── Blush marks (anime cheek circles) ────────────────────────────
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xFFAACC, transparent: true, opacity: 0.55 });
    const blushGeo = new THREE.SphereGeometry(3.0, 8, 6);
    const blushL = new THREE.Mesh(blushGeo, blushMat);
    blushL.scale.set(1.4, 0.7, 0.3);
    blushL.position.set(-10, 22, -38);
    group.add(blushL);
    const blushR = blushL.clone();
    blushR.position.set(10, 22, -38);
    group.add(blushR);
}

// ── Rider (academy student on unicorn's back) ─────────────────────────
// Anime proportions: larger head, smaller body, colorful hair.

function _addUnicornRider(group, mats) {
    const { riderBodyMat, riderAccentMat, riderSkinMat, hairMat1, hairMat2, eyeIrisMat, eyeWhiteMat, eyePupilMat, eyeHighMat, eyeLashMat, noseMat, starMat } = mats;

    // ── Torso — academy jacket ────────────────────────────────────────
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.5, 15, 10), riderBodyMat);
    torso.position.set(0, 28, 3);
    group.add(torso);

    // Jacket lapels / collar accent
    const collarGeo = new THREE.TorusGeometry(5, 1.2, 6, 12, Math.PI);
    const collar = new THREE.Mesh(collarGeo, riderAccentMat);
    collar.position.set(0, 35, 3);
    collar.rotation.x = Math.PI / 2;
    group.add(collar);

    // Star badge on chest
    const badge = new THREE.Mesh(new THREE.SphereGeometry(1.8, 6, 6), starMat);
    badge.position.set(3, 32, 9);
    group.add(badge);

    // ── Arms — slender, reaching forward ─────────────────────────────
    const armGeo = new THREE.CylinderGeometry(2.5, 2, 13, 8);
    const armL = new THREE.Mesh(armGeo, riderBodyMat);
    armL.rotation.z = 0.55;
    armL.rotation.x = -0.2;
    armL.position.set(-11, 28, -1);
    group.add(armL);

    const armR = new THREE.Mesh(armGeo, riderBodyMat);
    armR.rotation.z = -0.55;
    armR.rotation.x = -0.2;
    armR.position.set(11, 28, -1);
    group.add(armR);

    // Hands (small skin spheres)
    const handGeo = new THREE.SphereGeometry(2.2, 7, 7);
    const handL = new THREE.Mesh(handGeo, riderSkinMat);
    handL.position.set(-17, 33, -3);
    group.add(handL);
    const handR = handL.clone();
    handR.position.set(17, 33, -3);
    group.add(handR);

    // ── Head — anime: large, round ────────────────────────────────────
    const head = new THREE.Mesh(new THREE.SphereGeometry(8.5, 14, 12), riderSkinMat);
    head.scale.set(0.95, 1.0, 0.92);
    head.position.set(0, 42, 0);
    group.add(head);

    // Chin taper
    const chin = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 8), riderSkinMat);
    chin.scale.set(0.7, 0.45, 0.7);
    chin.position.set(0, 36, 0);
    group.add(chin);

    // ── Rider anime eyes (smaller version) ───────────────────────────
    const riderEyeMats = {
        eyeWhiteMat, eyeIrisMat, eyePupilMat, eyeHighMat,
        eyeShimMat: eyeIrisMat,
        eyeLashMat,
    };
    const rEyeL = _makeAnimeEye(riderEyeMats, false);
    rEyeL.scale.setScalar(0.82);
    rEyeL.position.set(-4.5, 43, 7.5);
    rEyeL.rotation.y = -0.12;
    group.add(rEyeL);
    const rEyeR = _makeAnimeEye(riderEyeMats, true);
    rEyeR.scale.setScalar(0.82);
    rEyeR.position.set(4.5, 43, 7.5);
    rEyeR.rotation.y = 0.12;
    group.add(rEyeR);

    // Tiny nose
    const rNose = new THREE.Mesh(new THREE.SphereGeometry(0.9, 6, 6), noseMat);
    rNose.position.set(0, 41, 8.8);
    group.add(rNose);

    // Smile — small arc via torus segment
    const smileGeo = new THREE.TorusGeometry(2.2, 0.5, 5, 10, Math.PI * 0.6);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0xCC6688 });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.position.set(0, 38.5, 8.5);
    smile.rotation.z = Math.PI;
    smile.rotation.x = -0.3;
    group.add(smile);

    // Blush cheeks on rider
    const rBlushMat = new THREE.MeshBasicMaterial({ color: 0xFFB3CC, transparent: true, opacity: 0.6 });
    const rBlushGeo = new THREE.SphereGeometry(2.4, 7, 6);
    const rbL = new THREE.Mesh(rBlushGeo, rBlushMat);
    rbL.scale.set(1.5, 0.7, 0.3);
    rbL.position.set(-6.5, 40.5, 8.2);
    group.add(rbL);
    const rbR = rbL.clone();
    rbR.position.set(6.5, 40.5, 8.2);
    group.add(rbR);

    // ── Hair — flowing layered puffs, vibrant color ───────────────────
    const hairPuffs = [
        // Top/back of head — large puffs
        [0,   50, -1,  3.8, 0],
        [-4,  49,  1,  3.4, 1],
        [4,   49,  0,  3.2, 0],
        [-6,  47, -2,  3.5, 1],
        [6,   47, -1,  3.3, 0],
        // Side swept strands
        [-9,  45,  2,  3.0, 1],
        [9,   45,  1,  3.0, 0],
        [-10, 42,  3,  2.8, 1],
        [10,  42,  2,  2.8, 0],
        // Back flow
        [-5,  45, -5,  3.0, 1],
        [5,   45, -4,  3.0, 0],
        [-3,  42, -7,  2.8, 1],
        [3,   42, -6,  2.6, 0],
        [-2,  39, -8,  2.5, 1],
        [2,   39, -7,  2.4, 0],
        // Front fringe / bangs
        [-3,  47,  7.5, 2.2, 0],
        [3,   47,  7.0, 2.2, 1],
        [0,   46,  8.0, 2.0, 0],
    ];
    const hairMats = [hairMat1, hairMat2];
    const hairGeoBase = new THREE.SphereGeometry(1, 10, 8);
    hairPuffs.forEach(([hx, hy, hz, s, mi]) => {
        const h = new THREE.Mesh(hairGeoBase, hairMats[mi]);
        h.scale.set(s, s, s * 0.8);
        h.position.set(hx, hy, hz);
        group.add(h);
    });

    // ── Academy star hairclip ─────────────────────────────────────────
    const clip = new THREE.Mesh(new THREE.SphereGeometry(2, 6, 6), starMat);
    clip.scale.set(1.4, 1.4, 0.5);
    clip.position.set(-9, 48, 3);
    group.add(clip);
}

// ── Rainbow sparkle trail ─────────────────────────────────────────────
// Multi-layer rainbow cone trail with sparkle star meshes.

function _addUnicornTrail(group, mats, isP1) {
    const { trailMat } = mats;

    // Primary wide cone
    const trail1 = new THREE.Mesh(new THREE.ConeGeometry(24, 120, 12), trailMat);
    trail1.rotation.x = Math.PI / 2;
    trail1.position.z = 65;
    group.add(trail1);

    // Secondary inner cone — accent color
    const trailMat2 = trailMat.clone();
    trailMat2.color.set(isP1 ? 0xFFD700 : 0x00CCFF);
    trailMat2.opacity = 0.28;
    const trail2 = new THREE.Mesh(new THREE.ConeGeometry(14, 140, 10), trailMat2);
    trail2.rotation.x = Math.PI / 2;
    trail2.position.z = 70;
    group.add(trail2);

    // Tertiary thin core glow
    const trailMat3 = trailMat.clone();
    trailMat3.color.set(isP1 ? 0xFFFFFF : 0xEECCFF);
    trailMat3.opacity = 0.18;
    const trail3 = new THREE.Mesh(new THREE.ConeGeometry(6, 160, 8), trailMat3);
    trail3.rotation.x = Math.PI / 2;
    trail3.position.z = 80;
    group.add(trail3);

    // ── Sparkle stars scattered along trail ───────────────────────────
    const sparkleColors = isP1
        ? [0xFF69B4, 0xFFD700, 0xFF99DD, 0xFFFFAA, 0xFF4499]
        : [0xAA66FF, 0x00CFFF, 0xDD99FF, 0x88EEFF, 0xCC44FF];

    const starGeo = new THREE.OctahedronGeometry(2.5, 0);
    for (let i = 0; i < 18; i++) {
        const sMat = new THREE.MeshBasicMaterial({
            color: sparkleColors[i % sparkleColors.length],
            transparent: true,
            opacity: 0.65 + Math.random() * 0.3,
        });
        const star = new THREE.Mesh(starGeo, sMat);
        const angle = (i / 18) * Math.PI * 2;
        const radius = 4 + (i % 4) * 4;
        const depth = 20 + i * 6;
        star.position.set(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            depth
        );
        star.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            (i / 18) * Math.PI * 2
        );
        const s = 0.7 + (i % 3) * 0.4;
        star.scale.setScalar(s);
        group.add(star);
    }
}

// ── Public API ─────────────────────────────────────────────────────────

function buildUnicornPlayerMesh(playerIndex) {
    const isP1  = playerIndex === 0;
    const mats  = _makeUnicornMaterials(isP1);
    const group = new THREE.Group();

    _addUnicornBody(group, mats);
    _addUnicornRider(group, mats);
    _addUnicornTrail(group, mats, isP1);

    return group;
}
