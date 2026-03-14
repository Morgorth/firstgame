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

    ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

    // 1. Ciel
    this._drawSky(ctx, gs.frameCount);
    // 2. Montagnes
    this._drawMountains(ctx);
    // 3. Sol / pelouse
    this._drawGround(ctx);
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
    // 9. Pulse des épreuves non complétées
    this._drawChallengePulse(ctx, gs);
    // 10. Marqueurs flottants
    this._drawChallengeMarkers(ctx, gs);
    // 11. Portail de sortie
    this._drawExit(ctx, gs);
    // 12. Joueur
    this._drawPlayer(ctx, gs);
    // 13. HUD
    this._drawHUD(ctx, gs);
  },

  // ── Ciel ────────────────────────────────────────────────────────

  _drawSky(ctx, frame) {
    const grad = ctx.createLinearGradient(0, 0, 0, 250);
    grad.addColorStop(0,   '#5BA8E0');
    grad.addColorStop(0.5, '#90C8F0');
    grad.addColorStop(1,   '#C8E8FB');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 900, 260);

    // Nuages animés
    const cx1 = ((frame * 0.15) % 1050) - 120;
    const cx2 = ((frame * 0.09) % 1050) + 180;
    const cx3 = ((frame * 0.12) % 1050) + 520;
    this._drawCloud(ctx, cx1, 35, 130, 48);
    this._drawCloud(ctx, cx2, 65, 95, 38);
    this._drawCloud(ctx, cx3, 28, 110, 44);
    this._drawCloud(ctx, ((frame * 0.07) % 1050) + 680, 75, 85, 32);

    // Oiseaux
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

  _drawMountains(ctx) {
    // Rangée arrière (bleu-gris clair)
    ctx.fillStyle = '#8BAFC5';
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.lineTo(100, 130); ctx.lineTo(230, 165); ctx.lineTo(370, 105);
    ctx.lineTo(490, 145); ctx.lineTo(610, 92);  ctx.lineTo(745, 128);
    ctx.lineTo(900, 112); ctx.lineTo(900, 240); ctx.lineTo(0, 240);
    ctx.closePath();
    ctx.fill();

    // Rangée avant (plus foncée)
    ctx.fillStyle = '#6A98AF';
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.lineTo(75, 178); ctx.lineTo(175, 205); ctx.lineTo(310, 155);
    ctx.lineTo(410, 188); ctx.lineTo(545, 158); ctx.lineTo(675, 182);
    ctx.lineTo(815, 162); ctx.lineTo(900, 188); ctx.lineTo(900, 265);
    ctx.lineTo(0, 265);
    ctx.closePath();
    ctx.fill();

    // Neige sur les pics
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
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

  _drawGround(ctx) {
    const grad = ctx.createLinearGradient(0, 248, 0, 585);
    grad.addColorStop(0,   '#48A03C');
    grad.addColorStop(0.35,'#58B248');
    grad.addColorStop(1,   '#66C054');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 248, 900, 337);

    // Légères collines (reflet plus clair)
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

  // ── Pulse épreuves ───────────────────────────────────────────────

  _drawChallengePulse(ctx, gs) {
    for (let i = 0; i < CONFIG.ROOMS.length; i++) {
      if (gs.roomsDone.includes(i)) continue;
      const room  = CONFIG.ROOMS[i];
      const pulse = 0.5 + 0.5 * Math.sin(gs.frameCount * 0.06 + i);
      ctx.save();
      ctx.globalAlpha = 0.28 * pulse;
      ctx.beginPath();
      ctx.arc(room.cx, room.cy, 22 + pulse * 14, 0, Math.PI * 2);
      ctx.fillStyle = '#E040FB';
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
      const floatY = room.cy - 42 + Math.sin(gs.frameCount * 0.05 + i * 1.1) * 5;

      ctx.textAlign = 'center';
      ctx.font = '20px system-ui';

      if (isDone) {
        ctx.globalAlpha = 0.85;
        ctx.fillText('✅', room.cx, floatY);
      } else {
        ctx.globalAlpha = 1;
        ctx.fillText(CONFIG.ROOM_NAMES[i].split(' ')[0], room.cx, floatY);
      }
      ctx.globalAlpha = 1;

      // Étiquette du bâtiment
      ctx.font = 'bold 10px system-ui';
      ctx.fillStyle = isDone ? '#80D880' : '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur  = 5;
      ctx.fillText(buildingLabels[i], room.cx, floatY + 16);
      ctx.shadowBlur  = 0;
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

  // ── Joueur ───────────────────────────────────────────────────────

  _drawPlayer(ctx, gs) {
    const { x, y } = gs.player;
    const r = CONFIG.player.radius;

    // Ombre
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.ellipse(x, y + r - 4, r * 0.9, r * 0.34, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Corps
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

    // Yeux
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

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x - 4, y - 5, 1, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Couronne
    if (gs.player.cosmetics && gs.player.cosmetics.avatar === 'couronne') {
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('👑', x, y - r - 2);
    }

    // Corne
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

  // ── HUD ─────────────────────────────────────────────────────────

  _drawHUD(ctx, gs) {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;

    ctx.fillStyle = 'rgba(15,5,25,0.72)';
    ctx.fillRect(0, H - 36, W, 36);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'left';
    const name = (typeof currentProfile !== 'undefined' && currentProfile) ? currentProfile.name : 'Aventurier';
    ctx.fillText(`🦄 ${name}`, 12, H - 12);

    ctx.textAlign = 'center';
    ctx.fillText(`Niveau ${gs.currentLevel}/20`, W / 2, H - 12);

    ctx.textAlign = 'right';
    if (gs.roomsDone.length < CONFIG.challenge.gateScore) {
      ctx.fillText(`Épreuves : ${gs.roomsDone.length}/5 🔒`, W - 12, H - 12);
    } else {
      ctx.fillText('Portail magique ouvert ! ✨', W - 12, H - 12);
    }
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

function _seededRNG(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
