// Webcam initialisation, MoveNet pose detection, and gesture recognition.
// Core MoveNet stack reused from Wave Assault; half-pipe specific gestures added below.

// ── Lifecycle ────────────────────────────────────────────────────────

async function initWebcam() {
    try {
        const statusEl = document.getElementById('cameraStatus');
        statusEl.textContent = 'Requesting camera access...';

        webcamState.video = document.getElementById('webcamVideo');
        webcamState.canvas = document.getElementById('webcamCanvas');
        webcamState.ctx = webcamState.canvas.getContext('2d', { willReadFrequently: true });

        document.getElementById('webcamContainer').classList.remove('hidden');

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: false
        });
        webcamState.stream = stream;
        webcamState.video.srcObject = stream;

        await new Promise(resolve => {
            webcamState.video.onloadedmetadata = () => {
                webcamState.canvas.width = webcamState.video.videoWidth;
                webcamState.canvas.height = webcamState.video.videoHeight;
                resolve();
            };
        });

        await webcamState.video.play();
        webcamState.initialized = true;
        webcamState.active = true;

        statusEl.textContent = 'Loading AI pose detection...';
        await initPoseDetector();

        statusEl.textContent = 'AI ready! Move freely across the pipe.';
        statusEl.style.color = '#00ff00';
        requestAnimationFrame(trackPoses);
        return true;
    } catch (e) {
        console.error('Webcam/Pose init error:', e);
        const s = document.getElementById('cameraStatus');
        s.textContent = 'Camera access denied.';
        s.style.color = '#ff0000';
        selectControlMode('keyboard');
        return false;
    }
}

async function initPoseDetector() {
    try {
        await tf.ready();
        webcamState.poseDetector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            {
                modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
                enableSmoothing: true,
                enableTracking: true,
                trackerType: poseDetection.TrackerType.BoundingBox,
                minPoseScore: 0.25,
            }
        );
        webcamState.poseDetectorReady = true;
    } catch (e) {
        console.error('Failed to init pose detector:', e);
        webcamState.poseDetectorReady = false;
        document.getElementById('cameraStatus').textContent = 'AI failed, using basic detection';
        requestAnimationFrame(trackMotion);
    }
}

function stopWebcam() {
    if (webcamState.stream) webcamState.stream.getTracks().forEach(t => t.stop());
    webcamState.stream = null;
    webcamState.active = false;
    webcamState.initialized = false;
    webcamState.previousFrame = null;
    webcamState.poseDetectorReady = false;
    document.getElementById('webcamContainer').classList.add('hidden');
}

// ── Pose tracking loop ───────────────────────────────────────────────

async function trackPoses() {
    if (!webcamState.active || !webcamState.initialized) return;

    const video = webcamState.video;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(trackPoses);
        return;
    }

    if (!webcamState.poseDetectorReady || !webcamState.poseDetector) {
        trackMotion();
        requestAnimationFrame(trackPoses);
        return;
    }

    try {
        const poses = await webcamState.poseDetector.estimatePoses(video);
        webcamState.allPoses = poses || [];

        const sortedPoses = [...webcamState.allPoses].sort(
            (a, b) => getPoseCenterX(a) - getPoseCenterX(b)
        );

        if (webcamState.registrationPhase === 'registering') {
            handleRegistrationPoseTracking(sortedPoses, video);
        } else if (gameState.running) {
            handleGameplayPoseTracking(sortedPoses, video);
        }

        // Update position indicators
        updatePositionMarkers();

        if (webcamState.registrationPhase === 'registering') {
            drawRegistrationDebug(sortedPoses);
        } else {
            drawPoseDebug();
        }
    } catch (e) {
        console.error('Pose detection error:', e);
    }

    requestAnimationFrame(trackPoses);
}

