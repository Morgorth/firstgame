// All canvas rendering: backgrounds, players, enemies, bullets, powerups, effects.

// Cached Image objects for player face icons (camera mode)
const _faceImageCache = {};

// ── Pre-rendered sprite cache (avoids per-frame emoji text / gradient work) ──

const _spriteCache = {};

function _ensureSprite(key, width, height, drawFn) {
    if (_spriteCache[key]) return _spriteCache[key];
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const cx = c.getContext('2d');
    drawFn(cx, width, height);
    _spriteCache[key] = c;
    return c;
}

function _getSparkleSprite(size) {
    const key = 'sparkle_' + size;
    return _ensureSprite(key, size + 4, size + 4, (cx, w, h) => {
        cx.font = `${size}px Arial`;
        cx.textBaseline = 'top';
        cx.fillText('\u2728', 0, 0);
    });
}

function _getHeartSprite() {
    return _ensureSprite('heart16', 20, 20, (cx) => {
        cx.font = '16px Arial';
        cx.textBaseline = 'top';
        cx.fillText('\uD83D\uDC96', 0, 0);
    });
}

function _getStarEmojiSprite() {
    return _ensureSprite('star40', 44, 44, (cx) => {
        cx.font = '40px Arial';
        cx.textBaseline = 'top';
        cx.textAlign = 'center';
        cx.fillText('\uD83C\uDF1F', 22, 0);
    });
}

// Cached background gradient (invalidated on resize)
let _bgGradientCache = null;
let _bgGradientH = 0;

// ── Theme-specific sprite drawing ───────────────────────────────────

// Pre-rendered unicorn sprite (drawn once, stamped via drawImage)
let _unicornSpriteCanvas = null;
let _unicornSpriteSize = 0;

function _getUnicornSprite() {
    if (_unicornSpriteCanvas) return _unicornSpriteCanvas;
    const c = document.createElement('canvas');
    // Draw at size 1.0 with padding; the sprite covers -20..20 x and -35..25 y
    const pad = 4;
    const w = 44 + pad * 2, h = 64 + pad * 2;
    c.width = w; c.height = h;
    const cx = c.getContext('2d');
    cx.translate(22 + pad, 37 + pad); // center origin

    cx.fillStyle = '#FFB6C1';
    // Head
    cx.beginPath(); cx.arc(0, 5, 18, 0, Math.PI * 2); cx.fill();
    // Ear
    cx.beginPath(); cx.moveTo(-12, -8); cx.lineTo(-8, -20); cx.lineTo(-4, -8); cx.closePath(); cx.fill();
    // Horn
    const hornGrad = cx.createLinearGradient(-2, -15, 2, -35);
    hornGrad.addColorStop(0, '#FFD700');
    hornGrad.addColorStop(0.5, '#FF69B4');
    hornGrad.addColorStop(1, '#87CEEB');
    cx.fillStyle = hornGrad;
    cx.beginPath(); cx.moveTo(-4, -15); cx.lineTo(0, -35); cx.lineTo(4, -15); cx.closePath(); cx.fill();
    // Eye
    cx.fillStyle = '#000';
    cx.beginPath(); cx.arc(6, 2, 4, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.arc(7, 1, 1.5, 0, Math.PI * 2); cx.fill();
    // Mane
    cx.fillStyle = '#FF6B6B'; cx.beginPath(); cx.ellipse(-15, -5, 8, 12, 0.3, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#FFE66D'; cx.beginPath(); cx.ellipse(-18, 5, 7, 10, 0.2, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#4ECDC4'; cx.beginPath(); cx.ellipse(-16, 15, 6, 8, 0.1, 0, Math.PI * 2); cx.fill();

    _unicornSpriteCanvas = c;
    return c;
}

function drawUnicorn(x, y, size) {
    const sprite = _getUnicornSprite();
    const pad = 4;
    const w = sprite.width, h = sprite.height;
    ctx.drawImage(sprite, x - (22 + pad) * size, y - (37 + pad) * size, w * size, h * size);
}

function drawWolf(x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);

    ctx.fillStyle = color;

    // Head
    ctx.beginPath(); ctx.arc(0, 5, 22, 0, Math.PI * 2); ctx.fill();
    // Snout
    ctx.fillStyle = '#D3D3D3';
    ctx.beginPath(); ctx.ellipse(0, 18, 10, 8, 0, 0, Math.PI * 2); ctx.fill();

    // Ears
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-18, -10); ctx.lineTo(-12, -28); ctx.lineTo(-6, -10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18, -10); ctx.lineTo(12, -28); ctx.lineTo(6, -10); ctx.closePath(); ctx.fill();
    // Inner ears
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(-12, -22); ctx.lineTo(-9, -10); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(12, -22); ctx.lineTo(9, -10); ctx.closePath(); ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-8, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-7, -1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -1, 2, 0, Math.PI * 2); ctx.fill();

    // Nose
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(0, 15, 4, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
}

// ── Pacific Rim theme drawing ───────────────────────────────────────

