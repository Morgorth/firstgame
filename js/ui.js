// HUD updates, screen transitions, control/theme selection, player registration UI.

// ── HUD ─────────────────────────────────────────────────────────────

function updateHUD() {
    document.getElementById('score').textContent = gameState.score;
}

function updateWave() {
    document.getElementById('wave').textContent = gameState.wave;
}

function updateCrowdDisplay() {
    if (gameState.playerCount === 2) {
        gameState.players.forEach((player, i) => {
            const fleetEl = document.getElementById(`p${i + 1}Fleet`);
            const hudEl = document.getElementById(`p${i + 1}Hud`);
            if (fleetEl) fleetEl.textContent = player.crowdSize;
            if (hudEl) hudEl.classList.toggle('eliminated', !player.active);
        });
    } else {
        document.getElementById('crowdSize').textContent = gameState.crowdSize;
        const ind = document.getElementById('crowdIndicator');
        ind.innerHTML = '';
        for (let i = 0; i < Math.min(gameState.crowdSize, 50); i++) {
            const pip = document.createElement('div');
            pip.className = 'crowd-pip';
            ind.appendChild(pip);
        }
    }
}

// ── Control mode ────────────────────────────────────────────────────

function selectControlMode(mode) {
    controlMode = mode;
    document.getElementById('keyboardModeBtn').classList.toggle('selected', mode === 'keyboard');
    document.getElementById('cameraModeBtn').classList.toggle('selected', mode === 'camera');

    // Reset webcam state
    webcamState.isReady = false;
    webcamState.waveFrames = 0;
    webcamState.playerFaceImage = null;
    webcamState.wristHistories = { left: [], right: [] };
    webcamState.motionScore = 0;
    webcamState.registrationPhase = 'idle';
    webcamState.playerTrackingIds = [null, null];
    webcamState.playerPoses = [null, null];
    webcamState.registeredPlayers.forEach(p => {
        p.ready = false; p.faceImage = null; p.waveFrames = 0;
        p.wristHistories = { left: [], right: [] }; p.motionScore = 0;
    });

    const indicator = document.getElementById('armsUpIndicator');
    const btn = document.getElementById('startBtn');
    const instr = document.getElementById('instructions');
    const playerCountContainer = document.getElementById('playerCountContainer');

    if (mode === 'keyboard') {
        instr.innerHTML = 'MOVE: Arrow Keys / A-D / Mouse / Touch<br>AUTO-FIRE: Always Active<br>SHOOT GOLDEN SHIPS: Collect to grow your fleet!<br>STOP ENEMIES: They cost ships if they pass OR hit you!';
        stopWebcam();
        document.getElementById('cameraStatus').textContent = '';
        indicator.style.display = 'none';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        playerCountContainer.classList.add('hidden');
        gameState.playerCount = 1;
    } else {
        instr.innerHTML = 'MOVE: Move LEFT / RIGHT to control your ship<br>AUTO-FIRE: Always Active<br>SHOOT GOLDEN SHIPS: Collect to grow your fleet!<br>STOP ENEMIES: They cost ships if they pass OR hit you!';
        initWebcam();
        indicator.style.display = 'none';
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
        playerCountContainer.classList.remove('hidden');
    }
}

// ── Player count ────────────────────────────────────────────────────

function selectPlayerCount(count) {
    webcamState.playerCount = count;
    gameState.playerCount = count;
    document.getElementById('onePlayerBtn').classList.toggle('selected', count === 1);
    document.getElementById('twoPlayerBtn').classList.toggle('selected', count === 2);

    webcamState.registrationPhase = 'idle';
    webcamState.currentRegisteringPlayer = 0;
    webcamState.registeredPlayers.forEach(p => {
        p.ready = false; p.faceImage = null; p.waveFrames = 0;
        p.wristHistories = { left: [], right: [] }; p.motionScore = 0;
    });

    startPlayerRegistration();
}

// ── Player registration flow ────────────────────────────────────────

function startPlayerRegistration() {
    webcamState.registrationPhase = 'registering';
    webcamState.currentRegisteringPlayer = 0;

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('playerSetupScreen').classList.remove('hidden');

    const setupCanvas = document.getElementById('setupCanvas');
    setupCanvas.width = webcamState.video.videoWidth || 640;
    setupCanvas.height = webcamState.video.videoHeight || 480;

    if (webcamState.playerCount === 2) {
        document.getElementById('p2ReadyCard').classList.remove('hidden');
    } else {
        document.getElementById('p2ReadyCard').classList.add('hidden');
    }

    updateRegistrationUI();
}

