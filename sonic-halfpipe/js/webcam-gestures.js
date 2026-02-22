// webcam-gestures.js — Half-pipe–specific gesture detection and gameplay pose tracking.
// Depends on: webcam-core.js, webcam-color.js, input.js (triggerJump, triggerCrouch)

// ── Wave gesture scoring (used by registration) ──────────────────────

function scoreWristHistory(history) {
    const cfg = CONFIG.waveGesture;
    const now = Date.now();
    const cutoff = now - cfg.historyWindowMs;
    const recent = history.filter(s => s.time >= cutoff);
    if (recent.length < 4) return 0;

    let dirChanges = 0;
    let totalAmplitude = 0;
    for (let i = 1; i < recent.length; i++) {
        const dx = recent[i].x - recent[i - 1].x;
        if (i > 1) {
            const prevDx = recent[i - 1].x - recent[i - 2].x;
            if (dx * prevDx < 0) dirChanges++;
        }
        totalAmplitude += Math.abs(dx);
    }
    if (dirChanges < cfg.minDirectionChanges) return 0;
    if (totalAmplitude < cfg.minAmplitude) return 0;
    return Math.min(1, totalAmplitude / 200);
}

// ── Jump gesture ─────────────────────────────────────────────────────
// Both wrists above the nose Y coordinate, held for N frames.

function checkJumpGesture(pose, playerIndex) {
    if (!gameState.running || gameState.countdownActive) return;
    const cfg = CONFIG.camera;
    const reg = webcamState.registeredPlayers[playerIndex];
    const p = gameState.players[playerIndex];

    if (reg.jumpCooldown > 0) { reg.jumpCooldown--; return; }
    if (p.jumping) { reg.jumpHoldFrames = 0; return; }

    const nose = getKeypoint(pose, 'nose');
    const lw   = getKeypoint(pose, 'left_wrist');
    const rw   = getKeypoint(pose, 'right_wrist');

    const bothUp = nose && nose.score > 0.3 &&
        lw && lw.score > 0.25 && lw.y < nose.y &&
        rw && rw.score > 0.25 && rw.y < nose.y;

    if (bothUp) {
        reg.jumpHoldFrames++;
        if (reg.jumpHoldFrames >= cfg.jumpHoldFrames) {
            triggerJump(playerIndex);
            reg.jumpHoldFrames  = 0;
            reg.jumpCooldown    = cfg.jumpCooldownFrames;
        }
    } else {
        reg.jumpHoldFrames = Math.max(0, reg.jumpHoldFrames - 1);
    }
}

// ── Crouch gesture ───────────────────────────────────────────────────
// Shoulder Y rises (person bends down), compared to calibrated baseline.

function checkCrouchGesture(pose, playerIndex) {
    if (!gameState.running || gameState.countdownActive) return;
    const cfg = CONFIG.camera;
    const reg = webcamState.registeredPlayers[playerIndex];
    const p = gameState.players[playerIndex];

    if (reg.crouchCooldown > 0) { reg.crouchCooldown--; return; }
    if (p.crouching) { reg.crouchHoldFrames = 0; return; }
    if (!reg.baselineShoulderY) return;

    const ls = getKeypoint(pose, 'left_shoulder');
    const rs = getKeypoint(pose, 'right_shoulder');
    if (!ls || !rs || ls.score < 0.25 || rs.score < 0.25) return;

    const currentShoulderY = (ls.y + rs.y) / 2;
    const frameH = webcamState.video ? webcamState.video.videoHeight : 480;
    const dropped = (currentShoulderY - reg.baselineShoulderY) / frameH;

    if (dropped > cfg.crouchShoulderDropRatio) {
        reg.crouchHoldFrames++;
        if (reg.crouchHoldFrames >= cfg.crouchHoldFrames) {
            triggerCrouch(playerIndex);
            reg.crouchHoldFrames = 0;
            reg.crouchCooldown   = cfg.crouchCooldownFrames;
        }
    } else {
        reg.crouchHoldFrames = Math.max(0, reg.crouchHoldFrames - 1);
    }
}

// ── Lane mapping ─────────────────────────────────────────────────────
// Maps pose X position to a continuous pipe position (0…laneCount-1).
// No dead-zone: full camera width maps directly to the full pipe arc.

