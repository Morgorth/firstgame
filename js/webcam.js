// Webcam initialization, MoveNet pose detection, wave-gesture detection,
// player registration flow, and debug visualizations.

// ── Lifecycle ───────────────────────────────────────────────────────

async function initWebcam() {
    try {
        const statusEl = document.getElementById('cameraStatus');
        statusEl.textContent = 'Requesting camera access...';

        webcamState.video = document.getElementById('webcamVideo');
        webcamState.canvas = document.getElementById('webcamCanvas');
        webcamState.ctx = webcamState.canvas.getContext('2d', { willReadFrequently: true });

        // Unhide container BEFORE setting srcObject so the video element
        // is in the layout — some browsers won't decode frames for
        // display:none videos.
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

        // Explicit play() — autoplay attribute alone is unreliable in
        // sandboxed iframes and many mobile browsers.
        await webcamState.video.play();

        webcamState.initialized = true;
        webcamState.active = true;

        statusEl.textContent = 'Loading AI pose detection...';
        await initPoseDetector();

        statusEl.textContent = 'AI ready! Move LEFT / CENTER / RIGHT.';
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
        console.log('TensorFlow.js ready, backend:', tf.getBackend());

        webcamState.poseDetector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            {
                modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
                enableSmoothing: true,
                enableTracking: true,
                trackerType: poseDetection.TrackerType.BoundingBox,
                minPoseScore: 0.25
            }
        );
        webcamState.poseDetectorReady = true;
        console.log('MoveNet MultiPose detector initialized');
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

// ── Pose tracking loop ──────────────────────────────────────────────

async function trackPoses() {
    if (!webcamState.active || !webcamState.initialized) return;

    const video = webcamState.video;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(trackPoses);
        return;
    }

    if (!webcamState.poseDetectorReady || !webcamState.poseDetector) {
        trackMotion();
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
        } else {
            handleLegacyPoseTracking(poses, video);
        }

        // Update position indicator markers
        const marker1 = document.getElementById('positionMarker');
        const marker2 = document.getElementById('positionMarkerP2');
        if (gameState.running && gameState.playerCount === 2) {
            const numLanes = gameState.numLanes || 5;
            const containerW = 200; // webcam container width
            const markerW = 20;
            marker1.style.background = '#00ffff';
            marker1.style.boxShadow = '0 0 10px #00ffff';
            marker1.style.left = ((gameState.players[0].targetLane + 0.5) / numLanes * containerW - markerW / 2) + 'px';
            marker2.style.display = 'block';
            marker2.style.background = '#ff00ff';
            marker2.style.boxShadow = '0 0 10px #ff00ff';
            marker2.style.left = ((gameState.players[1].targetLane + 0.5) / numLanes * containerW - markerW / 2) + 'px';
        } else {
            marker1.style.background = '#ff00ff';
            marker1.style.boxShadow = '0 0 10px #ff00ff';
            marker1.style.left = (30 + webcamState.targetLane * 60) + 'px';
            marker2.style.display = 'none';
        }

        if (webcamState.registrationPhase === 'registering' ||
            webcamState.registrationPhase === 'ready') {
            drawRegistrationDebug(sortedPoses);
        } else {
            drawPoseDebug();
        }
    } catch (e) {
        console.error('Pose detection error:', e);
    }

    requestAnimationFrame(trackPoses);
}

// ── Pose helpers ────────────────────────────────────────────────────

function getKeypoint(pose, name) {
    return pose.keypoints.find(k => k.name === name);
}

// Remove entries older than cutoff, mutating the array in place.
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

// Returns both wrists that meet the confidence threshold, or null for each.
function getWrists(pose) {
    const cfg = CONFIG.waveGesture;
    const lw = getKeypoint(pose, 'left_wrist');
    const rw = getKeypoint(pose, 'right_wrist');
    return {
        left: (lw && lw.score >= cfg.wristMinConfidence) ? lw : null,
        right: (rw && rw.score >= cfg.wristMinConfidence) ? rw : null
    };
}

