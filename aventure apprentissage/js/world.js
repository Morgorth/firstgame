// world.js — Rendu canvas du monde top-down

const worldSystem = {
  canvas: null,
  ctx: null,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) {
      console.error('Canvas #gameCanvas introuvable !');
      return;
    }
    this.canvas.width  = CONFIG.canvas.width;
    this.canvas.height = CONFIG.canvas.height;
    this.ctx = this.canvas.getContext('2d');
  },

  render(gs) {
    const ctx = this.ctx;
    if (!ctx) return;

    const lvl   = gs.currentLevel;
    const theme = CONFIG.THEMES[lvl] || CONFIG.THEMES[1];

    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    // 1. Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    // Déco étoiles de fond
    this._drawStars(ctx, gs.frameCount);

    // 2. Corridors
    ctx.fillStyle = theme.corridor;
    for (const c of CONFIG.CORRIDORS) {
      ctx.fillRect(c.x, c.y, c.w, c.h);
    }

    // Couloir de sortie (toujours visible)
    ctx.fillStyle = theme.corridor;
    ctx.fillRect(CONFIG.EXIT_CORRIDOR.x, CONFIG.EXIT_CORRIDOR.y,
                 CONFIG.EXIT_CORRIDOR.w, CONFIG.EXIT_CORRIDOR.h);

    // 3. Salles
    for (let i = 0; i < CONFIG.ROOMS.length; i++) {
      this._drawRoom(ctx, gs, i, theme);
    }

    // 4. Porte de sortie
    this._drawExit(ctx, gs, theme);

    // 5. Animation pulse des zones challenge non complétées
    this._drawChallengePulse(ctx, gs);

    // 6. Joueur
    this._drawPlayer(ctx, gs);

    // 7. HUD
    this._drawHUD(ctx, gs, theme);
  },

  _drawStars(ctx, frame) {
    // Étoiles fixes (seed déterministe)
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const rng = _seededRNG(42);
    for (let i = 0; i < 30; i++) {
      const x = rng() * 900;
      const y = rng() * 620;
      const r = rng() * 2 + 1;
      const pulse = 0.4 + 0.6 * Math.sin(frame * 0.02 + i * 0.7);
      ctx.globalAlpha = pulse * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  _drawRoom(ctx, gs, i, theme) {
    const room     = CONFIG.ROOMS[i];
    const isDone   = gs.roomsDone.includes(i);
    const isNear   = this._isPlayerNear(gs, room);

    // Couleur de la salle
    let roomColor = theme.room;
    if (isDone)  roomColor = _lighten(theme.room, 0.3);
    if (isNear)  roomColor = _lighten(theme.room, 0.15);

    // Fond
    ctx.fillStyle = roomColor;
    ctx.beginPath();
    _roundRect(ctx, room.x, room.y, room.w, room.h, 12);
    ctx.fill();

    // Bordure
    ctx.strokeStyle = isDone ? '#4caf50' : theme.wall;
    ctx.lineWidth   = isDone ? 3 : 2;
    ctx.stroke();

    // Nom de la salle
    ctx.fillStyle = '#333';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(CONFIG.ROOM_NAMES[i], room.x + room.w / 2, room.y + 22);

    // Icône statut
    const icon = isDone ? '✅' : '⭐';
    ctx.font = '22px system-ui';
    ctx.fillText(icon, room.x + room.w / 2, room.y + room.h / 2 + 8);
  },

  _drawExit(ctx, gs, theme) {
    const exitUnlocked = gs.roomsDone.length >= CONFIG.challenge.gateScore;
    const ez = CONFIG.EXIT_ZONE;

    ctx.fillStyle = exitUnlocked ? '#fff9c4' : '#e0e0e0';
    ctx.strokeStyle = exitUnlocked ? '#ffd600' : '#9e9e9e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    _roundRect(ctx, ez.x, ez.y, ez.w, ez.h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = '28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(exitUnlocked ? '🚪' : '🔒', ez.x + ez.w / 2, ez.y + ez.h / 2 + 10);

    if (!exitUnlocked) {
      ctx.font = 'bold 10px system-ui';
      ctx.fillStyle = '#757575';
      ctx.fillText(`${gs.roomsDone.length}/5`, ez.x + ez.w / 2, ez.y + ez.h - 4);
    }
  },

  _drawChallengePulse(ctx, gs) {
    for (let i = 0; i < CONFIG.ROOMS.length; i++) {
      if (gs.roomsDone.includes(i)) continue;
      const room  = CONFIG.ROOMS[i];
      const pulse = 0.5 + 0.5 * Math.sin(gs.frameCount * 0.06 + i);
      const radius= 14 + pulse * 8;

      ctx.save();
      ctx.globalAlpha = 0.25 * pulse;
      ctx.beginPath();
      ctx.arc(room.cx, room.cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#e040fb';
      ctx.fill();
      ctx.restore();
    }
  },

  _drawPlayer(ctx, gs) {
    const { x, y } = gs.player;
    const r = CONFIG.player.radius;

    // Ombre
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.ellipse(x, y + r - 4, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Corps principal
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, '#f48fb1');
    grad.addColorStop(1, CONFIG.player.color);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#ad1457';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Yeux expressifs
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x - 5, y - 4, 4, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 5, y - 4, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - 5, y - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Brillance pupille
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 4, y - 5, 1, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Couronne si équipée
    if (gs.player.cosmetics && gs.player.cosmetics.avatar === 'couronne') {
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('👑', x, y - r - 2);
    }

    // Corne de licorne (toujours visible)
    ctx.save();
    ctx.translate(x, y - r);
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-5, 2);
    ctx.lineTo(5, 2);
    ctx.closePath();
    const hornGrad = ctx.createLinearGradient(0, -14, 0, 2);
    hornGrad.addColorStop(0, '#fff9c4');
    hornGrad.addColorStop(1, '#ffd600');
    ctx.fillStyle = hornGrad;
    ctx.fill();
    ctx.restore();
  },

  _drawHUD(ctx, gs, theme) {
    // Bande HUD en bas
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, CONFIG.canvas.height - 36, CONFIG.canvas.width, 36);

    ctx.fillStyle = '#fff';
    ctx.font      = 'bold 14px system-ui';
    ctx.textAlign = 'left';

    const name = currentProfile ? currentProfile.name : 'Aventurier';
    ctx.fillText(`🦄 ${name}`, 12, CONFIG.canvas.height - 12);

    ctx.textAlign = 'center';
    ctx.fillText(`Niveau ${gs.currentLevel}/20`, CONFIG.canvas.width / 2, CONFIG.canvas.height - 12);

    ctx.textAlign = 'right';
    const roomsLeft = CONFIG.challenge.gateScore - gs.roomsDone.length;
    if (roomsLeft > 0) {
      ctx.fillText(`Salles : ${gs.roomsDone.length}/5 🔒`, CONFIG.canvas.width - 12, CONFIG.canvas.height - 12);
    } else {
      ctx.fillText(`Sortie déverrouillée ! 🚪`, CONFIG.canvas.width - 12, CONFIG.canvas.height - 12);
    }

    // Stats RPG mini
    if (currentProfile && currentProfile.stats) {
      const s = currentProfile.stats;
      ctx.textAlign = 'left';
      ctx.font = '11px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`📖${s.lecture} ➕${s.calcul} 🇬🇧${s.anglais}`, 12, CONFIG.canvas.height - 42);
    }
  },

  _isPlayerNear(gs, room) {
    const { x, y } = gs.player;
    return x > room.x - 10 && x < room.x + room.w + 10 &&
           y > room.y - 10 && y < room.y + room.h + 10;
  },
};

// ── Utilitaires de dessin ─────────────────────────────────────────

function _roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function _lighten(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const toHex = (n) => Math.min(255, Math.round(n + (255 - n) * amount)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Générateur pseudo-aléatoire déterministe (seed)
function _seededRNG(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
