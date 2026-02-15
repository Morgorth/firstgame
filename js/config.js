// Game configuration constants.
// All tunable numbers live here so they're easy to find and adjust.

const CONFIG = {
    player: {
        width: 30,
        height: 30,
        speed: 15,
        maxCrowd: 100,
        startCrowd: 3,
        fireRate: 10        // frames between auto-shots
    },
    bullet: {
        width: 3,
        height: 10,
        speed: 20,
        damage: 10
    },
    enemy: {
        basic: { width: 60, height: 60, speed: 2.5, health: 25, points: 10, color: '#ff0080' },
        fast:  { width: 50, height: 50, speed: 5,   health: 15, points: 15, color: '#00ff00' },
        tank:  { width: 90, height: 90, speed: 1.5, health: 60, points: 30, color: '#ff8800' },
        shifter: { width: 35, height: 35, speed: 3.5, health: 10, points: 20, color: '#aa00ff', dodgeCooldown: 30, dodgeRange: 200 },
        boss: { width: 150, height: 150, speed: 1.0, health: 200, points: 200, color: '#ff0000', horizontalSpeed: 1.5 }
    },
    powerup: {
        width: 30,
        height: 30,
        speed: 3,
        spawnChance: 0.12,
        types: {
            fleet:  { color: '#ffff00', unicornColor: '#FFD700', duration: 0 },
            shield: { color: '#00aaff', unicornColor: '#FFB6C1', duration: 600 },
            spread: { color: '#ff8800', unicornColor: '#FF69B4', duration: 480 }
        }
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
        killsPerCharge: 1000,        // cumulative kills between each charge earned
        activationKey: ' ',        // Space bar for keyboard mode
        handsUpHoldFrames: 12,     // ~200ms hold to prevent accidental activation
        flashDuration: 20,         // screen flash frames
        particlesPerEnemy: 15,     // explosion particles per destroyed enemy
        shakeIntensity: 15         // screen shake magnitude
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