// Legacy helper — returns best single wrist (used by debug drawing).
function getBestWrist(pose) {
    const { left, right } = getWrists(pose);
    if (left && right) return left.score > right.score ? left : right;
    return left || right || null;
}

// ── Wave-gesture detection ──────────────────────────────────────────

// Score a single wrist's history for wave-like motion.
// Uses time-based windowing so detection works consistently across framerates.
function scoreWristHistory(history) {
    const cfg = CONFIG.waveGesture;
    const now = Date.now();
    const cutoff = now - cfg.historyWindowMs;

    // Filter to only samples within the time window
    const recent = history.filter(h => h.time >= cutoff);
    if (recent.length < cfg.minSamplesForDetection) return 0;

    let totalMotion = 0;
    let directionChanges = 0;
    let lastDx = 0;
    let lastDy = 0;

    for (let i = 1; i < recent.length; i++) {
        const dx = recent[i].x - recent[i - 1].x;
        const dy = recent[i].y - recent[i - 1].y;
        totalMotion += Math.sqrt(dx * dx + dy * dy);

        if (i > 1) {
            const thresh = cfg.directionChangePx;
            if ((dx > thresh && lastDx < -thresh) || (dx < -thresh && lastDx > thresh)) directionChanges++;
            if ((dy > thresh && lastDy < -thresh) || (dy < -thresh && lastDy > thresh)) directionChanges++;
        }
        lastDx = dx;
        lastDy = dy;
    }

    const avgMotion = totalMotion / recent.length;

    // Progressive scoring: motion amount + oscillation bonus
    if (avgMotion > cfg.strongMotion || (avgMotion > cfg.mediumMotion && directionChanges >= 2)) return 1.0;
    if (avgMotion > cfg.mediumMotion || (avgMotion > cfg.weakMotion && directionChanges >= 1)) return 0.7;
    if (avgMotion > cfg.weakMotion) return 0.3;
    return 0;
}

// Track both wrists independently, return the best motion score.
// `wristHistories` is { left: [], right: [] }.
function updateWaveDetection(pose, wristHistories) {
    const cfg = CONFIG.waveGesture;
    const now = Date.now();
    const cutoff = now - cfg.historyWindowMs;
    const { left, right } = getWrists(pose);

    // Append new samples
    if (left)  wristHistories.left.push({ x: left.x, y: left.y, time: now });
    if (right) wristHistories.right.push({ x: right.x, y: right.y, time: now });

    // Prune old samples by time (mutate in place to keep caller references)
    pruneByTime(wristHistories.left, cutoff);
    pruneByTime(wristHistories.right, cutoff);

    // Score each independently, use the better one
    const leftScore  = scoreWristHistory(wristHistories.left);
    const rightScore = scoreWristHistory(wristHistories.right);
    return Math.max(leftScore, rightScore);
}

// ── Phase handlers ──────────────────────────────────────────────────

function findTargetPose(sortedPoses, playerIndex, video) {
    if (webcamState.playerCount === 2 && sortedPoses.length > 0) {
        const midX = video.videoWidth / 2;
        if (playerIndex === 0) {
            return sortedPoses.find(p => getPoseCenterX(p) > midX) || sortedPoses[sortedPoses.length - 1];
        } else {
            return sortedPoses.find(p => getPoseCenterX(p) < midX) || sortedPoses[0];
        }
    }
    return sortedPoses[0] || null;
}

