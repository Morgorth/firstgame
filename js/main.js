// Game lifecycle: startGame, gameOver, gameLoop, and all UI event bindings.

function startGame() {
    audioSystem.init();
    audioSystem.stopMusic();
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
            y: PLAY_AREA.height - 60,
            crowdSize: CONFIG.player.startCrowd,
            faceImage: webcamState.registeredPlayers[0]?.faceImage || null,
            color: '#00ffff',
            targetLane: 1
        },
        {
            active: playerCount === 2,
            x: lanePositions[playerCount === 2 ? 3 : 1],
            y: PLAY_AREA.height - 60,
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
        numLanes,
        totalKills: 0,
        playerKills: [0, 0],
        superWeaponCharges: [0, 0],
        superWeaponNextThreshold: [CONFIG.superWeapon.killsPerCharge, CONFIG.superWeapon.killsPerCharge],
        superWeaponFlashEffect: 0,
        activeEffects: { shield: [0, 0], spread: [0, 0] },
        fleetDonateState: { holdFrames: 0, cooldown: 0 }
    };

    if (controlMode === 'camera') {
        webcamState.currentLane = 1;
        webcamState.targetLane = 1;
        webcamState.registrationPhase = 'idle';
        webcamState.registeredPlayers[0].reachingOut = false;
        webcamState.registeredPlayers[1].reachingOut = false;
    }

    // Hide all overlay screens
    cancelCountdown();
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
    _lastCrowdSize = -1; // force pip rebuild on game start
    updateCrowdDisplay();

    // Countdown before first wave
    gameState.countdownActive = true;
    startWaveCountdown(() => {
        if (!gameState.running) return;
        gameState.countdownActive = false;
        spawnWave();
    });
}

function gameOver() {
    if (!gameState.running) return;   // prevent duplicate calls in same frame
    gameState.running = false;
    gameState.countdownActive = false;
    cancelCountdown();
    audioSystem.stopMusic();
    audioSystem.playGameOver();
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalWave').textContent = gameState.wave;
    document.getElementById('gameOverScreen').classList.remove('hidden');

    // Save high score
    const playerFaces = gameState.players.map(p => p.faceImage || null);
    const entry = {
        score: gameState.score,
        wave: gameState.wave,
        date: new Date().toISOString(),
        playerFaces,
        theme: gameTheme,
        controlMode
    };
    const isNewHighScore = entry.score > 0 && (highScores.length < 10 || highScores.some(h => entry.score > h.score));
    if (isNewHighScore) {
        highScores.push(entry);
        highScores.sort((a, b) => b.score - a.score);
        highScores = highScores.slice(0, 10);
        saveHighScores();
    }
    renderHighScores('gameOverHighScores');
}

function gameLoop() {
    update();
    // Only render if the game is running (start/game-over screens cover the canvas)
    if (gameState.running) render();
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
document.getElementById('pacificrimThemeBtn').addEventListener('click', () => selectTheme('pacificrim'));
document.getElementById('dragonThemeBtn').addEventListener('click', () => selectTheme('dragon'));
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// ── Boot ────────────────────────────────────────────────────────────

gameState.stars = createStars();
renderHighScores('startHighScores');
gameLoop();
