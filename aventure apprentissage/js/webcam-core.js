// webcam-core.js — Lifecycle webcam et helpers keypoints (MoveNet SinglePose)

async function initWebcam() {
  try {
    const statusEl = document.getElementById('cameraStatus');
    if (statusEl) statusEl.textContent = 'Accès caméra en cours...';

    webcamState.video  = document.getElementById('webcamVideo');
    webcamState.canvas = document.getElementById('webcamCanvas');
    webcamState.ctx    = webcamState.canvas.getContext('2d', { willReadFrequently: true });

    const container = document.getElementById('webcamContainer');
    if (container) container.classList.remove('hidden');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false,
    });
    webcamState.stream = stream;
    webcamState.video.srcObject = stream;

    await new Promise((resolve) => {
      webcamState.video.onloadedmetadata = () => {
        webcamState.canvas.width  = webcamState.video.videoWidth;
        webcamState.canvas.height = webcamState.video.videoHeight;
        resolve();
      };
    });

    await webcamState.video.play();
    webcamState.initialized = true;
    webcamState.active = true;

    if (statusEl) statusEl.textContent = 'Chargement de la détection IA...';
    await initPoseDetector();

    if (statusEl) {
      statusEl.textContent = 'IA prête ! Bouge tes bras !';
      statusEl.style.color = '#4caf50';
    }
    requestAnimationFrame(trackPoses);
    return true;
  } catch (e) {
    console.error('Erreur webcam/pose:', e);
    const s = document.getElementById('cameraStatus');
    if (s) {
      s.textContent = 'Caméra refusée — mode clavier activé.';
      s.style.color = '#f44336';
    }
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
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
      }
    );
    webcamState.poseDetectorReady = true;
  } catch (e) {
    console.error('Échec initialisation pose detector:', e);
    webcamState.poseDetectorReady = false;
    const s = document.getElementById('cameraStatus');
    if (s) s.textContent = 'IA indisponible — clavier actif';
  }
}

async function trackPoses() {
  if (!webcamState.active) return;

  if (webcamState.poseDetectorReady && webcamState.video.readyState >= 2) {
    try {
      const poses = await webcamState.poseDetector.estimatePoses(webcamState.video);
      if (poses && poses.length > 0) {
        webcamState.latestPose = poses[0];
      } else {
        webcamState.latestPose = null;
      }
    } catch (e) {
      // Silencieux pour ne pas spammer la console
    }
  }

  // Dessine le flux vidéo + squelette dans le canvas miniature
  _drawWebcamOverlay();

  // Appelle le traitement de geste (défini dans webcam-gestures.js)
  if (typeof processWebcamGesture === 'function') {
    processWebcamGesture();
  }

  requestAnimationFrame(trackPoses);
}

function _drawWebcamOverlay() {
  const { ctx, canvas, video, latestPose } = webcamState;
  if (!ctx || !video || video.readyState < 2) return;

  ctx.save();
  // Miroir horizontal pour l'utilisateur
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Dessine les points clés de la pose
  if (latestPose) {
    ctx.save();
    for (const kp of latestPose.keypoints) {
      if (kp.score > 0.3) {
        // Miroir des coordonnées x
        const mx = canvas.width - kp.x * (canvas.width / video.videoWidth);
        const my = kp.y * (canvas.height / video.videoHeight);
        ctx.beginPath();
        ctx.arc(mx, my, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#e040fb';
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

function stopWebcam() {
  if (webcamState.stream) {
    webcamState.stream.getTracks().forEach((t) => t.stop());
  }
  webcamState.stream = null;
  webcamState.active = false;
  webcamState.initialized = false;
  webcamState.poseDetectorReady = false;
  webcamState.latestPose = null;
  const container = document.getElementById('webcamContainer');
  if (container) container.classList.add('hidden');
}

// ── Helpers keypoints ──────────────────────────────────────────────

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
  if (!pose || !pose.keypoints) return null;
  return _getKeypointMap(pose).get(name) || null;
}