function handleRegistrationPoseTracking(sortedPoses, video) {
    const idx = webcamState.currentRegisteringPlayer;
    const reg = webcamState.registeredPlayers[idx];
    if (reg.ready) return;

    const targetPose = findTargetPose(sortedPoses, idx, video);
    if (!targetPose) return;

    // Store MoveNet tracking ID so gameplay can maintain identity
    if (targetPose.id !== undefined) {
        webcamState.playerTrackingIds[idx] = targetPose.id;
    }

    const motionScore = updateWaveDetection(targetPose, reg.wristHistories);
    reg.motionScore = motionScore;

    const indicator = document.getElementById('setupWaveIndicator');
    const cfg = CONFIG.waveGesture;

    if (motionScore >= 0.5) {
        reg.waveFrames++;
        const progress = Math.min(100, Math.floor(reg.waveFrames / cfg.framesToConfirm * 100));
        indicator.textContent = `WAVING... ${progress}%`;
        indicator.style.color = '#00ff00';

        if (reg.waveFrames >= cfg.framesToConfirm) {
            const faceImage = captureFaceForPlayer(idx, targetPose);
            if (faceImage) completePlayerRegistration(idx, faceImage);
        }
    } else if (motionScore > 0) {
        indicator.textContent = 'WAVE YOUR HAND!';
        indicator.style.color = '#ffff00';
        reg.waveFrames = Math.max(0, reg.waveFrames - 1);
    } else {
        indicator.textContent = 'WAVE YOUR HAND!';
        indicator.style.color = '#ffffff';
        reg.waveFrames = Math.max(0, reg.waveFrames - cfg.decayRate);
    }
}

function handleGameplayPoseTracking(sortedPoses, video) {
    const numLanes = gameState.playerCount === 2 ? 5 : 3;

    if (gameState.playerCount === 2) {
        assignTwoPlayerPoses(sortedPoses, video, numLanes);
    } else if (sortedPoses.length > 0) {
        assignPoseToPlayer(0, sortedPoses[0], video, numLanes);
        webcamState.playerPoses = [sortedPoses[0], null];
        const normalizedX = 1 - (getPoseCenterX(sortedPoses[0]) / video.videoWidth);
        webcamState.targetLane = normalizedX < 0.35 ? 0 : normalizedX > 0.65 ? 2 : 1;
    }
}

// Two-player pose assignment using MoveNet tracking IDs for persistence.
// Falls back to position-based assignment when IDs don't match.
function assignTwoPlayerPoses(sortedPoses, video, numLanes) {
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

    // Step 2: assign unmatched poses by position
    const unmatched = sortedPoses.filter(p => p !== p0Pose && p !== p1Pose);

    if (!p0Pose && !p1Pose && unmatched.length >= 2) {
        // Neither matched — rightmost in camera = P1
        p0Pose = unmatched[unmatched.length - 1];
        p1Pose = unmatched[0];
    } else if (!p0Pose && unmatched.length > 0) {
        p0Pose = unmatched[unmatched.length - 1];
    } else if (!p1Pose && unmatched.length > 0) {
        p1Pose = unmatched[0];
    }

    // Single-pose fallback: use position to decide which player
    if (sortedPoses.length === 1 && !p0Pose && !p1Pose) {
        const pose = sortedPoses[0];
        const normalizedX = 1 - (getPoseCenterX(pose) / video.videoWidth);
        if (normalizedX < 0.5) { p0Pose = pose; } else { p1Pose = pose; }
    }

    // Step 3: update tracking IDs
    if (p0Pose && p0Pose.id !== undefined) ids[0] = p0Pose.id;
    if (p1Pose && p1Pose.id !== undefined) ids[1] = p1Pose.id;

    // Step 4: assign to game players
    if (p0Pose) assignPoseToPlayer(0, p0Pose, video, numLanes);
    if (p1Pose) assignPoseToPlayer(1, p1Pose, video, numLanes);

    // Step 5: store for debug overlay
    webcamState.playerPoses = [p0Pose || null, p1Pose || null];
}

function assignPoseToPlayer(playerIndex, pose, video, numLanes) {
    const player = gameState.players[playerIndex];
    if (!player || !player.active) return;

    const normalizedX = 1 - (getPoseCenterX(pose) / video.videoWidth);

    let lane;
    if (numLanes === 5) {
        lane = Math.min(4, Math.floor(normalizedX * 5));
    } else {
        lane = normalizedX < 0.35 ? 0 : normalizedX > 0.65 ? 2 : 1;
    }
    player.targetLane = lane;

    const ls = getKeypoint(pose, 'left_shoulder');
    const rs = getKeypoint(pose, 'right_shoulder');
    if (ls && rs) webcamState.poseConfidence = (ls.score + rs.score) / 2;
}

