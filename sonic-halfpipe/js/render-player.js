// render-player.js — Player mesh builders and per-frame mesh update.
// Depends on: render.js (getTheme), render-theme-unicorn.js (buildUnicornPlayerMesh),
//             state.js (gameState, CONFIG), game.js (laneToPosition, jumpHeightAt)

// ── Default player mesh ──────────────────────────────────────────────

function _buildDefaultPlayerMesh(playerIndex) {
    const colors = [
        { body: 0x00ffff, emissive: 0x006666, trail: 0x00ffff },
        { body: 0xff00ff, emissive: 0x660066, trail: 0xff00ff },
    ];
    const c     = colors[playerIndex];
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
        color: c.body, emissive: c.emissive, roughness: 0.3,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(28, 16, 12), bodyMat);
    body.scale.set(0.9, 1.15, 0.9);
    group.add(body);

    const eyeMat  = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 8), eyeMat);
    leftEye.position.set(-9, 8, 24);
    group.add(leftEye);
    const rightEye = leftEye.clone();
    rightEye.position.set(9, 8, 24);
    group.add(rightEye);

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const lPupil   = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 6), pupilMat);
    lPupil.position.set(-9, 8, 30);
    group.add(lPupil);
    const rPupil = lPupil.clone();
    rPupil.position.set(9, 8, 30);
    group.add(rPupil);

    const trailMat = new THREE.MeshBasicMaterial({
        color: c.trail, transparent: true, opacity: 0.3,
    });
    const trail = new THREE.Mesh(new THREE.ConeGeometry(18, 90, 8), trailMat);
    trail.rotation.x = Math.PI / 2;
    trail.position.z = -50;
    group.add(trail);

    return group;
}

// ── Build (or rebuild) both player meshes ────────────────────────────
// Safely removes any existing meshes from the scene first.

function buildPlayerMeshes() {
    const T = getTheme();

    for (let i = 0; i < 2; i++) {
        if (gameState.players[i].mesh) {
            gameState.scene.remove(gameState.players[i].mesh);
            gameState.players[i].mesh = null;
        }

        const group = T.isUnicorn
            ? buildUnicornPlayerMesh(i)
            : _buildDefaultPlayerMesh(i);

        gameState.players[i].mesh = group;
        if (i < gameState.playerCount) {
            gameState.scene.add(group);
        }
    }
}

// ── Per-frame player mesh update ─────────────────────────────────────

function updatePlayerMeshes() {
    for (let i = 0; i < gameState.playerCount; i++) {
        const p    = gameState.players[i];
        const mesh = p.mesh;
        if (!mesh) continue;

        const pos     = laneToPosition(p.lane);
        const jumpOff = jumpHeightAt(p.jumpFrame);

        const halfArc = (CONFIG.pipe.arcDegrees / 2) * Math.PI / 180;
        const t       = p.lane / (CONFIG.pipe.laneCount - 1);
        const angle   = -halfArc + t * 2 * halfArc;
        const nx      = -Math.sin(angle);
        const ny      =  Math.cos(angle);

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
