// HUD updates, screen transitions, control/theme selection, player registration UI.

// ── HUD ─────────────────────────────────────────────────────────────

function _updateNukeEl(el, playerIndex) {
    if (!el) return;
    const charges = gameState.superWeaponCharges[playerIndex];
    if (charges > 0) {
        el.textContent = `READY! (x${charges})`;
        el.classList.add('nuke-ready');
    } else {
        el.textContent = gameState.playerKills[playerIndex] + '/' + gameState.superWeaponNextThreshold[playerIndex];
        el.classList.remove('nuke-ready');
    }
}

function updateHUD() {
    document.getElementById('score').textContent = gameState.score;

    if (gameState.playerCount === 2) {
        _updateNukeEl(document.getElementById('p1Nuke'), 0);
        _updateNukeEl(document.getElementById('p2Nuke'), 1);
    } else {
        _updateNukeEl(document.getElementById('nukeProgress'), 0);
    }

    updateActiveEffectsHUD();
}

function updateWave() {
    if (gameState.campaignMode) {
        const actWave = ((gameState.wave - 1) % CONFIG.campaign.wavesPerAct) + 1;
        document.getElementById('wave').textContent = actWave + '/' + CONFIG.campaign.wavesPerAct;
    } else {
        document.getElementById('wave').textContent = gameState.wave;
    }
}

let _lastCrowdSize = -1;
function updateCrowdDisplay() {
    if (gameState.playerCount === 2) {
        gameState.players.forEach((player, i) => {
            const fleetEl = document.getElementById(`p${i + 1}Fleet`);
            const hudEl = document.getElementById(`p${i + 1}Hud`);
            if (fleetEl) fleetEl.textContent = player.crowdSize;
            if (hudEl) hudEl.classList.toggle('eliminated', !player.active);
        });
    } else {
        const size = Math.min(gameState.crowdSize, 50);
        document.getElementById('crowdSize').textContent = gameState.crowdSize;
        // Only rebuild pips if count actually changed
        if (size !== _lastCrowdSize) {
            const ind = document.getElementById('crowdIndicator');
            const current = ind.children.length;
            if (size > current) {
                for (let i = current; i < size; i++) {
                    const pip = document.createElement('div');
                    pip.className = 'crowd-pip';
                    ind.appendChild(pip);
                }
            } else if (size < current) {
                for (let i = current - 1; i >= size; i--) {
                    ind.removeChild(ind.children[i]);
                }
            }
            _lastCrowdSize = size;
        }
    }
}

// ── Revive Flash ────────────────────────────────────────────────────

function showReviveFlash(playerIndex) {
    const hudEl = document.getElementById(`p${playerIndex + 1}Hud`);
    if (!hudEl) return;

    // Remove eliminated styling immediately
    hudEl.classList.remove('eliminated');

    // Add flash animation
    hudEl.classList.add('revive-flash');
    setTimeout(() => hudEl.classList.remove('revive-flash'), 1200);
}

// ── High Scores ─────────────────────────────────────────────────────

// scores param: pass the array to render; defaults to arcade highScores
function renderHighScores(containerId, scores) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = scores !== undefined ? scores : highScores;

    if (data.length === 0) {
        container.innerHTML = '<div style="color:#888;font-family:Rajdhani,sans-serif;font-size:14px;padding:10px;">No scores yet — play a game!</div>';
        return;
    }

    container.innerHTML = data.map((entry, i) => {
        const rank = i + 1;
        const firstClass = rank === 1 ? ' first-place' : '';

        // Face thumbnails
        let facesHtml = '';
        if (entry.playerFaces) {
            entry.playerFaces.forEach(face => {
                if (face) {
                    facesHtml += `<img class="high-score-face" src="${face}" alt="">`;
                } else {
                    facesHtml += `<div class="high-score-face high-score-face-placeholder">\uD83D\uDC64</div>`;
                }
            });
        }

        const d = new Date(entry.date);
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

        const isCampaignEntry = entry.theme === 'campaign';
        const themeIcon = isCampaignEntry ? '\uD83C\uDFC6' : entry.theme === 'unicorn' ? '\uD83E\uDD84' : entry.theme === 'pacificrim' ? '\uD83E\uDD16' : entry.theme === 'dragon' ? '\uD83D\uDC09' : '\uD83D\uDE80';
        const ctrlIcon = entry.controlMode === 'camera' ? '\uD83D\uDCF7' : '\u2328\uFE0F';
        const modeLabel = isCampaignEntry ? 'Campaign' : 'Arcade';

        return `<div class="high-score-entry${firstClass}">
            <div class="high-score-rank">#${rank}</div>
            <div class="high-score-faces">${facesHtml}</div>
            <div class="high-score-info">
                <div class="high-score-score">${entry.score.toLocaleString()}</div>
                <div class="high-score-meta">Wave ${entry.wave} &middot; ${dateStr} &middot; ${themeIcon} ${modeLabel} ${ctrlIcon}</div>
            </div>
        </div>`;
    }).join('');
}