function handleLegacyPoseTracking(poses, video) {
    if (!poses || poses.length === 0) return;

    const pose = poses[0];
    webcamState.lastPose = pose;
    webcamState.detectedKeypoints = pose.keypoints;

    const ls = getKeypoint(pose, 'left_shoulder');
    const rs = getKeypoint(pose, 'right_shoulder');
    const nose = getKeypoint(pose, 'nose');

    let centerX = null;
    let confidence = 0;

    if (ls && rs && ls.score > 0.3 && rs.score > 0.3) {
        centerX = (ls.x + rs.x) / 2;
        confidence = (ls.score + rs.score) / 2;
    } else if (nose && nose.score > 0.4) {
        centerX = nose.x;
        confidence = nose.score;
    }

    if (centerX !== null && confidence > 0.3) {
        webcamState.poseConfidence = confidence;
        const normalizedX = 1 - (centerX / video.videoWidth);
        webcamState.targetLane = normalizedX < 0.35 ? 0 : normalizedX > 0.65 ? 2 : 1;
    }

    // Wave detection for pre-game readiness
    if (!gameState.running && !webcamState.isReady) {
        webcamState.leftWristPos = getKeypoint(pose, 'left_wrist');
        webcamState.rightWristPos = getKeypoint(pose, 'right_wrist');

        const motionScore = updateWaveDetection(pose, webcamState.wristHistories);
        webcamState.motionScore = motionScore;

        const indicator = document.getElementById('armsUpIndicator');
        const cfg = CONFIG.waveGesture;

        if (motionScore >= 0.5) {
            webcamState.waveFrames++;
            const progress = Math.min(100, Math.floor(webcamState.waveFrames / cfg.framesToConfirm * 100));
            indicator.textContent = `WAVING... ${progress}%`;

            if (webcamState.waveFrames >= cfg.framesToConfirm) {
                webcamState.isReady = true;
                captureFace();
                indicator.textContent = 'READY! CLICK START!';
                indicator.classList.add('ready');
                document.getElementById('startBtn').style.opacity = '1';
                document.getElementById('startBtn').style.pointerEvents = 'auto';
            }
        } else {
            webcamState.waveFrames = Math.max(0, webcamState.waveFrames - cfg.decayRate);
        }
    }
}

// ── Debug drawing ───────────────────────────────────────────────────

function drawSkeletonOnCanvas(targetCtx, pose, color, scaleX, scaleY) {
    pose.keypoints.forEach(kp => {
        if (kp.score > 0.3) {
            targetCtx.beginPath();
            targetCtx.arc(kp.x * scaleX, kp.y * scaleY, 4, 0, Math.PI * 2);
            targetCtx.fillStyle = kp.score > 0.6 ? color : '#ffff00';
            targetCtx.fill();
        }
    });

    targetCtx.strokeStyle = color;
    targetCtx.lineWidth = 2;
    SKELETON_CONNECTIONS.forEach(([a, b]) => {
        const kpA = getKeypoint(pose, a);
        const kpB = getKeypoint(pose, b);
        if (kpA && kpB && kpA.score > 0.3 && kpB.score > 0.3) {
            targetCtx.beginPath();
            targetCtx.moveTo(kpA.x * scaleX, kpA.y * scaleY);
            targetCtx.lineTo(kpB.x * scaleX, kpB.y * scaleY);
            targetCtx.stroke();
        }
    });
}