function updatePositionMarkers() {
    const marker1 = document.getElementById('positionMarker');
    const marker2 = document.getElementById('positionMarkerP2');
    const maxT = CONFIG.pipe.laneCount - 1; // continuous range 0…maxT
    const containerW = 200;
    const markerW = 20;

    if (gameState.running && gameState.playerCount === 2) {
        marker1.style.background = '#00ffff';
        marker1.style.boxShadow = '0 0 10px #00ffff';
        marker1.style.left = (gameState.players[0].targetLane / maxT * containerW - markerW / 2) + 'px';
        marker2.style.display = 'block';
        marker2.style.background = '#ff00ff';
        marker2.style.boxShadow = '0 0 10px #ff00ff';
        marker2.style.left = (gameState.players[1].targetLane / maxT * containerW - markerW / 2) + 'px';
    } else {
        const lane = gameState.players[0] ? gameState.players[0].targetLane : maxT / 2;
        marker1.style.background = '#00ffff';
        marker1.style.boxShadow = '0 0 10px #00ffff';
        marker1.style.left = (lane / maxT * containerW - markerW / 2) + 'px';
        marker2.style.display = 'none';
    }
}

// ── Pose helpers (identical to Wave Assault) ─────────────────────────

const _keypointMapCache = new WeakMap();

function _getKeypointMap(pose) {
    let map = _keypointMapCache.get(pose.keypoints);
    if (map) return map;
    map = new Map();
    for (let i = 0; i < pose.keypoints.length; i++) {
        map.set(pose.keypoints[i].name, pose.keypoints[i]);
    }
    _keypointMapCache.set(pose.keypoints, map);
    return map;
}

function getKeypoint(pose, name) {
    return _getKeypointMap(pose).get(name) || null;
}

function pruneByTime(arr, cutoff) {
    let i = 0;
    while (i < arr.length && arr[i].time < cutoff) i++;
    if (i > 0) arr.splice(0, i);
}

function getPoseCenterX(pose) {
    const ls = getKeypoint(pose, 'left_shoulder');
    const rs = getKeypoint(pose, 'right_shoulder');
    if (ls && rs && ls.score > 0.3 && rs.score > 0.3) {
        return (ls.x + rs.x) / 2;
    }
    const nose = getKeypoint(pose, 'nose');
    if (nose && nose.score > 0.3) return nose.x;
    return pose.keypoints[0]?.x || 0;
}

function getWrists(pose) {
    const cfg = CONFIG.waveGesture;
    const lw = getKeypoint(pose, 'left_wrist');
    const rw = getKeypoint(pose, 'right_wrist');
    return {
        left: (lw && lw.score >= cfg.wristMinConfidence) ? lw : null,
        right: (rw && rw.score >= cfg.wristMinConfidence) ? rw : null,
    };
}

function getBestWrist(pose) {
    const { left, right } = getWrists(pose);
    if (left && right) return left.score > right.score ? left : right;
    return left || right || null;
}

// ── Color tracking (identical to Wave Assault) ───────────────────────

