// main.js — Bootstrap et game loop principal

// ── Audio System (intégré ici pour rester dans les 14 fichiers) ───

const audioSystem = {
  ctx: null,

  _getCtx() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext indisponible:', e);
      }
    }
    return this.ctx;
  },

  _resume() {
    const ctx = this._getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  },

  playSuccess() {
    const ctx = this._resume();
    if (!ctx) return;
    const t = ctx.currentTime;
    const freqs = [523, 659, 784, 1047]; // Do Mi Sol Do
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0.3, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.25);
      osc.start(t + i * 0.1);
      osc.stop(t + i * 0.1 + 0.3);
    });
  },

  playFail() {
    const ctx = this._resume();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.45);
  },

  playLevelComplete() {
    const ctx = this._resume();
    if (!ctx) return;
    const t = ctx.currentTime;
    const melody = [523, 523, 587, 523, 698, 659, 523, 523, 587, 523, 784, 698];
    melody.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.15);
      gain.gain.setValueAtTime(0.25, t + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.2);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.25);
    });
  },

  playStep() {
    const ctx = this._resume();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(800 + Math.random() * 200, t);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t);
    osc.stop(t + 0.06);
  },
};

// ── Contrôle ──────────────────────────────────────────────────────

function selectControlMode(mode) {
  controlMode = mode;
  console.log('[Main] Mode contrôle :', mode);
}

// ── Démarrage du jeu ──────────────────────────────────────────────

function startGame() {
  // Charge/recharge le profil et la progression
  if (!currentProfile)  currentProfile  = saveSystem.loadProfile();
  if (!currentProgress) currentProgress = saveSystem.loadProgress();

  gameState.currentLevel = currentProgress.currentLevel || 1;

  // Applique les cosmétiques du profil au joueur
  gameState.player.cosmetics.avatar   = currentProfile.equippedAvatar;
  gameState.player.cosmetics.unicorn  = currentProfile.equippedUnicorn;

  // Go to world map instead of directly playing
  showWorldMap();
}

function showWorldMap() {
  gameState.phase   = 'worldmap';
  gameState.running = true;

  // Set initial selected world based on current level
  const curLvl = currentProgress.currentLevel || 1;
  for (let wi = 0; wi < CONFIG.WORLDS.length; wi++) {
    if (CONFIG.WORLDS[wi].levels.includes(curLvl)) {
      gameState.worldMap.selectedWorld = wi;
      break;
    }
  }
  gameState.worldMap.selectedLevel = -1;
  gameState.worldMap.animFrame = 0;

  requestAnimationFrame(gameLoop);
}

function startLevel(levelNum) {
  gameState.currentLevel = levelNum;
  // Figure out which world this level belongs to
  for (let wi = 0; wi < CONFIG.WORLDS.length; wi++) {
    if (CONFIG.WORLDS[wi].levels.includes(levelNum)) {
      gameState.currentWorld = wi;
      break;
    }
  }
  _resetLevelState();
  gameState.phase   = 'playing';
  gameState.running = true;
}

function _resetLevelState() {
  // Récupère les salles déjà faites ce niveau depuis la progression
  const lvlData = currentProgress.levels[gameState.currentLevel];
  gameState.roomsDone           = lvlData ? [...(lvlData.roomsDone || [])] : [];
  gameState.recentlyExitedRooms = [];
  gameState.exitUnlocked        = gameState.roomsDone.length >= CONFIG.challenge.gateScore;
  gameState.player.x            = CONFIG.player.spawn.x;
  gameState.player.y            = CONFIG.player.spawn.y;
  gameState.challengeActive     = false;
}

// ── Game loop ─────────────────────────────────────────────────────

function gameLoop() {
  gameState.frameCount++;

  // World map phase — render map and handle navigation
  if (gameState.phase === 'worldmap') {
    worldSystem.render(gameState);
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState.phase !== 'playing') {
    requestAnimationFrame(gameLoop);
    return;
  }

  // 1. Input
  let dx = 0, dy = 0;
  if (controlMode === 'camera' && webcamState.active) {
    dx = webcamState.webcamInput.dx;
    dy = webcamState.webcamInput.dy;
  } else {
    ({ dx, dy } = inputSystem.getKeyboardInput());
  }

  // 2. Déplace le joueur
  movePlayer(dx, dy);

  // 3. Vérifie les triggers de salles
  if (!gameState.challengeActive) {
    checkRoomTriggers();
  }

  // 4. Vérifie la sortie
  if (!gameState.challengeActive) {
    checkExitTrigger();
  }

  // 5. Render
  worldSystem.render(gameState);

  requestAnimationFrame(gameLoop);
}