function drawRegistrationDebug(sortedPoses) {
    const cvs = document.getElementById('setupCanvas');
    const cx = cvs.getContext('2d');
    const video = webcamState.video;
    if (!cx || !video) return;

    cx.drawImage(video, 0, 0, cvs.width, cvs.height);

    const scaleX = cvs.width / video.videoWidth;
    const scaleY = cvs.height / video.videoHeight;

    // Center divider for 2-player mode
    if (webcamState.playerCount === 2) {
        cx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        cx.lineWidth = 2;
        cx.setLineDash([10, 5]);
        cx.beginPath();
        cx.moveTo(cvs.width / 2, 0);
        cx.lineTo(cvs.width / 2, cvs.height);
        cx.stroke();
        cx.setLineDash([]);

        cx.font = 'bold 14px Orbitron, monospace';
        cx.textAlign = 'center';
        cx.fillStyle = '#00ffff';
        cx.fillText('P1 SIDE', cvs.width * 0.75, 20);
        cx.fillStyle = '#ff00ff';
        cx.fillText('P2 SIDE', cvs.width * 0.25, 20);
    }

    // Draw all skeletons
    sortedPoses.forEach((pose, idx) => {
        const color = idx === 0 ? '#ff00ff' : '#00ffff';
        drawSkeletonOnCanvas(cx, pose, color, scaleX, scaleY);
    });

    // Wrist tracking for current registering player
    const currentPlayer = webcamState.currentRegisteringPlayer;
    const reg = webcamState.registeredPlayers[currentPlayer];
    if (reg.ready) return;

    const targetPose = findTargetPose(sortedPoses, currentPlayer, video);
    if (!targetPose) return;

    const motionScore = reg.motionScore || 0;
    const motionColor = motionScore >= 0.5 ? ['#00ff00', 'rgba(0,255,0,0.4)', 'rgba(0,255,0,0.6)']
                       : motionScore > 0   ? ['#ffff00', 'rgba(255,255,0,0.3)', 'rgba(255,255,0,0.4)']
                       :                     ['#ff6666', 'rgba(255,0,0,0.2)', 'rgba(255,0,0,0.3)'];

    // Draw both wrists and their trails
    const { left: lw, right: rw } = getWrists(targetPose);
    const wrists = [
        { kp: lw, history: reg.wristHistories.left,  label: 'L' },
        { kp: rw, history: reg.wristHistories.right, label: 'R' }
    ];

    wrists.forEach(({ kp, history, label }) => {
        if (!kp) return;
        const radius = 12 + motionScore * 8;

        // Wrist circle
        cx.beginPath();
        cx.arc(kp.x * scaleX, kp.y * scaleY, radius, 0, Math.PI * 2);
        cx.strokeStyle = motionColor[0];
        cx.fillStyle = motionColor[1];
        cx.lineWidth = 3;
        cx.stroke();
        cx.fill();

        // Wrist label
        cx.fillStyle = '#fff';
        cx.font = 'bold 10px Orbitron, monospace';
        cx.textAlign = 'center';
        cx.fillText(label, kp.x * scaleX, kp.y * scaleY - radius - 4);

        // Motion trail
        if (history && history.length > 1) {
            cx.beginPath();
            cx.moveTo(history[0].x * scaleX, history[0].y * scaleY);
            for (let i = 1; i < history.length; i++) {
                cx.lineTo(history[i].x * scaleX, history[i].y * scaleY);
            }
            cx.strokeStyle = motionColor[2];
            cx.lineWidth = 2;
            cx.stroke();
        }
    });

    // Motion label
    cx.fillStyle = '#ffffff';
    cx.font = 'bold 14px Orbitron, monospace';
    cx.textAlign = 'left';
    const motionText = motionScore >= 0.5 ? 'MOTION DETECTED!' :
                       motionScore > 0 ? 'Keep waving...' : 'Wave your hand!';
    cx.fillText(motionText, 10, cvs.height - 10);
}