function sampleTorsoColor(pose, video, cx, canvas) {
    const cfg = CONFIG.colorTracking;
    const ls = getKeypoint(pose, 'left_shoulder');
    const rs = getKeypoint(pose, 'right_shoulder');
    const lh = getKeypoint(pose, 'left_hip');
    const rh = getKeypoint(pose, 'right_hip');
    if (!ls || !rs || ls.score < 0.3 || rs.score < 0.3) return null;

    const sx = (ls.x + rs.x) / 2;
    const sy = (ls.y + rs.y) / 2;
    let hx, hy;
    if (lh && rh && lh.score > 0.2 && rh.score > 0.2) {
        hx = (lh.x + rh.x) / 2;
        hy = (lh.y + rh.y) / 2;
    } else {
        hx = sx;
        hy = sy + Math.abs(rs.x - ls.x) * 1.2;
    }

    const centerX = sx + (hx - sx) * 0.4;
    const centerY = sy + (hy - sy) * 0.4;
    const halfW = Math.abs(rs.x - ls.x) * 0.4;
    const halfH = Math.abs(hy - sy) * 0.25;

    const x0 = Math.max(0, Math.round(centerX - halfW));
    const y0 = Math.max(0, Math.round(centerY - halfH));
    const x1 = Math.min(video.videoWidth, Math.round(centerX + halfW));
    const y1 = Math.min(video.videoHeight, Math.round(centerY + halfH));

    if (x1 - x0 < 4 || y1 - y0 < 4) return null;

    cx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;
    const px0 = Math.round(x0 * scaleX);
    const py0 = Math.round(y0 * scaleY);
    const pw = Math.round((x1 - x0) * scaleX);
    const ph = Math.round((y1 - y0) * scaleY);
    if (pw < 2 || ph < 2) return null;

    const imageData = cx.getImageData(px0, py0, pw, ph);
    const data = imageData.data;
    const step = cfg.pixelStep;
    const bins = new Float32Array(cfg.hueBins);
    let count = 0;

    for (let py = 0; py < ph; py += step) {
        for (let px = 0; px < pw; px += step) {
            const idx = (py * pw + px) * 4;
            const r = data[idx] / 255;
            const g = data[idx + 1] / 255;
            const b = data[idx + 2] / 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            const sat = max > 0 ? delta / max : 0;
            if (sat < cfg.minSaturation || max < cfg.minValue || max > cfg.maxValue) continue;

            let hue;
            if (delta === 0) { hue = 0; }
            else if (max === r) { hue = 60 * (((g - b) / delta) % 6); }
            else if (max === g) { hue = 60 * (((b - r) / delta) + 2); }
            else { hue = 60 * (((r - g) / delta) + 4); }
            if (hue < 0) hue += 360;

            const bin = Math.min(cfg.hueBins - 1, Math.floor(hue / (360 / cfg.hueBins)));
            bins[bin]++;
            count++;
        }
    }
    if (count < cfg.minPixels) return null;
    for (let i = 0; i < bins.length; i++) bins[i] /= count;
    return bins;
}

function compareColorSignatures(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += Math.min(a[i], b[i]);
    return sum;
}

function updateColorSignature(stored, current, alpha) {
    if (!stored || !current || stored.length !== current.length) return current;
    const result = new Float32Array(stored.length);
    let sum = 0;
    for (let i = 0; i < stored.length; i++) {
        result[i] = stored[i] * (1 - alpha) + current[i] * alpha;
        sum += result[i];
    }
    if (sum > 0) { for (let i = 0; i < result.length; i++) result[i] /= sum; }
    return result;
}

// ── Wave gesture (used for registration) ────────────────────────────

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

// ── Half-pipe gesture detectors ──────────────────────────────────────

// Jump: both wrists above the nose Y coordinate (held for N frames).
function checkJumpGesture(pose, playerIndex) {
    if (!gameState.running || gameState.countdownActive) return;
    const cfg = CONFIG.camera;
    const reg = webcamState.registeredPlayers[playerIndex];
    const p = gameState.players[playerIndex];

    if (reg.jumpCooldown > 0) { reg.jumpCooldown--; return; }
    if (p.jumping) { reg.jumpHoldFrames = 0; return; }

    const nose = getKeypoint(pose, 'nose');
    const lw = getKeypoint(pose, 'left_wrist');
    const rw = getKeypoint(pose, 'right_wrist');

    const bothUp = nose && nose.score > 0.3 &&
        lw && lw.score > 0.25 && lw.y < nose.y &&
        rw && rw.score > 0.25 && rw.y < nose.y;

    if (bothUp) {
        reg.jumpHoldFrames++;
        if (reg.jumpHoldFrames >= cfg.jumpHoldFrames) {
            triggerJump(playerIndex);
            reg.jumpHoldFrames = 0;
            reg.jumpCooldown = cfg.jumpCooldownFrames;
        }
    } else {
        reg.jumpHoldFrames = Math.max(0, reg.jumpHoldFrames - 1);
    }
}

// Crouch: shoulder Y rises (person bends down), detected by comparing to baseline.
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
            reg.crouchCooldown = cfg.crouchCooldownFrames;
        }
    } else {
        reg.crouchHoldFrames = Math.max(0, reg.crouchHoldFrames - 1);
    }
}

