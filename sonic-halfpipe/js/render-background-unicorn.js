// render-background-unicorn.js — Canvas-drawn fantasy castle skyline for Sonic Half-Pipe.
// Paints a 2048×1024 canvas (moon, rainbow, stars, clouds, castle silhouette) and
// drapes it over a large fog-exempt background plane in the Three.js scene.
// Depends on: render.js (gameState), state.js

let _unicornBgMesh = null;

// ── Tiny seeded PRNG (Mulberry32) for deterministic star placement ─────────
function _m32(seed) {
    return function () {
        seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ── Canvas scene painter ──────────────────────────────────────────────────
function _paintUnicornScene() {
    const W = 2048, H = 1024;
    const cv  = document.createElement('canvas');
    cv.width  = W;
    cv.height = H;
    const ctx = cv.getContext('2d');

    // ── Sky gradient ──────────────────────────────────────────────────────
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0.00, '#07001a');
    sky.addColorStop(0.22, '#280050');
    sky.addColorStop(0.52, '#65006a');
    sky.addColorStop(0.80, '#aa1060');
    sky.addColorStop(1.00, '#dd3080');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // ── Large glowing moon ────────────────────────────────────────────────
    const mx = W * 0.73, my = H * 0.20;
    // Outer halo
    const moonHalo = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
    moonHalo.addColorStop(0.00, 'rgba(255,230,255,0.80)');
    moonHalo.addColorStop(0.45, 'rgba(220,100,255,0.30)');
    moonHalo.addColorStop(1.00, 'rgba(80,0,160,0.00)');
    ctx.fillStyle = moonHalo;
    ctx.beginPath();
    ctx.arc(mx, my, 180, 0, Math.PI * 2);
    ctx.fill();
    // Solid disc
    ctx.fillStyle = '#fff4ff';
    ctx.globalAlpha = 0.94;
    ctx.beginPath();
    ctx.arc(mx, my, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Soft inner shine
    const moonShine = ctx.createRadialGradient(mx - 18, my - 18, 0, mx, my, 68);
    moonShine.addColorStop(0.0, 'rgba(255,255,255,0.55)');
    moonShine.addColorStop(1.0, 'rgba(200,150,255,0.00)');
    ctx.fillStyle = moonShine;
    ctx.beginPath();
    ctx.arc(mx, my, 68, 0, Math.PI * 2);
    ctx.fill();

    // ── Rainbow arch ──────────────────────────────────────────────────────
    const rbColors = ['#ff0055','#ff6600','#ffdd00','#33ff44','#0077ff','#8800ff','#ff44ff'];
    const rbCX = W * 0.50, rbCY = H * 1.08, rbR = W * 0.52;
    rbColors.forEach((col, i) => {
        ctx.beginPath();
        ctx.arc(rbCX, rbCY, rbR - i * 20, Math.PI * 1.10, Math.PI * 1.90, false);
        ctx.strokeStyle = col;
        ctx.lineWidth   = 16;
        ctx.globalAlpha = 0.38;
        ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // ── Stars ─────────────────────────────────────────────────────────────
    const rng      = _m32(42);
    const starPal  = ['#ffffff','#ffcce8','#ffd700','#cc88ff','#88ddff','#ffaacc','#aaffcc'];

    // Round stars
    for (let i = 0; i < 260; i++) {
        const sx = rng() * W;
        const sy = rng() * H * 0.72;
        const sr = 0.7 + rng() * 2.1;
        ctx.fillStyle   = starPal[Math.floor(rng() * starPal.length)];
        ctx.globalAlpha = 0.35 + rng() * 0.65;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 4-point sparkle crosses
    for (let i = 0; i < 45; i++) {
        const sx  = rng() * W;
        const sy  = rng() * H * 0.68;
        const sr  = 3.5 + rng() * 6.5;
        const col = starPal[Math.floor(rng() * starPal.length)];
        ctx.save();
        ctx.translate(sx, sy);
        ctx.fillStyle   = col;
        ctx.globalAlpha = 0.55 + rng() * 0.45;
        ctx.beginPath();
        for (let p = 0; p < 4; p++) {
            const a  = (p / 4) * Math.PI * 2 - Math.PI / 4;
            const r2 = sr * 0.22;
            ctx.lineTo(Math.cos(a)              * sr,  Math.sin(a)              * sr);
            ctx.lineTo(Math.cos(a + Math.PI / 4) * r2, Math.sin(a + Math.PI / 4) * r2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    ctx.globalAlpha = 1;

    // ── Clouds ────────────────────────────────────────────────────────────
    function drawCloud(x, y, sc) {
        const puffs = [
            [0,0,82], [-65,14,63], [65,12,61],
            [-30,-26,53], [32,-22,50], [-95,20,44], [96,18,44],
        ];
        puffs.forEach(([dx, dy, r]) => {
            const g = ctx.createRadialGradient(
                x + dx * sc, y + dy * sc, 0,
                x + dx * sc, y + dy * sc, r * sc
            );
            g.addColorStop(0, 'rgba(255,210,245,0.48)');
            g.addColorStop(1, 'rgba(180,80,200,0.00)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x + dx * sc, y + dy * sc, r * sc, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    drawCloud(W * 0.13, H * 0.31, 1.30);
    drawCloud(W * 0.83, H * 0.37, 1.05);
    drawCloud(W * 0.46, H * 0.16, 0.78);

    // ── Castle silhouette ─────────────────────────────────────────────────
    const GY = Math.floor(H * 0.80);   // horizon / ground line

    function castleGrad(lighter) {
        const g = ctx.createLinearGradient(0, GY - 500, 0, GY);
        g.addColorStop(0, lighter ? '#7a1a9a' : '#440870');
        g.addColorStop(1, lighter ? '#310070' : '#190040');
        return g;
    }

    // Main wall body
    ctx.fillStyle = castleGrad(false);
    ctx.fillRect(W * 0.245, GY - 222, W * 0.510, 222);

    // Wall crenellations (merlons)
    ctx.fillStyle = castleGrad(true);
    const wmc  = 16;
    const wmW  = (W * 0.510) / (2 * wmc - 1);
    for (let i = 0; i < wmc; i++) {
        ctx.fillRect(W * 0.245 + i * 2 * wmW, GY - 222 - 30, wmW, 32);
    }

    // Gate arch (dark cut-out)
    const gx = W * 0.50, gW = 96, gH = 148;
    ctx.fillStyle = '#07001a';
    ctx.beginPath();
    ctx.moveTo(gx - gW / 2, GY + 4);
    ctx.lineTo(gx - gW / 2, GY - gH * 0.55);
    ctx.arc(gx, GY - gH * 0.55, gW / 2, Math.PI, 0, false);
    ctx.lineTo(gx + gW / 2, GY + 4);
    ctx.closePath();
    ctx.fill();

    // Gate magical glow
    const gateG = ctx.createRadialGradient(gx, GY - gH * 0.38, 0, gx, GY - gH * 0.38, gW * 1.5);
    gateG.addColorStop(0, 'rgba(180,0,255,0.50)');
    gateG.addColorStop(1, 'rgba(180,0,255,0.00)');
    ctx.fillStyle = gateG;
    ctx.beginPath();
    ctx.arc(gx, GY - gH * 0.38, gW * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // ── Tower builder ─────────────────────────────────────────────────────
    function drawTower(cx, baseY, tw, th, merlons) {
        // Body
        ctx.fillStyle = castleGrad(false);
        ctx.fillRect(cx - tw / 2, baseY - th, tw, th);

        // Battlements
        ctx.fillStyle = castleGrad(true);
        const bw = tw / (2 * merlons - 1);
        for (let i = 0; i < merlons; i++) {
            ctx.fillRect(cx - tw / 2 + i * 2 * bw, baseY - th - 30, bw, 32);
        }

        // Conical spire
        ctx.fillStyle = castleGrad(true);
        const spireTop = baseY - th - tw * 0.78;
        ctx.beginPath();
        ctx.moveTo(cx,              spireTop);
        ctx.lineTo(cx - tw / 2 - 6, baseY - th);
        ctx.lineTo(cx + tw / 2 + 6, baseY - th);
        ctx.closePath();
        ctx.fill();

        // Spire pink outline
        ctx.save();
        ctx.strokeStyle = '#FF44CC';
        ctx.lineWidth   = 2.5;
        ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.moveTo(cx,              spireTop);
        ctx.lineTo(cx - tw / 2 - 6, baseY - th);
        ctx.lineTo(cx + tw / 2 + 6, baseY - th);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Flag pole + pennant
        const flagY = spireTop - 6;
        ctx.fillStyle = '#FF44CC';
        ctx.fillRect(cx - 1.5, flagY - 44, 3, 44);
        ctx.fillStyle = '#FF88EE';
        ctx.beginPath();
        ctx.moveTo(cx + 1,  flagY - 44);
        ctx.lineTo(cx + 26, flagY - 32);
        ctx.lineTo(cx + 1,  flagY - 20);
        ctx.closePath();
        ctx.fill();
    }

    // ── Glowing window helper ─────────────────────────────────────────────
    function drawGlowWindow(cx, cy, r) {
        const wg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.8);
        wg.addColorStop(0, 'rgba(255,220,50,0.70)');
        wg.addColorStop(1, 'rgba(255,220,50,0.00)');
        ctx.fillStyle = wg;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle   = 'rgba(255,220,50,0.92)';
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // ── Draw towers back-to-front (far flankers first) ────────────────────
    drawTower(W * 0.20, GY - 18, 92,  220, 3);   // far left
    drawTower(W * 0.80, GY - 18, 92,  220, 3);   // far right
    drawTower(W * 0.32, GY,      122, 312, 4);   // mid left
    drawTower(W * 0.68, GY,      122, 312, 4);   // mid right
    drawTower(W * 0.50, GY,      175, 430, 5);   // centre (tallest)

    // Windows
    [
        [W * 0.50, GY - 192, 13],
        [W * 0.50, GY - 305, 11],
        [W * 0.32, GY - 158, 10],
        [W * 0.68, GY - 158, 10],
        [W * 0.20, GY - 108,  8],
        [W * 0.80, GY - 108,  8],
        [W * 0.38, GY - 102,  9],
        [W * 0.62, GY - 102,  9],
    ].forEach(([cx, cy, r]) => drawGlowWindow(cx, cy, r));

    // ── Horizon atmospheric glow ──────────────────────────────────────────
    const groundFade = ctx.createLinearGradient(0, GY - 12, 0, H);
    groundFade.addColorStop(0.00, 'rgba(140,0,200,0.25)');
    groundFade.addColorStop(0.40, 'rgba(80,0,160,0.14)');
    groundFade.addColorStop(1.00, 'rgba(7,0,25,0.92)');
    ctx.fillStyle = groundFade;
    ctx.fillRect(0, GY - 12, W, H - (GY - 12));

    // Subtle wide lens-flare glow centred on castle
    const centreGlow = ctx.createRadialGradient(W / 2, GY, 0, W / 2, GY, W * 0.45);
    centreGlow.addColorStop(0, 'rgba(180,0,255,0.12)');
    centreGlow.addColorStop(1, 'rgba(180,0,255,0.00)');
    ctx.fillStyle = centreGlow;
    ctx.fillRect(0, 0, W, H);

    return cv;
}

// ── Build / show / hide ───────────────────────────────────────────────────

function buildUnicornBackground() {
    const canvas = _paintUnicornScene();
    const tex    = new THREE.CanvasTexture(canvas);

    const geo  = new THREE.PlaneGeometry(13000, 7200);
    const mat  = new THREE.MeshBasicMaterial({
        map:        tex,
        depthTest:  false,
        depthWrite: false,
        fog:        false,   // always fully visible — not affected by scene fog
    });

    const mesh      = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 900, -4900);
    mesh.renderOrder = -1;
    return mesh;
}

function showUnicornBackground() {
    if (!gameState.scene) return;
    hideUnicornBackground();
    _unicornBgMesh = buildUnicornBackground();
    gameState.scene.add(_unicornBgMesh);
}

function hideUnicornBackground() {
    if (_unicornBgMesh) {
        if (gameState.scene) gameState.scene.remove(_unicornBgMesh);
        _unicornBgMesh = null;
    }
}
