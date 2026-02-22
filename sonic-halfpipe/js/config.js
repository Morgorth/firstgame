// All tuning constants for Sonic Half-Pipe.
// Tweak here without touching game logic.

const CONFIG = {
    pipe: {
        radius: 350,          // half-pipe radius in Three.js units
        laneCount: 5,         // lanes 0 (far-left) … 4 (far-right)
        segmentLength: 600,   // length of one repeating pipe chunk
        segmentCount: 8,      // how many chunks in the pool
        visibleLength: 4800,  // total Z length kept alive
        arcDegrees: 170,      // total sweep of the half-pipe (degrees)
    },

    player: {
        jumpHeight: 110,        // units off pipe surface at arc peak
        jumpDuration: 32,       // frames for full jump arc
        crouchScaleY: 0.52,     // Y scale when crouching
        crouchDuration: 24,     // frames crouch is held
        laneChangeSpeed: 0.14,  // lerp factor toward targetLane each frame
        hitRadius: 38,          // collision sphere radius
        invincibleFrames: 90,   // frames of invincibility after a hit
        startLane: 2,           // center lane
    },

    rings: {
        outerRadius: 22,
        tubeRadius: 4,
        spinSpeed: 0.07,       // radians per frame
        collectRadius: 58,
        goal: 50,              // rings needed to win
        pointsEach: 10,
    },

    obstacles: {
        spawnInterval: 75,     // frames between spawn batches
        spawnZ: -4200,         // world Z where new obstacles are born
        passZ: 200,            // world Z past which obstacles are removed
        bumperRadius: 46,
        bombRadius: 43,
        barrierWidth: 160,
        barrierHeight: 55,
        barrierDepth: 22,
    },

    speed: {
        initial: 7,
        max: 24,
        accelPerFrame: 0.004,
        // Every N rings collected, play a speed-up jingle
        speedUpEveryRings: 10,
    },

    // Pose / gesture thresholds
    camera: {
        // Jump: both wrists must be above nose (smaller Y in image coords)
        jumpHoldFrames: 3,       // frames to confirm jump
        jumpCooldownFrames: 20,  // prevent re-triggering immediately
        // Crouch: shoulder Y increases by this ratio of frame height
        crouchShoulderDropRatio: 0.10,
        crouchHoldFrames: 3,
        crouchCooldownFrames: 20,
        // Free movement: full camera width maps continuously to full pipe arc.
        // No dead-zone; laneChangeSpeed in player config handles smoothing.
    },

    // Wave-gesture (reused from Wave Assault for registration trigger)
    waveGesture: {
        historyWindowMs: 800,
        minDirectionChanges: 3,
        minAmplitude: 30,
        wristMinConfidence: 0.25,
        holdFrames: 8,
        waveCooldownMs: 1500,
    },

    // Color tracking for player re-identification (same as Wave Assault)
    colorTracking: {
        hueBins: 8,
        pixelStep: 4,
        minSaturation: 0.15,
        minValue: 0.1,
        maxValue: 0.95,
        minPixels: 20,
        matchThreshold: 0.45,
        updateAlpha: 0.15,
    },
};
