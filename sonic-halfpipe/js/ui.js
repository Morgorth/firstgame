// UI management: screen transitions, HUD updates, and high-score table.

// ── Screen management ────────────────────────────────────────────────

const SCREENS = ['titleScreen', 'setupScreen', 'gameScreen', 'endScreen'];

function showScreen(id) {
    SCREENS.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.toggle('hidden', s !== id);
    });
}

// ── Title screen ─────────────────────────────────────────────────────

function showTitleScreen() {
    showScreen('titleScreen');
    renderHighScoreTable();
}

// ── Setup screen ─────────────────────────────────────────────────────

function showSetupScreen(playerCount, mode) {
    gameState.playerCount = playerCount;
    controlMode = mode;

    // Show setup for camera mode, skip to game for keyboard
    if (mode === 'camera') {
        showScreen('setupScreen');
        document.getElementById('p2ReadyCard').classList.toggle('hidden', playerCount < 2);
        document.getElementById('setupStartBtn').classList.add('hidden');
        startPlayerRegistration(playerCount);
    } else {
        // Keyboard – register dummy players and start immediately
        webcamState.playerCount = playerCount;
        for (let i = 0; i < playerCount; i++) {
            webcamState.registeredPlayers[i].ready = true;
        }
        webcamState.registrationPhase = 'ready';
        startGame();
    }
}

function selectControlMode(mode) {
    controlMode = mode;
    if (mode === 'keyboard') {
        stopWebcam();
        document.getElementById('webcamContainer').classList.add('hidden');
    }
}

// ── Game screen / HUD ────────────────────────────────────────────────

function updateHUD() {
    const p1 = gameState.players[0];
    const p2 = gameState.players[1];

    document.getElementById('hudRings').textContent =
        `P1 RINGS: ${p1.rings}/${CONFIG.rings.goal}`;
    document.getElementById('hudScore').textContent =
        `SCORE: ${gameState.score}`;
    document.getElementById('hudSpeed').textContent =
        `SPEED: ${Math.round(gameState.speed)}`;

    const p2Hud = document.getElementById('hudP2');
    if (gameState.playerCount === 2) {
        p2Hud.classList.remove('hidden');
        document.getElementById('hudP2Rings').textContent =
            `P2 RINGS: ${p2.rings}/${CONFIG.rings.goal}`;
    } else {
        p2Hud.classList.add('hidden');
    }

    // Ring progress bars
    updateRingBar('ringBarP1Fill', p1.rings);
    if (gameState.playerCount === 2) updateRingBar('ringBarP2Fill', p2.rings);
}

function updateRingBar(id, rings) {
    const el = document.getElementById(id);
    if (!el) return;
    const pct = Math.min(100, (rings / CONFIG.rings.goal) * 100);
    el.style.width = pct + '%';
    el.style.background = pct >= 100 ? '#00ff00' : (pct > 60 ? '#ffff00' : '#00ccff');
}

// ── End screen ───────────────────────────────────────────────────────

function showEndScreen(win, winnerIndex) {
    showScreen('endScreen');

    const titleEl = document.getElementById('endTitle');
    const msgEl = document.getElementById('endMessage');

    if (win) {
        const winnerName = winnerIndex === 0 ? 'PLAYER 1' : 'PLAYER 2';
        titleEl.textContent = '🏆 YOU WIN! 🏆';
        titleEl.style.color = '#FFD700';
        msgEl.textContent = `${winnerName} collected all ${CONFIG.rings.goal} rings!`;
    } else {
        titleEl.textContent = 'GAME OVER';
        titleEl.style.color = '#FF4444';
        msgEl.textContent = 'Better luck next time!';
    }

    document.getElementById('endScore').textContent = `Score: ${gameState.score}`;
    document.getElementById('endRings').textContent =
        `Rings: ${gameState.players[0].rings}` +
        (gameState.playerCount === 2 ? ` / ${gameState.players[1].rings}` : '');

    // Pre-fill name input
    document.getElementById('endNameInput').value = '';
    document.getElementById('endNameInput').focus();

    renderHighScoreTable();
}

function submitHighScore() {
    const name = document.getElementById('endNameInput').value.trim() || 'PLAYER';
    const rings = Math.max(gameState.players[0].rings,
        gameState.playerCount === 2 ? gameState.players[1].rings : 0);
    addHighScore(name.toUpperCase(), gameState.score, rings);
    renderHighScoreTable();
}

// ── High-score table ─────────────────────────────────────────────────

function renderHighScoreTable() {
    const tbody = document.getElementById('highScoreBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    highScores.slice(0, 10).forEach((hs, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td>${hs.name}</td>
            <td>${hs.score}</td><td>${hs.rings}</td>`;
        tbody.appendChild(tr);
    });
}

// ── Webcam overlay toggle ────────────────────────────────────────────

function toggleWebcamOverlay() {
    const el = document.getElementById('webcamContainer');
    el.classList.toggle('minimized');
}
