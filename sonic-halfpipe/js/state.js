// Mutable runtime state for Sonic Half-Pipe.
// Reset fields are re-initialised in main.js:startGame().

// ── Keyboard state (populated by input.js) ──────────────────────────
const keys = {};

// ── Control / UI selections ─────────────────────────────────────────
let controlMode = 'keyboard';   // 'keyboard' | 'camera'
let gameTheme   = 'default';    // 'default' | 'unicorn'

// ── Webcam / pose-detection state ───────────────────────────────────
let webcamState = {
    active: false,
    stream: null,
    video: null,
    canvas: null,
    ctx: null,
    previousFrame: null,
    initialized: false,
    isReady: false,

    // MoveNet
    poseDetector: null,
    poseDetectorReady: false,
    lastPose: null,
    allPoses: [],
    playerTrackingIds: [null, null],
    playerPoses: [null, null],

    // Wave-gesture (used for registration trigger)
    wristHistories: { left: [], right: [] },
    motionScore: 0,

    // Player registration
    playerCount: 1,
    registrationPhase: 'idle',          // 'idle' | 'registering' | 'ready'
    currentRegisteringPlayer: 0,
    registeredPlayers: [
        {
            ready: false,
            faceImage: null,
            poseId: null,
            colorSignature: null,
            waveFrames: 0,
            wristHistories: { left: [], right: [] },
            motionScore: 0,
            handsUpFrames: 0,
            // Half-pipe specific
            jumpHoldFrames: 0,
            jumpCooldown: 0,
            crouchHoldFrames: 0,
            crouchCooldown: 0,
            baselineShoulderY: null,    // calibrated at registration
        },
        {
            ready: false,
            faceImage: null,
            poseId: null,
            colorSignature: null,
            waveFrames: 0,
            wristHistories: { left: [], right: [] },
            motionScore: 0,
            handsUpFrames: 0,
            jumpHoldFrames: 0,
            jumpCooldown: 0,
            crouchHoldFrames: 0,
            crouchCooldown: 0,
            baselineShoulderY: null,
        },
    ],
};

// ── In-game state (reset each startGame()) ──────────────────────────
let gameState = {
    running: false,
    frameCount: 0,
    speed: CONFIG.speed.initial,
    distance: 0,
    score: 0,

    // Players
    playerCount: 1,
    players: [
        {
            active: true,
            lane: CONFIG.player.startLane,
            targetLane: CONFIG.player.startLane,
            rings: 0,
            jumping: false,
            jumpFrame: 0,
            crouching: false,
            crouchFrame: 0,
            invincible: 0,
            color: '#00ffff',
            faceImage: null,
            // Three.js mesh group (assigned by render.js)
            mesh: null,
        },
        {
            active: true,
            lane: CONFIG.player.startLane,
            targetLane: CONFIG.player.startLane,
            rings: 0,
            jumping: false,
            jumpFrame: 0,
            crouching: false,
            crouchFrame: 0,
            invincible: 0,
            color: '#ff00ff',
            faceImage: null,
            mesh: null,
        },
    ],

    // Obstacle and ring item arrays
    // Each entry: { type, lane, z, active, mesh, ... }
    obstacles: [],
    ringItems: [],

    // Visual particle effects
    particles: [],

    // Game phase
    phase: 'start',             // 'start' | 'countdown' | 'playing' | 'win' | 'gameover'
    countdownActive: false,

    // Speed-up tracking
    lastSpeedUpRings: [0, 0],   // rings at last speed-up jingle per player

    // Three.js references (assigned by render.js)
    scene: null,
    camera: null,
    renderer: null,
    pipeSegments: [],           // recycled pipe mesh pool
    obstacleMeshPool: [],       // unused mesh pool
    ringMeshPool: [],
};

// ── High Scores ──────────────────────────────────────────────────────
let highScores = [];

function loadHighScores() {
    try {
        const raw = localStorage.getItem('sonicHalfPipeHighScores');
        if (raw) highScores = JSON.parse(raw);
    } catch (e) {
        highScores = [];
    }
}

function saveHighScores() {
    try {
        localStorage.setItem('sonicHalfPipeHighScores', JSON.stringify(highScores));
    } catch (e) { /* storage full */ }
}

function addHighScore(name, score, rings) {
    highScores.push({ name, score, rings, date: Date.now() });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);
    saveHighScores();
}

loadHighScores();
