// Entry point: bootstraps the engine and wires button callbacks.

// ── Game loop ────────────────────────────────────────────────────────

let _rafId = null;

function loop() {
    gameTick();
    renderFrame();
    _rafId = requestAnimationFrame(loop);
}

// ── Start / Restart ──────────────────────────────────────────────────

function startGame() {
    // Reset mutable game state
    gameState.running = true;
    gameState.frameCount = 0;
    gameState.speed = CONFIG.speed.initial;
    gameState.distance = 0;
    gameState.score = 0;
    gameState.phase = 'playing';
    gameState.countdownActive = false;
    gameState.obstacles = [];
    gameState.ringItems = [];
    gameState.particles = [];
    gameState.playerCount = webcamState.playerCount || 1;

    // Reset players
    for (let i = 0; i < 2; i++) {
        const p = gameState.players[i];
        p.active = i < gameState.playerCount;
        p.lane = CONFIG.player.startLane;
        p.targetLane = CONFIG.player.startLane;
        p.rings = 0;
        p.jumping = false;
        p.jumpFrame = 0;
        p.crouching = false;
        p.crouchFrame = 0;
        p.invincible = 0;
        // Restore face image from registration
        p.faceImage = webcamState.registeredPlayers[i].faceImage || null;
    }

    // Reset spawn timers
    _nextObstacleFrame = 0;
    _ringSpawnTimer = 0;

    // Clear previous scene items
    if (gameState.scene) clearSceneItems();

    showScreen('gameScreen');
    updateHUD();

    // Wire face images to HUD
    for (let i = 0; i < gameState.playerCount; i++) {
        const imgEl = document.getElementById(i === 0 ? 'hudFaceP1' : 'hudFaceP2');
        if (imgEl && gameState.players[i].faceImage) {
            imgEl.src = gameState.players[i].faceImage.src;
            imgEl.style.display = 'block';
        }
    }

    if (!_rafId) loop();

    startCountdown();
}

function restartGame() {
    // Re-use existing registration; just restart game state
    startGame();
}

// ── Button wiring (called from inline HTML onclick) ──────────────────

function onTitlePlay1() {
    showSetupScreen(1, 'keyboard');
}
function onTitlePlay2() {
    showSetupScreen(2, 'keyboard');
}
function onTitleCamera1() {
    if (!webcamState.initialized) initWebcam();
    showSetupScreen(1, 'camera');
}
function onTitleCamera2() {
    if (!webcamState.initialized) initWebcam();
    showSetupScreen(2, 'camera');
}

function onSetupStart() {
    startGame();
}

function onEndRestart() {
    restartGame();
}
function onEndTitle() {
    showTitleScreen();
}
function onEndSubmitScore() {
    submitHighScore();
}

// ── Init ─────────────────────────────────────────────────────────────

window.addEventListener('load', () => {
    loadHighScores();
    initScene();
    showTitleScreen();

    // Start the render loop immediately so the title can show the 3D pipe
    loop();
});
