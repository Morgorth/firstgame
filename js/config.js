// Game configuration constants.
// All tunable numbers live here so they're easy to find and adjust.

const CONFIG = {
    player: {
        width: 30,
        height: 30,
        speed: 15,
        maxCrowd: 100,
        startCrowd: 3,
        fireRate: 16,       // frames between auto-shots
        fireSpacing: 30     // pixels between fire columns
    },
    bullet: {
        width: 3,
        height: 10,
        speed: 20,
        damage: 10
    },
    enemy: {
        // renderScale: base visual size multiplier applied in render.js
        // sizePerShip: additional scale added per remaining health unit (bullet-damage chunks)
        basic:   { width: 60,  height: 60,  speed: 2.5, health: 25,  points: 10,  color: '#ff0080', renderScale: 1.0, sizePerShip: 0.08 },
        fast:    { width: 50,  height: 50,  speed: 5,   health: 15,  points: 15,  color: '#00ff00', renderScale: 0.9, sizePerShip: 0.08 },
        tank:    { width: 90,  height: 90,  speed: 1.5, health: 60,  points: 30,  color: '#ff8800', renderScale: 1.2, sizePerShip: 0.08, fireRate: 200 },
        shifter: { width: 35,  height: 35,  speed: 3.5, health: 10,  points: 20,  color: '#aa00ff', renderScale: 0.7, sizePerShip: 0.08, dodgeCooldown: 30, dodgeRange: 200 },
        boss:    { width: 80,  height: 80,  speed: 0.5, health: 600, points: 200, color: '#ff0000', renderScale: 0.8, sizePerShip: 0.01, horizontalSpeed: 1.5, fireRate: 180 }
    },
    powerup: {
        width: 30,
        height: 30,
        speed: 3,
        spawnChance: 0.12,
        types: {
            fleet:     { color: '#ffff00', unicornColor: '#FFD700', pacificrimColor: '#FF8C00', dragonColor: '#ff6600', duration: 0 },
            shield:    { color: '#00aaff', unicornColor: '#FFB6C1', pacificrimColor: '#00BFFF', dragonColor: '#ff3300', duration: 600 },
            spread:    { color: '#ff8800', unicornColor: '#FF69B4', pacificrimColor: '#FF4500', dragonColor: '#ffaa00', duration: 480 },
            rapidfire: { color: '#ff4400', unicornColor: '#FF1493', pacificrimColor: '#FF6347', dragonColor: '#ff2200', duration: 360 },
            regen:     { color: '#00ff88', unicornColor: '#98FF98', pacificrimColor: '#00FA9A', dragonColor: '#44ff44', duration: 480, interval: 60 }
        }
    },
    enemyBullet: {
        width: 8,
        height: 14,
        speed: 7,
        damage: 1   // ships lost per hit
    },
    wave: {
        delay: 300           // frames to wait between waves
    },
    waveGesture: {
        wristMinConfidence: 0.3,   // ignore wrist keypoints below this
        historyWindowMs: 1500,     // time window for motion analysis
        directionChangePx: 8,      // min px delta to count as a direction reversal
        strongMotion: 12,          // avgMotion above this = strong wave (score 1.0)
        mediumMotion: 7,           // avgMotion above this = medium wave (score 0.7)
        weakMotion: 4,             // avgMotion above this = weak wave (score 0.3)
        minSamplesForDetection: 6, // need at least this many samples in the window
        framesToConfirm: 20,       // consecutive qualifying frames to complete gesture
        decayRate: 2               // frames lost per non-qualifying frame
    },
    superWeapon: {
        killsPerCharge: 50,          // cumulative kills between each charge earned
        maxWaveBonus: 30,            // cap on per-wave increment to keep late-game nukes earnable
        activationKey: ' ',        // Space bar for keyboard mode
        handsUpHoldFrames: 12,     // ~200ms hold to prevent accidental activation
        flashDuration: 40,         // screen flash frames (longer for rainbow sweep)
        particlesPerEnemy: 15,     // explosion particles per destroyed enemy
        shakeIntensity: 15         // screen shake magnitude
    },
    fleetDonate: {
        holdFrames: 15,        // frames both must reach before transfer
        cooldownFrames: 60,    // frames after transfer before next allowed
        reviveShips: 2,        // ships given on revive
        normalShips: 1,        // ships transferred when both alive
        reachThreshold: 40     // pixels wrist must extend past shoulder
    },
    colorTracking: {
        hueBins: 8,
        minSaturation: 0.15,
        minValue: 0.15,
        maxValue: 0.95,
        minPixels: 20,
        swapThreshold: 0.15,
        adaptiveAlpha: 0.05,
        adaptiveFrameInterval: 10,
        pixelStep: 2
    }
};

// Shared skeleton connection pairs used by all pose-debug drawing.
const SKELETON_CONNECTIONS = [
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['nose', 'left_shoulder'],
    ['nose', 'right_shoulder']
];

// Extended connections used in the small webcam debug overlay.
const SKELETON_CONNECTIONS_FULL = [
    ...SKELETON_CONNECTIONS,
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip']
];

// Player color assignments.
const PLAYER_COLORS = [
    { primary: '#00ffff', secondary: '#0099ff', engine: '#ff00ff' },
    { primary: '#ff00ff', secondary: '#cc00cc', engine: '#00ffff' }
];