// ── World map keyboard navigation ────────────────────────────────

var _worldMapKeyThrottle = 0;

function handleWorldMapInput(e) {
  if (gameState.phase !== 'worldmap') return;
  // Prevent default for navigation keys in world map
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' '].includes(e.key)) {
    e.preventDefault();
  }
  const now = Date.now();
  if (now - _worldMapKeyThrottle < 180) return;
  _worldMapKeyThrottle = now;

  const wm = gameState.worldMap;
  const key = e.key;

  if (wm.selectedLevel === -1) {
    // Navigating between worlds
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      if (wm.selectedWorld < CONFIG.WORLDS.length - 1) {
        wm.selectedWorld++;
        audioSystem.playStep();
      }
    } else if (key === 'ArrowLeft' || key === 'q' || key === 'Q' || key === 'a' || key === 'A') {
      if (wm.selectedWorld > 0) {
        wm.selectedWorld--;
        audioSystem.playStep();
      }
    } else if (key === 'ArrowUp' || key === 'z' || key === 'Z' || key === 'w' || key === 'W') {
      // Enter level selection for this world
      if (worldSystem._isWorldUnlocked(wm.selectedWorld)) {
        wm.selectedLevel = 0;
        audioSystem.playStep();
      }
    } else if (key === 'Enter' || key === ' ') {
      // Quick-enter: select world and first available level
      if (worldSystem._isWorldUnlocked(wm.selectedWorld)) {
        wm.selectedLevel = 0;
        audioSystem.playStep();
      }
    } else if (key === 'Escape') {
      // Back to menu
      gameState.running = false;
      uiSystem.showMenu();
    }
  } else {
    // Navigating levels within a world
    const world = CONFIG.WORLDS[wm.selectedWorld];
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      if (wm.selectedLevel < world.levels.length - 1) {
        wm.selectedLevel++;
        audioSystem.playStep();
      }
    } else if (key === 'ArrowLeft' || key === 'q' || key === 'Q' || key === 'a' || key === 'A') {
      if (wm.selectedLevel > 0) {
        wm.selectedLevel--;
        audioSystem.playStep();
      }
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      // Back to world selection
      wm.selectedLevel = -1;
      audioSystem.playStep();
    } else if (key === 'Escape') {
      wm.selectedLevel = -1;
      audioSystem.playStep();
    } else if (key === 'Enter' || key === ' ') {
      const levelNum = world.levels[wm.selectedLevel];
      if (worldSystem._isLevelUnlocked(levelNum)) {
        startLevel(levelNum);
        audioSystem.playSuccess();
      }
    }
  }
}

// ── Mouvement avec collision ──────────────────────────────────────

function movePlayer(dx, dy) {
  if (dx === 0 && dy === 0) return;

  // Normalise la diagonale
  if (dx !== 0 && dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len;
    dy /= len;
  }

  const speed = CONFIG.player.speed;
  const r     = CONFIG.player.radius;
  const newX  = gameState.player.x + dx * speed;
  const newY  = gameState.player.y + dy * speed;

  // Construit la liste des zones walkable
  const walkable = [...CONFIG.ROOMS, ...CONFIG.CORRIDORS];
  if (gameState.exitUnlocked) {
    walkable.push(CONFIG.EXIT_ZONE, CONFIG.EXIT_CORRIDOR);
  }

  // Vérifie la collision
  if (_isWalkable(newX, newY, r, walkable)) {
    gameState.player.x = newX;
    gameState.player.y = newY;
  } else {
    // Essaie le mouvement sur un seul axe
    if (_isWalkable(newX, gameState.player.y, r, walkable)) {
      gameState.player.x = newX;
    } else if (_isWalkable(gameState.player.x, newY, r, walkable)) {
      gameState.player.y = newY;
    }
  }
}

function _isWalkable(x, y, r, zones) {
  for (const z of zones) {
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) {
      return true;
    }
  }
  return false;
}

// ── Triggers ──────────────────────────────────────────────────────

