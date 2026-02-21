// render-background.js — Background gradient, theme environment, and ambient particles (stars/embers/rain).
// Depends on: render-sprites.js

// ── Background gradient ──────────────────────────────────────────────

function drawBackground({ isUnicorn, isPacificRim, isDragon }) {
    const needsNewGradient =
        !_bgGradientCache ||
        _bgGradientH !== canvas.height ||
        _bgGradientTheme !== gameTheme;

    if (needsNewGradient) {
        if (isUnicorn) {
            _bgGradientCache = ctx.createLinearGradient(0, 0, 0, canvas.height);
            _bgGradientCache.addColorStop(0,   '#87CEEB');
            _bgGradientCache.addColorStop(0.3, '#FFB6C1');
            _bgGradientCache.addColorStop(0.6, '#DDA0DD');
            _bgGradientCache.addColorStop(1,   '#98FB98');
        } else if (isPacificRim) {
            _bgGradientCache = ctx.createLinearGradient(0, 0, 0, canvas.height);
            _bgGradientCache.addColorStop(0,    '#050d14');
            _bgGradientCache.addColorStop(0.55, '#0a1e2e');
            _bgGradientCache.addColorStop(0.75, '#0c2030');
            _bgGradientCache.addColorStop(1,    '#061820');
        } else if (isDragon) {
            _bgGradientCache = ctx.createLinearGradient(0, 0, 0, canvas.height);
            _bgGradientCache.addColorStop(0,    '#0a0505');
            _bgGradientCache.addColorStop(0.50, '#1a0a08');
            _bgGradientCache.addColorStop(0.80, '#2a0e04');
            _bgGradientCache.addColorStop(1,    '#3d1200');
        } else {
            _bgGradientCache = null; // space uses flat colour
        }
        _bgGradientH     = canvas.height;
        _bgGradientTheme = gameTheme;
    }

    ctx.fillStyle = _bgGradientCache || '#0a0015';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ── Dragon grotto environment ────────────────────────────────────────
// Drawn inside the play-area transform, before stars/embers.

function drawDragonEnvironment() {
    const pw = PLAY_AREA.width;
    const ph = PLAY_AREA.height;
    const fc = gameState.frameCount || 0;

    // Lava pool glow at the very bottom (thin strip — keeps gameplay area clear)
    const lavaGrad = ctx.createLinearGradient(0, ph * 0.95, 0, ph);
    lavaGrad.addColorStop(0,   'rgba(0,0,0,0)');
    lavaGrad.addColorStop(0.5, 'rgba(180,40,0,0.55)');
    lavaGrad.addColorStop(1,   'rgba(255,80,0,0.85)');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, ph * 0.95, pw, ph * 0.05);

    // Lava surface — irregular bubbling rock ledge
    ctx.fillStyle = 'rgba(20,6,2,0.98)';
    ctx.beginPath();
    ctx.moveTo(0, ph);
    [[0.02,-0.020],[0.05,-0.012],[0.09,-0.028],[0.13,-0.015],[0.17,-0.032],
     [0.21,-0.010],[0.25,-0.024],[0.29,-0.018],[0.33,-0.030],[0.37,-0.013],
     [0.41,-0.028],[0.45,-0.011],[0.49,-0.025],[0.53,-0.016],[0.57,-0.029],
     [0.61,-0.008],[0.65,-0.023],[0.69,-0.016],[0.73,-0.031],[0.77,-0.012],
     [0.81,-0.026],[0.85,-0.014],[0.89,-0.028],[0.93,-0.010],[0.97,-0.022],[1.0,-0.018]
    ].forEach(([fx, fy]) => ctx.lineTo(fx * pw, ph + fy * ph));
    ctx.lineTo(pw, ph); ctx.closePath(); ctx.fill();

    // Lava pool cracks with orange glow
    [[0.12,0.96,0.28,0.98],[0.35,0.97,0.55,0.96],[0.60,0.96,0.78,0.98],[0.82,0.96,0.96,0.98]]
    .forEach(([x1,y1,x2,y2], fi) => {
        const lGrad = ctx.createLinearGradient(x1*pw, y1*ph, x2*pw, y2*ph);
        const flk = Math.sin(fc * 0.07 + fi * 1.8) * 0.25 + 0.75;
        lGrad.addColorStop(0,   `rgba(255,100,0,0)`);
        lGrad.addColorStop(0.5, `rgba(255,160,0,${0.7 * flk})`);
        lGrad.addColorStop(1,   `rgba(255,100,0,0)`);
        ctx.strokeStyle = lGrad; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x1*pw, y1*ph); ctx.lineTo(x2*pw, y2*ph); ctx.stroke();
    });

    // Cave walls — dark rocky side columns
    ctx.fillStyle = 'rgba(12,5,3,0.98)';
    ctx.fillRect(0, 0, pw * 0.06, ph);
    ctx.fillRect(pw * 0.94, 0, pw * 0.06, ph);

    // Stalactites hanging from ceiling
    ctx.fillStyle = 'rgba(16,8,4,0.97)';
    [[0.04,0.22],[0.10,0.14],[0.17,0.28],[0.24,0.10],[0.31,0.19],
     [0.38,0.13],[0.44,0.24],[0.51,0.08],[0.57,0.20],[0.63,0.15],
     [0.70,0.26],[0.77,0.11],[0.83,0.18],[0.90,0.22],[0.96,0.12]
    ].forEach(([fx, fh], si) => {
        const bw = pw * (0.04 + (si % 3) * 0.01);
        const bh = ph * fh;
        ctx.beginPath();
        ctx.moveTo(fx * pw - bw / 2, 0);
        ctx.lineTo(fx * pw, bh);
        ctx.lineTo(fx * pw + bw / 2, 0);
        ctx.closePath(); ctx.fill();
    });

    // Torch flames on cave walls (flickering radial glows)
    [[0.07, 0.3],[0.07, 0.65],[0.93, 0.3],[0.93, 0.65]].forEach(([tfx, tfy], ti) => {
        const tx = tfx * pw, ty = tfy * ph;
        const flk = Math.sin(fc * 0.12 + ti * 2.1) * 0.30 + 0.70;
        const tGrad = ctx.createRadialGradient(tx, ty, 0, tx, ty, pw * 0.08 * flk);
        tGrad.addColorStop(0,    `rgba(255,200,50,${0.70 * flk})`);
        tGrad.addColorStop(0.35, `rgba(255,80,0,${0.35 * flk})`);
        tGrad.addColorStop(1,    'rgba(0,0,0,0)');
        ctx.fillStyle = tGrad;
        ctx.fillRect(tx - pw * 0.1, ty - ph * 0.08, pw * 0.2, ph * 0.16);
    });

    // Stalagmites rising from lava (inside lava strip only)
    ctx.fillStyle = 'rgba(14,6,2,0.97)';
    [[0.08,0.018],[0.19,0.013],[0.30,0.020],[0.42,0.015],[0.50,0.022],
     [0.60,0.014],[0.71,0.018],[0.82,0.013],[0.92,0.020]
    ].forEach(([fx, fh]) => {
        const sw = pw * 0.028;
        const sh = ph * fh;
        const baseY = ph * 0.975;
        ctx.beginPath();
        ctx.moveTo(fx * pw - sw / 2, baseY);
        ctx.lineTo(fx * pw, baseY - sh);
        ctx.lineTo(fx * pw + sw / 2, baseY);
        ctx.closePath(); ctx.fill();
    });
}

