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
  phase: 'menu',  // 'menu' | 'calibration' | 'worldmap' | 'playing' | 'challenge' | 'levelcomplete' | 'gamecomplete'
  player: {
    x: 450,
    y: 560,
    dx: 0,
    dy: 0,
    cosmetics: { avatar: null, unicorn: null },
  },
  currentLevel: 1,
  currentWorld: 0,         // index into CONFIG.WORLDS
  roomsDone: [],           // indices de salles complétées ce niveau (pour débloquer la sortie)
  recentlyExitedRooms: [], // salles dont le challenge vient de se terminer (cooldown anti-retrigger)
  challengeActive: false,
  frameCount: 0,
  exitUnlocked: false,
  floatingXP: [],      // [{text, x, y, frame, maxFrame}] — notifications flottantes
  // World map state
  worldMap: {
    selectedWorld: 0,      // currently highlighted world on the map
    selectedLevel: -1,     // currently highlighted level within world (-1 = none)
    cursorX: 150,          // animated cursor position
    cursorY: 420,
    animFrame: 0,
  },
};

// Profil et progression — seront chargés depuis saveSystem
let currentProfile = null;
let currentProgress = null;