// Jaeger (player) — P1: blue/silver Gipsy Danger, P2: red/gold Crimson Typhoon
function drawJaeger(pos, playerIndex) {
    const isPR2 = playerIndex === 1;
    const primary   = isPR2 ? '#cc2200' : '#0066cc';
    const secondary = isPR2 ? '#ffaa00' : '#00ccff';
    const visor     = isPR2 ? '#ff6600' : '#00ffff';

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Legs
    ctx.fillStyle = primary;
    ctx.fillRect(-9, 10, 7, 14);
    ctx.fillRect(2, 10, 7, 14);

    // Torso
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-14, -5); ctx.lineTo(-12, 10); ctx.lineTo(12, 10); ctx.lineTo(14, -5);
    ctx.lineTo(10, -12); ctx.lineTo(-10, -12);
    ctx.closePath(); ctx.fill();

    // Chest detail
    ctx.fillStyle = secondary;
    ctx.fillRect(-5, -8, 10, 8);

    // Shoulders
    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.arc(-16, -8, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(16, -8, 7, 0, Math.PI * 2); ctx.fill();

    // Arms
    ctx.fillStyle = primary;
    ctx.fillRect(-20, -4, 6, 12);
    ctx.fillRect(14, -4, 6, 12);

    // Head
    ctx.fillStyle = primary;
    ctx.fillRect(-8, -24, 16, 13);

    // Visor glow
    const visorPulse = Math.sin((gameState.frameCount || 0) * 0.08) * 0.3 + 0.7;
    ctx.fillStyle = visor;
    ctx.globalAlpha = visorPulse;
    ctx.fillRect(-6, -22, 12, 5);
    ctx.globalAlpha = 1;

    // Conn-Pod (top knot)
    ctx.fillStyle = secondary;
    ctx.fillRect(-4, -28, 8, 5);

    ctx.restore();
}