function drawPoseDebug() {
    if (!webcamState.ctx) return;

    const cx = webcamState.ctx;
    const video = webcamState.video;
    const cvs = webcamState.canvas;

    // Always draw the video frame so the feed is visible even before
    // MoveNet detects a pose (prevents permanent black canvas).
    cx.drawImage(video, 0, 0, cvs.width, cvs.height);

    // Two-player gameplay: draw both players with their own colors
    if (gameState.running && gameState.playerCount === 2) {
        drawTwoPlayerDebug(cx, cvs);
        return;
    }

    if (!webcamState.detectedKeypoints) return;

    // Draw keypoints and skeleton (scale 1:1 on webcam canvas)
    const kps = webcamState.detectedKeypoints;
    kps.forEach(kp => {
        if (kp.score > 0.3) {
            cx.beginPath();
            cx.arc(kp.x, kp.y, 4, 0, Math.PI * 2);
            cx.fillStyle = kp.score > 0.6 ? '#00ff00' : '#ffff00';
            cx.fill();
        }
    });

    cx.strokeStyle = '#00ffff';
    cx.lineWidth = 2;
    SKELETON_CONNECTIONS_FULL.forEach(([a, b]) => {
        const kpA = kps.find(k => k.name === a);
        const kpB = kps.find(k => k.name === b);
        if (kpA && kpB && kpA.score > 0.3 && kpB.score > 0.3) {
            cx.beginPath();
            cx.moveTo(kpA.x, kpA.y);
            cx.lineTo(kpB.x, kpB.y);
            cx.stroke();
        }
    });

    // Lane zone dividers
    const w = cvs.width, h = cvs.height;
    cx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
    cx.lineWidth = 2;
    cx.setLineDash([5, 5]);
    cx.beginPath();
    cx.moveTo(w * 0.35, 0); cx.lineTo(w * 0.35, h);
    cx.moveTo(w * 0.65, 0); cx.lineTo(w * 0.65, h);
    cx.stroke();
    cx.setLineDash([]);

    // Lane label
    const laneLabels = ['RIGHT', 'CENTER', 'LEFT'];
    const laneColors = ['#ff6666', '#66ff66', '#6666ff'];
    cx.fillStyle = laneColors[webcamState.targetLane];
    cx.font = 'bold 16px Orbitron, monospace';
    cx.textAlign = 'center';
    cx.strokeStyle = '#000';
    cx.lineWidth = 3;
    cx.strokeText(laneLabels[webcamState.targetLane], w / 2, h - 15);
    cx.fillText(laneLabels[webcamState.targetLane], w / 2, h - 15);

    // Wave threshold line (pre-game)
    if (!gameState.running && !webcamState.isReady && webcamState.waveThresholdY) {
        const threshY = webcamState.waveThresholdY;
        cx.strokeStyle = '#ffff00';
        cx.lineWidth = 2;
        cx.setLineDash([10, 5]);
        cx.beginPath();
        cx.moveTo(0, threshY); cx.lineTo(w, threshY);
        cx.stroke();
        cx.setLineDash([]);

        cx.fillStyle = '#ffff00';
        cx.font = 'bold 12px Orbitron, monospace';
        cx.textAlign = 'left';
        cx.fillText('RAISE HAND HERE', 5, threshY - 5);

        [webcamState.leftWristPos, webcamState.rightWristPos].forEach(wr => {
            if (wr && wr.score > 0.2) {
                const isAbove = wr.y < threshY;
                cx.beginPath();
                cx.arc(wr.x, wr.y, 12, 0, Math.PI * 2);
                cx.strokeStyle = isAbove ? '#00ff00' : '#ff6666';
                cx.lineWidth = 3;
                cx.stroke();
                cx.fillStyle = isAbove ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)';
                cx.fill();
            }
        });
    }

    // Confidence label
    const label = document.getElementById('webcamLabel');
    const conf = Math.round(webcamState.poseConfidence * 100);
    label.textContent = `AI ${conf}%`;
    label.style.color = conf > 60 ? '#00ff00' : conf > 40 ? '#ffff00' : '#ff6666';
}

