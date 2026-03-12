// ui.js — Gestion des écrans HTML et overlays

const uiSystem = {
  _micTimeout: null,
  _micActive: false,

  init() {
    // Boutons du menu
    const btnKeyboard = document.getElementById('btnPlayKeyboard');
    const btnCamera   = document.getElementById('btnPlayCamera');
    if (btnKeyboard) btnKeyboard.addEventListener('click', () => this._onPlayKeyboard());
    if (btnCamera)   btnCamera.addEventListener('click',   () => this._onPlayCamera());

    // Calibration
    const btnSkipCalib = document.getElementById('btnSkipCalib');
    if (btnSkipCalib) btnSkipCalib.addEventListener('click', () => this._skipCalibration());

    // Challenge
    const btnSkip = document.getElementById('btnSkipChallenge');
    if (btnSkip) btnSkip.addEventListener('click', () => {
      challengeSystem.skip();
    });

    // Level complete
    const btnNext = document.getElementById('btnNextLevel');
    if (btnNext) btnNext.addEventListener('click', () => this._onNextLevel());

    // Game complete
    const btnRestart = document.getElementById('btnRestart');
    if (btnRestart) btnRestart.addEventListener('click', () => this._onRestart());

    // Settings
    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) btnSettings.addEventListener('click', () => this._showSettings());
  },

  // ── Navigation ─────────────────────────────────────────────────

  showMenu() {
    gameState.phase = 'menu';
    this._showScreen('screen-menu');
    this._hideScreen('screen-challenge');
    this._hideScreen('screen-levelcomplete');
    this._hideScreen('screen-gamecomplete');
    this._hideScreen('screen-calibration');

    // Affiche le niveau actuel
    const disp = document.getElementById('menuLevelDisplay');
    if (disp && currentProgress) {
      disp.textContent = `Niveau actuel : ${currentProgress.currentLevel} / 20`;
    }

    // Pré-remplit le nom
    const nameInput = document.getElementById('playerName');
    if (nameInput && currentProfile) {
      nameInput.value = currentProfile.name !== 'Aventurier' ? currentProfile.name : '';
    }
  },

  hideMenu() {
    this._hideScreen('screen-menu');
  },

  showCalibration(onDone) {
    this._showScreen('screen-calibration');
    this._hideScreen('screen-menu');

    let count = 10;
    const countEl = document.getElementById('calibCountdown');
    if (countEl) countEl.textContent = count;

    const interval = setInterval(() => {
      count--;
      if (countEl) countEl.textContent = count;
      if (count <= 0) {
        clearInterval(interval);
        this._hideScreen('screen-calibration');
        if (onDone) onDone();
      }
    }, 1000);

    // Stocke l'interval pour le skip
    this._calibInterval = interval;
    this._calibOnDone   = onDone;
  },

  _skipCalibration() {
    if (this._calibInterval) clearInterval(this._calibInterval);
    this._hideScreen('screen-calibration');
    if (this._calibOnDone) this._calibOnDone();
  },

  // ── Challenge ──────────────────────────────────────────────────

  showChallenge(challengeData) {
    this._showScreen('screen-challenge');

    const { type, data } = challengeData;
    const badge   = document.getElementById('challengeTypeBadge');
    const content = document.getElementById('challengeContent');
    const hints   = document.getElementById('hintArea');
    const feedback= document.getElementById('feedbackArea');
    const dots    = document.getElementById('attemptsDots');
    const mic     = document.getElementById('micIndicator');

    // Remet à zéro
    if (hints)    { hints.classList.add('hidden'); hints.textContent = ''; }
    if (feedback) feedback.textContent = '';
    if (mic)      mic.classList.add('hidden');

    // Badge de type
    const badgeMap = { lecture: '📖 Lecture', calcul: '➕ Calcul', anglais: '🇬🇧 Anglais' };
    if (badge) badge.textContent = badgeMap[type] || type;

    // Contenu selon le type
    if (content) {
      if (type === 'lecture') {
        const displayText = data.display.replace(/·/g, '<span class="syllable-dot">·</span>');
        const colored = data.display.split('·').map((s, i) =>
          `<span class="syllable syllable-${i % 3}">${s}</span>`
        ).join('<span class="syllable-dot">·</span>');
        content.innerHTML = `
          <div class="challenge-instruction">Lis ce mot !</div>
          <div class="challenge-word lecture-word">${colored}</div>
        `;
      } else if (type === 'calcul') {
        content.innerHTML = `
          <div class="challenge-instruction">Combien font...</div>
          <div class="challenge-word calcul-word">${data.a} + ${data.b} = ?</div>
        `;
      } else if (type === 'anglais') {
        content.innerHTML = `
          <div class="challenge-instruction">Comment dit-on en anglais ?</div>
          <div class="challenge-emoji">${data.emoji}</div>
          <div class="challenge-word anglais-word">${data.fr}</div>
        `;
      }
    }

    // Points de tentative
    this._renderDots(challengeData.maxAttempts, challengeData.attempts);

    // Active le micro après un délai
    setTimeout(() => this.startMic(), 800);
  },

  _renderDots(max, used) {
    const dots = document.getElementById('attemptsDots');
    if (!dots) return;
    dots.innerHTML = '';
    for (let i = 0; i < max; i++) {
      const d = document.createElement('span');
      d.className = 'attempt-dot' + (i < used ? ' used' : '');
      dots.appendChild(d);
    }
  },

  startMic() {
    if (!challengeSystem.current) return;
    const { type } = challengeSystem.current;
    const lang = type === 'anglais' ? 'en-US' : 'fr-FR';

    const mic = document.getElementById('micIndicator');
    if (mic) mic.classList.remove('hidden');

    this._micActive = true;

    speechSystem.startListening(
      lang,
      (text, alternatives) => {
        // Résultat reçu
        this._micActive = false;
        if (mic) mic.classList.add('hidden');
        if (challengeSystem.current) {
          challengeSystem.processAnswer(text, alternatives);
        }
      },
      () => {
        // Fin sans résultat (timeout)
        this._micActive = false;
        if (mic) mic.classList.add('hidden');
        if (challengeSystem.current) {
          const feedback = document.getElementById('feedbackArea');
          if (feedback) feedback.textContent = "Je n'ai pas entendu. Essaie encore !";
          setTimeout(() => this.startMic(), 1500);
        }
      }
    );
  },

  hideChallenge() {
    speechSystem.stopListening();
    this._micActive = false;
    const mic = document.getElementById('micIndicator');
    if (mic) mic.classList.add('hidden');
    this._hideScreen('screen-challenge');
    gameState.phase = 'playing';
  },

  showFeedback(success, message) {
    const area = document.getElementById('feedbackArea');
    if (!area) return;
    area.className = 'feedback-area ' + (success ? 'success' : 'error');
    area.textContent = (success ? '✅ ' : '💔 ') + message;

    // Met à jour les dots
    if (challengeSystem.current) {
      this._renderDots(
        challengeSystem.current.maxAttempts,
        challengeSystem.current.attempts
      );
    }
  },

  showHint(hintText) {
    const area = document.getElementById('hintArea');
    if (!area) return;
    area.textContent = '💡 ' + hintText;
    area.classList.remove('hidden');
  },

  // ── Level complete ──────────────────────────────────────────────

  showLevelComplete(roomsDone, newCosmetics) {
    gameState.phase = 'levelcomplete';
    this._showScreen('screen-levelcomplete');

    const scoreEl = document.getElementById('levelCompleteScore');
    if (scoreEl) {
      scoreEl.innerHTML = `
        <p>Tu as réussi <strong>${roomsDone.length}/6</strong> salles !</p>
        <p>Niveau <strong>${gameState.currentLevel}</strong> terminé ! 🎉</p>
      `;
    }

    const cosEl = document.getElementById('newCosmetics');
    if (cosEl) {
      if (newCosmetics && newCosmetics.length > 0) {
        cosEl.innerHTML = '<p>Nouveaux cosmétiques débloqués ! ✨</p>' +
          newCosmetics.map((c) => `<span class="cosmetic-badge">${c.emoji} ${c.name}</span>`).join(' ');
      } else {
        cosEl.innerHTML = '';
      }
    }

    audioSystem.playLevelComplete();
  },

  showGameComplete() {
    gameState.phase = 'gamecomplete';
    this._showScreen('screen-gamecomplete');
    audioSystem.playLevelComplete();
  },

  // ── Helpers ────────────────────────────────────────────────────

  _showScreen(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('hidden');
      el.classList.add('active');
    }
  },

  _hideScreen(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      el.classList.add('hidden');
    }
  },

  // ── Callbacks boutons ──────────────────────────────────────────

  _onPlayKeyboard() {
    const nameInput = document.getElementById('playerName');
    if (nameInput && nameInput.value.trim()) {
      currentProfile.name = nameInput.value.trim();
      saveSystem.saveProfile(currentProfile);
    }
    selectControlMode('keyboard');
    this.hideMenu();
    startGame();
  },

  _onPlayCamera() {
    const nameInput = document.getElementById('playerName');
    if (nameInput && nameInput.value.trim()) {
      currentProfile.name = nameInput.value.trim();
      saveSystem.saveProfile(currentProfile);
    }
    selectControlMode('camera');
    this.hideMenu();
    this.showCalibration(() => {
      initWebcam().then(() => startGame());
    });
  },

  _onNextLevel() {
    this._hideScreen('screen-levelcomplete');
    nextLevel();
  },

  _onRestart() {
    this._hideScreen('screen-gamecomplete');
    saveSystem.resetAll();
    currentProfile  = saveSystem.loadProfile();
    currentProgress = saveSystem.loadProgress();
    this.showMenu();
  },

  _showSettings() {
    // Simple dialogue de réinitialisation
    if (confirm('Réinitialiser la progression ? (toutes les données seront effacées)')) {
      saveSystem.resetAll();
      currentProfile  = saveSystem.loadProfile();
      currentProgress = saveSystem.loadProgress();
      this.showMenu();
    }
  },

  updateHUD() {
    // Le HUD est dessiné directement dans le canvas par world.js
  },
};
