// state.js — Variables globales partagées par tous les modules

let controlMode = 'keyboard'; // 'keyboard' | 'camera'

const webcamState = {
  video: null,
  canvas: null,
  ctx: null,
  stream: null,
  initialized: false,
  active: false,
  poseDetector: null,
  poseDetectorReady: false,
  latestPose: null,
  webcamInput: { dx: 0, dy: 0 },
  gestureHistory: [],
};

const gameState = {
  running: false,
  phase: 'menu',  // 'menu' | 'calibration' | 'playing' | 'challenge' | 'levelcomplete' | 'gamecomplete'
  player: {
    x: 450,
    y: 560,
    dx: 0,
    dy: 0,
    cosmetics: { avatar: null, unicorn: null },
  },
  currentLevel: 1,
  roomsDone: [],       // indices de salles complétées ce niveau
  challengeActive: false,
  frameCount: 0,
  exitUnlocked: false,
  floatingXP: [],      // [{text, x, y, frame, maxFrame}] — notifications flottantes
};

// Profil et progression — seront chargés depuis saveSystem
let currentProfile = null;
let currentProgress = null;
