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

  render(gs) {
    const ctx = this.ctx;
    if (!ctx) return;

    // darkLevel: 0 = fully dark (start), 1 = fully bright (all challenges won)
    const darkLevel = Math.min(1, gs.roomsDone.length / CONFIG.ROOMS.length);

    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    // 1. Ciel (nuit → jour selon darkLevel)
    this._drawSky(ctx, gs.frameCount, darkLevel);
    // 2. Montagnes
    this._drawMountains(ctx, darkLevel);
    // 3. Sol / pelouse
    this._drawGround(ctx, darkLevel);
    // 4. Allées de pierre
    this._drawPaths(ctx);
    // 5. Arbres arrière-plan
    this._drawBackTrees(ctx, gs.frameCount);
    // 6. Bâtiments
    this._drawLeftDome(ctx, gs.frameCount);
    this._drawRightConservatory(ctx, gs.frameCount);
    this._drawGardenPavilion(ctx, 55, 345, 'left', gs.frameCount);
    this._drawGardenPavilion(ctx, 725, 345, 'right', gs.frameCount);
    this._drawFountain(ctx, gs.frameCount);
    this._drawMainCastle(ctx, gs.frameCount);
    // 7. Arbres premier plan
    this._drawFrontTrees(ctx, gs.frameCount);
    // 8. Décorations (haies, fleurs, lanternes)
    this._drawDecorations(ctx, gs.frameCount);
    // 9. Overlay sombre (s'estompe au fil des victoires)
    this._drawDarkOverlay(ctx, darkLevel);
    // 10. Créatures nocturnes (loups et chauves-souris)
    this._drawWolves(ctx, gs.frameCount, darkLevel);
    this._drawBats(ctx, gs.frameCount, darkLevel);
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
    ctx.fillText(`Niveau ${gs.currentLevel} / 20`, W / 2, H - 44);

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
