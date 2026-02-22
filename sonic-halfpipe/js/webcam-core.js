// webcam-core.js — Webcam lifecycle and shared keypoint helpers.
// Must load first among webcam sub-modules.

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

// ── Shared keypoint helpers ──────────────────────────────────────────

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
        left:  (lw && lw.score >= cfg.wristMinConfidence) ? lw : null,
        right: (rw && rw.score >= cfg.wristMinConfidence) ? rw : null,
    };
}

function getBestWrist(pose) {
    const { left, right } = getWrists(pose);
    if (left && right) return left.score > right.score ? left : right;
    return left || right || null;
}