// Kaiju (enemies) — monsters of various types
function drawKaiju(e, sc) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(sc, sc);

    const biolumPulse = Math.sin((gameState.frameCount || 0) * 0.12) * 0.5 + 0.5;

    if (e.type === 'basic') {
        // Category II — hunched bruiser (Leatherback-like)
        ctx.fillStyle = '#2a5a2a';
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(-22, -5); ctx.lineTo(-25, 18);
        ctx.lineTo(0, 25); ctx.lineTo(25, 18); ctx.lineTo(22, -5);
        ctx.closePath(); ctx.fill();
        // Bioluminescent vents
        ctx.fillStyle = `rgba(0,255,80,${0.4 + biolumPulse * 0.5})`;
        ctx.beginPath(); ctx.ellipse(-10, 5, 4, 8, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(10, 5, 4, 8, -0.3, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = `rgba(0,255,80,${0.7 + biolumPulse * 0.3})`;
        ctx.beginPath(); ctx.arc(-8, -8, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -8, 5, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'fast') {
        // Category I — sleek quad runner (Raiju-like)
        ctx.fillStyle = '#1a3a4a';
        ctx.beginPath();
        ctx.moveTo(0, -28); ctx.lineTo(-14, -5); ctx.lineTo(-16, 18);
        ctx.lineTo(16, 18); ctx.lineTo(14, -5);
        ctx.closePath(); ctx.fill();
        // Streamlined fin
        ctx.beginPath(); ctx.moveTo(-14, -5); ctx.lineTo(-22, -12); ctx.lineTo(-14, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(22, -12); ctx.lineTo(14, 0); ctx.fill();
        // Glowing eye stripe
        ctx.fillStyle = `rgba(0,200,255,${0.6 + biolumPulse * 0.4})`;
        ctx.fillRect(-10, -14, 20, 5);

    } else if (e.type === 'shifter') {
        // Category III — tentacled phaser (Otachi-like)
        ctx.fillStyle = '#3a1a4a';
        ctx.beginPath();
        ctx.moveTo(0, -18); ctx.lineTo(-12, 0); ctx.lineTo(0, 20); ctx.lineTo(12, 0);
        ctx.closePath(); ctx.fill();
        // Tentacle fins
        ctx.fillStyle = '#5a2a6a';
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-22, -8); ctx.lineTo(-18, 10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(22, -8); ctx.lineTo(18, 10); ctx.fill();
        // Phase glow
        ctx.fillStyle = `rgba(180,0,255,${biolumPulse * 0.8})`;
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'tank') {
        // Category IV — armored titan (Knifehead-like)
        ctx.fillStyle = '#3a2a1a';
        // Massive body
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(-32, -15); ctx.lineTo(-38, 22);
        ctx.lineTo(-22, 30); ctx.lineTo(22, 30); ctx.lineTo(38, 22); ctx.lineTo(32, -15);
        ctx.closePath(); ctx.fill();
        // Armored brow plates
        ctx.fillStyle = '#5a3a1a';
        ctx.beginPath(); ctx.moveTo(-20, -28); ctx.lineTo(0, -40); ctx.lineTo(20, -28); ctx.fill();
        // Biolum belly
        ctx.fillStyle = `rgba(255,80,0,${0.3 + biolumPulse * 0.4})`;
        ctx.beginPath(); ctx.ellipse(0, 12, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = `rgba(255,60,0,${0.8 + biolumPulse * 0.2})`;
        ctx.beginPath(); ctx.arc(-12, -10, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(12, -10, 7, 0, Math.PI * 2); ctx.fill();

    } else {
        // Category V Boss — Slattern (triple tail, massive)
        // Main body
        ctx.fillStyle = '#1a1a3a';
        ctx.beginPath();
        ctx.moveTo(0, -55); ctx.lineTo(-55, -25); ctx.lineTo(-65, 28);
        ctx.lineTo(-45, 48); ctx.lineTo(45, 48); ctx.lineTo(65, 28); ctx.lineTo(55, -25);
        ctx.closePath(); ctx.fill();
        // Triple forehead crests
        ctx.fillStyle = '#2a2a5a';
        ctx.beginPath(); ctx.moveTo(-16, -52); ctx.lineTo(-8, -70); ctx.lineTo(0, -52); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(8, -70); ctx.lineTo(16, -52); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-26, -44); ctx.lineTo(-18, -60); ctx.lineTo(-10, -44); ctx.fill();
        // Tail spikes (side cannons)
        ctx.fillStyle = '#3a3a6a';
        ctx.fillRect(-78, -12, 18, 44);
        ctx.fillRect(60, -12, 18, 44);
        // Eyes — four, bioluminescent blue
        const eyeColor = `rgba(0,150,255,${0.7 + biolumPulse * 0.3})`;
        ctx.fillStyle = eyeColor;
        ctx.beginPath(); ctx.arc(-22, -8, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(22, -8, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-10, -22, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -22, 6, 0, Math.PI * 2); ctx.fill();
        // Pulsing PPDC blue core
        ctx.fillStyle = `rgba(0,200,255,${biolumPulse * 0.7})`;
        ctx.beginPath(); ctx.arc(0, 20, 16, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
}

// ── Space-theme ship drawing ────────────────────────────────────────

function drawSpaceShip(pos, playerIndex) {
    const colors = PLAYER_COLORS[playerIndex] || PLAYER_COLORS[0];
    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Hull
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.moveTo(0, -20); ctx.lineTo(-12, 8); ctx.lineTo(-8, 12);
    ctx.lineTo(8, 12); ctx.lineTo(12, 8);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = colors.secondary;
    ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI * 2); ctx.fill();

    // Wings
    ctx.fillStyle = colors.primary;
    ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(-18, 0); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, 8); ctx.lineTo(18, 0); ctx.lineTo(12, 0); ctx.closePath(); ctx.fill();

    // Engines
    ctx.fillStyle = colors.engine;
    ctx.fillRect(-6, 12, 4, 6);
    ctx.fillRect(2, 12, 4, 6);

    ctx.restore();
}

function drawSpaceEnemy(e, sc) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(sc, sc);
    ctx.fillStyle = e.color;

    if (e.type === 'basic') {
        ctx.beginPath();
        ctx.moveTo(0, -25); ctx.lineTo(-20, -10); ctx.lineTo(-25, 15);
        ctx.lineTo(-15, 20); ctx.lineTo(15, 20); ctx.lineTo(25, 15); ctx.lineTo(20, -10);
        ctx.closePath(); ctx.fill();
        // Wing tips
        ctx.beginPath(); ctx.moveTo(-25, 15); ctx.lineTo(-30, 10); ctx.lineTo(-25, 5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(25, 15); ctx.lineTo(30, 10); ctx.lineTo(25, 5); ctx.fill();
        // Core
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'fast') {
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(-15, 0); ctx.lineTo(-12, 15);
        ctx.lineTo(12, 15); ctx.lineTo(15, 0);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-25, -5); ctx.lineTo(-20, 5); ctx.fill();
        ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(25, -5); ctx.lineTo(20, 5); ctx.fill();
        ctx.fillStyle = '#00ff00';
        ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI * 2); ctx.fill();
    } else if (e.type === 'shifter') {
        // Shifter — sleek diamond/dart shape
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(-14, 0); ctx.lineTo(0, 20); ctx.lineTo(14, 0);
        ctx.closePath(); ctx.fill();
        // Flickering core
        ctx.fillStyle = gameState.frameCount % 6 < 3 ? '#dd66ff' : '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        // Side fins
        ctx.fillStyle = e.color;
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-20, -5); ctx.lineTo(-14, -8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(20, -5); ctx.lineTo(14, -8); ctx.fill();
    } else if (e.type === 'boss') {
        // Boss — large hull with red eye sockets and pulsing core
        // Main hull
        ctx.beginPath();
        ctx.moveTo(0, -50); ctx.lineTo(-50, -25); ctx.lineTo(-60, 30);
        ctx.lineTo(-40, 45); ctx.lineTo(40, 45); ctx.lineTo(60, 30); ctx.lineTo(50, -25);
        ctx.closePath(); ctx.fill();
        // Side cannons
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(-70, -10, 15, 40);
        ctx.fillRect(55, -10, 15, 40);
        // Eye sockets
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-20, -5, 12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(20, -5, 12, 0, Math.PI * 2); ctx.fill();
        // Red eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(-20, -5, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(20, -5, 7, 0, Math.PI * 2); ctx.fill();
        // Pulsing core
        const bossPulse = Math.sin(gameState.frameCount * 0.1) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(255,0,0,${bossPulse})`;
        ctx.beginPath(); ctx.arc(0, 20, 14, 0, Math.PI * 2); ctx.fill();
        // Engines
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(-20, 45, 8, 12);
        ctx.fillRect(12, 45, 8, 12);
    } else {
        // Tank
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(-30, -15); ctx.lineTo(-35, 20);
        ctx.lineTo(-20, 25); ctx.lineTo(20, 25); ctx.lineTo(35, 20); ctx.lineTo(30, -15);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-25, -10); ctx.lineTo(-20, 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(25, -10); ctx.lineTo(20, 15); ctx.stroke();
        // Engines
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(-8, 25, 5, 8);
        ctx.fillRect(3, 25, 5, 8);
        ctx.fillStyle = '#ff8800';
        ctx.beginPath(); ctx.arc(0, 5, 8, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
}

// ── Main render ─────────────────────────────────────────────────────

function render() {
    const isUnicorn = gameTheme === 'unicorn';
    const isPacificRim = gameTheme === 'pacificrim';

    // Background
    if (isUnicorn) {
        if (!_bgGradientCache || _bgGradientH !== canvas.height) {
            _bgGradientCache = ctx.createLinearGradient(0, 0, 0, canvas.height);
            _bgGradientCache.addColorStop(0, '#87CEEB');
            _bgGradientCache.addColorStop(0.3, '#FFB6C1');
            _bgGradientCache.addColorStop(0.6, '#DDA0DD');
            _bgGradientCache.addColorStop(1, '#98FB98');
            _bgGradientH = canvas.height;
        }
        ctx.fillStyle = _bgGradientCache;
    } else if (isPacificRim) {
        if (!_bgGradientCache || _bgGradientH !== canvas.height) {
            _bgGradientCache = ctx.createLinearGradient(0, 0, 0, canvas.height);
            _bgGradientCache.addColorStop(0, '#050d14');
            _bgGradientCache.addColorStop(0.55, '#0a1e2e');
            _bgGradientCache.addColorStop(0.75, '#0c2030');
            _bgGradientCache.addColorStop(1, '#061820');
            _bgGradientH = canvas.height;
        }
        ctx.fillStyle = _bgGradientCache;
    } else {
        ctx.fillStyle = '#0a0015';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set up play-area transform
    ctx.save();
    const scale = Math.min(canvas.width / PLAY_AREA.width, canvas.height / PLAY_AREA.height);
    ctx.translate(
        (canvas.width - PLAY_AREA.width * scale) / 2,
        (canvas.height - PLAY_AREA.height * scale) / 2
    );
    ctx.scale(scale, scale);

    // Screen shake
    if (gameState.hitEffect > 0) {
        ctx.translate(
            (Math.random() - 0.5) * gameState.screenShake.x * 2,
            (Math.random() - 0.5) * gameState.screenShake.y * 2
        );
    }

    // Stars / sparkles / rain
    if (isUnicorn) {
        for (let i = 0; i < gameState.stars.length; i++) {
            const s = gameState.stars[i];
            const spriteSize = Math.round(s.size * 8);
            if (spriteSize < 1) continue;
            const sprite = _getSparkleSprite(spriteSize);
            ctx.globalAlpha = s.size / 2 + 0.3;
            ctx.drawImage(sprite, s.x, s.y);
        }
        ctx.globalAlpha = 1;
    } else if (isPacificRim) {
        // Rain streaks — diagonal lines
        ctx.strokeStyle = 'rgba(100,180,220,0.25)';
        ctx.lineWidth = 1;
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

        // === Destroyed city — Shatterdome ruins ===
        const pw = PLAY_AREA.width;
        const ph = PLAY_AREA.height;
        const gY = ph * 0.96;
        const fc = gameState.frameCount || 0;

        // Distant horizon fire-glow (burning ocean reflection)
        const hGrad = ctx.createLinearGradient(0, ph * 0.60, 0, ph * 0.82);
        hGrad.addColorStop(0, 'rgba(0,0,0,0)');
        hGrad.addColorStop(0.6, 'rgba(90,28,6,0.38)');
        hGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hGrad;
        ctx.fillRect(0, ph * 0.60, pw, ph * 0.22);

        // Far background ruins — tall dark skeletons for depth
        ctx.fillStyle = 'rgba(7,15,22,0.95)';
        [[0.00,0.06,0.36],[0.07,0.04,0.46],[0.12,0.08,0.31],[0.21,0.05,0.52],
         [0.27,0.06,0.40],[0.34,0.05,0.56],[0.40,0.08,0.33],[0.49,0.05,0.49],
         [0.55,0.07,0.43],[0.63,0.06,0.52],[0.70,0.08,0.34],[0.79,0.05,0.47],
         [0.85,0.07,0.42],[0.93,0.06,0.54],[0.98,0.09,0.37]
        ].forEach(([fx, fw, fh]) => {
            ctx.fillRect(fx * pw, gY - fh * ph, fw * pw, fh * ph + 30);
        });

        // Mid-ground destroyed buildings — polygon ruins with jagged broken tops
        // Format: [leftFrac, rightFrac, maxHeightFrac, normalizedProfile [[pctX, pctH], ...]]
        // pctX=0 is left edge, pctX=1 is right; pctH=0 is ground, pctH=1 is maxHeight
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
            ctx.closePath();
            ctx.fill();
        });

        // Exposed rebar / structural beams poking out of ruins
        ctx.strokeStyle = 'rgba(30,45,55,1)';
        ctx.lineWidth = 3;
        [[0.04,0.21, 0.035,0.25],[0.16,0.29, 0.145,0.33],[0.31,0.37, 0.295,0.42],
         [0.57,0.32, 0.555,0.37],[0.76,0.38, 0.748,0.44],[0.94,0.27, 0.928,0.31]
        ].forEach(([fx1,fy1,fx2,fy2]) => {
            ctx.beginPath();
            ctx.moveTo(fx1*pw, gY - fy1*ph);
            ctx.lineTo(fx2*pw, gY - fy2*ph);
            ctx.stroke();
        });

        // Ground rubble layer — irregular mound of collapsed debris
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
        ctx.lineTo(pw, gY + ph * 0.04);
        ctx.lineTo(0, gY + ph * 0.04);
        ctx.closePath();
        ctx.fill();

        // Flooded street — dark seawater pooling among the ruins
        const waterY = gY - ph * 0.008;
        const wGrad = ctx.createLinearGradient(0, waterY, 0, ph);
        wGrad.addColorStop(0, 'rgba(0,30,50,0.88)');
        wGrad.addColorStop(1, 'rgba(0,12,22,0.98)');
        ctx.fillStyle = wGrad;
        ctx.fillRect(0, waterY, pw, ph - waterY);
        // Water shimmer lines
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = 'rgba(0,100,160,0.55)';
        ctx.lineWidth = 1;
        for (let wi = 0; wi < 6; wi++) {
            const wOff = Math.sin(fc * 0.015 + wi * 1.2) * ph * 0.003;
            ctx.beginPath();
            ctx.moveTo(0, waterY + ph * 0.005 + wi * ph * 0.007 + wOff);
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
            fGrad.addColorStop(0,   `rgba(255,215,70,${0.80 * flicker})`);
            fGrad.addColorStop(0.30, `rgba(255,90,10,${0.50 * flicker})`);
            fGrad.addColorStop(0.65, `rgba(110,18,0,${0.22 * flicker})`);
            fGrad.addColorStop(1,    'rgba(0,0,0,0)');
            ctx.fillStyle = fGrad;
            ctx.fillRect(fx - fsize * 3.5, fy - fsize * 3.5, fsize * 7, fsize * 7);
            // Bright ember core
            ctx.fillStyle = `rgba(255,245,160,${0.75 * flicker})`;
            ctx.beginPath();
            ctx.arc(fx, fy, fsize * 0.22 * flicker, 0, Math.PI * 2);
            ctx.fill();
        });

        // Low-hanging smog clouds drifting over the ruins
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
    } else {
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < gameState.stars.length; i++) {
            const s = gameState.stars[i];
            ctx.globalAlpha = s.size / 2;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;
    }

    // Particles
    if (isUnicorn) {
        const sparkle12 = _getSparkleSprite(12);
        const pColors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF69B4'];
        for (let i = 0; i < gameState.particles.length; i++) {
            const p = gameState.particles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.drawImage(sparkle12, p.x, p.y);
        }
        ctx.globalAlpha = 1;
    } else if (isPacificRim) {
        // Debris sparks — larger, fiery
        for (let i = 0; i < gameState.particles.length; i++) {
            const p = gameState.particles[i];
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
            // Spark trail
            ctx.globalAlpha = alpha * 0.4;
            ctx.fillRect(p.x - p.vx, p.y - p.vy, 2, 2);
        }
        ctx.globalAlpha = 1;
    } else {
        for (let i = 0; i < gameState.particles.length; i++) {
            const p = gameState.particles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
        }
        ctx.globalAlpha = 1;
    }

    // Player fleets
    if (gameState.running) {
        gameState.players.forEach((player, playerIndex) => {
            if (!player.active) return;

            (gameState._cachedCrowdPositions?.[playerIndex] || getCrowdPositions(playerIndex)).forEach(pos => {
                if (isUnicorn) {
                    drawUnicorn(pos.x, pos.y, 0.8);
                } else if (isPacificRim) {
                    drawJaeger(pos, playerIndex);
                } else {
                    drawSpaceShip(pos, playerIndex);
                }
            });

            // Face icon above fleet (camera mode)
            if (controlMode === 'camera' && player.faceImage) {
                if (!_faceImageCache[playerIndex] || _faceImageCache[playerIndex].src !== player.faceImage) {
                    _faceImageCache[playerIndex] = new Image();
                    _faceImageCache[playerIndex].src = player.faceImage;
                }
                const img = _faceImageCache[playerIndex];
                const numRows = Math.ceil(player.crowdSize / Math.ceil(Math.sqrt(player.crowdSize * 2)));
                const faceY = player.y - numRows * 28 - 40;
                const playerColor = player.color || PLAYER_COLORS[playerIndex].primary;

                // Clipped face circle
                ctx.save();
                ctx.translate(player.x, faceY);
                ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.clip();
                ctx.drawImage(img, -25, -25, 50, 50);
                ctx.restore();

                // Border ring (no shadowBlur — use double stroke for glow effect)
                ctx.save();
                ctx.translate(player.x, faceY);
                const ringColor = isUnicorn ? '#FF69B4' : isPacificRim ? '#FF8C00' : playerColor;
                ctx.strokeStyle = ringColor;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = 8;
                ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();

                // Label
                ctx.fillStyle = playerColor;
                ctx.font = 'bold 14px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`P${playerIndex + 1}`, player.x, faceY - 35);
            }

            // Shield overlay: pulsing circle around fleet when active
            if (gameState.activeEffects.shield[playerIndex] > 0) {
                const shieldPulse = Math.sin(gameState.frameCount * 0.12) * 0.15 + 0.85;
                const shieldRadius = Math.sqrt(player.crowdSize) * 28 + 20;
                const shieldColor = isUnicorn ? 'rgba(255,182,193,' : isPacificRim ? 'rgba(0,200,255,' : 'rgba(0,170,255,';
                ctx.strokeStyle = shieldColor + (0.6 * shieldPulse) + ')';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(player.x, player.y - shieldRadius / 3, shieldRadius * shieldPulse, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = shieldColor + (0.2 * shieldPulse) + ')';
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.arc(player.x, player.y - shieldRadius / 3, shieldRadius * shieldPulse, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    }

    // Bullets
    if (isUnicorn) {
        const heartSprite = _getHeartSprite();
        for (let i = 0; i < gameState.bullets.length; i++) {
            const b = gameState.bullets[i];
            if (!b.active) continue;
            ctx.drawImage(heartSprite, b.x - 8, b.y - 3);
        }
    } else if (isPacificRim) {
        // Plasma cannon bolts — wide amber beams with glow
        for (let i = 0; i < gameState.bullets.length; i++) {
            const b = gameState.bullets[i];
            if (!b.active) continue;
            const isP2 = (b.owner || 0) === 1;
            const boltColor = isP2 ? '#ff6600' : '#00ccff';
            const glowColor = isP2 ? 'rgba(255,100,0,0.3)' : 'rgba(0,200,255,0.3)';
            // Glow
            ctx.fillStyle = glowColor;
            ctx.fillRect(b.x - 5, b.y - 2, 10, 14);
            // Core bolt
            ctx.fillStyle = boltColor;
            ctx.fillRect(b.x - 2, b.y, 4, 12);
            // Bright center
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(b.x - 1, b.y + 1, 2, 8);
        }
    } else {
        for (let i = 0; i < gameState.bullets.length; i++) {
            const b = gameState.bullets[i];
            if (!b.active) continue;
            const owner = gameState.players[b.owner || 0];
            ctx.fillStyle = owner?.color || '#ff00ff';
            ctx.fillRect(b.x - 1.5, b.y, 3, 10);
        }
    }

    // Enemies
    // Draw all enemy sprites first
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.y < -100 || e.health <= 0) continue;
        const ships = Math.ceil(e.health / CONFIG.bullet.damage);
        const sc = (e.type === 'boss' ? 1.8 : e.type === 'tank' ? 1.2 : e.type === 'fast' ? 0.9 : e.type === 'shifter' ? 0.7 : 1) * (1 + ships * 0.08);
        if (isUnicorn) {
            const wolfColor = e.type === 'boss' ? '#8B0000' : e.type === 'tank' ? '#8B4513' : e.type === 'fast' ? '#A0A0A0' : e.type === 'shifter' ? '#9B30FF' : '#696969';
            drawWolf(e.x, e.y, sc * 0.9, wolfColor);
        } else if (isPacificRim) {
            drawKaiju(e, sc);
        } else {
            drawSpaceEnemy(e, sc);
        }
    }
    // Batch health overlays — set font once
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 18px Orbitron,monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.y < -100 || e.health <= 0) continue;
        const ships = Math.ceil(e.health / CONFIG.bullet.damage);
        ctx.strokeText(ships, e.x, e.y);
        ctx.fillText(ships, e.x, e.y);
    }

    // Powerups
    ctx.font = 'bold 22px Orbitron,monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < gameState.powerups.length; i++) {
        const p = gameState.powerups[i];
        if (!p.active) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        const pulse = Math.sin(gameState.frameCount * 0.15) * 0.5 + 1;
        const puType = p.type || 'fleet';
        const typeCfg = CONFIG.powerup.types[puType];
        const puColor = isUnicorn ? typeCfg.unicornColor : isPacificRim ? typeCfg.pacificrimColor : typeCfg.color;

        if (isUnicorn) {
            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 45 * pulse);
            grd.addColorStop(0, puColor + '80');
            grd.addColorStop(1, puColor + '00');
            ctx.fillStyle = grd;
            ctx.fillRect(-50, -50, 100, 100);
            if (puType === 'fleet') {
                const starSprite = _getStarEmojiSprite();
                const sz = 44 * pulse;
                ctx.drawImage(starSprite, -sz / 2, -sz / 2, sz, sz);
            } else if (puType === 'shield') {
                ctx.font = `${Math.round(36 * pulse)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = puColor;
                ctx.fillText('\uD83D\uDEE1\uFE0F', 0, 0);
            } else {
                ctx.font = `${Math.round(36 * pulse)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = puColor;
                ctx.fillText('\u2728', 0, 0);
            }
        } else {
            const grd = ctx.createRadialGradient(0, 0, 10, 0, 0, 50 * pulse);
            grd.addColorStop(0, puColor + '66');
            grd.addColorStop(1, puColor + '00');
            ctx.fillStyle = grd;
            ctx.fillRect(-55, -55, 110, 110);

            ctx.strokeStyle = puColor + '99';
            ctx.lineWidth = 8;
            ctx.beginPath(); ctx.arc(0, 0, 35 * pulse, 0, Math.PI * 2); ctx.stroke();

            ctx.scale(1.3, 1.3);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;

            if (puType === 'fleet') {
                ctx.fillStyle = puColor;
                ctx.beginPath();
                ctx.moveTo(0, -15); ctx.lineTo(-10, 6); ctx.lineTo(-6, 10);
                ctx.lineTo(6, 10); ctx.lineTo(10, 6);
                ctx.closePath();
                ctx.stroke(); ctx.fill();
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath(); ctx.arc(0, -3, 4, 0, Math.PI * 2); ctx.fill();
            } else if (puType === 'shield') {
                // Shield shape
                ctx.fillStyle = puColor;
                ctx.beginPath();
                ctx.moveTo(0, -15); ctx.lineTo(-12, -5); ctx.lineTo(-10, 10);
                ctx.lineTo(0, 15); ctx.lineTo(10, 10); ctx.lineTo(12, -5);
                ctx.closePath();
                ctx.stroke(); ctx.fill();
            } else {
                // Spread: triple bars
                ctx.fillStyle = puColor;
                ctx.fillRect(-8, -10, 16, 4);
                ctx.fillRect(-12, -2, 24, 4);
                ctx.fillRect(-8, 6, 16, 4);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(-8, -10, 16, 4);
                ctx.strokeRect(-12, -2, 24, 4);
                ctx.strokeRect(-8, 6, 16, 4);
            }
        }

        // Ships-to-destroy count
        ctx.font = 'bold 22px Orbitron,monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const ships = Math.ceil(p.health / CONFIG.bullet.damage);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        const labelY = isUnicorn ? 35 : 18;
        ctx.strokeText(ships, 0, labelY);
        ctx.fillText(ships, 0, labelY);
        ctx.restore();
    }

    // Hit flash overlay
    if (gameState.hitEffect > 0) {
        const flashColor = isUnicorn ? '128,0,128' : isPacificRim ? '255,80,0' : '255,0,0';
        ctx.fillStyle = `rgba(${flashColor},${gameState.hitEffect / 50})`;
        ctx.fillRect(0, 0, PLAY_AREA.width, PLAY_AREA.height);
    }

    // Super weapon flash overlay
    if (gameState.superWeaponFlashEffect > 0) {
        const flashDuration = CONFIG.superWeapon.flashDuration;
        const effect = gameState.superWeaponFlashEffect;

        if (isUnicorn) {
            // Rainbow wave sweeping bottom-to-top
            const progress = 1 - (effect / flashDuration);
            const waveFrontY = PLAY_AREA.height * (1 - progress);
            const bandHeight = 100;

            // Rainbow gradient band
            const rainbowGrad = ctx.createLinearGradient(0, 0, PLAY_AREA.width, 0);
            rainbowGrad.addColorStop(0, '#FF0000');
            rainbowGrad.addColorStop(0.16, '#FF8800');
            rainbowGrad.addColorStop(0.33, '#FFFF00');
            rainbowGrad.addColorStop(0.5, '#00FF00');
            rainbowGrad.addColorStop(0.66, '#0088FF');
            rainbowGrad.addColorStop(0.83, '#8800FF');
            rainbowGrad.addColorStop(1, '#FF00FF');

            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = rainbowGrad;
            ctx.fillRect(0, waveFrontY - bandHeight / 2, PLAY_AREA.width, bandHeight);

            // White sparkle leading edge
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, waveFrontY - 3, PLAY_AREA.width, 6);
            ctx.restore();
        } else if (isPacificRim) {
            // Pacific Rim: EMP shockwave — white blast ring expanding outward
            const progress = 1 - (effect / flashDuration);
            const centerX = PLAY_AREA.width / 2;
            const centerY = PLAY_AREA.height / 2;
            const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * 1.4;

            // Blinding white flash at start
            const flashAlpha = Math.max(0, (1 - progress * 2.5) * 0.8);
            if (flashAlpha > 0) {
                ctx.fillStyle = `rgba(200,240,255,${flashAlpha})`;
                ctx.fillRect(0, 0, PLAY_AREA.width, PLAY_AREA.height);
            }

            // Expanding shockwave ring
            const ringRadius = maxRadius * progress;
            const ringAlpha = (1 - progress) * 0.9;
            ctx.save();
            ctx.strokeStyle = `rgba(0,200,255,${ringAlpha})`;
            ctx.lineWidth = 20 * (1 - progress);
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            // Inner glow ring
            ctx.strokeStyle = `rgba(255,255,255,${ringAlpha * 0.6})`;
            ctx.lineWidth = 8 * (1 - progress);
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius * 0.95, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else {
            // Space theme: cyan flash (unchanged)
            const alpha = effect / flashDuration * 0.6;
            ctx.fillStyle = `rgba(0,255,255,${alpha})`;
            ctx.fillRect(0, 0, PLAY_AREA.width, PLAY_AREA.height);
        }
    }

    // Fleet donation reach beams (2P only)
    if (gameState.running && gameState.playerCount === 2) {
        const r0 = webcamState.registeredPlayers[0].reachingOut;
        const r1 = webcamState.registeredPlayers[1].reachingOut;
        const p0 = gameState.players[0];
        const p1 = gameState.players[1];
        const ds = gameState.fleetDonateState;
        const donateColor = isUnicorn ? '#FF69B4' : isPacificRim ? '#FF8C00' : '#00ffff';

        if (r0 || r1) {
            const midX = (p0.x + p1.x) / 2;
            const midY = (p0.y + p1.y) / 2;

            // Individual reach beams
            if (r0 && (p0.active || !p0.active)) {
                const endX = r1 ? midX : p0.x + (p1.x - p0.x) * 0.3;
                ctx.save();
                ctx.globalAlpha = 0.4 + Math.sin(gameState.frameCount * 0.15) * 0.15;
                ctx.strokeStyle = donateColor;
                ctx.lineWidth = 4;
                ctx.setLineDash([8, 8]);
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(endX, midY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }
            if (r1 && (p1.active || !p1.active)) {
                const endX = r0 ? midX : p1.x + (p0.x - p1.x) * 0.3;
                ctx.save();
                ctx.globalAlpha = 0.4 + Math.sin(gameState.frameCount * 0.15) * 0.15;
                ctx.strokeStyle = donateColor;
                ctx.lineWidth = 4;
                ctx.setLineDash([8, 8]);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(endX, midY);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }

            // Connected beam with particles when both reaching
            if (r0 && r1 && ds.cooldown === 0) {
                const progress = Math.min(ds.holdFrames / CONFIG.fleetDonate.holdFrames, 1);
                ctx.save();
                ctx.globalAlpha = 0.3 + progress * 0.5;
                ctx.strokeStyle = donateColor;
                ctx.lineWidth = 3 + progress * 6;
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.stroke();

                // Glow
                ctx.globalAlpha = 0.15 + progress * 0.2;
                ctx.lineWidth = 12 + progress * 12;
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.stroke();
                ctx.restore();

                // Heart / energy particles along the beam
                if (isPacificRim && progress > 0.3) {
                    // Neural drift arc sparks
                    const numSparks = Math.floor(progress * 6) + 2;
                    ctx.strokeStyle = `rgba(255,180,0,${0.6 + progress * 0.4})`;
                    ctx.lineWidth = 2;
                    for (let i = 0; i < numSparks; i++) {
                        const t = (i + 1) / (numSparks + 1);
                        const bx = p0.x + (p1.x - p0.x) * t;
                        const by = p0.y + (p1.y - p0.y) * t;
                        const jitter = Math.sin(gameState.frameCount * 0.2 + i * 1.5) * 12;
                        ctx.beginPath();
                        ctx.moveTo(bx - 6, by + jitter - 6);
                        ctx.lineTo(bx + 2, by + jitter);
                        ctx.lineTo(bx - 2, by + jitter + 4);
                        ctx.lineTo(bx + 6, by + jitter + 10);
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                } else if (isUnicorn && progress > 0.3) {
                    const heartSprite = _getHeartSprite();
                    const numHearts = Math.floor(progress * 5) + 1;
                    for (let i = 0; i < numHearts; i++) {
                        const t = (i + 1) / (numHearts + 1);
                        const offset = Math.sin(gameState.frameCount * 0.1 + i * 2) * 15;
                        const hx = p0.x + (p1.x - p0.x) * t;
                        const hy = p0.y + (p1.y - p0.y) * t + offset;
                        ctx.globalAlpha = 0.6 + progress * 0.4;
                        ctx.drawImage(heartSprite, hx - 8, hy - 8);
                    }
                    ctx.globalAlpha = 1;
                }
            }
        }
    }

    // Charge-ready indicator above player fleet
    if (gameState.running) {
        gameState.players.forEach((player, idx) => {
            if (!player.active || gameState.superWeaponCharges[idx] <= 0) return;
            const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.font = 'bold 28px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const numRows = Math.ceil(player.crowdSize / Math.ceil(Math.sqrt(player.crowdSize * 2)));
            const iconY = player.y - numRows * 28 - 70;

            if (isUnicorn) {
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.strokeText('\u2B50', player.x, iconY);
                ctx.fillText('\u2B50', player.x, iconY);
            } else if (isPacificRim) {
                // Lightning bolt — neural handshake ready
                ctx.fillStyle = '#FF8C00';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.strokeText('\u26A1', player.x, iconY);
                ctx.fillText('\u26A1', player.x, iconY);
            } else {
                ctx.fillStyle = '#00ffff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                // Triangle/nuke symbol
                ctx.beginPath();
                ctx.moveTo(player.x, iconY - 20);
                ctx.lineTo(player.x - 12, iconY);
                ctx.lineTo(player.x + 12, iconY);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        });
    }

    ctx.restore();
}
