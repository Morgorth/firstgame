// webcam-pose.js — Pose tracking loop, position marker updates, and debug overlays.
// Depends on: webcam-core.js, webcam-gestures.js, webcam-registration.js

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

// ── Position marker update ───────────────────────────────────────────

function updatePositionMarkers() {
    const marker1    = document.getElementById('positionMarker');
    const marker2    = document.getElementById('positionMarkerP2');
    const maxT       = CONFIG.pipe.laneCount - 1;
    const containerW = 200;
    const markerW    = 20;

    if (gameState.running && gameState.playerCount === 2) {
        marker1.style.background  = '#00ffff';
        marker1.style.boxShadow   = '0 0 10px #00ffff';
        marker1.style.left = (gameState.players[0].targetLane / maxT * containerW - markerW / 2) + 'px';
        marker2.style.display     = 'block';
        marker2.style.background  = '#ff00ff';
        marker2.style.boxShadow   = '0 0 10px #ff00ff';
        marker2.style.left = (gameState.players[1].targetLane / maxT * containerW - markerW / 2) + 'px';
    } else {
        const lane = gameState.players[0] ? gameState.players[0].targetLane : maxT / 2;
        marker1.style.background = '#00ffff';
        marker1.style.boxShadow  = '0 0 10px #00ffff';
        marker1.style.left = (lane / maxT * containerW - markerW / 2) + 'px';
        marker2.style.display = 'none';
    }
}

// ── Debug overlay drawing ────────────────────────────────────────────

// Draw the live video frame as the canvas background.
function _drawVideoBackground() {
    const cx     = webcamState.ctx;
    const canvas = webcamState.canvas;
    const video  = webcamState.video;
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
        ['left_shoulder',  'right_shoulder'],
        ['left_shoulder',  'left_elbow'],  ['left_elbow',  'left_wrist'],
        ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
        ['left_shoulder',  'left_hip'],    ['right_shoulder', 'right_hip'],
        ['left_hip',       'right_hip'],
    ];

    cx.save();
    cx.strokeStyle  = color;
    cx.fillStyle    = color;
    cx.lineWidth    = 2;
    cx.globalAlpha  = 0.8;

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
