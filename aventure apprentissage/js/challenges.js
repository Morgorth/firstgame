// challenges.js — Système de challenges éducatifs

const challengeSystem = {
  current: null,  // { type, data, grammar, attempts, maxAttempts, roomId, levelNum }
  _onComplete: null,
  _onFail: null,

  start(roomId, levelNum, onComplete, onFail) {
    if (this.current) return;

    const level = LEVELS[levelNum - 1];
    const type  = level.challengeTypes[roomId];
    const data  = this._buildChallengeData(type, levelNum, roomId);

    this.current = {
      type,
      data,
      grammar:     this._buildGrammar(type, data),
      attempts:    0,
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

  processAnswer(spokenText, allAlternatives) {
    if (!this.current) return;
    const { type, data } = this.current;
    let success = false;

    if (type === 'calcul') {
      // Use the LAST number in the transcript — kids count aloud to reach the answer,
      // so "un deux trois quatre cinq" should give 5, not 1 or 12345.
      const _lastNum = (text) => {
        const norm = speechSystem.normalize(text);
        const all  = norm.match(/\d+/g);
        return all ? parseInt(all[all.length - 1], 10) : NaN;
      };
      const num = _lastNum(spokenText);
      if (!isNaN(num) && num === data.answer) {
        success = true;
      } else if (allAlternatives) {
        for (const alt of allAlternatives) {
          const ni = _lastNum(alt);
          if (!isNaN(ni) && ni === data.answer) { success = true; break; }
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
      success = speechSystem.matches(spokenText, data.expected);
      if (!success && allAlternatives) {
        for (const alt of allAlternatives) {
          if (speechSystem.matches(alt, data.expected)) { success = true; break; }
        }
      }
    }

    if (success) {
      // restartMicAfter=false : le challenge se ferme après le feedback
      uiSystem.showFeedback(true, 'Bravo ! 🌟', false);
      setTimeout(() => this.end(true), 1500);
    } else {
      this.current.attempts++;
      if (this.current.attempts >= this.current.maxAttempts) {
        // Mode aide : restartMicAfter=false, le challenge se ferme
        uiSystem.showFeedback(false, "Pas de problème ! Voici la réponse 💡", false);
        uiSystem.showHint(this._getHint());
        setTimeout(() => this.end(false), 3000);
      } else {
        const remaining = this.current.maxAttempts - this.current.attempts;
        // restartMicAfter=true : showFeedback relance le micro après la voix
        uiSystem.showFeedback(
          false,
          `Ce n'est pas ça ! Essaie encore ! (${remaining} essai${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''})`,
          true
        );
        if (this.current.attempts >= 2) {
          uiSystem.showHint(this._getHint());
        }
      }
    }
  },

  _getHint() {
    if (!this.current) return '';
    const { type, data } = this.current;
    if (type === 'lecture') return `Réponse : "${data.expected[0]}"`;
    if (type === 'calcul')  return `Réponse : ${data.answer}`;
    if (type === 'anglais') return `Réponse en anglais : "${data.expected[0]}"`;
    return '';
  },

  end(success) {
    if (!this.current) return;
    const { roomId, type, attempts } = this.current;

    this.current = null;
    gameState.challengeActive = false;

    uiSystem.hideChallenge();

    if (success) {
      audioSystem.playSuccess();
      const skillMap = { lecture: 'lecture', calcul: 'calcul', anglais: 'anglais' };
      const skill    = skillMap[type] || 'lecture';
      const xpPoints = (attempts === 0) ? 20 : 10;
      const oldLevel = currentProfile.stats ? (currentProfile.stats[skill] || 1) : 1;
      rpgSystem.addXP(currentProfile, skill, xpPoints);
      const newLevel = currentProfile.stats ? (currentProfile.stats[skill] || 1) : 1;
      const newCosmetics = rpgSystem.checkUnlocks(currentProfile);
      saveSystem.saveProfile(currentProfile);

      // Notification flottante XP
      const xpIcons = { lecture: '📖', calcul: '➕', anglais: '🇬🇧' };
      const xpIcon  = xpIcons[skill] || '✨';
      const levelUp = newLevel > oldLevel;
      gameState.floatingXP.push({
        text:     levelUp ? `${xpIcon} NIVEAU ${newLevel} !` : `+${xpPoints} XP ${xpIcon}`,
        x:        gameState.player.x,
        y:        gameState.player.y - 40,
        frame:    0,
        maxFrame: levelUp ? 110 : 80,
        levelUp,
      });

      if (this._onComplete) this._onComplete(roomId, newCosmetics);
    } else {
      audioSystem.playFail();
      if (this._onFail) this._onFail(roomId);
    }

    this._onComplete = null;
    this._onFail     = null;
  },

  skip() {
    if (!this.current) return;
    this.end(false);
  },

  // Construit les données du challenge selon le type et le niveau
  _buildChallengeData(type, levelNum, roomId) {
    if (type === 'calcul') {
      return generateCalcul(levelNum);
    } else if (type === 'lecture') {
      let pool;
      if (levelNum <= 6)       pool = LECTURE_SYLLABES;
      else if (levelNum <= 13) pool = LECTURE_MOTS;
      else                     pool = LECTURE_PHRASES;
      const idx = (levelNum * 3 + roomId) % pool.length;
      return { ...pool[idx] };
    } else if (type === 'anglais') {
      const idx = (levelNum * 2 + roomId) % ANGLAIS_DATA.length;
      return { ...ANGLAIS_DATA[idx] };
    }
    return {};
  },

  // Construit la grammaire JSGF pour orienter le STT vers les réponses attendues
  _buildGrammar(type, data) {
    let words = [];
    if (type === 'calcul') {
      words = [String(data.answer)];
      const numWords = {
        0:'zero', 1:'un', 2:'deux', 3:'trois', 4:'quatre', 5:'cinq', 6:'six',
        7:'sept', 8:'huit', 9:'neuf', 10:'dix', 11:'onze', 12:'douze', 13:'treize',
        14:'quatorze', 15:'quinze', 16:'seize', 17:'dix-sept', 18:'dix-huit',
        19:'dix-neuf', 20:'vingt', 21:'vingt-et-un', 22:'vingt-deux', 23:'vingt-trois',
        24:'vingt-quatre', 25:'vingt-cinq', 26:'vingt-six', 27:'vingt-sept',
        28:'vingt-huit', 29:'vingt-neuf', 30:'trente',
      };
      if (numWords[data.answer]) words.push(numWords[data.answer]);
    } else if (type === 'lecture') {
      words = [...(data.expected || [])];
      if (data.display) words.push(data.display.replace(/·/g, ''));
    } else if (type === 'anglais') {
      words = [...(data.expected || [])];
    }
    if (!words.length) return null;
    const unique = [...new Set(words.map(w => w.toLowerCase()))];
    return `#JSGF V1.0; grammar answer; public <answer> = ${unique.join(' | ')};`;
  },
};