// ── Active Effects HUD ──────────────────────────────────────────────

function updateActiveEffectsHUD() {
    const el = document.getElementById('activeEffects');
    if (!el) return;

    let html = '';
    // Show effects for player 0 (or all active players)
    for (let i = 0; i < gameState.players.length; i++) {
        if (!gameState.players[i].active) continue;
        const shield = gameState.activeEffects.shield[i];
        const spread = gameState.activeEffects.spread[i];
        if (shield > 0) {
            const secs = Math.ceil(shield / 60);
            html += `<div class="active-effect shield-effect">\uD83D\uDEE1\uFE0F ${secs}s</div>`;
        }
        if (spread > 0) {
            const secs = Math.ceil(spread / 60);
            html += `<div class="active-effect spread-effect">\u2728 ${secs}s</div>`;
        }
    }
    el.innerHTML = html;
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
        p.ready = false; p.faceImage = null; p.colorSignature = null; p.waveFrames = 0;
        p.wristHistories = { left: [], right: [] }; p.motionScore = 0;
    });

    const indicator = document.getElementById('armsUpIndicator');
    const btn = document.getElementById('startBtn');
    const instr = document.getElementById('instructions');
    const playerCountContainer = document.getElementById('playerCountContainer');

    if (mode === 'keyboard') {
        instr.innerHTML = 'MOVE: Arrow Keys / A-D / Mouse / Touch<br>AUTO-FIRE: Always Active<br>SUPER WEAPON: Space Bar (earn every 50 kills)<br>SHOOT GOLDEN SHIPS: Collect to grow your fleet!<br>STOP ENEMIES: They cost ships if they pass OR hit you!';
        stopWebcam();
        document.getElementById('cameraStatus').textContent = '';
        indicator.style.display = 'none';
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
        playerCountContainer.classList.add('hidden');
        gameState.playerCount = 1;
    } else {
        instr.innerHTML = 'MOVE: Move LEFT / RIGHT to control your ship<br>AUTO-FIRE: Always Active<br>SUPER WEAPON: Raise both hands above head (earn every 50 kills)<br>SHOOT GOLDEN SHIPS: Collect to grow your fleet!<br>STOP ENEMIES: They cost ships if they pass OR hit you!';
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
        p.ready = false; p.faceImage = null; p.colorSignature = null; p.waveFrames = 0;
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

    // In campaign mode show the wave number relative to the current act (e.g. "1/10")
    const actWave = gameState.campaignMode
        ? ((gameState.wave - 1) % CONFIG.campaign.wavesPerAct) + 1
        : gameState.wave;
    const waveLabel = gameState.campaignMode
        ? actWave + '/' + CONFIG.campaign.wavesPerAct
        : gameState.wave;

    const steps = [];
    if (isFirstWave) {
        steps.push({ text: 'READY?', voice: 'Are you ready?', delay: 1200 });
    } else {
        steps.push({ text: 'WAVE ' + waveLabel, voice: 'Wave ' + actWave, delay: 900 });
    }
    steps.push(
        { text: '3', voice: '3', delay: 650, beep: true },
        { text: '2', voice: '2', delay: 650, beep: true },
        { text: '1', voice: '1', delay: 650, beep: true },
        { text: 'GO!', voice: 'Go!', delay: 400, go: true }
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

// ── Campaign HUD ─────────────────────────────────────────────────────

function updateCampaignHUD() {
    const el = document.getElementById('campaignActDisplay');
    if (!el) return;
    if (gameState.campaignMode) {
        const act = gameState.campaignAct;
        const cfg = CONFIG.campaign.acts[act];
        document.getElementById('campaignActText').textContent =
            'ACT ' + (act + 1) + ' \u00b7 ' + cfg.name.toUpperCase();
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

// ── Act complete overlay ──────────────────────────────────────────────

function showActCompleteOverlay(completedAct, nextAct, fleetBonus, onComplete) {
    const actNames = CONFIG.campaign.acts.map(a => a.name);
    const overlay = document.getElementById('actCompleteOverlay');

    document.getElementById('actCompleteTitle').textContent =
        'ACT ' + (completedAct + 1) + ' COMPLETE!';
    document.getElementById('actCompleteTheme').textContent =
        actNames[completedAct].toUpperCase() + ' CLEARED';
    document.getElementById('actCompleteBonus').textContent =
        fleetBonus > 0 ? '+' + fleetBonus + ' FLEET SHIPS' : '';
    document.getElementById('actCompleteNext').textContent =
        'NEXT: ' + actNames[nextAct].toUpperCase();

    overlay.classList.remove('hidden');

    setTimeout(() => {
        overlay.classList.add('hidden');
        onComplete();
    }, CONFIG.campaign.transitionMs);
}

// ── Campaign complete screen ──────────────────────────────────────────

function showCampaignCompleteScreen() {
    document.getElementById('campaignFinalScore').textContent = gameState.score;
    document.getElementById('campaignCompleteScreen').classList.remove('hidden');
    renderHighScores('campaignHighScores', campaignScores);
}

// ── Game mode selection ───────────────────────────────────────────────

function selectGameMode(mode) {
    gameMode = mode;
    document.getElementById('arcadeModeBtn').classList.toggle('selected', mode === 'arcade');
    document.getElementById('campaignModeBtn').classList.toggle('selected', mode === 'campaign');

    const themeSection = document.getElementById('themeSectionContainer');
    if (themeSection) {
        themeSection.style.opacity = mode === 'campaign' ? '0.4' : '1';
        themeSection.style.pointerEvents = mode === 'campaign' ? 'none' : '';
    }

    const modeDesc = document.getElementById('campaignModeDesc');
    if (modeDesc) modeDesc.classList.toggle('hidden', mode !== 'campaign');
}

// ── Theme selection ─────────────────────────────────────────────────

function selectTheme(theme) {
    gameTheme = theme;
    document.getElementById('spaceThemeBtn').classList.toggle('selected', theme === 'space');
    document.getElementById('unicornThemeBtn').classList.toggle('selected', theme === 'unicorn');
    document.getElementById('pacificrimThemeBtn').classList.toggle('selected', theme === 'pacificrim');
    document.getElementById('dragonThemeBtn').classList.toggle('selected', theme === 'dragon');
    document.getElementById('goSpaceThemeBtn').classList.toggle('selected', theme === 'space');
    document.getElementById('goUnicornThemeBtn').classList.toggle('selected', theme === 'unicorn');
    document.getElementById('goPacificrimThemeBtn').classList.toggle('selected', theme === 'pacificrim');
    document.getElementById('goDragonThemeBtn').classList.toggle('selected', theme === 'dragon');

    const title = document.getElementById('gameTitle');
    const subtitle = document.getElementById('gameSubtitle');
    const container = document.getElementById('gameContainer');

    container.classList.toggle('unicorn-theme', theme === 'unicorn');
    container.classList.toggle('pacificrim-theme', theme === 'pacificrim');
    container.classList.toggle('dragon-theme', theme === 'dragon');

    if (theme === 'unicorn') {
        title.textContent = 'UNICORN MAGIC';
        subtitle.textContent = 'PROTECT THE RAINBOW';
        container.style.background = 'linear-gradient(180deg, #87CEEB 0%, #FFB6C1 30%, #DDA0DD 60%, #98FB98 100%)';
        document.body.style.background = '#FFB6C1';
    } else if (theme === 'pacificrim') {
        title.textContent = 'PACIFIC RIM';
        subtitle.textContent = 'DEFEND THE BREACH';
        container.style.background = 'radial-gradient(ellipse at 50% 80%, rgba(0,80,120,0.4) 0%, transparent 60%), linear-gradient(180deg, #050d14 0%, #0a1e2e 60%, #0d2a1a 100%)';
        document.body.style.background = '#050d14';
    } else if (theme === 'dragon') {
        title.textContent = 'DRAGON GROTTO';
        subtitle.textContent = 'SCORCH THE KNIGHTS';
        container.style.background = 'radial-gradient(ellipse at 50% 100%, rgba(200,60,0,0.4) 0%, transparent 55%), linear-gradient(180deg, #0a0505 0%, #1a0a08 55%, #2d1006 100%)';
        document.body.style.background = '#0a0505';
    } else {
        title.textContent = 'WAVE ASSAULT';
        subtitle.textContent = 'SURVIVE THE ONSLAUGHT';
        container.style.background = 'radial-gradient(ellipse at 20% 30%,rgba(138,43,226,0.15) 0%,transparent 50%),radial-gradient(ellipse at 80% 70%,rgba(0,255,255,0.1) 0%,transparent 50%),linear-gradient(180deg,#0a0015 0%,#1a0a2e 100%)';
        document.body.style.background = '#0a0015';
    }
}