function poseToLane(pose, playerIndex) {
    const video = webcamState.video;
    if (!video) return CONFIG.player.startLane;

    const cx = getPoseCenterX(pose);
    const W  = video.videoWidth;

    let norm; // 0.0 (far left) … 1.0 (far right) within this player's zone
    if (gameState.playerCount === 2) {
        // P1 owns left half, P2 owns right half (mirrored video)
        if (playerIndex === 0) {
            norm = 1 - Math.min(1, Math.max(0, (cx / (W * 0.5))));
        } else {
            norm = 1 - Math.min(1, Math.max(0, ((cx - W * 0.5) / (W * 0.5))));
        }
    } else {
        norm = 1 - Math.min(1, Math.max(0, cx / W));
    }

    return norm * (CONFIG.pipe.laneCount - 1);
}

// ── Gameplay pose update ─────────────────────────────────────────────

function handleGameplayPoseTracking(sortedPoses, video) {
    const cx     = webcamState.ctx;
    const canvas = webcamState.canvas;

    for (let i = 0; i < gameState.playerCount; i++) {
        const reg = webcamState.registeredPlayers[i];
        if (!reg.ready) continue;

        const pose = findPoseForPlayer(sortedPoses, i, video, cx, canvas);
        webcamState.playerPoses[i] = pose;
        if (!pose) continue;

        gameState.players[i].targetLane = poseToLane(pose, i);

        checkJumpGesture(pose, i);
        checkCrouchGesture(pose, i);

        if (reg.colorSignature) {
            const current = sampleTorsoColor(pose, video, cx, canvas);
            if (current) {
                reg.colorSignature = updateColorSignature(
                    reg.colorSignature, current, CONFIG.colorTracking.updateAlpha
                );
            }
        }
    }
}

// Return the pose most likely to belong to the given player.
function findPoseForPlayer(sortedPoses, playerIndex, video, cx, canvas) {
    if (!sortedPoses.length) return null;

    const reg = webcamState.registeredPlayers[playerIndex];

    // Match by MoveNet tracking ID first
    if (reg.poseId !== null) {
        for (const p of sortedPoses) {
            if (p.id === reg.poseId) return p;
        }
    }

    // Fall back to color signature matching
    let best = null;
    let bestScore = CONFIG.colorTracking.matchThreshold;
    for (const p of sortedPoses) {
        const sig   = sampleTorsoColor(p, video, cx, canvas);
        const score = compareColorSignatures(reg.colorSignature, sig);
        if (score > bestScore) { bestScore = score; best = p; }
    }
    if (best) {
        reg.poseId = best.id;
        return best;
    }

    // Fall back to positional heuristic (left pose → P1, right pose → P2)
    if (gameState.playerCount === 2) {
        return playerIndex === 0 ? sortedPoses[0] : sortedPoses[sortedPoses.length - 1];
    }
    return sortedPoses[0];
}

// ── Fallback: pixel motion tracking (no MoveNet) ─────────────────────

function trackMotion() {
    if (!webcamState.active) return;
    const video  = webcamState.video;
    const cx     = webcamState.ctx;
    const canvas = webcamState.canvas;
    if (!video || video.readyState < 2) return;

    cx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = cx.getImageData(0, 0, canvas.width, canvas.height).data;
    if (!webcamState.previousFrame) {
        webcamState.previousFrame = frame;
        return;
    }

    const thirds     = Math.floor(canvas.width / 3);
    const motionCols = [0, 0, 0];
    let total = 0;
    for (let y = 0; y < canvas.height; y += 4) {
        for (let x = 0; x < canvas.width; x += 4) {
            const idx  = (y * canvas.width + x) * 4;
            const diff = Math.abs(frame[idx]     - webcamState.previousFrame[idx])
                       + Math.abs(frame[idx + 1] - webcamState.previousFrame[idx + 1])
                       + Math.abs(frame[idx + 2] - webcamState.previousFrame[idx + 2]);
            if (diff > 30) {
                motionCols[Math.min(2, Math.floor(x / thirds))]++;
                total++;
            }
        }
    }
    webcamState.previousFrame = frame;
    if (total < 10) return;

    const weightedX = (motionCols[0] * 0.1 + motionCols[1] * 0.5 + motionCols[2] * 0.9)
                    / Math.max(1, total);
    // Mirror (camera is mirrored)
    gameState.players[0].targetLane = (1 - weightedX) * (CONFIG.pipe.laneCount - 1);
}