// ── Pacific Rim city ruins environment ───────────────────────────────
// Drawn inside the play-area transform, mixed with rain/star pass.

function drawPacificRimEnvironment() {
    const pw = PLAY_AREA.width;
    const ph = PLAY_AREA.height;
    const gY = ph * 0.96;
    const fc = gameState.frameCount || 0;

    // Distant horizon fire-glow (burning ocean reflection)
    const hGrad = ctx.createLinearGradient(0, ph * 0.60, 0, ph * 0.82);
    hGrad.addColorStop(0,   'rgba(0,0,0,0)');
    hGrad.addColorStop(0.6, 'rgba(90,28,6,0.38)');
    hGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, ph * 0.60, pw, ph * 0.22);

    // Far background ruins — tall dark skeletons
    ctx.fillStyle = 'rgba(7,15,22,0.95)';
    [[0.00,0.06,0.36],[0.07,0.04,0.46],[0.12,0.08,0.31],[0.21,0.05,0.52],
     [0.27,0.06,0.40],[0.34,0.05,0.56],[0.40,0.08,0.33],[0.49,0.05,0.49],
     [0.55,0.07,0.43],[0.63,0.06,0.52],[0.70,0.08,0.34],[0.79,0.05,0.47],
     [0.85,0.07,0.42],[0.93,0.06,0.54],[0.98,0.09,0.37]
    ].forEach(([fx, fw, fh]) => {
        ctx.fillRect(fx * pw, gY - fh * ph, fw * pw, fh * ph + 30);
    });

    // Mid-ground destroyed buildings — polygon ruins with jagged broken tops
    const ruinDefs = [
        [0.00, 0.068, 0.22, [[0,0],[.15,.90],[.28,.80],[.42,.95],[.55,.75],[.70,.88],[.85,.78],[1,0]]],
        [0.07, 0.135, 0.10, [[0,0],[.2,.72],[.38,.88],[.55,.65],[.72,.80],[.88,.60],[1,0]]],
        [0.14, 0.215, 0.30, [[0,0],[.12,.85],[.25,.95],[.38,.80],[.50,.90],[.65,.75],[.78,.88],[.92,.70],[1,0]]],
        [0.22, 0.290, 0.14, [[0,0],[.18,.78],[.33,.90],[.48,.72],[.62,.85],[.78,.68],[.92,.80],[1,0]]],
        [0.30, 0.385, 0.38, [[0,0],[.08,.78],[.18,.92],[.28,.82],[.40,.97],[.52,.84],[.63,.93],[.75,.80],[.87,.90],[1,0]]],
        [0.39, 0.470, 0.20, [[0,0],[.15,.82],[.30,.92],[.45,.76],[.60,.88],[.75,.72],[.90,.85],[1,0]]],
        [0.48, 0.545, 0.12, [[0,0],[.22,.74],[.40,.88],[.58,.70],[.75,.82],[.90,.65],[1,0]]],
        [0.55, 0.635, 0.33, [[0,0],[.10,.80],[.22,.93],[.35,.84],[.47,.96],[.60,.81],[.72,.90],[.85,.76],[1,0]]],
        [0.64, 0.720, 0.18, [[0,0],[.18,.80],[.35,.92],[.52,.75],[.68,.87],[.84,.70],[1,0]]],
        [0.73, 0.815, 0.40, [[0,0],[.08,.75],[.18,.90],[.30,.82],[.42,.96],[.55,.85],[.65,.92],[.78,.80],[.90,.87],[1,0]]],
        [0.82, 0.890, 0.13, [[0,0],[.20,.78],[.38,.88],[.55,.72],[.72,.84],[.88,.68],[1,0]]],
        [0.90, 0.975, 0.28, [[0,0],[.12,.82],[.25,.93],[.38,.80],[.52,.91],[.65,.78],[.78,.88],[.92,.74],[1,0]]],
        [0.98, 1.065, 0.22, [[0,0],[.15,.85],[.30,.95],[.45,.78],[.60,.90],[.75,.76],[.90,.88],[1,0]]],
    ];
    ctx.fillStyle = 'rgba(14,27,35,0.98)';
    ruinDefs.forEach(([lx, rx, hy, profile]) => {
        const bW = (rx - lx) * pw;
        const bH = hy * ph;
        ctx.beginPath();
        ctx.moveTo(lx * pw, gY);
        profile.forEach(([px, py]) => ctx.lineTo(lx * pw + px * bW, gY - py * bH));
        ctx.lineTo(rx * pw, gY);
        ctx.closePath(); ctx.fill();
    });

    // Exposed rebar / structural beams
    ctx.strokeStyle = 'rgba(30,45,55,1)'; ctx.lineWidth = 3;
    [[0.04,0.21, 0.035,0.25],[0.16,0.29, 0.145,0.33],[0.31,0.37, 0.295,0.42],
     [0.57,0.32, 0.555,0.37],[0.76,0.38, 0.748,0.44],[0.94,0.27, 0.928,0.31]
    ].forEach(([fx1,fy1,fx2,fy2]) => {
        ctx.beginPath();
        ctx.moveTo(fx1*pw, gY - fy1*ph);
        ctx.lineTo(fx2*pw, gY - fy2*ph);
        ctx.stroke();
    });

    // Ground rubble layer
    ctx.fillStyle = 'rgba(18,33,42,1)';
    ctx.beginPath();
    ctx.moveTo(0, gY);
    [[0.02,-0.016],[0.05,-0.010],[0.08,-0.022],[0.12,-0.013],[0.16,-0.028],
     [0.20,-0.012],[0.24,-0.021],[0.28,-0.015],[0.32,-0.025],[0.36,-0.011],
     [0.40,-0.026],[0.44,-0.009],[0.48,-0.022],[0.52,-0.013],[0.56,-0.024],
     [0.60,-0.010],[0.64,-0.021],[0.68,-0.014],[0.72,-0.027],[0.76,-0.010],
     [0.80,-0.022],[0.84,-0.013],[0.88,-0.025],[0.92,-0.009],[0.96,-0.020],
     [0.99,-0.014],[1.00,-0.018]
    ].forEach(([fx, fy]) => ctx.lineTo(fx * pw, gY + fy * ph));
    ctx.lineTo(pw, gY + ph * 0.04); ctx.lineTo(0, gY + ph * 0.04);
    ctx.closePath(); ctx.fill();

    // Flooded street — dark seawater pooling
    const waterY = gY - ph * 0.008;
    const wGrad = ctx.createLinearGradient(0, waterY, 0, ph);
    wGrad.addColorStop(0, 'rgba(0,30,50,0.88)');
    wGrad.addColorStop(1, 'rgba(0,12,22,0.98)');
    ctx.fillStyle = wGrad;
    ctx.fillRect(0, waterY, pw, ph - waterY);
    // Water shimmer lines
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = 'rgba(0,100,160,0.55)'; ctx.lineWidth = 1;
    for (let wi = 0; wi < 6; wi++) {
        const wOff = Math.sin(fc * 0.015 + wi * 1.2) * ph * 0.003;
        ctx.beginPath();
        ctx.moveTo(0,  waterY + ph * 0.005 + wi * ph * 0.007 + wOff);
        ctx.lineTo(pw, waterY + ph * 0.005 + wi * ph * 0.007 + wOff);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Fires — animated glowing blazes at ruin collapse points
    [[0.068,0.10,0.018],[0.215,0.14,0.015],[0.385,0.35,0.024],
     [0.47,0.08,0.014],[0.635,0.10,0.017],[0.815,0.37,0.027],
     [0.975,0.26,0.020],[1.055,0.09,0.016]
    ].forEach(([ffx, ffy, ffs], fi) => {
        const fx = ffx * pw;
        const fy = gY - ffy * ph;
        const fsize = ffs * pw;
        const flicker = Math.sin(fc * 0.10 + fi * 2.4) * 0.30 + 0.70;
        const fGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fsize * 2.8 * flicker);
        fGrad.addColorStop(0,    `rgba(255,215,70,${0.80 * flicker})`);
        fGrad.addColorStop(0.30, `rgba(255,90,10,${0.50 * flicker})`);
        fGrad.addColorStop(0.65, `rgba(110,18,0,${0.22 * flicker})`);
        fGrad.addColorStop(1,    'rgba(0,0,0,0)');
        ctx.fillStyle = fGrad;
        ctx.fillRect(fx - fsize * 3.5, fy - fsize * 3.5, fsize * 7, fsize * 7);
        // Bright ember core
        ctx.fillStyle = `rgba(255,245,160,${0.75 * flicker})`;
        ctx.beginPath(); ctx.arc(fx, fy, fsize * 0.22 * flicker, 0, Math.PI * 2); ctx.fill();
    });

    // Low-hanging smog clouds
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = 'rgba(5,12,18,1)';
    [[0.10, 0.30, 0.18, 0.055],[0.36, 0.25, 0.16, 0.048],
     [0.62, 0.36, 0.20, 0.062],[0.84, 0.28, 0.17, 0.052]
    ].forEach(([sfx, sfy, sfw, sfh]) => {
        ctx.beginPath();
        ctx.ellipse(sfx*pw, gY - sfy*ph, sfw*pw, sfh*ph, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ── Ambient particles (stars / embers / rain) ────────────────────────
// Must be called inside the play-area transform.

function drawStars({ isUnicorn, isPacificRim, isDragon }) {
    if (isUnicorn) {
        for (let i = 0; i < gameState.stars.length; i++) {
            const s = gameState.stars[i];
            const sz = Math.round(s.size * 8);
            if (sz < 1) continue;
            ctx.globalAlpha = s.size / 2 + 0.3;
            ctx.drawImage(_getSparkleSprite(sz), s.x, s.y);
        }
        ctx.globalAlpha = 1;

    } else if (isDragon) {
        // Floating embers drifting upward
        for (let i = 0; i < gameState.stars.length; i++) {
            const s = gameState.stars[i];
            const alpha = s.size * 0.5 + 0.1;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = s.size > 1.5 ? '#ff8800' : s.size > 1.0 ? '#ff4400' : '#ff2200';
            const r = s.size * 1.5 + 0.5;
            ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

    } else if (isPacificRim) {
        // Rain streaks — diagonal lines
        ctx.strokeStyle = 'rgba(100,180,220,0.25)'; ctx.lineWidth = 1;
        for (let i = 0; i < gameState.stars.length; i++) {
            const s = gameState.stars[i];
            ctx.globalAlpha = s.size * 0.25;
            const len = s.size * 18 + 8;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x + len * 0.15, s.y + len);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

    } else {
        // Space — white pixel stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < gameState.stars.length; i++) {
            const s = gameState.stars[i];
            ctx.globalAlpha = s.size / 2;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;
    }
}
