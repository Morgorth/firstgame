// Game lifecycle: startGame, gameOver, gameLoop, and all UI event bindings.

function startGame() {
    const playerCount = controlMode === 'camera' ? webcamState.playerCount : 1;
    const numLanes = playerCount === 2 ? 5 : 3;

    // Evenly spaced lane positions
    const lanePositions = [];
    for (let i = 0; i < numLanes; i++) {
        lanePositions.push(PLAY_AREA.width * ((i + 0.5) / numLanes));
    }

    const players = [
        {
            active: true,
            x: lanePositions[1],
            y: PLAY_AREA.height - 150,
            crowdSize: CONFIG.player.startCrowd,
            faceImage: webcamState.registeredPlayers[0]?.faceImage || null,
            color: '#00ffff',
            targetLane: 1
        },
        {
            active: playerCount === 2,
            x: lanePositions[playerCount === 2 ? 3 : 1],
            y: PLAY_AREA.height - 150,
            crowdSize: CONFIG.player.startCrowd,
            faceImage: webcamState.registeredPlayers[1]?.faceImage || null,
            color: '#ff00ff',
            targetLane: playerCount === 2 ? 3 : 1
        }
    ];

    gameState = {
        ...gameState,
        running: true,
        playerCount,
        players,
        player: createPlayer(),
        bullets: [],
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
        crowdSize: CONFIG.player.startCrowd,
        stars: createStars(),
        hitEffect: 0,
        screenShake: { x: 0, y: 0 },
        lanePositions,
        numLanes
    };

    if (controlMode === 'camera') {
        webcamState.currentLane = 1;
        webcamState.targetLane = 1;
        webcamState.registrationPhase = 'idle';
    }

    // Hide all overlay screens
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('playerSetupScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');

    if (controlMode === 'camera' && webcamState.active) {
        document.getElementById('webcamContainer').classList.remove('hidden');
    }

    // Configure HUD for player count
    if (playerCount === 2) {
        document.getElementById('singlePlayerHud').classList.add('hidden');
        document.getElementById('multiPlayerHud').classList.remove('hidden');
        if (players[0].faceImage) document.getElementById('p1HudFace').src = players[0].faceImage;
        if (players[1].faceImage) document.getElementById('p2HudFace').src = players[1].faceImage;
    } else {
        document.getElementById('singlePlayerHud').classList.remove('hidden');
        document.getElementById('multiPlayerHud').classList.add('hidden');
    }

    updateHUD();
    updateWave();
    updateCrowdDisplay();
    spawnWave();
}

function gameOver() {
    gameState.running = false;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalWave').textContent = gameState.wave;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// ── Event bindings ──────────────────────────────────────────────────

document.getElementById('keyboardModeBtn').addEventListener('click', () => selectControlMode('keyboard'));
document.getElementById('cameraModeBtn').addEventListener('click', () => selectControlMode('camera'));
document.getElementById('onePlayerBtn').addEventListener('click', () => selectPlayerCount(1));
document.getElementById('twoPlayerBtn').addEventListener('click', () => selectPlayerCount(2));
document.getElementById('setupStartBtn').addEventListener('click', startGame);
document.getElementById('spaceThemeBtn').addEventListener('click', () => selectTheme('space'));
document.getElementById('unicornThemeBtn').addEventListener('click', () => selectTheme('unicorn'));
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// ── Boot ────────────────────────────────────────────────────────────

gameState.stars = createStars();
gameLoop();
