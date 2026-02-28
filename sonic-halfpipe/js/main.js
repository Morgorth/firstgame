// Entry point: bootstraps the engine and wires button callbacks.

// ── Game loop ────────────────────────────────────────────────────────

let _rafId    = null;
const _TICK_MS = 1000 / 60;   // target: one game tick per ~16.67 ms
let _lastTick  = 0;

// Cap physics to 60 fps so the game runs at the same speed on 60 Hz,
// 120 Hz, and 144 Hz monitors.  renderFrame() is still called every
// rAF, but gameTick() is skipped when the frame arrived too early.
function loop(ts) {
    _rafId = requestAnimationFrame(loop);
    const elapsed = ts - _lastTick;
    if (elapsed < _TICK_MS - 1) return;   // too soon — only render
    _lastTick = ts;
    gameTick();
    renderFrame();
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

    // Rebuild player meshes for the current theme and player count.
    // applyThemeToScene() also rebuilds the pipe pool and lights, so only
    // call it if the 3D scene is already initialised.
    if (gameState.scene) buildPlayerMeshes();

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

    // Wire face images to HUD (hide if no face was captured)
    for (let i = 0; i < 2; i++) {
        const imgEl = document.getElementById(i === 0 ? 'hudFaceP1' : 'hudFaceP2');
        if (!imgEl) continue;
        if (gameState.players[i].faceImage) {
            imgEl.src = gameState.players[i].faceImage.src;
            imgEl.style.display = 'block';
        } else {
            imgEl.src = '';
            imgEl.style.display = 'none';
        }
    }

    if (!_rafId) _rafId = requestAnimationFrame(loop);

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
    _rafId = requestAnimationFrame(loop);
});
