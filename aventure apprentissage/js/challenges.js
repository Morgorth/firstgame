// challenges.js — Système de challenges éducatifs

const challengeSystem = {
  current: null,  // { type, data, attempts, maxAttempts, roomId, levelNum, onComplete, onFail }
  _onComplete: null,
  _onFail: null,

  // Lance un challenge pour la salle roomId du niveau levelNum
  start(roomId, levelNum, onComplete, onFail) {
    if (this.current) return; // déjà actif

    const level     = LEVELS[levelNum - 1];
    const type      = level.challengeTypes[roomId]; // 'lecture'|'calcul'|'anglais'
    const data      = this._buildChallengeData(type, levelNum, roomId);

    this.current = {
      type,
      data,
      attempts: 0,
      maxAttempts: CONFIG.challenge.maxAttempts,
      roomId,
      levelNum,
    };
    this._onComplete = onComplete;
    this._onFail     = onFail;

    gameState.challengeActive = true;
    gameState.phase = 'challenge';

    uiSystem.showChallenge(this.current);
  },

  // Traite la réponse vocale reçue
  processAnswer(spokenText, allAlternatives) {
    if (!this.current) return;
    const { type, data } = this.current;
    let success = false;

    if (type === 'calcul') {
      // Extrait un nombre depuis le texte (ex: "quinze" → 15)
      const spoken = parseInt(speechSystem.normalize(spokenText).replace(/\s/g, ''), 10);
      const num    = isNaN(spoken)
        ? speechSystem.wordToNumber(spokenText)
        : spoken;

      // Essaie aussi les alternatives
      if (num === data.answer) {
        success = true;
      } else if (allAlternatives) {
        for (const alt of allAlternatives) {
          const n = speechSystem.wordToNumber(alt);
          if (n === data.answer) { success = true; break; }
          const ni = parseInt(speechSystem.normalize(alt).replace(/\s/g, ''), 10);
          if (ni === data.answer) { success = true; break; }
        }
      }
    } else if (type === 'lecture') {
      success = speechSystem.matches(spokenText, data.expected);
      if (!success && allAlternatives) {
        for (const alt of allAlternatives) {
          if (speechSystem.matches(alt, data.expected)) { success = true; break; }
        }
      }
    } else if (type === 'anglais') {
      // STT en-US → comparaison simple
      success = speechSystem.matches(spokenText, data.expected);
      if (!success && allAlternatives) {
        for (const alt of allAlternatives) {
          if (speechSystem.matches(alt, data.expected)) { success = true; break; }
        }
      }
    }

    if (success) {
      this.end(true);
    } else {
      this.current.attempts++;
      if (this.current.attempts >= this.current.maxAttempts) {
        // Mode aide : on marque quand même comme "tentée" pour ne pas bloquer
        uiSystem.showFeedback(false, "Pas de problème ! Voici la réponse 💡");
        uiSystem.showHint(this._getHint());
        setTimeout(() => this.end(false), 3000);
      } else {
        const remaining = this.current.maxAttempts - this.current.attempts;
        uiSystem.showFeedback(false, `Essaie encore ! (${remaining} essai${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''})`);
        if (this.current.attempts >= 2) {
          uiSystem.showHint(this._getHint());
        }
        // Relance l'écoute après feedback
        setTimeout(() => uiSystem.startMic(), 2000);
      }
    }
  },

  // Texte d'indice selon le type
  _getHint() {
    if (!this.current) return '';
    const { type, data } = this.current;
    if (type === 'lecture') {
      return `Réponse : "${data.expected[0]}"`;
    } else if (type === 'calcul') {
      return `Réponse : ${data.answer}`;
    } else if (type === 'anglais') {
      return `Réponse en anglais : "${data.expected[0]}"`;
    }
    return '';
  },

  end(success) {
    if (!this.current) return;
    const { roomId, levelNum, type, attempts } = this.current;

    this.current = null;
    gameState.challengeActive = false;

    uiSystem.hideChallenge();

    if (success) {
      audioSystem.playSuccess();
      // XP selon type
      const skillMap = { lecture: 'lecture', calcul: 'calcul', anglais: 'anglais' };
      const skill = skillMap[type] || 'lecture';
      // 20 XP si réussi du premier coup, 10 XP sinon
      const xpPoints = (attempts === 0) ? 20 : 10;
      rpgSystem.addXP(currentProfile, skill, xpPoints);
      const newCosmetics = rpgSystem.checkUnlocks(currentProfile);
      saveSystem.saveProfile(currentProfile);

      if (this._onComplete) this._onComplete(roomId, newCosmetics);
    } else {
      audioSystem.playFail();
      // On marque quand même la salle comme tentée (mode aide)
      if (this._onFail) this._onFail(roomId);
    }

    this._onComplete = null;
    this._onFail     = null;
  },

  // Passe le challenge en cours (bouton "Passer")
  skip() {
    if (!this.current) return;
    this.end(false);
  },

  // Construit les données du challenge selon le type et le niveau
  _buildChallengeData(type, levelNum, roomId) {
    if (type === 'calcul') {
      return generateCalcul(levelNum);
    } else if (type === 'lecture') {
      // Progression : niveaux 1-6 = syllabes, 7-13 = mots, 14-20 = phrases
      let pool;
      if (levelNum <= 6) {
        pool = LECTURE_SYLLABES;
      } else if (levelNum <= 13) {
        pool = LECTURE_MOTS;
      } else {
        pool = LECTURE_PHRASES;
      }
      // Choix déterministe (mais varié) basé sur niveau + salle
      const idx = (levelNum * 3 + roomId) % pool.length;
      return { ...pool[idx] };
    } else if (type === 'anglais') {
      const idx = (levelNum * 2 + roomId) % ANGLAIS_DATA.length;
      return { ...ANGLAIS_DATA[idx] };
    }
    return {};
  },
};
