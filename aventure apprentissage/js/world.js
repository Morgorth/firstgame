// world.js — Rendu canvas du monde château-licorne (inspiré du château magique)

const worldSystem = {
  canvas: null,
  ctx: null,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    if (!this.canvas) { console.error('Canvas #gameCanvas introuvable !'); return; }
    this.canvas.width  = CONFIG.canvas.width;
    this.canvas.height = CONFIG.canvas.height;
    this.ctx = this.canvas.getContext('2d');
  },

  // Returns the current world config for the active level
  getCurrentWorld() {
    for (const w of CONFIG.WORLDS) {
      if (w.levels.includes(gameState.currentLevel)) return w;
    }
    return CONFIG.WORLDS[0];
  },

  // Returns the world theme id ('forest','beach','city','castle') for a level
  getWorldTheme(levelNum) {
    if (levelNum <= 5)  return 'forest';
    if (levelNum <= 10) return 'beach';
    if (levelNum <= 15) return 'city';
    return 'castle';
  },

  render(gs) {
    const ctx = this.ctx;
    if (!ctx) return;

    // World map phase — render the overworld map instead
    if (gs.phase === 'worldmap') {
      this.renderWorldMap(gs);
      return;
    }

    // darkLevel: 0 = fully dark (start), 1 = fully bright (all challenges won)
    const darkLevel = Math.min(1, gs.roomsDone.length / CONFIG.ROOMS.length);
    const theme = this.getWorldTheme(gs.currentLevel);

    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    // 1. Themed background (sky + terrain + buildings)
    if (theme === 'forest') {
      this._drawForestBg(ctx, gs.frameCount, darkLevel, gs.currentLevel);
    } else if (theme === 'beach') {
      this._drawBeachBg(ctx, gs.frameCount, darkLevel, gs.currentLevel);
    } else if (theme === 'city') {
      this._drawCityBg(ctx, gs.frameCount, darkLevel, gs.currentLevel);
    } else {
      // Castle — original background
      this._drawSky(ctx, gs.frameCount, darkLevel);
      this._drawMountains(ctx, darkLevel);
      this._drawGround(ctx, darkLevel);
      this._drawPaths(ctx);
      this._drawBackTrees(ctx, gs.frameCount);
      this._drawLeftDome(ctx, gs.frameCount);
      this._drawRightConservatory(ctx, gs.frameCount);
      this._drawGardenPavilion(ctx, 55, 345, 'left', gs.frameCount);
      this._drawGardenPavilion(ctx, 725, 345, 'right', gs.frameCount);
      this._drawFountain(ctx, gs.frameCount);
      this._drawMainCastle(ctx, gs.frameCount);
      this._drawFrontTrees(ctx, gs.frameCount);
      this._drawDecorations(ctx, gs.frameCount);
      this._drawDarkOverlay(ctx, darkLevel);
      this._drawWolves(ctx, gs.frameCount, darkLevel);
      this._drawBats(ctx, gs.frameCount, darkLevel);
    }
    // 11. Pulse des épreuves non complétées
    this._drawChallengePulse(ctx, gs);
    // 12. Marqueurs flottants (toujours bien visibles)
    this._drawChallengeMarkers(ctx, gs);
    // 13. Portail de sortie
    this._drawExit(ctx, gs);
    // 14. Joueur
    this._drawPlayer(ctx, gs);
    // 15. Notifications XP flottantes
    this._drawFloatingXP(ctx, gs);
    // 16. HUD
    this._drawHUD(ctx, gs);
  },

  // ── Ciel ────────────────────────────────────────────────────────

  _drawSky(ctx, frame, darkLevel) {
    // Ciel de nuit
    const nightGrad = ctx.createLinearGradient(0, 0, 0, 260);
    nightGrad.addColorStop(0,   '#050010');
    nightGrad.addColorStop(0.5, '#0D0825');
    nightGrad.addColorStop(1,   '#1A103A');
    ctx.fillStyle = nightGrad;
    ctx.fillRect(0, 0, 900, 260);

    // Étoiles (visibles quand sombre)
    if (darkLevel < 0.95) {
      this._drawStars(ctx, frame, 1 - darkLevel);
    }

    // Lune (visible quand sombre)
    if (darkLevel < 0.8) {
      const moonAlpha = Math.min(1, (1 - darkLevel) * 1.5);
      ctx.save();
      ctx.globalAlpha = moonAlpha;
      // Halo de lune
      const moonGlow = ctx.createRadialGradient(780, 55, 0, 780, 55, 55);
      moonGlow.addColorStop(0, 'rgba(255,255,200,0.25)');
      moonGlow.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(780, 55, 55, 0, Math.PI * 2);
      ctx.fill();
      // Corps de la lune
      ctx.fillStyle = '#F8F4CC';
      ctx.beginPath();
      ctx.arc(780, 55, 22, 0, Math.PI * 2);
      ctx.fill();
      // Ombre (forme de croissant)
      ctx.fillStyle = '#0D0825';
      ctx.beginPath();
      ctx.arc(791, 49, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Ciel de jour superposé (s'intensifie avec darkLevel)
    if (darkLevel > 0) {
      ctx.save();
      ctx.globalAlpha = darkLevel;
      const dayGrad = ctx.createLinearGradient(0, 0, 0, 260);
      dayGrad.addColorStop(0,   '#5BA8E0');
      dayGrad.addColorStop(0.5, '#90C8F0');
      dayGrad.addColorStop(1,   '#C8E8FB');
      ctx.fillStyle = dayGrad;
      ctx.fillRect(0, 0, 900, 260);

      // Nuages animés (visibles seulement de jour)
      const cx1 = ((frame * 0.15) % 1050) - 120;
      const cx2 = ((frame * 0.09) % 1050) + 180;
      const cx3 = ((frame * 0.12) % 1050) + 520;
      this._drawCloud(ctx, cx1, 35, 130, 48);
      this._drawCloud(ctx, cx2, 65, 95, 38);
      this._drawCloud(ctx, cx3, 28, 110, 44);
      this._drawCloud(ctx, ((frame * 0.07) % 1050) + 680, 75, 85, 32);
      ctx.restore();
    }

    // Oiseaux de jour (seulement quand assez clair)
    if (darkLevel > 0.3) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (darkLevel - 0.3) * 1.4);
      ctx.strokeStyle = '#3A7AB8';
      ctx.lineWidth = 1.5;
      const bOff = (frame * 0.45) % 950;
      for (let i = 0; i < 5; i++) {
        const bx = (bOff + i * 70) % 940;
        const by = 40 + i * 10 + Math.sin(frame * 0.05 + i) * 5;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + 7, by - 5, bx + 14, by);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx + 14, by);
        ctx.quadraticCurveTo(bx + 21, by - 5, bx + 28, by);
        ctx.stroke();
      }
      ctx.restore();
    }
  },

  _drawStars(ctx, frame, intensity) {
    ctx.save();
    const rng = _seededRNG(42);
    for (let i = 0; i < 60; i++) {
      const sx = rng() * 900;
      const sy = rng() * 200;
      const twinkle = 0.4 + 0.6 * Math.sin(frame * 0.04 + i * 1.3);
      ctx.globalAlpha = intensity * twinkle * 0.9;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(sx, sy, rng() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  _drawCloud(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5,  y + h * 0.62, w * 0.48, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.28, y + h * 0.42, w * 0.30, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.68, y + h * 0.44, w * 0.27, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  // ── Montagnes ───────────────────────────────────────────────────

  _drawMountains(ctx, darkLevel) {
    const t = darkLevel;
    // Rangée arrière : interpolation nuit (gris très sombre) → jour (bleu-gris)
    ctx.fillStyle = _lerpColorRGB([22, 18, 40], [139, 175, 197], t);
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.lineTo(100, 130); ctx.lineTo(230, 165); ctx.lineTo(370, 105);
    ctx.lineTo(490, 145); ctx.lineTo(610, 92);  ctx.lineTo(745, 128);
    ctx.lineTo(900, 112); ctx.lineTo(900, 240); ctx.lineTo(0, 240);
    ctx.closePath();
    ctx.fill();

    // Rangée avant
    ctx.fillStyle = _lerpColorRGB([14, 10, 28], [106, 152, 175], t);
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.lineTo(75, 178); ctx.lineTo(175, 205); ctx.lineTo(310, 155);
    ctx.lineTo(410, 188); ctx.lineTo(545, 158); ctx.lineTo(675, 182);
    ctx.lineTo(815, 162); ctx.lineTo(900, 188); ctx.lineTo(900, 265);
    ctx.lineTo(0, 265);
    ctx.closePath();
    ctx.fill();

    // Neige sur les pics (visible même la nuit, légèrement)
    ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.35 * t})`;
    for (const [px, py] of [[100,130],[370,105],[610,92],[815,162]]) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 20, py + 28);
      ctx.lineTo(px + 20, py + 28);
      ctx.closePath();
      ctx.fill();
    }
  },

  // ── Sol ─────────────────────────────────────────────────────────

  _drawGround(ctx, darkLevel) {
    const t = darkLevel;
    const grad = ctx.createLinearGradient(0, 248, 0, 585);
    grad.addColorStop(0,    _lerpColorRGB([8, 18, 8],   [72, 160, 60],  t));
    grad.addColorStop(0.35, _lerpColorRGB([12, 24, 10], [88, 178, 72],  t));
    grad.addColorStop(1,    _lerpColorRGB([16, 28, 12], [102, 192, 84], t));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 248, 900, 337);

    // Légères collines
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.ellipse(160, 262, 190, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(740, 268, 175, 32, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  // ── Allées ──────────────────────────────────────────────────────

  _drawPaths(ctx) {
    ctx.fillStyle = '#C8B480';

    // Grande allée centrale montante vers le château
    ctx.beginPath();
    ctx.moveTo(395, 585);
    ctx.lineTo(370, 320);
    ctx.lineTo(530, 320);
    ctx.lineTo(505, 585);
    ctx.fill();

    // Allée vers aile gauche
    ctx.beginPath();
    ctx.moveTo(378, 365);
    ctx.lineTo(205, 305);
    ctx.lineTo(210, 290);
    ctx.lineTo(385, 350);
    ctx.fill();

    // Allée vers aile droite
    ctx.beginPath();
    ctx.moveTo(522, 365);
    ctx.lineTo(695, 305);
    ctx.lineTo(700, 290);
    ctx.lineTo(527, 350);
    ctx.fill();

    // Allée vers pavillon gauche
    ctx.beginPath();
    ctx.moveTo(378, 435);
    ctx.lineTo(200, 425);
    ctx.lineTo(200, 410);
    ctx.lineTo(380, 420);
    ctx.fill();

    // Allée vers pavillon droit
    ctx.beginPath();
    ctx.moveTo(522, 435);
    ctx.lineTo(700, 425);
    ctx.lineTo(700, 410);
    ctx.lineTo(520, 420);
    ctx.fill();

    // Bord de l'allée (ombre)
    ctx.fillStyle = 'rgba(100,80,30,0.18)';
    ctx.fillRect(395, 320, 110, 265);

    // Marches de l'escalier (4 marches)
    ctx.fillStyle = '#B8A070';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(412 + i * 8, 462 + i * 8, 76 - i * 16, 5);
    }

    // Bordures des allées (pavés)
    ctx.strokeStyle = 'rgba(160,130,60,0.4)';
    ctx.lineWidth = 1;
    for (let y = 330; y < 585; y += 22) {
      ctx.beginPath();
      ctx.moveTo(397, y);
      ctx.lineTo(503, y);
      ctx.stroke();
    }
  },

  // ── Château central ─────────────────────────────────────────────

  _drawMainCastle(ctx, frame) {
    // ── Corps principal du château ──
    const bodyGrad = ctx.createLinearGradient(305, 155, 595, 295);
    bodyGrad.addColorStop(0, '#F2E8F8');
    bodyGrad.addColorStop(0.5, '#FDFAFF');
    bodyGrad.addColorStop(1, '#E0D0EC');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    _roundRect(ctx, 305, 155, 290, 140, 8);
    ctx.fill();
    ctx.strokeStyle = '#C0A0D0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grandes fenêtres en arc sur le corps
    ctx.fillStyle = '#B0CCEC';
    ctx.strokeStyle = '#9080B8';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const wx = 325 + i * 52;
      ctx.beginPath();
      ctx.rect(wx, 178, 24, 44);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wx + 12, 178, 12, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
    }

    // Frise décorative sur le corps
    ctx.strokeStyle = '#D0B0E0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(305, 170);
    ctx.lineTo(595, 170);
    ctx.stroke();

    // ── Tours latérales ──
    this._drawTower(ctx, 278, 115, 82, 175, '#EEE2F6', '#C090D8', false, frame);
    this._drawTower(ctx, 540, 115, 82, 175, '#EEE2F6', '#C090D8', false, frame);

    // ── Tour centrale principale (haute, avec flèche illuminée) ──
    this._drawTower(ctx, 390, 50, 120, 220, '#F4ECF8', '#D0A0E8', true, frame);

    // ── Grande arche d'entrée ──
    ctx.fillStyle = '#1A0A2A';
    ctx.beginPath();
    ctx.rect(422, 245, 56, 50);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(450, 245, 28, Math.PI, 0);
    ctx.fill();

    // Herse / grille (si sortie non ouverte)
    ctx.strokeStyle = '#8060A0';
    ctx.lineWidth = 2;
    for (let g = 0; g < 4; g++) {
      ctx.beginPath();
      ctx.moveTo(428 + g * 12, 248);
      ctx.lineTo(428 + g * 12, 294);
      ctx.stroke();
    }

    // Rosette décorative au-dessus de l'entrée
    ctx.strokeStyle = '#E0C0F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(450, 205, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#D4A8E0';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(450, 205, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Bannières / oriflammes animées
    const bannerPositions = [318, 445, 545, 605];
    for (let b = 0; b < bannerPositions.length; b++) {
      const bx = bannerPositions[b];
      const by = b < 2 ? 108 : 112;
      const wave = Math.sin(frame * 0.06 + b * 1.2) * 4;
      ctx.fillStyle = b % 2 === 0 ? '#E040FB' : '#9C27B0';
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 20, by + 4 + wave);
      ctx.lineTo(bx, by + 16);
      ctx.closePath();
      ctx.fill();
    }

    // Escalier d'entrée (base)
    const stairGrad = ctx.createLinearGradient(390, 290, 510, 320);
    stairGrad.addColorStop(0, '#D8C8A0');
    stairGrad.addColorStop(1, '#C0B080');
    ctx.fillStyle = stairGrad;
    ctx.beginPath();
    ctx.moveTo(395, 295);
    ctx.lineTo(380, 320);
    ctx.lineTo(520, 320);
    ctx.lineTo(505, 295);
    ctx.fill();
    ctx.strokeStyle = '#A89060';
    ctx.lineWidth = 1;
    ctx.stroke();
  },

  _drawTower(ctx, x, y, w, h, wallColor, domeColor, hasSpire, frame) {
    const cx = x + w / 2;

    // Corps de la tour
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, wallColor);
    grad.addColorStop(0.45, '#FFFFFF');
    grad.addColorStop(1, wallColor);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#C0A0D0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    // Fenêtres en arc
    ctx.fillStyle = '#A8C8E8';
    ctx.strokeStyle = '#8070A8';
    ctx.lineWidth = 1;
    const rows = hasSpire ? 4 : 3;
    for (let row = 0; row < rows; row++) {
      const wy = y + 18 + row * 38;
      if (wy + 24 > y + h) break;
      ctx.beginPath();
      ctx.rect(cx - 9, wy, 18, 24);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, wy, 9, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
    }

    // Dôme
    const dR = w / 2;
    const dGrad = ctx.createRadialGradient(cx - dR * 0.3, y - dR * 0.2, 2, cx, y, dR);
    dGrad.addColorStop(0, '#F4DCF8');
    dGrad.addColorStop(0.5, domeColor);
    dGrad.addColorStop(1, '#7840A0');
    ctx.fillStyle = dGrad;
    ctx.beginPath();
    ctx.arc(cx, y, dR, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#8050A8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (hasSpire) {
      // Flèche principale
      ctx.fillStyle = '#C890E0';
      ctx.beginPath();
      ctx.moveTo(cx, y - dR * 2.4);
      ctx.lineTo(cx - dR * 0.28, y - dR * 0.55);
      ctx.lineTo(cx + dR * 0.28, y - dR * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9050B8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Lueur bleue magique animée au sommet
      const t = frame * 0.04;
      const glowA = 0.55 + 0.45 * Math.sin(t);
      const glowR = ctx.createRadialGradient(cx, y - dR * 2.4, 0, cx, y - dR * 2.4, 22);
      glowR.addColorStop(0, `rgba(140,180,255,${glowA})`);
      glowR.addColorStop(0.5, `rgba(100,140,255,${glowA * 0.55})`);
      glowR.addColorStop(1, 'rgba(80,120,255,0)');
      ctx.fillStyle = glowR;
      ctx.beginPath();
      ctx.arc(cx, y - dR * 2.4, 22, 0, Math.PI * 2);
      ctx.fill();

      // Étoile cristal au sommet
      ctx.fillStyle = '#E8F0FF';
      ctx.beginPath();
      ctx.arc(cx, y - dR * 2.4, 5, 0, Math.PI * 2);
      ctx.fill();

      // Rayons scintillants
      ctx.strokeStyle = `rgba(200,220,255,${0.4 + 0.3 * Math.sin(t * 1.5)})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 6,  y - dR * 2.4 + Math.sin(a) * 6);
        ctx.lineTo(cx + Math.cos(a) * 16, y - dR * 2.4 + Math.sin(a) * 16);
        ctx.stroke();
      }
    } else {
      // Petite boule dorée sur les tours secondaires
      ctx.fillStyle = '#F0D040';
      ctx.strokeStyle = '#C0A000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, y - dR, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  },

  // ── Aile gauche — Dôme ──────────────────────────────────────────

  _drawLeftDome(ctx, frame) {
    const x = 40, y = 170, w = 155, h = 120, cx = x + w / 2;

    const wallGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    wallGrad.addColorStop(0, '#F6EEF8');
    wallGrad.addColorStop(1, '#DDD0EC');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    _roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = '#C0A0D0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fenêtres
    ctx.fillStyle = '#B8D4F4';
    ctx.strokeStyle = '#8888B8';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const wx = x + 16 + i * 44;
      ctx.beginPath();
      ctx.rect(wx, y + 38, 24, 38);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(wx + 12, y + 38, 12, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
    }

    // Grand dôme rose-mauve
    const dR = w * 0.47;
    const dGrad = ctx.createRadialGradient(cx - 22, y - 20, 4, cx, y, dR);
    dGrad.addColorStop(0, '#F8E0FC');
    dGrad.addColorStop(0.45, '#D090D0');
    dGrad.addColorStop(1, '#7A4888');
    ctx.fillStyle = dGrad;
    ctx.beginPath();
    ctx.arc(cx, y, dR, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#7A4888';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nervures du dôme
    ctx.strokeStyle = 'rgba(200,160,220,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + Math.cos(a) * dR, y + Math.sin(a) * dR * 0.2);
      ctx.stroke();
    }

    // Boule dorée sur le dôme
    ctx.fillStyle = '#F0D840';
    ctx.strokeStyle = '#C0A000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, y - dR, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Entrée voûtée
    ctx.fillStyle = '#1A0828';
    ctx.beginPath();
    ctx.rect(cx - 20, y + h - 42, 40, 42);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, y + h - 42, 20, Math.PI, 0);
    ctx.fill();
  },

  // ── Aile droite — Conservatoire ─────────────────────────────────

  _drawRightConservatory(ctx, frame) {
    const x = 705, y = 170, w = 155, h = 120, cx = x + w / 2;

    const wallGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    wallGrad.addColorStop(0, '#EAF4F6');
    wallGrad.addColorStop(1, '#D0E4EC');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    _roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = '#A0B8C8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vitraux colorés (4 fenêtres arc-en-ciel)
    const glassC = ['#FFAAC0', '#A8C8FF', '#B0F0A8', '#FFE8A0'];
    for (let i = 0; i < 4; i++) {
      const wx = x + 10 + i * 34;
      ctx.fillStyle = glassC[i];
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.rect(wx, y + 38, 22, 40);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx + 11, y + 38, 11, Math.PI, 0);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#7898A8';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Toit en arc de verre (conservatoire)
    ctx.fillStyle = 'rgba(150,210,230,0.52)';
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 2);
    ctx.bezierCurveTo(x + w / 4, y - 45, x + 3 * w / 4, y - 45, x + w + 5, y + 2);
    ctx.lineTo(x + w + 5, y + 8);
    ctx.bezierCurveTo(x + 3 * w / 4, y - 38, x + w / 4, y - 38, x - 5, y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#70A8C0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Reflet sur le verre
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 28, y - 4);
    ctx.bezierCurveTo(x + w / 3, y - 30, x + 2 * w / 3, y - 30, x + w - 28, y - 4);
    ctx.stroke();

    // Entrée voûtée
    ctx.fillStyle = '#0A1820';
    ctx.beginPath();
    ctx.rect(cx - 20, y + h - 42, 40, 42);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, y + h - 42, 20, Math.PI, 0);
    ctx.fill();
  },

  // ── Pavillons de jardin ─────────────────────────────────────────

  _drawGardenPavilion(ctx, x, y, side, frame) {
    const w = 125, h = 105, cx = x + w / 2;

    // Corps
    const wallGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    wallGrad.addColorStop(0, '#FAF0FC');
    wallGrad.addColorStop(1, '#ECD8F4');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    _roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#C0A0D0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fenêtre centrale
    ctx.fillStyle = '#B8D4F0';
    ctx.strokeStyle = '#8080B0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(cx - 16, y + 28, 32, 38);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y + 28, 16, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Toit à pignon
    const roofColor = side === 'left' ? '#C898D8' : '#98B8D8';
    const roofStroke = side === 'left' ? '#8848A0' : '#5878A0';
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(cx, y - 38);
    ctx.lineTo(x + w + 12, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = roofStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Boule décorative au sommet du toit
    ctx.fillStyle = '#F0D840';
    ctx.strokeStyle = '#C0A000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, y - 38, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Porte
    ctx.fillStyle = '#2A1828';
    ctx.beginPath();
    ctx.rect(cx - 18, y + h - 38, 36, 38);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, y + h - 38, 18, Math.PI, 0);
    ctx.fill();

    // Vignette florale sur le mur
    ctx.strokeStyle = side === 'left' ? 'rgba(220,160,240,0.5)' : 'rgba(160,200,240,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(x + 15 + i * 15, y + 12, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + 22 + i * 15, y + 12, 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  // ── Fontaine centrale ────────────────────────────────────────────

  _drawFountain(ctx, frame) {
    const cx = 450, cy = 440;

    // Bassin extérieur (ellipse)
    ctx.fillStyle = '#A8C8E8';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 18, 62, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7898B8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eau / reflets ondes
    ctx.strokeStyle = 'rgba(200,230,255,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const t = frame * 0.035 + i * 1.4;
      const rr = 14 + i * 17 + Math.sin(t) * 3;
      ctx.globalAlpha = 0.5 - i * 0.14;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 18, rr, rr * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Piédestal
    ctx.fillStyle = '#DDD0F0';
    ctx.beginPath();
    ctx.rect(cx - 12, cy - 14, 24, 32);
    ctx.fill();
    ctx.strokeStyle = '#C0A8D8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Statue licorne (simplifiée)
    ctx.fillStyle = '#F8F2FC';
    ctx.strokeStyle = '#C8A8E0';
    ctx.lineWidth = 1.5;
    // Corps
    ctx.beginPath();
    ctx.ellipse(cx, cy - 24, 14, 9, -0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Tête
    ctx.beginPath();
    ctx.arc(cx + 11, cy - 32, 8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Pattes
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 16); ctx.lineTo(cx - 8, cy - 4);
    ctx.moveTo(cx + 2, cy - 16); ctx.lineTo(cx + 0, cy - 4);
    ctx.strokeStyle = '#C0A0D8';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Corne
    ctx.fillStyle = '#F8E040';
    ctx.beginPath();
    ctx.moveTo(cx + 17, cy - 40);
    ctx.lineTo(cx + 14, cy - 31);
    ctx.lineTo(cx + 20, cy - 31);
    ctx.closePath();
    ctx.fill();
    // Queue
    ctx.strokeStyle = '#E080F8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 22);
    ctx.bezierCurveTo(cx - 22, cy - 30, cx - 24, cy - 18, cx - 18, cy - 12);
    ctx.stroke();

    // Jets d'eau paraboliques (4 arcs)
    ctx.strokeStyle = 'rgba(150,200,240,0.72)';
    ctx.lineWidth = 2;
    for (let j = 0; j < 4; j++) {
      const a = (j / 4) * Math.PI * 2 + frame * 0.018;
      const sx = cx + Math.cos(a) * 9;
      const sy = cy - 15;
      const tx = cx + Math.cos(a) * 52;
      const ty = cy + 14;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + Math.cos(a) * 28, sy - 22, tx, ty);
      ctx.stroke();
    }
  },

  // ── Arbres ──────────────────────────────────────────────────────

  _drawBackTrees(ctx, frame) {
    // Rangée derrière les bâtiments
    for (const [tx, ty, r] of [
      [30, 228, 28], [155, 218, 32], [330, 220, 26],
      [570, 220, 26], [745, 218, 30], [865, 228, 26],
    ]) {
      this._drawBlossomTree(ctx, tx, ty, r, frame, 0.7);
    }
  },

  _drawFrontTrees(ctx, frame) {
    // Cerisiers dans les jardins
    for (let i = 0; i < 8; i++) {
      const positions = [
        [28,  395, 26], [222, 378, 24], [348, 502, 25], [562, 502, 25],
        [678, 378, 24], [872, 395, 26], [155, 495, 22], [745, 495, 22],
      ];
      const [tx, ty, r] = positions[i];
      this._drawBlossomTree(ctx, tx, ty, r, frame, 1.0);
    }

    // Saules pleureurs aux coins
    this._drawWillowTree(ctx, 0,   428, frame);
    this._drawWillowTree(ctx, 858, 428, frame);
  },

  _drawBlossomTree(ctx, x, y, r, frame, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Tronc
    ctx.fillStyle = '#8B6040';
    ctx.beginPath();
    ctx.rect(x - 5, y, 10, 42);
    ctx.fill();

    // Branches (plusieurs cercles rose cerisier)
    const cols = ['#FFB7C5', '#FF9AB5', '#FFCCD8', '#FF88A8'];
    for (let i = 0; i < 5; i++) {
      const bx = x + Math.cos(i * 1.26) * r * 0.55;
      const by = y - r * 0.35 + Math.sin(i * 1.26) * r * 0.48;
      const br = r * (0.68 + i * 0.05);
      const g = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, br);
      g.addColorStop(0, cols[i % cols.length]);
      g.addColorStop(1, 'rgba(255,180,200,0.25)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pétales tombants
    const rng = _seededRNG(x * 37 + y * 13);
    for (let p = 0; p < 7; p++) {
      const px = x + (rng() - 0.5) * r * 2.6;
      const py = y + ((frame * 0.5 + p * 15 + rng() * 20) % 45);
      const fa = 0.65 - py / 65;
      if (fa <= 0) continue;
      ctx.fillStyle = '#FFB7C5';
      ctx.globalAlpha = alpha * fa;
      ctx.beginPath();
      ctx.ellipse(px, py, 3, 2, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  },

  _drawWillowTree(ctx, x, y, frame) {
    ctx.save();
    // Feuillage haut
    ctx.fillStyle = '#A0C848';
    ctx.beginPath();
    ctx.arc(x + 22, y - 32, 30, 0, Math.PI * 2);
    ctx.fill();

    // Tronc
    ctx.fillStyle = '#7A5030';
    ctx.beginPath();
    ctx.rect(x + 16, y - 18, 12, 62);
    ctx.fill();

    // Branches retombantes
    ctx.strokeStyle = '#C0D870';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 9; i++) {
      const bx = x + 6 + i * 8;
      const wave = Math.sin(frame * 0.025 + i * 0.55) * 9;
      ctx.beginPath();
      ctx.moveTo(bx, y - 12);
      ctx.bezierCurveTo(bx + wave, y + 12, bx + wave * 1.6, y + 35, bx + wave * 2.2, y + 62);
      ctx.stroke();
    }
    ctx.restore();
  },

  // ── Décorations ─────────────────────────────────────────────────

  _drawDecorations(ctx, frame) {
    // Haies taillées en topiaire
    for (const [hx, hy, hw, hh] of [
      [278, 395, 88, 22], [534, 395, 88, 22],
      [204, 462, 62, 18], [634, 462, 62, 18],
    ]) {
      const g = ctx.createLinearGradient(hx, hy, hx, hy + hh);
      g.addColorStop(0, '#2C8018');
      g.addColorStop(1, '#1A5810');
      ctx.fillStyle = g;
      ctx.beginPath();
      _roundRect(ctx, hx, hy, hw, hh, 10);
      ctx.fill();
      ctx.strokeStyle = '#145008';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Fleurs décoratives sur haie
      ctx.fillStyle = '#FFEE30';
      for (let f = 0; f < 5; f++) {
        ctx.beginPath();
        ctx.arc(hx + 10 + f * (hw - 20) / 4, hy + hh / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Parterres de fleurs
    for (const [fbx, fby] of [[315, 505],[488, 505],[132, 455],[648, 455]]) {
      this._drawFlowerBed(ctx, fbx, fby, frame);
    }

    // Lanternes magiques le long de l'allée
    for (const [lx, ly] of [
      [388, 475], [412, 448], [488, 448], [512, 475],
    ]) {
      this._drawLantern(ctx, lx, ly, frame);
    }

    // Statue équestre gauche de l'entrée du château
    this._drawStatue(ctx, 380, 295, frame);
    this._drawStatue(ctx, 520, 295, frame);
  },

  _drawFlowerBed(ctx, x, y, frame) {
    const cols = ['#FF5888','#FF38A8','#FF88C0','#FFAA78','#FFE030','#FF6060'];
    const rng = _seededRNG(x * 11 + y * 7);
    for (let i = 0; i < 9; i++) {
      const fx = x + (rng() - 0.5) * 52;
      const fy = y + (rng() - 0.5) * 22;
      const pulse = 0.75 + 0.25 * Math.sin(frame * 0.045 + i * 0.9);
      ctx.fillStyle = cols[i % cols.length];
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  _drawLantern(ctx, x, y, frame) {
    const gA = 0.48 + 0.52 * Math.sin(frame * 0.07 + x * 0.08);
    // Halo lumineux
    const gGrad = ctx.createRadialGradient(x, y, 0, x, y, 20);
    gGrad.addColorStop(0, `rgba(255,240,140,${gA * 0.65})`);
    gGrad.addColorStop(1, 'rgba(255,200,80,0)');
    ctx.fillStyle = gGrad;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Poteau
    ctx.fillStyle = '#7860A8';
    ctx.fillRect(x - 2, y, 4, 22);

    // Lanterne
    ctx.fillStyle = `rgba(255,245,160,${0.72 + gA * 0.28})`;
    ctx.beginPath();
    _roundRect(ctx, x - 7, y - 16, 14, 14, 3);
    ctx.fill();
    ctx.strokeStyle = '#5040A0';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  },

  _drawStatue(ctx, x, y, frame) {
    // Piédestal
    ctx.fillStyle = '#D8D0E8';
    ctx.fillRect(x - 12, y, 24, 22);
    ctx.strokeStyle = '#C0B0D8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 12, y, 24, 22);
    // Figurine simple (licorne stylisée)
    ctx.fillStyle = '#EEE8F8';
    ctx.beginPath();
    ctx.arc(x + 4, y - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y - 3, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#C8B8E0';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Corne
    ctx.fillStyle = '#F0D040';
    ctx.beginPath();
    ctx.moveTo(x + 9, y - 15);
    ctx.lineTo(x + 7, y - 8);
    ctx.lineTo(x + 12, y - 8);
    ctx.closePath();
    ctx.fill();
  },

  // ── Overlay sombre ──────────────────────────────────────────────

  _drawDarkOverlay(ctx, darkLevel) {
    if (darkLevel >= 1) return;
    ctx.save();
    ctx.globalAlpha = (1 - darkLevel) * 0.58;
    ctx.fillStyle = '#040010';
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    ctx.restore();
  },

  // ── Loups ────────────────────────────────────────────────────────

  _drawWolves(ctx, frame, darkLevel) {
    if (darkLevel >= 1) return;
    const alpha = Math.min(1, (1 - darkLevel) * 1.4);
    // Positions des loups dans les jardins
    const wolves = [
      { x: 88,  y: 490, flip: false },
      { x: 812, y: 490, flip: true  },
      { x: 240, y: 458, flip: false },
      { x: 660, y: 458, flip: true  },
    ];
    // Disparaît progressivement (1 loup par épreuve résolue, en partant des coins)
    const visibleCount = wolves.length - Math.min(wolves.length, Math.floor(darkLevel * wolves.length * 1.3));
    for (let i = 0; i < visibleCount; i++) {
      const w = wolves[i];
      const breathe = Math.sin(frame * 0.03 + i * 1.5) * 1.5;
      ctx.save();
      ctx.globalAlpha = alpha * (i < visibleCount - 1 ? 1 : Math.max(0.15, (1 - darkLevel * 1.5)));
      if (w.flip) {
        ctx.translate(w.x * 2, 0);
        ctx.scale(-1, 1);
      }
      this._drawWolf(ctx, w.x, w.y + breathe, frame);
      ctx.restore();
    }
  },

  _drawWolf(ctx, x, y, frame) {
    // Corps du loup (silhouette sombre)
    const bodyColor = '#1A1230';
    const eyeGlow   = '#FF4400';

    // Corps
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(x, y, 22, 13, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Tête
    ctx.beginPath();
    ctx.ellipse(x + 20, y - 7, 12, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Museau pointu
    ctx.beginPath();
    ctx.moveTo(x + 30, y - 5);
    ctx.lineTo(x + 38, y - 2);
    ctx.lineTo(x + 30, y + 1);
    ctx.closePath();
    ctx.fill();

    // Oreilles dressées
    ctx.beginPath();
    ctx.moveTo(x + 14, y - 15);
    ctx.lineTo(x + 10, y - 26);
    ctx.lineTo(x + 20, y - 18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 22, y - 16);
    ctx.lineTo(x + 26, y - 27);
    ctx.lineTo(x + 30, y - 17);
    ctx.closePath();
    ctx.fill();

    // Pattes
    for (let i = 0; i < 4; i++) {
      const legX = x - 14 + i * 10;
      const legWave = i % 2 === 0 ? Math.sin(frame * 0.08 + i) * 2 : 0;
      ctx.fillRect(legX, y + 10, 5, 14 + legWave);
    }

    // Queue relevée
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 20, y - 2);
    ctx.bezierCurveTo(x - 34, y - 8, x - 38, y - 20, x - 30, y - 28);
    ctx.stroke();

    // Yeux rougeoyants
    const eyeA = 0.7 + 0.3 * Math.sin(frame * 0.07);
    ctx.fillStyle = eyeGlow;
    ctx.globalAlpha *= eyeA;
    ctx.beginPath();
    ctx.arc(x + 27, y - 9, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Halo
    const eg = ctx.createRadialGradient(x + 27, y - 9, 0, x + 27, y - 9, 8);
    eg.addColorStop(0, `rgba(255,80,0,0.5)`);
    eg.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(x + 27, y - 9, 8, 0, Math.PI * 2);
    ctx.fill();
  },

  // ── Chauves-souris ───────────────────────────────────────────────

  _drawBats(ctx, frame, darkLevel) {
    if (darkLevel >= 0.85) return;
    const alpha = Math.min(1, (1 - darkLevel) * 1.8);
    ctx.save();
    ctx.globalAlpha = alpha;

    const batCount = Math.max(1, Math.round((1 - darkLevel) * 5));
    for (let i = 0; i < batCount; i++) {
      const speed = 0.4 + i * 0.12;
      const bx = ((frame * speed + i * 185) % 1020) - 60;
      const by = 30 + i * 30 + Math.sin(frame * 0.07 + i * 1.7) * 18;
      const wingPhase = Math.sin(frame * 0.22 + i * 0.9);
      this._drawBat(ctx, bx, by, wingPhase);
    }
    ctx.restore();
  },

  _drawBat(ctx, x, y, wingPhase) {
    const w = 22 + wingPhase * 6;
    ctx.fillStyle = '#110820';
    ctx.strokeStyle = '#221040';
    ctx.lineWidth = 1;

    // Aile gauche
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x - w * 0.4, y - 8 - wingPhase * 6, x - w, y - 4 + wingPhase * 5, x - w, y + 5);
    ctx.bezierCurveTo(x - w * 0.7, y + 8, x - w * 0.3, y + 5, x, y);
    ctx.fill();

    // Aile droite
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + w * 0.4, y - 8 - wingPhase * 6, x + w, y - 4 + wingPhase * 5, x + w, y + 5);
    ctx.bezierCurveTo(x + w * 0.7, y + 8, x + w * 0.3, y + 5, x, y);
    ctx.fill();

    // Corps
    ctx.fillStyle = '#1A1030';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tête + oreilles
    ctx.beginPath();
    ctx.arc(x, y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    // Oreilles
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 8);
    ctx.lineTo(x - 5, y - 14);
    ctx.lineTo(x - 1, y - 9);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 8);
    ctx.lineTo(x + 5, y - 14);
    ctx.lineTo(x + 1, y - 9);
    ctx.closePath();
    ctx.fill();

    // Petits yeux rouges
    ctx.fillStyle = '#CC2200';
    ctx.beginPath();
    ctx.arc(x - 2, y - 5, 1, 0, Math.PI * 2);
    ctx.arc(x + 2, y - 5, 1, 0, Math.PI * 2);
    ctx.fill();
  },

  // ── Pulse épreuves ───────────────────────────────────────────────

  _drawChallengePulse(ctx, gs) {
    const darkLevel = Math.min(1, gs.roomsDone.length / CONFIG.ROOMS.length);
    for (let i = 0; i < CONFIG.ROOMS.length; i++) {
      if (gs.roomsDone.includes(i)) continue;
      const room  = CONFIG.ROOMS[i];
      const pulse = 0.5 + 0.5 * Math.sin(gs.frameCount * 0.06 + i);
      ctx.save();
      // Plus lumineux quand sombre pour rester visible
      const baseAlpha = 0.35 + (1 - darkLevel) * 0.3;
      ctx.globalAlpha = baseAlpha * pulse;
      const pGrad = ctx.createRadialGradient(room.cx, room.cy, 4, room.cx, room.cy, 36 + pulse * 14);
      pGrad.addColorStop(0, '#FF80FF');
      pGrad.addColorStop(0.5, '#E040FB');
      pGrad.addColorStop(1, 'rgba(180,0,220,0)');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(room.cx, room.cy, 36 + pulse * 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  // ── Marqueurs flottants ──────────────────────────────────────────

  _drawChallengeMarkers(ctx, gs) {
    const buildingLabels = [
      'Château', 'Dôme', 'Serre', 'Pavillon G.', 'Fontaine', 'Pavillon D.',
    ];
    for (let i = 0; i < CONFIG.ROOMS.length; i++) {
      const room   = CONFIG.ROOMS[i];
      const isDone = gs.roomsDone.includes(i);
      const floatY = room.cy - 48 + Math.sin(gs.frameCount * 0.05 + i * 1.1) * 5;
      const emoji  = CONFIG.ROOM_NAMES[i].split(' ')[0];
      const label  = buildingLabels[i];

      ctx.save();
      ctx.textAlign = 'center';

      if (isDone) {
        // Badge vert "complété"
        ctx.globalAlpha = 0.92;
        const bw = 68, bh = 36, bx = room.cx - bw / 2, by = floatY - 22;
        ctx.fillStyle = 'rgba(10, 60, 20, 0.88)';
        ctx.strokeStyle = '#50EE80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        _roundRect(ctx, bx, by, bw, bh, 10);
        ctx.fill();
        ctx.stroke();
        ctx.font = '18px system-ui';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('✅', room.cx, floatY - 3);
        ctx.font = 'bold 10px system-ui';
        ctx.fillStyle = '#80FF90';
        ctx.fillText(label, room.cx, floatY + 12);
      } else {
        // Badge orange/rouge bien visible "à faire"
        const pulse = 0.85 + 0.15 * Math.sin(gs.frameCount * 0.09 + i);
        const bw = 76, bh = 42, bx = room.cx - bw / 2, by = floatY - 24;

        // Ombre portée
        ctx.globalAlpha = 0.5 * pulse;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        _roundRect(ctx, bx + 3, by + 3, bw, bh, 11);
        ctx.fill();

        // Fond du badge
        ctx.globalAlpha = 0.95 * pulse;
        const bgGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
        bgGrad.addColorStop(0, '#3D0060');
        bgGrad.addColorStop(1, '#1A0030');
        ctx.fillStyle = bgGrad;
        ctx.strokeStyle = '#FF40FF';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        _roundRect(ctx, bx, by, bw, bh, 11);
        ctx.fill();
        ctx.stroke();

        // Emoji épreuve
        ctx.globalAlpha = 1;
        ctx.font = '20px system-ui';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur  = 8;
        ctx.fillText(emoji, room.cx, floatY - 2);
        ctx.shadowBlur  = 0;

        // Nom du bâtiment
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = '#FFD0FF';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur  = 4;
        ctx.fillText(label, room.cx, floatY + 14);
        ctx.shadowBlur  = 0;

        // Petite flèche pointant vers le centre du bâtiment
        ctx.globalAlpha = 0.7 * pulse;
        ctx.fillStyle = '#FF80FF';
        ctx.beginPath();
        ctx.moveTo(room.cx - 6, floatY + 20);
        ctx.lineTo(room.cx + 6, floatY + 20);
        ctx.lineTo(room.cx,     floatY + 28);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  },

  // ── Portail de sortie ────────────────────────────────────────────

  _drawExit(ctx, gs) {
    if (gs.roomsDone.length < CONFIG.challenge.gateScore) return;

    const ez = CONFIG.EXIT_ZONE;
    const ecx = ez.x + ez.w / 2;
    const ecy = ez.y + ez.h / 2;
    const pulse = 0.6 + 0.4 * Math.sin(gs.frameCount * 0.08);

    // Anneau de portail
    const pGrad = ctx.createRadialGradient(ecx, ecy, 8, ecx, ecy, 40);
    pGrad.addColorStop(0, `rgba(210,160,255,${pulse})`);
    pGrad.addColorStop(0.5, `rgba(160,110,230,${pulse * 0.7})`);
    pGrad.addColorStop(1, 'rgba(100,50,200,0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(ecx, ecy, 40, 0, Math.PI * 2);
    ctx.fill();

    // Particules tourbillonnantes
    ctx.fillStyle = '#E8D0FF';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + gs.frameCount * 0.05;
      const pr = 28;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(ecx + Math.cos(a) * pr, ecy + Math.sin(a) * pr, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.font = '26px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('✨', ecx, ecy + 9);

    ctx.font = 'bold 10px system-ui';
    ctx.fillStyle = '#F0E0FF';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur  = 4;
    ctx.fillText('Portail magique', ecx, ecy + 55);
    ctx.shadowBlur  = 0;
  },

  // ── Joueur — fille sur licorne ────────────────────────────────────

  _drawPlayer(ctx, gs) {
    const { x, y } = gs.player;
    const frame = gs.frameCount;

    const profile  = (typeof currentProfile !== 'undefined' && currentProfile) ? currentProfile : null;
    const unlocked = profile ? (profile.cosmetics || { avatar: [], unicorn: [] }) : { avatar: [], unicorn: [] };
    const magie    = profile ? rpgSystem.getMagie(profile) : 1;

    const hasSaddle      = unlocked.unicorn.includes('selle_rose');
    const hasWings       = unlocked.unicorn.includes('ailes');
    const hasRainbowHorn = unlocked.unicorn.includes('corne_arc');
    const hasCapeBlue    = unlocked.avatar.includes('cape_bleue');
    const hasCapeGold    = unlocked.avatar.includes('cape_doree');
    const hasCrown       = unlocked.avatar.includes('couronne');
    const hasHat         = unlocked.avatar.includes('chapeau_mage');
    const hasWand        = unlocked.avatar.includes('baguette');
    const hasArmor       = unlocked.avatar.includes('armure');

    // Couleurs mane/queue selon corne arc-en-ciel
    const maneColors = hasRainbowHorn
      ? ['#FF6B9D', '#FFB347', '#FFD700', '#7EC8E3', '#9B59B6']
      : ['#FF88CC', '#FF55AA', '#CC3388'];
    const tailColors = hasRainbowHorn
      ? ['#FF6B9D', '#FFD700', '#7EC8E3', '#9B59B6']
      : ['#FF88CC', '#FF55AA', '#AA2266'];

    ctx.save();

    // ── OMBRE ──────────────────────────────────────────────────────
    ctx.globalAlpha = 0.20;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + 22, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── SCINTILLEMENTS MAGIQUES (magie ≥ 3) ──────────────────────
    if (magie >= 3) {
      const numSparks = Math.min(7, Math.floor(magie * 0.8));
      for (let i = 0; i < numSparks; i++) {
        const ang = (i / numSparks) * Math.PI * 2 + frame * 0.04;
        const sr  = 28 + Math.sin(frame * 0.07 + i) * 5;
        ctx.globalAlpha = 0.22 + 0.35 * Math.sin(frame * 0.09 + i * 1.4);
        ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FF80FF';
        ctx.beginPath();
        ctx.arc(x + Math.cos(ang) * sr, y + 4 + Math.sin(ang) * sr * 0.4, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // ── AILES (si débloquées) ─────────────────────────────────────
    if (hasWings) {
      const flap = Math.sin(frame * 0.08) * 6;
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = '#FFE8FF';
      ctx.strokeStyle = '#DDA0DD';
      ctx.lineWidth = 1;
      // Aile gauche
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 2);
      ctx.bezierCurveTo(x - 22, y - 4 - flap, x - 32, y + 2 - flap, x - 26, y + 11);
      ctx.bezierCurveTo(x - 16, y + 8, x - 10, y + 5, x - 6, y + 2);
      ctx.fill(); ctx.stroke();
      // Aile droite
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 2);
      ctx.bezierCurveTo(x + 22, y - 4 - flap, x + 32, y + 2 - flap, x + 26, y + 11);
      ctx.bezierCurveTo(x + 16, y + 8, x + 10, y + 5, x + 6, y + 2);
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── QUEUE ─────────────────────────────────────────────────────
    for (let i = 0; i < tailColors.length; i++) {
      const tw = Math.sin(frame * 0.04 + i * 0.7) * 5;
      ctx.strokeStyle = tailColors[i];
      ctx.lineWidth   = 2.8 - i * 0.4;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 16, y + 4);
      ctx.bezierCurveTo(x - 26, y + tw, x - 32, y + 9 + tw, x - 26 + i * 2, y + 20);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // ── CORPS LICORNE ─────────────────────────────────────────────
    const bodyGrad = ctx.createRadialGradient(x - 4, y + 2, 2, x, y + 6, 22);
    bodyGrad.addColorStop(0, '#FFFFFF');
    bodyGrad.addColorStop(0.5, '#F2EEFF');
    bodyGrad.addColorStop(1, '#E0D0FF');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(x, y + 5, 21, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#C8B0E8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Étoiles sur le corps (comme dans l'image de référence)
    ctx.fillStyle = 'rgba(170, 130, 240, 0.55)';
    for (const [sx, sy] of [[-7, 4], [4, 8], [8, 1]]) {
      ctx.beginPath();
      ctx.arc(x + sx, y + sy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── SELLE ROSE ────────────────────────────────────────────────
    if (hasSaddle) {
      ctx.fillStyle = '#FF88C0';
      ctx.strokeStyle = '#FF5090';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#FFFDE0';
      ctx.beginPath();
      ctx.ellipse(x, y - 1, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ── PATTES ────────────────────────────────────────────────────
    const legBob   = Math.sin(frame * 0.10) * 2;
    const legColor = '#F0EAFF';
    const hoofCol  = '#B090D0';
    for (let i = 0; i < 4; i++) {
      const lx   = x - 15 + i * 10;
      const lanim = i % 2 === 0 ? legBob : -legBob;
      ctx.fillStyle   = legColor;
      ctx.strokeStyle = '#C8B0E8';
      ctx.lineWidth   = 1;
      ctx.fillRect(lx - 2.5, y + 16, 5, 9 + lanim);
      ctx.strokeRect(lx - 2.5, y + 16, 5, 9 + lanim);
      ctx.fillStyle = hoofCol;
      ctx.beginPath();
      _roundRect(ctx, lx - 3, y + 24 + lanim, 6, 4, 2);
      ctx.fill();
    }

    // ── COU + TÊTE LICORNE ────────────────────────────────────────
    const hx = x + 15;
    const hy = y - 6;

    // Cou
    ctx.fillStyle   = '#F0EAFF';
    ctx.strokeStyle = '#C8B0E8';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(hx - 6, y + 4);
    ctx.bezierCurveTo(hx - 9, y - 2, hx - 7, hy + 5, hx - 5, hy + 6);
    ctx.lineTo(hx + 5, hy + 5);
    ctx.bezierCurveTo(hx + 6, y - 1, hx + 5, y + 2, hx + 4, y + 4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Tête
    const headGrad = ctx.createRadialGradient(hx - 2, hy - 2, 1, hx, hy, 10);
    headGrad.addColorStop(0, '#FFFFFF');
    headGrad.addColorStop(1, '#EDE0FF');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(hx, hy, 10, 8, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#C8B0E8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Naseau
    ctx.fillStyle = '#E8C0E8';
    ctx.beginPath();
    ctx.arc(hx + 8, hy + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Œil de licorne (grand, expressif)
    ctx.fillStyle = '#7B52AB';
    ctx.beginPath();
    ctx.arc(hx + 2, hy - 1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(hx + 3, hy - 1.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // ── CORNE ─────────────────────────────────────────────────────
    ctx.save();
    ctx.translate(hx + 1, hy - 7);
    ctx.rotate(0.15);
    let hornGrad;
    if (hasRainbowHorn) {
      hornGrad = ctx.createLinearGradient(0, -16, 0, 4);
      ['#FF6B9D', '#FFD700', '#7EC8E3', '#9B59B6', '#FF6B9D'].forEach(
        (c, i, a) => hornGrad.addColorStop(i / (a.length - 1), c)
      );
    } else {
      hornGrad = ctx.createLinearGradient(0, -16, 0, 4);
      hornGrad.addColorStop(0, '#FFFFFF');
      hornGrad.addColorStop(1, '#FFD700');
    }
    ctx.fillStyle = hornGrad;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-3.5, 4);
    ctx.lineTo(3.5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,50,0.55)';
    ctx.lineWidth   = 0.8;
    ctx.beginPath();
    ctx.moveTo(0.5, -14); ctx.lineTo(-1, -6); ctx.lineTo(1.5, 2);
    ctx.stroke();
    ctx.restore();

    // Halo corne arc-en-ciel
    if (hasRainbowHorn) {
      const hGlow = ctx.createRadialGradient(hx + 2, hy - 14, 0, hx + 2, hy - 14, 13);
      hGlow.addColorStop(0, `rgba(255,200,255,${0.28 + 0.28 * Math.sin(frame * 0.10)})`);
      hGlow.addColorStop(1, 'rgba(200,150,255,0)');
      ctx.fillStyle = hGlow;
      ctx.beginPath();
      ctx.arc(hx + 2, hy - 14, 13, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── CRINIÈRE ──────────────────────────────────────────────────
    ctx.lineCap = 'round';
    for (let i = 0; i < maneColors.length; i++) {
      const mw = Math.sin(frame * 0.04 + i * 0.5) * 3;
      ctx.strokeStyle = maneColors[i];
      ctx.lineWidth   = 2.4 - i * 0.22;
      ctx.beginPath();
      ctx.moveTo(hx - 4 + i * 0.6, hy - 6);
      ctx.bezierCurveTo(hx - 10 + mw, hy + 2, hx - 13 + mw, y, hx - 10 + i * 0.8, y + 4);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // ── CAVALIÈRE ─────────────────────────────────────────────────
    const rx = x - 2;   // centre horizontal de la cavalière
    const ry = y - 6;   // centre vertical (milieu torse)

    // Cape (derrière, dessinée avant le corps)
    if (hasCapeBlue || hasCapeGold) {
      const capeColor  = hasCapeGold ? '#FFD700' : '#5588FF';
      const capeBorder = hasCapeGold ? '#CC9900' : '#3366CC';
      const capeWave   = Math.sin(frame * 0.04) * 3;
      ctx.fillStyle   = capeColor;
      ctx.strokeStyle = capeBorder;
      ctx.lineWidth   = 1;
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.moveTo(rx - 7, ry - 2);
      ctx.bezierCurveTo(rx - 13, ry + 8, rx - 15 + capeWave, ry + 16, rx - 8 + capeWave, ry + 22);
      ctx.bezierCurveTo(rx - 1, ry + 16, rx + 5, ry + 8, rx + 7, ry - 2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Jambes (à cheval sur la licorne)
    ctx.fillStyle = '#7B3BA8';
    ctx.beginPath();
    ctx.ellipse(rx - 8, ry + 8, 5, 3.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(rx + 9, ry + 8, 5, 3.5, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Bottes
    ctx.fillStyle   = '#7B4010';
    ctx.strokeStyle = '#5A2D08';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.ellipse(rx - 9, ry + 12, 4, 2.5, 0.3, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(rx + 10, ry + 12, 4, 2.5, -0.3, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Veste / armure
    const jacketC0 = hasArmor ? '#B0C0E0' : '#A070FF';
    const jacketC1 = hasArmor ? '#7080B0' : '#8B4CF6';
    const jacketGrad = ctx.createRadialGradient(rx - 3, ry - 3, 1, rx, ry + 2, 8);
    jacketGrad.addColorStop(0, jacketC0);
    jacketGrad.addColorStop(1, jacketC1);
    ctx.fillStyle   = jacketGrad;
    ctx.strokeStyle = hasArmor ? '#6080A8' : '#6030C0';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.ellipse(rx, ry + 1, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    if (hasArmor) {
      ctx.strokeStyle = 'rgba(200,220,255,0.65)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(rx - 4, ry - 2); ctx.lineTo(rx + 4, ry - 2);
      ctx.moveTo(rx, ry - 4);     ctx.lineTo(rx, ry + 5);
      ctx.stroke();
    }

    // Ceinture dorée
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(rx - 5, ry + 5, 10, 2);

    // Bras
    ctx.strokeStyle = jacketC1;
    ctx.lineWidth   = 4.5;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(rx - 5, ry - 1); ctx.lineTo(rx - 11, ry + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx + 5, ry - 1); ctx.lineTo(rx + 11, ry + 5);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Mains
    ctx.fillStyle = '#F4C2A1';
    ctx.beginPath();
    ctx.arc(rx - 11, ry + 5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx + 11, ry + 5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Baguette magique
    if (hasWand) {
      ctx.strokeStyle = '#8B5E3C';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 11, ry + 5); ctx.lineTo(rx + 20, ry - 3);
      ctx.stroke();
      const glow = 0.5 + 0.5 * Math.sin(frame * 0.12);
      ctx.fillStyle = `rgba(255,230,50,${glow * 0.55})`;
      ctx.beginPath();
      ctx.arc(rx + 20, ry - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(rx + 20, ry - 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── TÊTE DE LA CAVALIÈRE ──────────────────────────────────────
    ctx.fillStyle   = '#F4C2A1';
    ctx.strokeStyle = '#D8956A';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.arc(rx, ry - 10, 7.5, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Chevelure (longue, arc-en-ciel — comme dans l'image)
    const hairC = ['#9B5DE5', '#C77DFF', '#FF6B9D', '#FF9BE5'];
    ctx.lineCap = 'round';
    for (let i = 0; i < hairC.length; i++) {
      const hw = Math.sin(frame * 0.03 + i * 0.5) * 3;
      ctx.strokeStyle = hairC[i];
      ctx.lineWidth   = 3 - i * 0.4;
      ctx.beginPath();
      ctx.moveTo(rx - 2 + i * 1.5, ry - 17);
      ctx.bezierCurveTo(rx - 9 + hw, ry - 8, rx - 13 + hw, ry, rx - 14 + hw * 1.5, ry + 12);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // Dessus de la tête (cheveux violets)
    ctx.fillStyle   = '#9B5DE5';
    ctx.strokeStyle = '#7B40C5';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.ellipse(rx + 1, ry - 15, 8, 5, -0.1, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Mèche sur le côté
    ctx.fillStyle = '#A060F0';
    ctx.beginPath();
    ctx.moveTo(rx - 6, ry - 11);
    ctx.bezierCurveTo(rx - 9, ry - 8, rx - 7, ry - 4, rx - 4, ry - 5);
    ctx.bezierCurveTo(rx - 3, ry - 8, rx - 4, ry - 12, rx - 6, ry - 11);
    ctx.fill();

    // Yeux (grands, expressifs)
    ctx.fillStyle = '#3B2060';
    ctx.beginPath();
    ctx.arc(rx - 3, ry - 11, 2, 0, Math.PI * 2);
    ctx.arc(rx + 3, ry - 11, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(rx - 2.2, ry - 11.7, 0.8, 0, Math.PI * 2);
    ctx.arc(rx + 3.8, ry - 11.7, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Sourire
    ctx.strokeStyle = '#D06040';
    ctx.lineWidth   = 1.2;
    ctx.beginPath();
    ctx.arc(rx, ry - 7, 2.5, 0.3, Math.PI - 0.3);
    ctx.stroke();

    // Joues rosées
    ctx.globalAlpha = 0.28;
    ctx.fillStyle   = '#FF8090';
    ctx.beginPath();
    ctx.ellipse(rx - 5, ry - 9, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.ellipse(rx + 5, ry - 9, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // ── ACCESSOIRES COSMÉTIQUES ───────────────────────────────────
    if (hasHat) {
      // Chapeau de mage
      ctx.fillStyle   = '#4A0080';
      ctx.strokeStyle = '#7000C0';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(rx, ry - 30);
      ctx.lineTo(rx - 9, ry - 16);
      ctx.lineTo(rx + 9, ry - 16);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6B00B0';
      ctx.beginPath();
      ctx.ellipse(rx, ry - 16, 11, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(frame * 0.10);
      ctx.font        = '8px system-ui';
      ctx.textAlign   = 'center';
      ctx.fillStyle   = '#FFD700';
      ctx.fillText('⭐', rx, ry - 22);
      ctx.globalAlpha = 1;
    } else if (hasCrown) {
      ctx.font      = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('👑', rx, ry - 19);
    }

    ctx.restore();
  },

  // ── Notifications XP flottantes ─────────────────────────────────

  _drawFloatingXP(ctx, gs) {
    if (!gs.floatingXP || gs.floatingXP.length === 0) return;

    for (let i = gs.floatingXP.length - 1; i >= 0; i--) {
      const n = gs.floatingXP[i];
      n.frame++;

      const progress = n.frame / n.maxFrame;
      // Fondu entrant rapide, fondu sortant sur les 30 derniers %
      const alpha = progress < 0.7 ? 1 : Math.max(0, 1 - (progress - 0.7) / 0.3);
      const dy    = n.y - n.frame * 0.55;

      ctx.save();
      ctx.globalAlpha = alpha * 0.95;
      ctx.textAlign   = 'center';

      if (n.levelUp) {
        // Level-up : grand texte doré avec halo
        ctx.font        = 'bold 20px system-ui';
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur  = 12;
        ctx.fillStyle   = '#FFD700';
        ctx.fillText(n.text, n.x, dy);
        ctx.shadowBlur  = 0;
      } else {
        ctx.font        = 'bold 15px system-ui';
        ctx.shadowColor = '#8800FF';
        ctx.shadowBlur  = 7;
        ctx.fillStyle   = '#FFFFFF';
        ctx.fillText(n.text, n.x, dy);
        ctx.shadowBlur  = 0;
      }

      ctx.restore();

      if (n.frame >= n.maxFrame) gs.floatingXP.splice(i, 1);
    }
  },

  // ── HUD ─────────────────────────────────────────────────────────

  _drawHUD(ctx, gs) {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;

    const profile = (typeof currentProfile !== 'undefined' && currentProfile) ? currentProfile : null;
    const stats   = profile ? (profile.stats || { lecture: 1, calcul: 1, anglais: 1 }) : { lecture: 1, calcul: 1, anglais: 1 };
    const xp      = profile ? (profile.xp    || { lecture: 0, calcul: 0, anglais: 0 }) : { lecture: 0, calcul: 0, anglais: 0 };
    const magie   = profile ? rpgSystem.getMagie(profile) : 1;
    const name    = profile ? profile.name : 'Aventurier';

    // Fond du HUD élargi
    ctx.fillStyle = 'rgba(12,4,22,0.82)';
    ctx.fillRect(0, H - 62, W, 62);

    // Liseré supérieur violet
    ctx.strokeStyle = 'rgba(180,120,255,0.40)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 62); ctx.lineTo(W, H - 62);
    ctx.stroke();

    // ── Ligne 1 : nom | niveau | épreuves ────────────────────────
    ctx.fillStyle = '#FFFFFF';
    ctx.font      = 'bold 13px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`🦄 ${name}`, 12, H - 44);

    ctx.textAlign = 'center';
    const worldIdx = Math.floor((gs.currentLevel - 1) / 5);
    const worldEmoji = CONFIG.WORLDS[Math.min(worldIdx, 3)].emoji;
    const worldName = CONFIG.WORLDS[Math.min(worldIdx, 3)].name;
    ctx.fillText(`${worldEmoji} ${worldName} — Niv. ${gs.currentLevel}`, W / 2, H - 44);

    ctx.textAlign = 'right';
    if (gs.roomsDone.length < CONFIG.challenge.gateScore) {
      ctx.fillStyle = '#FFD0A0';
      ctx.fillText(`Épreuves : ${gs.roomsDone.length}/5 🔒`, W - 12, H - 44);
    } else {
      ctx.fillStyle = '#90FF90';
      ctx.fillText('Portail ouvert ! ✨', W - 12, H - 44);
    }

    // Séparateur
    ctx.strokeStyle = 'rgba(160,100,255,0.28)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(10, H - 36); ctx.lineTo(W - 10, H - 36);
    ctx.stroke();

    // ── Ligne 2 : barres de compétences ──────────────────────────
    const skillDefs = [
      { key: 'lecture', label: 'Lecture', icon: '📖', color: '#7FBBFF' },
      { key: 'calcul',  label: 'Calcul',  icon: '➕', color: '#FFB347' },
      { key: 'anglais', label: 'Anglais', icon: '🌍', color: '#90EE90' },
    ];

    const zoneW = (W - 110) / 3; // 3 compétences — 110px réservés pour Magie
    const barH  = 6;
    const barW  = Math.floor(zoneW * 0.40);

    skillDefs.forEach((sk, i) => {
      const lvl      = stats[sk.key] || 1;
      const curXP    = xp[sk.key]    || 0;
      const needXP   = rpgSystem.xpForLevel(lvl);
      const progress = Math.min(1, curXP / needXP);
      const sx       = i * zoneW + 8;
      const sy       = H - 22;

      // Icône
      ctx.font      = '12px system-ui';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(sk.icon, sx, sy);

      // Label + niveau
      ctx.font      = 'bold 10px system-ui';
      ctx.fillStyle = sk.color;
      ctx.fillText(`${sk.label}`, sx + 18, sy);

      ctx.font      = '10px system-ui';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`Niv.${lvl}`, sx + 18, sy + 13);

      // Barre XP
      const bx = sx + 72;
      const by = sy - 7;
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      ctx.beginPath();
      _roundRect(ctx, bx, by, barW, barH, 3);
      ctx.fill();

      if (progress > 0) {
        const g = ctx.createLinearGradient(bx, by, bx + barW, by);
        g.addColorStop(0, sk.color);
        g.addColorStop(1, '#FFFFFF');
        ctx.fillStyle = g;
        ctx.beginPath();
        _roundRect(ctx, bx, by, barW * progress, barH, 3);
        ctx.fill();
      }

      // Texte XP compact
      ctx.font      = '8px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.textAlign = 'left';
      ctx.fillText(`${curXP}/${needXP}xp`, bx + barW + 4, sy - 2);
    });

    // ── Magie ─────────────────────────────────────────────────────
    const mx = W - 104;
    const my = H - 22;

    ctx.fillStyle = '#FF88FF';
    ctx.font      = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('✨', mx, my);

    ctx.font      = 'bold 10px system-ui';
    ctx.fillStyle = '#FFB0FF';
    ctx.fillText('Magie', mx + 18, my);

    ctx.font      = '10px system-ui';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Niv.${magie}`, mx + 18, my + 13);

    // Étoiles animées Magie
    ctx.fillStyle = '#FFD700';
    const starCount = Math.min(5, magie);
    for (let s = 0; s < starCount; s++) {
      const pulse = 0.55 + 0.45 * Math.sin(gs.frameCount * 0.10 + s * 0.9);
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(mx + 60 + s * 9, my + 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },

  // ══════════════════════════════════════════════════════════════════
  // ══  WORLD MAP — Mario-style overworld  ═══════════════════════════
  // ══════════════════════════════════════════════════════════════════

  renderWorldMap(gs) {
    const ctx = this.ctx;
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;
    const frame = gs.frameCount;
    const wm = gs.worldMap;
    wm.animFrame++;

    ctx.clearRect(0, 0, W, H);

    // ── Background: parchment / adventure map ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0,   '#1A0830');
    bgGrad.addColorStop(0.3, '#2A1050');
    bgGrad.addColorStop(0.7, '#1A2040');
    bgGrad.addColorStop(1,   '#0A1020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    const rng = _seededRNG(77);
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < 80; i++) {
      const sx = rng() * W;
      const sy = rng() * H;
      const twinkle = 0.3 + 0.7 * Math.sin(frame * 0.03 + i * 1.7);
      ctx.globalAlpha = twinkle * 0.6;
      ctx.beginPath();
      ctx.arc(sx, sy, rng() * 1.5 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Terrain patches around worlds ──
    this._drawMapTerrain(ctx, frame);

    // ── Draw paths between worlds ──
    for (const [a, b] of CONFIG.WORLD_PATHS) {
      const wa = CONFIG.WORLDS[a];
      const wb = CONFIG.WORLDS[b];
      // Determine if path is unlocked (world a completed)
      const aComplete = this._isWorldComplete(a);
      ctx.save();
      ctx.setLineDash(aComplete ? [] : [8, 6]);
      ctx.strokeStyle = aComplete ? '#FFD700' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = aComplete ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(wa.mapX, wa.mapY);
      // Curved path
      const mx = (wa.mapX + wb.mapX) / 2;
      const my = Math.min(wa.mapY, wb.mapY) - 40;
      ctx.quadraticCurveTo(mx, my, wb.mapX, wb.mapY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated dots on unlocked paths
      if (aComplete) {
        for (let d = 0; d < 5; d++) {
          const t = ((frame * 0.008 + d * 0.2) % 1);
          const dx = (1-t)*(1-t)*wa.mapX + 2*(1-t)*t*mx + t*t*wb.mapX;
          const dy = (1-t)*(1-t)*wa.mapY + 2*(1-t)*t*my + t*t*wb.mapY;
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * Math.PI);
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(dx, dy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    // ── Draw world nodes ──
    for (let wi = 0; wi < CONFIG.WORLDS.length; wi++) {
      const w = CONFIG.WORLDS[wi];
      const unlocked = this._isWorldUnlocked(wi);
      const complete = this._isWorldComplete(wi);
      const selected = wm.selectedWorld === wi && wm.selectedLevel === -1;

      this._drawWorldNode(ctx, w, wi, unlocked, complete, selected, frame);

      // Draw level nodes within selected world
      if (wm.selectedWorld === wi && unlocked) {
        this._drawLevelNodes(ctx, w, wi, frame, wm);
      }
    }

    // ── Title ──
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px system-ui';
    ctx.fillStyle = '#FFD700';
    ctx.shadowColor = 'rgba(255,200,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.fillText('Carte du Monde', W / 2, 45);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#C8B0FF';
    ctx.fillText('Choisis un monde et un niveau !', W / 2, 70);

    // Controls hint
    ctx.font = '13px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('← → pour choisir  •  ↑ ↓ pour les niveaux  •  Entrée pour jouer', W / 2, H - 15);
    ctx.restore();

    // ── HUD: profile info ──
    ctx.save();
    ctx.fillStyle = 'rgba(12,4,22,0.7)';
    ctx.fillRect(0, H - 40, W, 40);
    const profile = currentProfile || { name: 'Aventurier' };
    ctx.font = 'bold 14px system-ui';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'left';
    ctx.fillText(`🦄 ${profile.name}`, 12, H - 18);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD0A0';
    ctx.fillText(`Progression : ${currentProgress.currentLevel - 1} / 20 niveaux`, W - 12, H - 18);
    ctx.restore();
  },

  _isWorldUnlocked(worldIdx) {
    if (worldIdx === 0) return true;
    // A world is unlocked when the previous world's last level is completed
    const prevWorld = CONFIG.WORLDS[worldIdx - 1];
    const lastLevel = prevWorld.levels[prevWorld.levels.length - 1];
    return !!(currentProgress.levels[lastLevel] && currentProgress.levels[lastLevel].completed);
  },

  _isWorldComplete(worldIdx) {
    const w = CONFIG.WORLDS[worldIdx];
    const lastLevel = w.levels[w.levels.length - 1];
    return !!(currentProgress.levels[lastLevel] && currentProgress.levels[lastLevel].completed);
  },

  _isLevelUnlocked(levelNum) {
    if (levelNum <= 1) return true;
    // Level is unlocked if previous level is completed OR it's the currentLevel
    return levelNum <= currentProgress.currentLevel;
  },

  _drawMapTerrain(ctx, frame) {
    // Terrain patches for each world
    const terrains = [
      // Forest: green patches with trees
      { cx: 150, cy: 420, color: '#1A4A1A', r: 80 },
      // Beach: sand + water
      { cx: 350, cy: 280, color: '#1A3A4A', r: 75 },
      // City: gray patch
      { cx: 550, cy: 380, color: '#2A2A3A', r: 70 },
      // Castle: purple hilltop
      { cx: 750, cy: 240, color: '#2A1A3A', r: 85 },
    ];

    for (let i = 0; i < terrains.length; i++) {
      const t = terrains[i];
      const rng = _seededRNG(i * 100 + 7);

      // Main terrain ellipse
      ctx.save();
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.ellipse(t.cx, t.cy + 25, t.r * 1.4, t.r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Theme-specific decorations
      if (i === 0) {
        // Forest: little trees
        ctx.fillStyle = '#2E6E2E';
        for (let j = 0; j < 8; j++) {
          const tx = t.cx - 80 + rng() * 160;
          const ty = t.cy - 15 + rng() * 60;
          ctx.beginPath();
          ctx.moveTo(tx, ty - 18);
          ctx.lineTo(tx - 8, ty);
          ctx.lineTo(tx + 8, ty);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(tx - 2, ty, 4, 6);
        }
      } else if (i === 1) {
        // Beach: waves
        ctx.strokeStyle = 'rgba(100,200,255,0.4)';
        ctx.lineWidth = 2;
        for (let j = 0; j < 4; j++) {
          const wy = t.cy + 15 + j * 10;
          const wave = Math.sin(frame * 0.03 + j) * 8;
          ctx.beginPath();
          ctx.moveTo(t.cx - 70, wy);
          ctx.quadraticCurveTo(t.cx - 30 + wave, wy - 8, t.cx, wy);
          ctx.quadraticCurveTo(t.cx + 30 + wave, wy + 8, t.cx + 70, wy);
          ctx.stroke();
        }
        // Palm tree
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(t.cx + 50, t.cy - 5, 5, 25);
        ctx.fillStyle = '#228B22';
        for (let l = 0; l < 4; l++) {
          const a = l * 0.8 - 0.4 + Math.sin(frame * 0.02) * 0.1;
          ctx.beginPath();
          ctx.moveTo(t.cx + 52, t.cy - 8);
          ctx.quadraticCurveTo(t.cx + 52 + Math.cos(a) * 20, t.cy - 20, t.cx + 52 + Math.cos(a) * 30, t.cy - 5);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#228B22';
          ctx.stroke();
        }
      } else if (i === 2) {
        // City: small buildings
        ctx.fillStyle = '#4A4A5A';
        for (let j = 0; j < 5; j++) {
          const bx = t.cx - 55 + j * 25;
          const bh = 12 + rng() * 18;
          ctx.fillRect(bx, t.cy + 5 - bh, 15, bh);
          // Window
          ctx.fillStyle = '#FFE040';
          ctx.globalAlpha = 0.5 + 0.5 * Math.sin(frame * 0.04 + j);
          ctx.fillRect(bx + 3, t.cy + 5 - bh + 3, 4, 4);
          ctx.fillRect(bx + 9, t.cy + 5 - bh + 3, 4, 4);
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#4A4A5A';
        }
      } else {
        // Castle: turrets
        ctx.fillStyle = '#6A4A8A';
        ctx.fillRect(t.cx - 20, t.cy - 30, 40, 45);
        ctx.fillStyle = '#8A6AAA';
        ctx.beginPath();
        ctx.moveTo(t.cx - 25, t.cy - 30);
        ctx.lineTo(t.cx, t.cy - 55);
        ctx.lineTo(t.cx + 25, t.cy - 30);
        ctx.closePath();
        ctx.fill();
        // Towers
        ctx.fillStyle = '#5A3A7A';
        ctx.fillRect(t.cx - 30, t.cy - 25, 12, 35);
        ctx.fillRect(t.cx + 18, t.cy - 25, 12, 35);
        // Flag
        ctx.fillStyle = '#E040FB';
        const wave = Math.sin(frame * 0.06) * 3;
        ctx.beginPath();
        ctx.moveTo(t.cx, t.cy - 55);
        ctx.lineTo(t.cx + 15, t.cy - 50 + wave);
        ctx.lineTo(t.cx, t.cy - 45);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  },

  _drawWorldNode(ctx, world, idx, unlocked, complete, selected, frame) {
    const x = world.mapX;
    const y = world.mapY;
    const r = selected ? 38 : 32;
    const pulse = selected ? (0.9 + 0.1 * Math.sin(frame * 0.08)) : 1;

    ctx.save();

    if (!unlocked) {
      ctx.globalAlpha = 0.35;
    }

    // Glow for selected
    if (selected && unlocked) {
      const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 1.8);
      glow.addColorStop(0, 'rgba(255,215,0,0.35)');
      glow.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Circle background
    const grad = ctx.createRadialGradient(x - 8, y - 8, 2, x, y, r);
    grad.addColorStop(0, complete ? '#FFE070' : (unlocked ? '#6040A0' : '#2A2A3A'));
    grad.addColorStop(1, complete ? '#C8A020' : (unlocked ? '#3A2060' : '#1A1A2A'));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = complete ? '#FFD700' : (selected ? '#E040FB' : 'rgba(255,255,255,0.3)');
    ctx.lineWidth = selected ? 3.5 : 2;
    ctx.stroke();

    // World emoji
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${r * 0.8}px system-ui`;
    ctx.fillStyle = '#FFF';
    ctx.fillText(world.emoji, x, y + 2);

    // World name
    ctx.font = 'bold 13px system-ui';
    ctx.fillStyle = selected ? '#FFD700' : '#C8B0E0';
    ctx.textBaseline = 'top';
    ctx.fillText(world.name, x, y + r + 8);

    // Lock icon
    if (!unlocked) {
      ctx.font = '20px system-ui';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFF';
      ctx.globalAlpha = 0.7;
      ctx.fillText('🔒', x, y);
    }

    // Completion stars
    if (unlocked) {
      const completedLevels = world.levels.filter(l =>
        currentProgress.levels[l] && currentProgress.levels[l].completed
      ).length;
      ctx.font = '11px system-ui';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#FFD700';
      let stars = '';
      for (let s = 0; s < world.levels.length; s++) {
        stars += s < completedLevels ? '★' : '☆';
      }
      ctx.fillText(stars, x, y + r + 22);
    }

    ctx.restore();
  },

  _drawLevelNodes(ctx, world, worldIdx, frame, wm) {
    const levels = world.levels;
    const baseX = world.mapX;
    const baseY = world.mapY - 70;

    // Draw a small arc of level nodes above the world node
    for (let li = 0; li < levels.length; li++) {
      const levelNum = levels[li];
      const angle = Math.PI + (li / (levels.length - 1)) * Math.PI;
      const nodeX = baseX + Math.cos(angle) * 90;
      const nodeY = baseY + Math.sin(angle) * 30 - 20;
      const unlocked = this._isLevelUnlocked(levelNum);
      const completed = !!(currentProgress.levels[levelNum] && currentProgress.levels[levelNum].completed);
      const selected = wm.selectedLevel === li;

      ctx.save();

      // Line from world to level
      ctx.strokeStyle = unlocked ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY + 50);
      ctx.lineTo(nodeX, nodeY);
      ctx.stroke();

      if (!unlocked) ctx.globalAlpha = 0.3;

      const r = selected ? 20 : 16;

      // Glow for selected
      if (selected && unlocked) {
        const glow = ctx.createRadialGradient(nodeX, nodeY, 4, nodeX, nodeY, r * 2);
        glow.addColorStop(0, 'rgba(255,215,0,0.4)');
        glow.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, r * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Node circle
      ctx.fillStyle = completed ? '#FFD700' : (unlocked ? '#5030A0' : '#2A2A3A');
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = selected ? '#FFD700' : (completed ? '#FFA000' : 'rgba(255,255,255,0.25)');
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.stroke();

      // Level number
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${selected ? 14 : 12}px system-ui`;
      ctx.fillStyle = completed ? '#4A2800' : '#FFF';
      ctx.fillText(String(levelNum), nodeX, nodeY + 1);

      // Completed check
      if (completed) {
        ctx.font = '10px system-ui';
        ctx.fillStyle = '#2E7D32';
        ctx.fillText('✓', nodeX + r - 2, nodeY - r + 4);
      }

      // Lock
      if (!unlocked) {
        ctx.globalAlpha = 0.6;
        ctx.font = '12px system-ui';
        ctx.fillText('🔒', nodeX, nodeY);
      }

      ctx.restore();
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // ══  THEMED BACKGROUNDS  ═════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════

  // ── FOREST THEME ──────────────────────────────────────────────────
  _drawForestBg(ctx, frame, darkLevel, levelNum) {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;
    const t = darkLevel;
    const seed = levelNum * 137;

    // Sky: deep green-tinted night → bright green sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 260);
    skyGrad.addColorStop(0,   _lerpColorRGB([10, 25, 10], [50, 140, 80], t));
    skyGrad.addColorStop(0.5, _lerpColorRGB([15, 35, 15], [80, 170, 100], t));
    skyGrad.addColorStop(1,   _lerpColorRGB([20, 45, 20], [140, 210, 150], t));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, 260);

    // Stars when dark
    if (t < 0.9) {
      this._drawStars(ctx, frame, 1 - t);
    }

    // Clouds (day)
    if (t > 0.2) {
      ctx.save();
      ctx.globalAlpha = t * 0.7;
      const cx1 = ((frame * 0.12) % 1050) - 120;
      const cx2 = ((frame * 0.08) % 1050) + 300;
      this._drawCloud(ctx, cx1, 40, 110, 42);
      this._drawCloud(ctx, cx2, 60, 90, 35);
      ctx.restore();
    }

    // Forest hills (layered, procedural heights based on seed)
    const rng = _seededRNG(seed);
    ctx.fillStyle = _lerpColorRGB([8, 30, 8], [40, 100, 30], t);
    ctx.beginPath();
    ctx.moveTo(0, 240);
    for (let x = 0; x <= W; x += 60) {
      ctx.lineTo(x, 180 + rng() * 50);
    }
    ctx.lineTo(W, 260); ctx.lineTo(0, 260);
    ctx.closePath();
    ctx.fill();

    // Closer hills
    ctx.fillStyle = _lerpColorRGB([12, 40, 12], [55, 130, 45], t);
    ctx.beginPath();
    ctx.moveTo(0, 260);
    for (let x = 0; x <= W; x += 45) {
      ctx.lineTo(x, 215 + rng() * 40);
    }
    ctx.lineTo(W, 270); ctx.lineTo(0, 270);
    ctx.closePath();
    ctx.fill();

    // Ground
    const groundGrad = ctx.createLinearGradient(0, 248, 0, H);
    groundGrad.addColorStop(0,   _lerpColorRGB([15, 35, 10], [65, 145, 55], t));
    groundGrad.addColorStop(0.5, _lerpColorRGB([18, 40, 12], [80, 160, 65], t));
    groundGrad.addColorStop(1,   _lerpColorRGB([20, 45, 14], [95, 175, 75], t));
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 248, W, H - 248);

    // Dirt paths (procedural)
    ctx.fillStyle = '#7A6040';
    ctx.globalAlpha = 0.4 + t * 0.3;
    this._drawPaths(ctx);
    ctx.globalAlpha = 1;

    // Large pine/deciduous trees (procedural positions from seed)
    const rng2 = _seededRNG(seed + 50);
    for (let i = 0; i < 14; i++) {
      const tx = rng2() * W;
      const ty = 230 + rng2() * 80;
      const treeType = rng2() > 0.5 ? 'pine' : 'oak';
      const treeH = 40 + rng2() * 35;
      this._drawForestTree(ctx, tx, ty, treeH, treeType, frame, t);
    }

    // Mushrooms scattered
    const rng3 = _seededRNG(seed + 200);
    for (let i = 0; i < 8; i++) {
      const mx = rng3() * W;
      const my = 380 + rng3() * 160;
      ctx.fillStyle = '#DD3333';
      ctx.beginPath();
      ctx.arc(mx, my - 4, 5, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#F0E0C0';
      ctx.fillRect(mx - 2, my - 4, 4, 7);
      // Dots on cap
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(mx - 2, my - 6, 1.5, 0, Math.PI * 2);
      ctx.arc(mx + 2, my - 7, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fireflies when dark
    if (t < 0.7) {
      ctx.fillStyle = '#AAFF00';
      const rng4 = _seededRNG(seed + 300);
      for (let i = 0; i < 12; i++) {
        const fx = rng4() * W;
        const fy = 260 + rng4() * 250;
        const fa = (1 - t) * (0.3 + 0.7 * Math.sin(frame * 0.06 + i * 2));
        ctx.globalAlpha = fa;
        ctx.beginPath();
        ctx.arc(fx + Math.sin(frame * 0.03 + i) * 8, fy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Dark overlay
    this._drawDarkOverlay(ctx, darkLevel);
  },

  _drawForestTree(ctx, x, y, h, type, frame, dayLevel) {
    ctx.save();
    // Trunk
    ctx.fillStyle = _lerpColorRGB([30, 20, 10], [90, 60, 30], dayLevel);
    ctx.fillRect(x - 4, y - h * 0.3, 8, h * 0.5);

    if (type === 'pine') {
      // Layered triangles
      for (let layer = 0; layer < 3; layer++) {
        const ly = y - h * 0.2 - layer * h * 0.25;
        const lw = 20 - layer * 4;
        ctx.fillStyle = _lerpColorRGB([10, 40 + layer * 15, 10], [30, 100 + layer * 25, 25], dayLevel);
        ctx.beginPath();
        ctx.moveTo(x, ly - h * 0.3);
        ctx.lineTo(x - lw, ly);
        ctx.lineTo(x + lw, ly);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Round oak canopy
      const colors = ['#2A6A1A', '#358A25', '#40A030'];
      for (let c = 0; c < 3; c++) {
        const ox = x + Math.cos(c * 2.1) * 8;
        const oy = y - h * 0.5 + Math.sin(c * 2.1) * 6;
        ctx.fillStyle = _lerpColorRGB([10, 30 + c * 15, 8], [50 + c * 20, 120 + c * 20, 40], dayLevel);
        ctx.beginPath();
        ctx.arc(ox, oy, 14 + c * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Leaf fall animation
    const sway = Math.sin(frame * 0.02 + x * 0.1) * 3;
    ctx.fillStyle = 'rgba(100,200,50,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + sway, y - h * 0.1, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  // ── BEACH THEME ───────────────────────────────────────────────────
  _drawBeachBg(ctx, frame, darkLevel, levelNum) {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;
    const t = darkLevel;
    const seed = levelNum * 211;

    // Sky: tropical sunset/day
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 220);
    skyGrad.addColorStop(0,   _lerpColorRGB([5, 10, 30], [50, 180, 240], t));
    skyGrad.addColorStop(0.6, _lerpColorRGB([10, 15, 40], [120, 210, 250], t));
    skyGrad.addColorStop(1,   _lerpColorRGB([20, 20, 50], [200, 230, 255], t));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, 220);

    // Stars
    if (t < 0.85) this._drawStars(ctx, frame, 1 - t);

    // Sun (day)
    if (t > 0.3) {
      ctx.save();
      ctx.globalAlpha = t * 0.9;
      const sunGlow = ctx.createRadialGradient(750, 60, 0, 750, 60, 60);
      sunGlow.addColorStop(0, 'rgba(255,230,100,0.8)');
      sunGlow.addColorStop(0.5, 'rgba(255,200,50,0.3)');
      sunGlow.addColorStop(1, 'rgba(255,180,0,0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(750, 60, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFE040';
      ctx.beginPath();
      ctx.arc(750, 60, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Clouds
    if (t > 0.2) {
      ctx.save();
      ctx.globalAlpha = t * 0.6;
      this._drawCloud(ctx, ((frame * 0.1) % 1050) - 100, 30, 100, 38);
      this._drawCloud(ctx, ((frame * 0.06) % 1050) + 400, 55, 80, 30);
      ctx.restore();
    }

    // Ocean
    const oceanY = 190;
    const oceanGrad = ctx.createLinearGradient(0, oceanY, 0, 350);
    oceanGrad.addColorStop(0, _lerpColorRGB([5, 20, 50], [30, 120, 200], t));
    oceanGrad.addColorStop(0.5, _lerpColorRGB([8, 30, 60], [50, 150, 220], t));
    oceanGrad.addColorStop(1, _lerpColorRGB([10, 35, 65], [80, 180, 230], t));
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, oceanY, W, 160);

    // Waves
    ctx.strokeStyle = `rgba(255,255,255,${0.15 + t * 0.25})`;
    ctx.lineWidth = 2;
    for (let wi = 0; wi < 6; wi++) {
      const wy = oceanY + 20 + wi * 25;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 5) {
        const yOff = Math.sin(x * 0.02 + frame * 0.04 + wi * 1.5) * 5;
        if (x === 0) ctx.moveTo(x, wy + yOff);
        else ctx.lineTo(x, wy + yOff);
      }
      ctx.stroke();
    }

    // Sandy beach
    const sandY = 340;
    const sandGrad = ctx.createLinearGradient(0, sandY, 0, H);
    sandGrad.addColorStop(0,   _lerpColorRGB([40, 35, 20], [235, 215, 165], t));
    sandGrad.addColorStop(0.3, _lerpColorRGB([45, 40, 22], [225, 205, 155], t));
    sandGrad.addColorStop(1,   _lerpColorRGB([50, 42, 25], [210, 195, 140], t));
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, sandY, W, H - sandY);

    // Shore foam line
    ctx.strokeStyle = `rgba(255,255,255,${0.3 + t * 0.4})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 5) {
      const yOff = Math.sin(x * 0.015 + frame * 0.03) * 4;
      if (x === 0) ctx.moveTo(x, sandY + yOff);
      else ctx.lineTo(x, sandY + yOff);
    }
    ctx.stroke();

    // Paths on sand
    ctx.globalAlpha = 0.3 + t * 0.2;
    ctx.fillStyle = '#C8B480';
    this._drawPaths(ctx);
    ctx.globalAlpha = 1;

    // Palm trees (procedural)
    const rng = _seededRNG(seed);
    for (let i = 0; i < 8; i++) {
      const px = rng() * W;
      const py = 310 + rng() * 120;
      this._drawPalmTree(ctx, px, py, frame, t);
    }

    // Seashells
    const rng2 = _seededRNG(seed + 100);
    for (let i = 0; i < 10; i++) {
      const sx = rng2() * W;
      const sy = sandY + 10 + rng2() * (H - sandY - 80);
      ctx.fillStyle = ['#FFE0C0', '#FFC8A0', '#FFB088', '#E0C0B0'][i % 4];
      ctx.beginPath();
      ctx.arc(sx, sy, 3 + rng2() * 2, 0, Math.PI);
      ctx.fill();
    }

    // Crabs when dark
    if (t < 0.6) {
      const rng3 = _seededRNG(seed + 300);
      ctx.fillStyle = '#CC4422';
      ctx.globalAlpha = (1 - t) * 0.8;
      for (let i = 0; i < 3; i++) {
        const cx = rng3() * W;
        const cy = sandY + 30 + rng3() * 100;
        const scuttle = Math.sin(frame * 0.08 + i * 2) * 5;
        ctx.beginPath();
        ctx.ellipse(cx + scuttle, cy, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Claws
        ctx.strokeStyle = '#CC4422';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + scuttle - 8, cy);
        ctx.lineTo(cx + scuttle - 14, cy - 4);
        ctx.moveTo(cx + scuttle + 8, cy);
        ctx.lineTo(cx + scuttle + 14, cy - 4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Dark overlay
    this._drawDarkOverlay(ctx, darkLevel);
  },

  _drawPalmTree(ctx, x, y, frame, dayLevel) {
    ctx.save();
    const sway = Math.sin(frame * 0.015 + x * 0.05) * 4;

    // Trunk (curved)
    ctx.strokeStyle = _lerpColorRGB([40, 25, 10], [140, 95, 50], dayLevel);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + sway * 2, y - 40, x + sway * 3, y - 70);
    ctx.stroke();

    // Coconuts
    ctx.fillStyle = '#8B4513';
    for (let c = 0; c < 2; c++) {
      ctx.beginPath();
      ctx.arc(x + sway * 3 + (c - 0.5) * 6, y - 68, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fronds
    const frondX = x + sway * 3;
    const frondY = y - 72;
    for (let f = 0; f < 6; f++) {
      const angle = (f / 6) * Math.PI * 2 + Math.sin(frame * 0.02) * 0.1;
      const length = 30 + Math.random() * 10;
      ctx.strokeStyle = _lerpColorRGB([15, 45, 10], [40, 160, 30], dayLevel);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(frondX, frondY);
      ctx.quadraticCurveTo(
        frondX + Math.cos(angle) * length * 0.7,
        frondY + Math.sin(angle) * length * 0.3 - 15,
        frondX + Math.cos(angle) * length,
        frondY + Math.sin(angle) * length * 0.5 + 10
      );
      ctx.stroke();
    }
    ctx.restore();
  },

  // ── CITY THEME ────────────────────────────────────────────────────
  _drawCityBg(ctx, frame, darkLevel, levelNum) {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;
    const t = darkLevel;
    const seed = levelNum * 307;

    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 240);
    skyGrad.addColorStop(0,   _lerpColorRGB([10, 10, 30], [80, 130, 190], t));
    skyGrad.addColorStop(0.5, _lerpColorRGB([15, 15, 40], [120, 165, 210], t));
    skyGrad.addColorStop(1,   _lerpColorRGB([25, 25, 55], [180, 210, 240], t));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, 240);

    // Stars at night
    if (t < 0.85) this._drawStars(ctx, frame, 1 - t);

    // Clouds
    if (t > 0.2) {
      ctx.save();
      ctx.globalAlpha = t * 0.65;
      this._drawCloud(ctx, ((frame * 0.08) % 1050) - 80, 25, 120, 45);
      this._drawCloud(ctx, ((frame * 0.05) % 1050) + 500, 50, 95, 36);
      ctx.restore();
    }

    // Distant city skyline (procedural)
    const rng = _seededRNG(seed);
    ctx.fillStyle = _lerpColorRGB([15, 15, 25], [90, 95, 110], t);
    ctx.beginPath();
    ctx.moveTo(0, 240);
    let bx = 0;
    while (bx < W) {
      const bw = 25 + rng() * 40;
      const bh = 40 + rng() * 100;
      ctx.lineTo(bx, 240 - bh);
      ctx.lineTo(bx + bw, 240 - bh);
      bx += bw + rng() * 8;
    }
    ctx.lineTo(W, 240);
    ctx.closePath();
    ctx.fill();

    // Windows on distant buildings (twinkling at night)
    if (t < 0.8) {
      const rng1b = _seededRNG(seed + 5);
      ctx.fillStyle = '#FFE040';
      let bx2 = 0;
      while (bx2 < W) {
        const bw = 25 + rng1b() * 40;
        const bh = 40 + rng1b() * 100;
        rng1b(); // skip spacing
        for (let wy = 240 - bh + 8; wy < 235; wy += 12) {
          for (let wx = bx2 + 4; wx < bx2 + bw - 4; wx += 10) {
            ctx.globalAlpha = (1 - t) * (0.3 + 0.7 * (rng1b() > 0.5 ? Math.sin(frame * 0.04 + wx + wy) * 0.5 + 0.5 : 0.2));
            ctx.fillRect(wx, wy, 4, 5);
          }
        }
        bx2 += bw + rng1b() * 8;
      }
      ctx.globalAlpha = 1;
    }

    // Ground: pavement/park
    const groundGrad = ctx.createLinearGradient(0, 248, 0, H);
    groundGrad.addColorStop(0,   _lerpColorRGB([20, 20, 18], [130, 130, 120], t));
    groundGrad.addColorStop(0.3, _lerpColorRGB([22, 25, 20], [100, 120, 90], t));
    groundGrad.addColorStop(1,   _lerpColorRGB([25, 28, 22], [85, 110, 75], t));
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 248, W, H - 248);

    // Road
    ctx.fillStyle = _lerpColorRGB([18, 18, 16], [75, 75, 70], t);
    ctx.fillRect(0, 320, W, 35);
    // Road lines
    ctx.strokeStyle = '#FFE040';
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(0, 338);
    ctx.lineTo(W, 338);
    ctx.stroke();
    ctx.setLineDash([]);

    // Close buildings (procedural, colorful)
    const rng2 = _seededRNG(seed + 100);
    const buildingColors = ['#CC6644', '#88AA66', '#6688BB', '#AA7788', '#BB9955', '#7799AA'];
    for (let i = 0; i < 10; i++) {
      const bx3 = rng2() * W;
      const bh3 = 50 + rng2() * 80;
      const bw3 = 35 + rng2() * 30;
      const by3 = 310 - bh3;
      const color = buildingColors[Math.floor(rng2() * buildingColors.length)];

      ctx.fillStyle = _lerpColorRGB(
        [parseInt(color.slice(1,3),16)*0.3, parseInt(color.slice(3,5),16)*0.3, parseInt(color.slice(5,7),16)*0.3],
        [parseInt(color.slice(1,3),16), parseInt(color.slice(3,5),16), parseInt(color.slice(5,7),16)],
        t
      );
      ctx.fillRect(bx3, by3, bw3, bh3);

      // Windows
      for (let wy = by3 + 8; wy < by3 + bh3 - 10; wy += 14) {
        for (let wx = bx3 + 5; wx < bx3 + bw3 - 8; wx += 12) {
          const lit = rng2() > 0.3;
          if (lit && t < 0.7) {
            ctx.fillStyle = '#FFE040';
            ctx.globalAlpha = (1 - t) * 0.7;
          } else {
            ctx.fillStyle = _lerpColorRGB([40, 50, 60], [150, 190, 220], t);
            ctx.globalAlpha = 0.6;
          }
          ctx.fillRect(wx, wy, 6, 7);
          ctx.globalAlpha = 1;
        }
      }

      // Door
      ctx.fillStyle = '#3A2A1A';
      ctx.fillRect(bx3 + bw3 / 2 - 6, by3 + bh3 - 18, 12, 18);

      // Roof detail
      ctx.fillStyle = _lerpColorRGB([30, 25, 20], [80, 60, 50], t);
      ctx.fillRect(bx3 - 3, by3 - 4, bw3 + 6, 6);
    }

    // Paths
    ctx.globalAlpha = 0.35 + t * 0.2;
    this._drawPaths(ctx);
    ctx.globalAlpha = 1;

    // Street lamps
    const rng3 = _seededRNG(seed + 200);
    for (let i = 0; i < 8; i++) {
      const lx = 50 + rng3() * (W - 100);
      const ly = 355 + rng3() * 80;
      this._drawStreetLamp(ctx, lx, ly, frame, t);
    }

    // Park trees (smaller)
    const rng4 = _seededRNG(seed + 400);
    for (let i = 0; i < 6; i++) {
      const tx = rng4() * W;
      const ty = 370 + rng4() * 150;
      this._drawCityTree(ctx, tx, ty, frame, t);
    }

    // Dark overlay
    this._drawDarkOverlay(ctx, darkLevel);
  },

  _drawStreetLamp(ctx, x, y, frame, dayLevel) {
    ctx.save();
    // Pole
    ctx.fillStyle = _lerpColorRGB([20, 20, 20], [60, 60, 65], dayLevel);
    ctx.fillRect(x - 2, y - 35, 4, 35);

    // Lamp head
    ctx.fillStyle = '#444';
    ctx.fillRect(x - 8, y - 38, 16, 5);

    // Light (stronger at night)
    const glow = 1 - dayLevel;
    if (glow > 0.1) {
      const grad = ctx.createRadialGradient(x, y - 36, 2, x, y - 20, 35);
      grad.addColorStop(0, `rgba(255,240,140,${glow * 0.7})`);
      grad.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y - 20, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bulb
    ctx.fillStyle = `rgba(255,245,160,${0.5 + glow * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y - 36, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  _drawCityTree(ctx, x, y, frame, dayLevel) {
    ctx.save();
    ctx.fillStyle = _lerpColorRGB([30, 20, 10], [80, 55, 30], dayLevel);
    ctx.fillRect(x - 3, y - 12, 6, 18);

    ctx.fillStyle = _lerpColorRGB([15, 40, 12], [50, 130, 40], dayLevel);
    ctx.beginPath();
    ctx.arc(x, y - 20, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = _lerpColorRGB([20, 50, 15], [65, 150, 50], dayLevel);
    ctx.beginPath();
    ctx.arc(x - 6, y - 17, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 7, y - 18, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};

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

// Interpolation linéaire entre deux couleurs RGB (tableaux [r,g,b])
function _lerpColorRGB(c1, c2, t) {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function _lighten(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const toHex = (n) => Math.min(255, Math.round(n + (255 - n) * amount)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function _seededRNG(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
