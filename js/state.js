// Mutable game state. Two top-level objects hold everything:
//   gameState  – in-game runtime data (score, entities, players, etc.)
//   webcamState – camera / pose-detection / registration data

// Canvas & play-area references (set once on load, updated on resize).
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let PLAY_AREA = { width: 0, height: 0 };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    PLAY_AREA.width = canvas.width * 2;
    PLAY_AREA.height = canvas.height * 2;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Current selections (set from UI before game starts).
let controlMode = 'keyboard';
let gameTheme = 'space';
let gameMode = 'arcade';   // 'arcade' | 'campaign'

// Webcam / pose-detection state.
let webcamState = {
    active: false,
    stream: null,
    video: null,
    canvas: null,
    ctx: null,
    previousFrame: null,
    currentLane: 1,
    targetLane: 1,
    initialized: false,
    waveFrames: 0,
    isReady: false,
    playerFaceImage: null,
    handsUpFrames: 0,

    // MoveNet
    poseDetector: null,
    poseDetectorReady: false,
    lastPose: null,
    detectedKeypoints: null,
    poseConfidence: 0,
    allPoses: [],
    playerTrackingIds: [null, null],   // MoveNet tracking IDs per player
    playerPoses: [null, null],         // current pose assigned to each player (for debug)

    // Wave-gesture motion tracking (both wrists independently)
    wristHistories: { left: [], right: [] },
    motionScore: 0,

    // Player registration
    playerCount: 1,
    registrationPhase: 'idle',          // 'idle' | 'registering' | 'ready'
    currentRegisteringPlayer: 0,
    registeredPlayers: [
        { ready: false, faceImage: null, poseId: null, colorSignature: null, waveFrames: 0, wristHistories: { left: [], right: [] }, motionScore: 0, handsUpFrames: 0, reachingOut: false },
        { ready: false, faceImage: null, poseId: null, colorSignature: null, waveFrames: 0, wristHistories: { left: [], right: [] }, motionScore: 0, handsUpFrames: 0, reachingOut: false }
    ]
};

// In-game state (reset each time startGame runs).
let gameState = {
    running: false,
    bullets: [],
    enemyBullets: [],
    enemies: [],
    powerups: [],
    particles: [],
    score: 0,
    wave: 1,
    waveTimer: 0,
    enemiesInWave: 0,
    enemiesKilled: 0,
    frameCount: 0,
    lastShot: 0,
    lastRapidShot: 0,
    stars: [],
    hitEffect: 0,
    screenShake: { x: 0, y: 0 },
    countdownActive: false,
    totalKills: 0,
    playerKills: [0, 0],
    superWeaponCharges: [0, 0],
    superWeaponNextThreshold: [50, 50],
    superWeaponFlashEffect: 0,

    // Multi-player
    playerCount: 1,
    players: [
        { active: true, x: 0, y: 0, crowdSize: 3, faceImage: null, color: '#00ffff', targetLane: 1 },
        { active: true, x: 0, y: 0, crowdSize: 3, faceImage: null, color: '#ff00ff', targetLane: 3 }
    ],

    // Active power-up effects (remaining frames per player)
    activeEffects: { shield: [0, 0], spread: [0, 0], rapidfire: [0, 0], regen: [0, 0] },

    // Fleet donation (hold-hands gesture)
    fleetDonateState: { holdFrames: 0, cooldown: 0 },

    // Campaign mode state
    campaignMode: false,
    campaignAct: 0,               // 0-indexed current act (0–3)
    campaignActTransitioning: false,  // true while act-complete overlay is showing

    // Legacy single-player compat (player 0 mirror).
    player: null,
    crowdSize: 1
};

// ── High Scores ─────────────────────────────────────────────────────
let highScores = [];

function loadHighScores() {
    try {
        const raw = localStorage.getItem('waveAssaultHighScores');
        if (raw) highScores = JSON.parse(raw);
    } catch (e) {
        highScores = [];
    }
}

function saveHighScores() {
    try {
        localStorage.setItem('waveAssaultHighScores', JSON.stringify(highScores));
    } catch (e) { /* storage full or unavailable */ }
}

loadHighScores();

// Keyboard state map (updated by input.js).
const keys = {};
