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

    if (gameState.playerCount === 2) {
        assignTwoPlayerPoses(sortedPoses, video, cx, canvas);
    } else {
        // 1-player: pick first pose
        const pose = sortedPoses[0] || null;
        webcamState.playerPoses[0] = pose;
        if (pose) {
            if (pose.id !== undefined) webcamState.playerTrackingIds[0] = pose.id;
            gameState.players[0].targetLane = poseToLane(pose, 0);
            checkJumpGesture(pose, 0);
            checkCrouchGesture(pose, 0);
        }
    }
}

// Two-player pose assignment using MoveNet tracking IDs for persistence.
// Falls back to joint colour-swap detection, then position, when IDs don't match.
// Ensures the same pose is never assigned to both players (mutual exclusion).
function assignTwoPlayerPoses(sortedPoses, video, cx, canvas) {
    if (sortedPoses.length === 0) {
        webcamState.playerPoses = [null, null];
        return;
    }

    const ids = webcamState.playerTrackingIds;
    let p0Pose = null, p1Pose = null;

    // Step 1: match by MoveNet tracking ID (persists across frames)
    if (ids[0] !== null || ids[1] !== null) {
        for (const pose of sortedPoses) {
            if (pose.id !== undefined) {
                if (pose.id === ids[0]) p0Pose = pose;
                if (pose.id === ids[1]) p1Pose = pose;
            }
        }
    }

    // Step 2: assign unmatched poses using colour-swap detection then position
    const unmatched = sortedPoses.filter(p => p !== p0Pose && p !== p1Pose);

    if (!p0Pose && !p1Pose && unmatched.length >= 2) {
        const reg0 = webcamState.registeredPlayers[0];
        const reg1 = webcamState.registeredPlayers[1];

        // Positional default: P0 registered on left half of camera → leftmost = [0]
        let candidateP0 = unmatched[0];
        let candidateP1 = unmatched[unmatched.length - 1];

        if (reg0.colorSignature && reg1.colorSignature && cx && canvas) {
            cx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const colorA = sampleTorsoColor(candidateP0, video, cx, canvas);
            const colorB = sampleTorsoColor(candidateP1, video, cx, canvas);
            if (colorA && colorB) {
                const normalScore = compareColorSignatures(reg0.colorSignature, colorA)
                                  + compareColorSignatures(reg1.colorSignature, colorB);
                const swapScore   = compareColorSignatures(reg0.colorSignature, colorB)
                                  + compareColorSignatures(reg1.colorSignature, colorA);
                if (swapScore - normalScore > CONFIG.colorTracking.swapThreshold) {
                    candidateP0 = unmatched[unmatched.length - 1];
                    candidateP1 = unmatched[0];
                }
            }
        }
        p0Pose = candidateP0;
        p1Pose = candidateP1;
    } else if (!p0Pose && unmatched.length > 0) {
        p0Pose = unmatched[0];
    } else if (!p1Pose && unmatched.length > 0) {
        p1Pose = unmatched[unmatched.length - 1];
    }

    // Single-pose fallback: use position to decide which player
    if (sortedPoses.length === 1 && !p0Pose && !p1Pose) {
        const pose = sortedPoses[0];
        // P0 registered on left half of camera (x < W/2)
        if (getPoseCenterX(pose) < video.videoWidth / 2) {
            p0Pose = pose;
        } else {
            p1Pose = pose;
        }
    }

    // Step 3: refresh tracking IDs from this frame's matches
    if (p0Pose && p0Pose.id !== undefined) ids[0] = p0Pose.id;
    if (p1Pose && p1Pose.id !== undefined) ids[1] = p1Pose.id;

    // Step 3b: adaptive colour signature update — only when matched confidently by ID
    if (gameState.frameCount % CONFIG.colorTracking.adaptiveFrameInterval === 0) {
        for (let pi = 0; pi < 2; pi++) {
            const pose = pi === 0 ? p0Pose : p1Pose;
            const reg  = webcamState.registeredPlayers[pi];
            if (pose && pose.id !== undefined && pose.id === ids[pi] && reg.colorSignature && cx && canvas) {
                const currentColor = sampleTorsoColor(pose, video, cx, canvas);
                if (currentColor) {
                    reg.colorSignature = updateColorSignature(
                        reg.colorSignature, currentColor, CONFIG.colorTracking.updateAlpha
                    );
                }
            }
        }
    }

    // Step 4: apply lane, jump, and crouch to each player
    const assignedPoses = [p0Pose, p1Pose];
    for (let i = 0; i < 2; i++) {
        const pose   = assignedPoses[i];
        webcamState.playerPoses[i] = pose || null;
        if (!pose) continue;
        const player = gameState.players[i];
        if (!player || !player.active) continue;
        player.targetLane = poseToLane(pose, i);
        checkJumpGesture(pose, i);
        checkCrouchGesture(pose, i);
    }
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