function checkRoomTriggers() {
  const { x, y } = gameState.player;
  const radius   = CONFIG.challenge.triggerRadius;

  // Retire les salles du cooldown dès que le joueur s'en est éloigné
  gameState.recentlyExitedRooms = gameState.recentlyExitedRooms.filter(roomId => {
    const room = CONFIG.ROOMS[roomId];
    return Math.hypot(x - room.cx, y - room.cy) < radius * 1.5;
  });

  for (let i = 0; i < CONFIG.ROOMS.length; i++) {
    // Ignore les salles en cooldown (le joueur vient d'en sortir)
    if (gameState.recentlyExitedRooms.includes(i)) continue;

    const room = CONFIG.ROOMS[i];
    const dist = Math.hypot(x - room.cx, y - room.cy);

    if (dist < radius) {
      gameState.challengeActive = true;

      challengeSystem.start(
        i,
        gameState.currentLevel,
        // onComplete — marque la salle (pour la sortie) mais elle reste rejouable
        (roomId, newCosmetics) => {
          _markRoomDone(roomId);
          _saveLevelProgress();
          gameState.recentlyExitedRooms.push(roomId);
          if (gameState.phase !== 'levelcomplete') {
            gameState.phase = 'playing';
          }
        },
        // onFail (skip) — retour à la map sans marquer la salle
        (roomId) => {
          gameState.recentlyExitedRooms.push(roomId);
          if (gameState.phase !== 'levelcomplete') {
            gameState.phase = 'playing';
          }
        }
      );
      break;
    }
  }
}

function _markRoomDone(roomId) {
  if (!gameState.roomsDone.includes(roomId)) {
    gameState.roomsDone.push(roomId);
  }
  gameState.exitUnlocked = gameState.roomsDone.length >= CONFIG.challenge.gateScore;
}

function checkExitTrigger() {
  if (!gameState.exitUnlocked) return;

  const { x, y } = gameState.player;
  const ez = CONFIG.EXIT_ZONE;

  if (x >= ez.x && x <= ez.x + ez.w && y >= ez.y && y <= ez.y + ez.h) {
    _completeLevel();
  }
}

// ── Fin de niveau ─────────────────────────────────────────────────

function _completeLevel() {
  gameState.phase = 'levelcomplete';
  gameState.running = false;

  // Sauvegarde la progression
  const lvlNum = gameState.currentLevel;
  if (!currentProgress.levels[lvlNum]) currentProgress.levels[lvlNum] = {};
  currentProgress.levels[lvlNum].completed = true;
  currentProgress.levels[lvlNum].score     = gameState.roomsDone.length;
  currentProgress.levels[lvlNum].roomsDone = [...gameState.roomsDone];

  // Avance au niveau suivant si c'est le plus haut atteint
  if (lvlNum >= currentProgress.currentLevel && lvlNum < 20) {
    currentProgress.currentLevel = lvlNum + 1;
  }
  saveSystem.saveProgress(currentProgress);

  // Vérifie les nouveaux cosmétiques
  const newCosmetics = rpgSystem.checkUnlocks(currentProfile);
  saveSystem.saveProfile(currentProfile);

  if (lvlNum >= 20) {
    uiSystem.showGameComplete();
  } else {
    uiSystem.showLevelComplete(gameState.roomsDone, newCosmetics);
  }
}

function _saveLevelProgress() {
  const lvlNum = gameState.currentLevel;
  if (!currentProgress.levels[lvlNum]) currentProgress.levels[lvlNum] = {};
  currentProgress.levels[lvlNum].roomsDone = [...gameState.roomsDone];
  currentProgress.levels[lvlNum].score     = gameState.roomsDone.length;
  saveSystem.saveProgress(currentProgress);
}

function nextLevel() {
  gameState.currentLevel++;
  if (gameState.currentLevel > 20) gameState.currentLevel = 20;
  // Return to world map to choose next level
  showWorldMap();
}

// ── Init au chargement ────────────────────────────────────────────

window.addEventListener('load', () => {
  // Charge les données sauvegardées
  currentProfile  = saveSystem.loadProfile();
  currentProgress = saveSystem.loadProgress();

  // Init des systèmes
  inputSystem.init();
  worldSystem.init();
  speechSystem.init();
  uiSystem.init();

  // World map keyboard navigation
  document.addEventListener('keydown', handleWorldMapInput);

  // Affiche le menu
  uiSystem.showMenu();

  // Déverrouille AudioContext ET speechSynthesis sur premier clic utilisateur
  document.addEventListener('click', () => {
    audioSystem._resume();
    speechSystem._warmUp();
  }, { once: true });

  console.log('[Licorne RPG] Prêt ! 🦄');
});
