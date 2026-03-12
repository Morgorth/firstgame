// webcam-gestures.js — Détection de gestes pour mouvement top-down 4 directions

const GESTURE_HISTORY_SIZE = 5;
const KEYPOINT_MIN_SCORE   = 0.3;

// Traite la pose courante pour extraire un vecteur de mouvement (dx, dy)
function processWebcamGesture() {
  const pose = webcamState.latestPose;
  if (!pose) {
    updateWebcamInput(0, 0);
    return;
  }

  const nose         = getKeypoint(pose, 'nose');
  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const rightShoulder= getKeypoint(pose, 'right_shoulder');
  const leftHip      = getKeypoint(pose, 'left_hip');
  const rightHip     = getKeypoint(pose, 'right_hip');
  const leftWrist    = getKeypoint(pose, 'left_wrist');
  const rightWrist   = getKeypoint(pose, 'right_wrist');

  // Besoin d'au moins les épaules et les poignets pour détecter les gestes
  if (!leftShoulder || leftShoulder.score < KEYPOINT_MIN_SCORE ||
      !rightShoulder|| rightShoulder.score < KEYPOINT_MIN_SCORE) {
    updateWebcamInput(0, 0);
    return;
  }

  // Calcule la hauteur du corps (épaule → hanche ou approximation)
  let bodyHeight = 100; // valeur par défaut
  if (leftHip && leftHip.score > KEYPOINT_MIN_SCORE) {
    bodyHeight = Math.abs(leftShoulder.y - leftHip.y);
  } else if (rightHip && rightHip.score > KEYPOINT_MIN_SCORE) {
    bodyHeight = Math.abs(rightShoulder.y - rightHip.y);
  } else if (nose && nose.score > KEYPOINT_MIN_SCORE) {
    bodyHeight = Math.abs(nose.y - leftShoulder.y) * 3;
  }
  if (bodyHeight < 30) bodyHeight = 30;

  const threshold = bodyHeight * 0.1;

  // Détection des bras levés
  // Note : en webcam miroir, left_wrist correspond au bras DROIT de l'utilisateur
  // On inverse pour que le mouvement soit intuitif (bras gauche = gauche à l'écran)
  const leftArmUp  = leftWrist  && leftWrist.score  > KEYPOINT_MIN_SCORE
                     && leftWrist.y  < leftShoulder.y  - threshold;
  const rightArmUp = rightWrist && rightWrist.score > KEYPOINT_MIN_SCORE
                     && rightWrist.y < rightShoulder.y - threshold;

  let dx = 0, dy = 0;

  if (leftArmUp && rightArmUp) {
    // Les deux bras levés → avancer (dy = -1)
    dy = -1;
  } else if (leftArmUp) {
    // Bras gauche levé seulement → aller à gauche
    dx = -1;
  } else if (rightArmUp) {
    // Bras droit levé seulement → aller à droite
    dx = 1;
  }
  // Aucun bras levé → stop (dx=0, dy=0)

  // Smoothing : moyenne glissante sur GESTURE_HISTORY_SIZE frames
  if (!webcamState.gestureHistory) webcamState.gestureHistory = [];
  webcamState.gestureHistory.push({ dx, dy });
  if (webcamState.gestureHistory.length > GESTURE_HISTORY_SIZE) {
    webcamState.gestureHistory.shift();
  }

  const hist = webcamState.gestureHistory;
  const avgDx = hist.reduce((s, g) => s + g.dx, 0) / hist.length;
  const avgDy = hist.reduce((s, g) => s + g.dy, 0) / hist.length;

  // Seuil pour éviter les micro-mouvements
  const smoothDx = Math.abs(avgDx) > 0.4 ? Math.sign(avgDx) : 0;
  const smoothDy = Math.abs(avgDy) > 0.4 ? Math.sign(avgDy) : 0;

  updateWebcamInput(smoothDx, smoothDy);
}

function updateWebcamInput(dx, dy) {
  webcamState.webcamInput.dx = dx;
  webcamState.webcamInput.dy = dy;
}