// Map pose X position to a continuous pipe position (0…laneCount-1).
// No dead-zone: the full camera width maps directly to the full pipe arc.
function poseToLane(pose, playerIndex) {
    const video = webcamState.video;
    if (!video) return CONFIG.player.startLane;

    const cx = getPoseCenterX(pose);
    const W = video.videoWidth;

    let norm; // 0.0 (far left) … 1.0 (far right) within this player's zone
    if (gameState.playerCount === 2) {
        // P1 owns left half, P2 owns right half (mirrored video)
        if (playerIndex === 0) {
            norm = 1 - Math.min(1, Math.max(0, (cx / (W * 0.5))));
        } else {
            norm = 1 - Math.min(1, Math.max(0, ((cx - W * 0.5) / (W * 0.5))));
        }
    } else {
        // Full width for single player
        norm = 1 - Math.min(1, Math.max(0, cx / W));
    }

    return norm * (CONFIG.pipe.laneCount - 1);
}

// ── Gameplay pose update ─────────────────────────────────────────────

function handleGameplayPoseTracking(sortedPoses, video) {
    const cx = webcamState.ctx;
    const canvas = webcamState.canvas;

    for (let i = 0; i < gameState.playerCount; i++) {
        const reg = webcamState.registeredPlayers[i];
        if (!reg.ready) continue;

        // Find the best matching pose for this player
        const pose = findPoseForPlayer(sortedPoses, i, video, cx, canvas);
        webcamState.playerPoses[i] = pose;
        if (!pose) continue;

        // Update lane from body position
        gameState.players[i].targetLane = poseToLane(pose, i);

        // Gesture detection
        checkJumpGesture(pose, i);
        checkCrouchGesture(pose, i);

        // Keep color signature fresh
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
        const sig = sampleTorsoColor(p, video, cx, canvas);
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
    const video = webcamState.video;
    const cx = webcamState.ctx;
    const canvas = webcamState.canvas;
    if (!video || video.readyState < 2) return;

    cx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = cx.getImageData(0, 0, canvas.width, canvas.height).data;
    if (!webcamState.previousFrame) {
        webcamState.previousFrame = frame;
        return;
    }

    const thirds = Math.floor(canvas.width / 3);
    const motionCols = [0, 0, 0];
    let total = 0;
    for (let y = 0; y < canvas.height; y += 4) {
        for (let x = 0; x < canvas.width; x += 4) {
            const idx = (y * canvas.width + x) * 4;
            const diff = Math.abs(frame[idx] - webcamState.previousFrame[idx]) +
                Math.abs(frame[idx + 1] - webcamState.previousFrame[idx + 1]) +
                Math.abs(frame[idx + 2] - webcamState.previousFrame[idx + 2]);
            if (diff > 30) {
                motionCols[Math.min(2, Math.floor(x / thirds))]++;
                total++;
            }
        }
    }
    webcamState.previousFrame = frame;
    if (total < 10) return;

    // Derive lane from motion centroid
    const weightedX = (motionCols[0] * 0.1 + motionCols[1] * 0.5 + motionCols[2] * 0.9) / Math.max(1, total);
    // Mirror (camera is mirrored)
    const lane = (1 - weightedX) * (CONFIG.pipe.laneCount - 1);
    gameState.players[0].targetLane = lane;
}

// ── Player registration (identical flow to Wave Assault) ─────────────

function startPlayerRegistration(playerCount) {
    webcamState.playerCount = playerCount;
    webcamState.registrationPhase = 'registering';
    webcamState.currentRegisteringPlayer = 0;
    webcamState.registeredPlayers.forEach(r => {
        r.ready = false;
        r.faceImage = null;
        r.poseId = null;
        r.colorSignature = null;
        r.waveFrames = 0;
        r.wristHistories = { left: [], right: [] };
        r.motionScore = 0;
        r.jumpHoldFrames = 0;
        r.jumpCooldown = 0;
        r.crouchHoldFrames = 0;
        r.crouchCooldown = 0;
        r.baselineShoulderY = null;
    });
    updateRegistrationUI();
}

function handleRegistrationPoseTracking(sortedPoses, video) {
    const cx = webcamState.ctx;
    const canvas = webcamState.canvas;
    const idx = webcamState.currentRegisteringPlayer;
    const reg = webcamState.registeredPlayers[idx];

    // Pick the pose most central to this player's expected side
    let pose = null;
    if (webcamState.playerCount === 2) {
        const halfW = video.videoWidth / 2;
        const candidates = sortedPoses.filter(p => {
            const x = getPoseCenterX(p);
            return idx === 0 ? x < halfW : x >= halfW;
        });
        pose = candidates[0] || null;
    } else {
        pose = sortedPoses[0] || null;
    }
    if (!pose) return;

    // Track wrist wave gesture for confirmation
    const { left, right } = getWrists(pose);
    const now = Date.now();
    if (left) reg.wristHistories.left.push({ x: left.x, y: left.y, time: now });
    if (right) reg.wristHistories.right.push({ x: right.x, y: right.y, time: now });

    const cutoff = now - CONFIG.waveGesture.historyWindowMs - 100;
    pruneByTime(reg.wristHistories.left, cutoff);
    pruneByTime(reg.wristHistories.right, cutoff);

    const lScore = scoreWristHistory(reg.wristHistories.left);
    const rScore = scoreWristHistory(reg.wristHistories.right);
    reg.motionScore = Math.max(lScore, rScore);

    if (reg.motionScore > 0.3) {
        reg.waveFrames++;
    } else {
        reg.waveFrames = Math.max(0, reg.waveFrames - 1);
    }

    updateRegistrationWaveIndicator(reg.waveFrames, CONFIG.waveGesture.holdFrames);

    if (reg.waveFrames >= CONFIG.waveGesture.holdFrames) {
        // Sample torso color first (it draws the video frame to the canvas as a
        // side effect), then capture the face from the live video element.
        reg.colorSignature = sampleTorsoColor(pose, video, cx, canvas);
        captureFaceImage(pose, video, idx);
        reg.poseId = pose.id;

        // Calibrate crouch baseline from current shoulder Y
        const ls = getKeypoint(pose, 'left_shoulder');
        const rs = getKeypoint(pose, 'right_shoulder');
        if (ls && rs && ls.score > 0.3 && rs.score > 0.3) {
            reg.baselineShoulderY = (ls.y + rs.y) / 2;
        }

        reg.ready = true;
        reg.waveFrames = 0;
        onPlayerRegistered(idx);
    }
}

function captureFaceImage(pose, video, playerIndex) {
    const nose = getKeypoint(pose, 'nose');
    const ls = getKeypoint(pose, 'left_shoulder');
    const rs = getKeypoint(pose, 'right_shoulder');
    if (!nose || nose.score < 0.3) return;

    const shoulderWidth = (ls && rs) ? Math.abs(rs.x - ls.x) : 80;
    const faceSize = Math.max(40, shoulderWidth * 0.8);
    // Keypoint coordinates are in video space — use them directly.
    const fx = nose.x - faceSize / 2;
    const fy = nose.y - faceSize * 0.7;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 60;
    tempCanvas.height = 60;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw from the live video element (not the overlay canvas) so we always
    // get the actual camera frame regardless of draw order.
    tempCtx.save();
    tempCtx.scale(-1, 1);          // mirror to match CSS scaleX(-1) on the canvas
    tempCtx.translate(-60, 0);
    tempCtx.drawImage(
        video,
        fx, fy, faceSize, faceSize, // source: video-space coords
        0, 0, 60, 60                // dest: 60×60 thumbnail
    );
    tempCtx.restore();

    const img = new Image();
    img.src = tempCanvas.toDataURL();
    webcamState.registeredPlayers[playerIndex].faceImage = img;
    gameState.players[playerIndex].faceImage = img;
}

function onPlayerRegistered(playerIndex) {
    const reg = webcamState.registeredPlayers[playerIndex];
    updateRegistrationPlayerCard(playerIndex, reg.faceImage);

    const nextIdx = playerIndex + 1;
    if (nextIdx < webcamState.playerCount) {
        webcamState.currentRegisteringPlayer = nextIdx;
        updateRegistrationUI();
    } else {
        webcamState.registrationPhase = 'ready';
        document.getElementById('setupStartBtn').classList.remove('hidden');
    }
}

// ── Registration UI helpers ──────────────────────────────────────────

function updateRegistrationUI() {
    const idx = webcamState.currentRegisteringPlayer;
    const isP2 = idx === 1;
    document.getElementById('setupTitle').textContent = isP2
        ? 'PLAYER 2 - GET READY!'
        : 'PLAYER 1 - GET READY!';
    document.getElementById('setupTitle').className = `player-setup-title ${isP2 ? 'p2' : 'p1'}`;
    document.getElementById('setupInstruction').textContent = isP2
        ? 'Stand on the RIGHT side and wave your hand'
        : 'Stand on the LEFT side and wave your hand';
    if (webcamState.playerCount === 2) {
        document.getElementById('p2ReadyCard').classList.remove('hidden');
    }
}

function updateRegistrationWaveIndicator(frames, maxFrames) {
    const el = document.getElementById('setupWaveIndicator');
    const pct = Math.min(1, frames / maxFrames);
    if (pct > 0.1) {
        el.textContent = `WAVING… ${Math.round(pct * 100)}%`;
        el.style.color = pct > 0.7 ? '#00ff00' : '#ffff00';
    } else {
        el.textContent = 'WAVE YOUR HAND!';
        el.style.color = '#ffffff';
    }
}

function updateRegistrationPlayerCard(playerIndex, faceImage) {
    const cardId = playerIndex === 0 ? 'p1ReadyCard' : 'p2ReadyCard';
    const faceId = playerIndex === 0 ? 'p1FacePreview' : 'p2FacePreview';
    const placeholderId = playerIndex === 0 ? 'p1FacePlaceholder' : 'p2FacePlaceholder';
    const statusId = playerIndex === 0 ? 'p1ReadyStatus' : 'p2ReadyStatus';

    document.getElementById(statusId).textContent = 'READY!';
    document.getElementById(statusId).style.color = '#00ff00';
    if (faceImage) {
        const faceEl = document.getElementById(faceId);
        faceEl.src = faceImage.src;
        faceEl.style.display = 'block';
        document.getElementById(placeholderId).style.display = 'none';
    }
}

// ── Debug overlay drawing ────────────────────────────────────────────

// Draw the live video frame as the canvas background.
// Must be called at the start of every overlay draw so the canvas
// always shows the camera feed beneath skeleton/debug graphics.
function _drawVideoBackground() {
    const cx = webcamState.ctx;
    const canvas = webcamState.canvas;
    const video = webcamState.video;
    if (!video || video.readyState < 2) {
        cx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }
    cx.drawImage(video, 0, 0, canvas.width, canvas.height);
}

// Draw skeleton dots and connecting lines for one pose.
function _drawSkeleton(pose, color) {
    const cx = webcamState.ctx;
    const SKELETON_PAIRS = [
        ['left_shoulder', 'right_shoulder'],
        ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
        ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
        ['left_hip', 'right_hip'],
    ];

    cx.save();
    cx.strokeStyle = color;
    cx.fillStyle = color;
    cx.lineWidth = 2;
    cx.globalAlpha = 0.8;

    for (const kp of pose.keypoints) {
        if (kp.score > 0.3) {
            cx.beginPath();
            cx.arc(kp.x, kp.y, 4, 0, Math.PI * 2);
            cx.fill();
        }
    }
    for (const [a, b] of SKELETON_PAIRS) {
        const ka = getKeypoint(pose, a);
        const kb = getKeypoint(pose, b);
        if (ka && kb && ka.score > 0.3 && kb.score > 0.3) {
            cx.beginPath();
            cx.moveTo(ka.x, ka.y);
            cx.lineTo(kb.x, kb.y);
            cx.stroke();
        }
    }
    cx.restore();
}

function drawPoseDebug() {
    _drawVideoBackground();

    const colors = ['#00ffff', '#ff00ff'];
    for (let i = 0; i < gameState.playerCount; i++) {
        const pose = webcamState.playerPoses[i];
        if (pose) _drawSkeleton(pose, colors[i]);
    }
}

function drawRegistrationDebug(sortedPoses) {
    _drawVideoBackground();

    for (const pose of sortedPoses) {
        _drawSkeleton(pose, '#ffff00');
    }
}