// Two-player debug overlay: draws both skeletons in player colors (P1=cyan, P2=magenta)
// with lane dividers and per-player position indicators.
function drawTwoPlayerDebug(cx, cvs) {
    const w = cvs.width, h = cvs.height;
    const playerPoses = webcamState.playerPoses || [null, null];
    const playerColors = ['#00ffff', '#ff00ff'];

    // Draw each player's skeleton
    playerPoses.forEach((pose, idx) => {
        if (!pose) return;
        const color = playerColors[idx];

        // Keypoints
        pose.keypoints.forEach(kp => {
            if (kp.score > 0.3) {
                cx.beginPath();
                cx.arc(kp.x, kp.y, 4, 0, Math.PI * 2);
                cx.fillStyle = kp.score > 0.6 ? color : '#ffff00';
                cx.fill();
            }
        });

        // Skeleton lines
        cx.strokeStyle = color;
        cx.lineWidth = 2;
        SKELETON_CONNECTIONS_FULL.forEach(([a, b]) => {
            const kpA = getKeypoint(pose, a);
            const kpB = getKeypoint(pose, b);
            if (kpA && kpB && kpA.score > 0.3 && kpB.score > 0.3) {
                cx.beginPath();
                cx.moveTo(kpA.x, kpA.y);
                cx.lineTo(kpB.x, kpB.y);
                cx.stroke();
            }
        });

        // Player label above head
        const nose = getKeypoint(pose, 'nose');
        if (nose && nose.score > 0.3) {
            cx.font = 'bold 12px Orbitron, monospace';
            cx.textAlign = 'center';
            cx.strokeStyle = '#000';
            cx.lineWidth = 3;
            cx.strokeText('P' + (idx + 1), nose.x, nose.y - 20);
            cx.fillStyle = color;
            cx.fillText('P' + (idx + 1), nose.x, nose.y - 20);
        }
    });

    // Lane dividers (5 lanes)
    cx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    cx.lineWidth = 1;
    cx.setLineDash([4, 4]);
    for (let i = 1; i < 5; i++) {
        const x = w * (i / 5);
        cx.beginPath();
        cx.moveTo(x, 0);
        cx.lineTo(x, h);
        cx.stroke();
    }
    cx.setLineDash([]);

    // Per-player lane indicators at bottom of canvas
    gameState.players.forEach((player, idx) => {
        if (!player.active) return;
        const color = playerColors[idx];
        // Map lane position: lane 0 = rightmost in camera (mirrored to left on screen)
        // Camera X = width * (1 - (lane + 0.5) / numLanes)
        const numLanes = gameState.numLanes || 5;
        const laneX = w * (1 - (player.targetLane + 0.5) / numLanes);

        cx.fillStyle = color;
        cx.beginPath();
        cx.arc(laneX, h - 8, 5, 0, Math.PI * 2);
        cx.fill();

        cx.font = 'bold 10px Orbitron, monospace';
        cx.textAlign = 'center';
        cx.strokeStyle = '#000';
        cx.lineWidth = 2;
        cx.strokeText('P' + (idx + 1), laneX, h - 18);
        cx.fillStyle = color;
        cx.fillText('P' + (idx + 1), laneX, h - 18);
    });

    // Confidence label
    const label = document.getElementById('webcamLabel');
    const conf = Math.round(webcamState.poseConfidence * 100);
    label.textContent = `AI ${conf}%`;
    label.style.color = conf > 60 ? '#00ff00' : conf > 40 ? '#ffff00' : '#ff6666';
}

// ── Fallback edge-based tracking (no MoveNet) ──────────────────────

