// Game configuration constants.
// All tunable numbers live here so they're easy to find and adjust.

const CONFIG = {
    player: {
        width: 30,
        height: 30,
        speed: 15,
        maxCrowd: 50,
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
        tank:  { width: 90, height: 90, speed: 1.5, health: 60, points: 30, color: '#ff8800' }
    },
    powerup: {
        width: 30,
        height: 30,
        speed: 3,
        spawnChance: 0.12
    },
    wave: {
        delay: 300           // frames to wait between waves
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