function updateRegistrationUI() {
    const idx = webcamState.currentRegisteringPlayer;
    const title = document.getElementById('setupTitle');
    const instruction = document.getElementById('setupInstruction');
    const webcamBorder = document.getElementById('setupWebcam');
    const indicator = document.getElementById('setupWaveIndicator');

    title.className = 'player-setup-title ' + (idx === 0 ? 'p1' : 'p2');
    title.textContent = `PLAYER ${idx + 1} - GET READY!`;
    webcamBorder.className = 'player-setup-webcam ' + (idx === 0 ? '' : 'p2');

    if (webcamState.playerCount === 2) {
        instruction.textContent = idx === 0
            ? 'Stand on the LEFT side and raise your hand'
            : 'Stand on the RIGHT side and raise your hand';
    } else {
        instruction.textContent = 'Stand in front of camera and raise your hand';
    }

    indicator.textContent = 'RAISE YOUR HAND!';
    indicator.classList.remove('ready');

    // Update ready cards
    for (let i = 0; i < 2; i++) {
        const reg = webcamState.registeredPlayers[i];
        const statusEl = document.getElementById(`p${i + 1}ReadyStatus`);
        const facePreview = document.getElementById(`p${i + 1}FacePreview`);
        const placeholder = document.getElementById(`p${i + 1}FacePlaceholder`);

        if (reg.ready && reg.faceImage) {
            statusEl.textContent = 'READY!';
            statusEl.classList.add('ready');
            facePreview.src = reg.faceImage;
            facePreview.style.display = 'block';
            placeholder.style.display = 'none';
        } else if (i === idx) {
            statusEl.textContent = 'REGISTERING...';
            statusEl.classList.remove('ready');
        } else {
            statusEl.textContent = 'WAITING...';
            statusEl.classList.remove('ready');
        }
    }

    // Show start button when all required players are ready
    const allReady = webcamState.registeredPlayers
        .slice(0, webcamState.playerCount)
        .every(p => p.ready);

    if (allReady) {
        document.getElementById('setupStartBtn').classList.remove('hidden');
        webcamState.registrationPhase = 'ready';
    }
}

function completePlayerRegistration(playerIndex, faceImage) {
    webcamState.registeredPlayers[playerIndex].ready = true;
    webcamState.registeredPlayers[playerIndex].faceImage = faceImage;
    gameState.players[playerIndex].faceImage = faceImage;

    const indicator = document.getElementById('setupWaveIndicator');
    indicator.textContent = 'CAPTURED!';
    indicator.classList.add('ready');

    setTimeout(() => {
        if (playerIndex < webcamState.playerCount - 1) {
            webcamState.currentRegisteringPlayer = playerIndex + 1;
            const next = webcamState.registeredPlayers[playerIndex + 1];
            next.waveFrames = 0;
            next.wristHistories = { left: [], right: [] };
            next.motionScore = 0;
        }
        updateRegistrationUI();
    }, 500);
}

// ── Wave countdown ─────────────────────────────────────────────────

let _countdownId = 0;

function startWaveCountdown(onComplete) {
    const myId = ++_countdownId;
    const overlay = document.getElementById('countdownOverlay');
    const text = document.getElementById('countdownText');
    overlay.classList.remove('hidden');

    const isFirstWave = gameState.wave === 1;

    const steps = [];
    if (isFirstWave) {
        steps.push({ text: 'READY?', voice: 'Are you ready?', delay: 1500 });
    } else {
        steps.push({ text: 'WAVE ' + gameState.wave, voice: 'Wave ' + gameState.wave, delay: 1200 });
    }
    steps.push(
        { text: '3', voice: '3', delay: 850, beep: true },
        { text: '2', voice: '2', delay: 850, beep: true },
        { text: '1', voice: '1', delay: 850, beep: true },
        { text: 'GO!', voice: 'Go!', delay: 500, go: true }
    );

    let i = 0;
    function showStep() {
        if (myId !== _countdownId || !gameState.running) {
            overlay.classList.add('hidden');
            return;
        }
        if (i >= steps.length) {
            overlay.classList.add('hidden');
            onComplete();
            return;
        }

        const step = steps[i];
        text.textContent = step.text;

        // Re-trigger CSS animation
        text.style.animation = 'none';
        text.offsetWidth;
        text.style.animation = step.go
            ? 'countdownGo 0.5s ease-out forwards'
            : 'countdownPop 0.5s ease-out forwards';

        // Voice
        audioSystem.speakText(step.voice);

        // Sound effects
        if (step.beep) audioSystem.playCountdownTick();
        if (step.go) audioSystem.playCountdownGo();

        i++;
        setTimeout(showStep, step.delay);
    }

    showStep();
}

function cancelCountdown() {
    _countdownId++;
    document.getElementById('countdownOverlay').classList.add('hidden');
}

// ── Theme selection ─────────────────────────────────────────────────

function selectTheme(theme) {
    gameTheme = theme;
    document.getElementById('spaceThemeBtn').classList.toggle('selected', theme === 'space');
    document.getElementById('unicornThemeBtn').classList.toggle('selected', theme === 'unicorn');

    const title = document.getElementById('gameTitle');
    const subtitle = document.getElementById('gameSubtitle');
    const container = document.getElementById('gameContainer');

    container.classList.toggle('unicorn-theme', theme === 'unicorn');

    if (theme === 'unicorn') {
        title.textContent = 'UNICORN MAGIC';
        subtitle.textContent = 'PROTECT THE RAINBOW';
        container.style.background = 'linear-gradient(180deg, #87CEEB 0%, #FFB6C1 30%, #DDA0DD 60%, #98FB98 100%)';
        document.body.style.background = '#FFB6C1';
    } else {
        title.textContent = 'WAVE ASSAULT';
        subtitle.textContent = 'SURVIVE THE ONSLAUGHT';
        container.style.background = 'radial-gradient(ellipse at 20% 30%,rgba(138,43,226,0.15) 0%,transparent 50%),radial-gradient(ellipse at 80% 70%,rgba(0,255,255,0.1) 0%,transparent 50%),linear-gradient(180deg,#0a0015 0%,#1a0a2e 100%)';
        document.body.style.background = '#0a0015';
    }
}