function trackMotion() {
    if (!webcamState.active || !webcamState.initialized) return;

    const video = webcamState.video;
    const cvs = webcamState.canvas;
    const cx = webcamState.ctx;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(trackMotion);
        return;
    }

    cx.drawImage(video, 0, 0, cvs.width, cvs.height);
    const frame = cx.getImageData(0, 0, cvs.width, cvs.height);
    const data = frame.data;
    const h = cvs.height, w = cvs.width, step = 3;

    // Edge-based 3-lane detection
    const LANES = 3;
    const laneWidth = Math.floor(w / LANES);
    const laneEdges = [0, 0, 0];

    for (let lane = 0; lane < LANES; lane++) {
        const laneStart = lane * laneWidth + 2;
        const laneEnd = Math.min(laneStart + laneWidth - 2, w - 2);
        for (let y = Math.floor(h * 0.1); y < Math.floor(h * 0.9); y += step) {
            for (let x = laneStart; x < laneEnd; x += step) {
                const i = (y * w + x) * 4;
                const here = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const right = (data[i + 12] + data[i + 13] + data[i + 14]) / 3;
                const hEdge = Math.abs(here - right);
                const below = (data[((y + step) * w + x) * 4] + data[((y + step) * w + x) * 4 + 1] + data[((y + step) * w + x) * 4 + 2]) / 3;
                const vEdge = Math.abs(here - below);
                if (hEdge > 20) laneEdges[lane] += hEdge;
                if (vEdge > 20) laneEdges[lane] += vEdge;
            }
        }
    }

    let maxEdges = 0, bodyLane = webcamState.targetLane;
    for (let i = 0; i < LANES; i++) {
        if (laneEdges[i] > maxEdges) {
            maxEdges = laneEdges[i];
            bodyLane = LANES - 1 - i; // mirror
        }
    }
    if (maxEdges > 1000) webcamState.targetLane = bodyLane;

    document.getElementById('positionMarker').style.left = (30 + webcamState.targetLane * 60) + 'px';

    // Fallback wave gesture (frame-diff motion in top 35%)
    if (!gameState.running && !webcamState.isReady && webcamState.previousFrame) {
        const prev = webcamState.previousFrame.data;
        let topMotion = 0;
        for (let y = 0; y < Math.floor(h * 0.35); y += step) {
            for (let x = 0; x < w; x += step) {
                const i = (y * w + x) * 4;
                const diff = Math.abs(data[i] - prev[i]) + Math.abs(data[i + 1] - prev[i + 1]) + Math.abs(data[i + 2] - prev[i + 2]);
                if (diff > 30) topMotion += diff;
            }
        }
        if (topMotion > 5000) {
            webcamState.waveFrames++;
            const indicator = document.getElementById('armsUpIndicator');
            indicator.textContent = `WAVING... ${Math.min(100, Math.floor(webcamState.waveFrames / 20 * 100))}%`;
            if (webcamState.waveFrames >= 20) {
                webcamState.isReady = true;
                captureFace();
                indicator.textContent = 'READY! CLICK START!';
                indicator.classList.add('ready');
                document.getElementById('startBtn').style.opacity = '1';
                document.getElementById('startBtn').style.pointerEvents = 'auto';
            }
        } else {
            webcamState.waveFrames = Math.max(0, webcamState.waveFrames - 1);
        }
    }

    webcamState.previousFrame = frame;
    requestAnimationFrame(trackMotion);
}

// ── Face capture ────────────────────────────────────────────────────

function captureFace() {
    if (!webcamState.video) return;
    const v = webcamState.video;
    const tc = document.createElement('canvas');
    const tx = tc.getContext('2d');
    tc.width = tc.height = 80;
    const cropSize = Math.min(v.videoWidth, v.videoHeight) * 0.5;
    tx.save();
    tx.translate(80, 0);
    tx.scale(-1, 1);
    tx.drawImage(v, (v.videoWidth - cropSize) / 2, v.videoHeight * 0.1, cropSize, cropSize, 0, 0, 80, 80);
    tx.restore();
    webcamState.playerFaceImage = tc.toDataURL('image/png');
}

function captureFaceForPlayer(playerIndex, pose) {
    if (!webcamState.video) return null;
    const v = webcamState.video;
    const nose = getKeypoint(pose, 'nose');
    if (!nose || nose.score < 0.3) return null;

    const tc = document.createElement('canvas');
    const tx = tc.getContext('2d');
    tc.width = tc.height = 80;
    const cropSize = Math.min(v.videoWidth, v.videoHeight) * 0.4;
    const cropX = Math.max(0, nose.x - cropSize / 2);
    const cropY = Math.max(0, nose.y - cropSize / 2);

    tx.save();
    tx.translate(80, 0);
    tx.scale(-1, 1);
    tx.drawImage(v, cropX, cropY, cropSize, cropSize, 0, 0, 80, 80);
    tx.restore();
    return tc.toDataURL('image/png');
}
