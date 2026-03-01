// render-textures.js — Procedural canvas textures for each theme in Sonic Half-Pipe.
// Exports: getTextures() → { pipe, ring, playerBody0, playerBody1, bumper, bomb, barrier }
// Depends on: render.js (getTheme), THREE (global)
//
// All textures are generated via HTMLCanvasElement + THREE.CanvasTexture so no
// image files are required. Results are cached per theme; switching themes
// disposes the old textures and builds fresh ones.

let _cachedTheme    = null;
let _cachedTextures = null;

// ── Shared helpers ────────────────────────────────────────────────────

function _makeCanvas(w, h) {
    const cv = document.createElement('canvas');
    cv.width  = w;
    cv.height = h || w;
    return cv;
}

function _toTexture(canvas, repeatX, repeatY) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS   = THREE.RepeatWrapping;
    tex.wrapT   = THREE.RepeatWrapping;
    tex.repeat.set(repeatX || 1, repeatY || 1);
    return tex;
}

// Deterministic integer hash → float [0,1).  Module-scope so it is shared
// across all texture builders without re-creating a closure each call.
function _seededRng(n) {
    n = ((n >>> 16) ^ n) * 0x45d9f3b;
    n = ((n >>> 16) ^ n) * 0x45d9f3b;
    return ((n >>> 16) ^ n) / 0xffffffff;
}

// Draw a glowing dot: radial halo then solid core.
function _drawGlowDot(c, x, y, haloR, glowColor, dotColor, dotR) {
    const g = c.createRadialGradient(x, y, 0, x, y, haloR);
    g.addColorStop(0, glowColor);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x, y, haloR, 0, Math.PI * 2); c.fill();
    c.fillStyle = dotColor;
    c.beginPath(); c.arc(x, y, dotR,  0, Math.PI * 2); c.fill();
}

// ── Default theme ─────────────────────────────────────────────────────

// Circuit board pattern: dark navy base + cyan grid + traces + junction dots.
function _makeDefaultPipeTexture() {
    const size = 256;
    const cv   = _makeCanvas(size);
    const c    = cv.getContext('2d');

    // Background
    c.fillStyle = '#010a18';
    c.fillRect(0, 0, size, size);

    // Faint grid
    c.strokeStyle = 'rgba(0, 80, 160, 0.18)';
    c.lineWidth   = 0.5;
    for (let i = 0; i <= 8; i++) {
        const v = i * 32;
        c.beginPath(); c.moveTo(v, 0);    c.lineTo(v, size); c.stroke();
        c.beginPath(); c.moveTo(0, v);    c.lineTo(size, v); c.stroke();
    }

    // Circuit traces
    c.strokeStyle = 'rgba(0, 190, 255, 0.55)';
    c.lineWidth   = 1.5;
    const traces = [
        [0, 64,  160, 64],  [160, 64,  160, 128], [160, 128, 256, 128],
        [32,  0,  32, 64],  [32,  128, 32,  192], [32,  192, 128, 192],
        [96, 96, 224, 96],  [224,   0, 224,  96],
        [64, 160,  64, 256],[64,  160, 192, 160],
    ];
    traces.forEach(([x1, y1, x2, y2]) => {
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    });

    // Junction dots
    const dots = [[160, 64], [160, 128], [32, 64], [32, 192], [224, 96], [64, 160], [192, 160]];
    dots.forEach(([jx, jy]) => {
        _drawGlowDot(c, jx, jy, 9, 'rgba(0,255,255,0.30)', '#00ffff', 2.5);
    });

    return _toTexture(cv, 2, 4);
}

// Metallic gold gradient — wraps around the ring tube.
function _makeDefaultRingTexture() {
    const cv = _makeCanvas(256, 32);
    const c  = cv.getContext('2d');

    const grad = c.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0,    '#7A5800');
    grad.addColorStop(0.25, '#FFD700');
    grad.addColorStop(0.5,  '#FFFACD');
    grad.addColorStop(0.75, '#FFD700');
    grad.addColorStop(1,    '#7A5800');
    c.fillStyle = grad;
    c.fillRect(0, 0, 256, 32);

    // Tubular highlight (v direction)
    const vGrad = c.createLinearGradient(0, 0, 0, 32);
    vGrad.addColorStop(0,   'rgba(255,255,255,0.45)');
    vGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
    vGrad.addColorStop(1,   'rgba(0,0,0,0.30)');
    c.fillStyle = vGrad;
    c.fillRect(0, 0, 256, 32);

    return _toTexture(cv, 1, 1);
}

// Neon circuit body texture per player: background colour + circuit in team colour.
function _makeDefaultPlayerBodyTexture(playerIndex) {
    const size   = 256;
    const cv     = _makeCanvas(size);
    const c      = cv.getContext('2d');
    const isP1    = playerIndex === 0;
    const base    = isP1 ? '#001a26' : '#1a0026';
    const neon    = isP1 ? 'rgba(0,200,255,0.65)' : 'rgba(255,0,200,0.65)';
    const dotCol  = isP1 ? '#00ffff' : '#ff00ff';
    const glowCol = isP1 ? 'rgba(0,255,255,0.35)' : 'rgba(255,0,255,0.35)';

    c.fillStyle = base;
    c.fillRect(0, 0, size, size);

    // Circuit pattern
    c.strokeStyle = neon;
    c.lineWidth   = 1.5;
    const segs = [
        [0, 80, 80, 80], [80, 80, 80, 0],
        [80, 128, 256, 128], [128, 80, 128, 256],
        [0, 192, 128, 192], [192, 0, 192, 128],
        [192, 192, 256, 192], [32, 128, 32, 256],
        [0, 48, 256, 48],
    ];
    segs.forEach(([x1, y1, x2, y2]) => {
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    });

    // Junction dots
    const junctions = [[80, 80], [80, 128], [128, 128], [128, 192], [32, 192], [192, 128]];
    junctions.forEach(([dx, dy]) => {
        _drawGlowDot(c, dx, dy, 8, glowCol, dotCol, 2.5);
    });

    return _toTexture(cv, 1, 1);
}

// Diagonal hazard stripes — shared by bumper, bomb, barrier with different colours.
function _makeHazardTexture(bgColor, stripeColor) {
    const size = 256;
    const cv   = _makeCanvas(size);
    const c    = cv.getContext('2d');

    c.fillStyle = bgColor;
    c.fillRect(0, 0, size, size);

    c.fillStyle = stripeColor;
    const sw = 36;
    for (let i = -size; i < size * 2; i += sw * 2) {
        c.beginPath();
        c.moveTo(i,            0);
        c.lineTo(i + sw,       0);
        c.lineTo(i + sw + size, size);
        c.lineTo(i + size,     size);
        c.closePath();
        c.fill();
    }

    return _toTexture(cv, 1, 1);
}

// ── Unicorn theme ─────────────────────────────────────────────────────

// Deep purple base + rainbow overlay + sparkle dots.
function _makeUnicornPipeTexture() {
    const size = 256;
    const cv   = _makeCanvas(size);
    const c    = cv.getContext('2d');

    c.fillStyle = '#0d0022';
    c.fillRect(0, 0, size, size);

    // Subtle rainbow shimmer across width
    const rainGrad = c.createLinearGradient(0, 0, size, 0);
    ['#ff0080','#ff4400','#ffcc00','#00ff88','#0088ff','#cc00ff','#ff0080']
        .forEach((col, i, arr) => rainGrad.addColorStop(i / (arr.length - 1), col));
    c.globalAlpha = 0.11;
    c.fillStyle   = rainGrad;
    c.fillRect(0, 0, size, size);
    c.globalAlpha = 1;

    // Soft horizontal scan-lines
    c.strokeStyle = 'rgba(255,80,220,0.18)';
    c.lineWidth   = 1;
    for (let y = 0; y < size; y += 24) {
        c.beginPath(); c.moveTo(0, y); c.lineTo(size, y); c.stroke();
    }

    // Sparkle stars (deterministic — _seededRng ensures stable output across calls)
    const sparkCols = ['#FFD700','#FF80FF','#80FFFF','#FFFFFF','#FF99EE'];
    for (let i = 0; i < 42; i++) {
        const x = _seededRng(i * 17 + 1) * size;
        const y = _seededRng(i * 31 + 2) * size;
        const r = 1 + _seededRng(i * 53 + 3) * 2;
        c.fillStyle   = sparkCols[i % sparkCols.length];
        c.globalAlpha = 0.35 + _seededRng(i * 7 + 4) * 0.55;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;

    return _toTexture(cv, 2, 4);
}

// Full-spectrum rainbow gradient + metallic sheen — wraps around the ring tube.
function _makeUnicornRingTexture() {
    const cv = _makeCanvas(256, 32);
    const c  = cv.getContext('2d');

    const grad = c.createLinearGradient(0, 0, 256, 0);
    [
        [0,    '#FF0080'],
        [0.15, '#FF6600'],
        [0.30, '#FFD700'],
        [0.45, '#44FF88'],
        [0.60, '#00AAFF'],
        [0.75, '#8844FF'],
        [0.90, '#FF44CC'],
        [1,    '#FF0080'],
    ].forEach(([t, col]) => grad.addColorStop(t, col));
    c.fillStyle = grad;
    c.fillRect(0, 0, 256, 32);

    // Metallic sheen top-to-bottom
    const sheen = c.createLinearGradient(0, 0, 0, 32);
    sheen.addColorStop(0,   'rgba(255,255,255,0.50)');
    sheen.addColorStop(0.4, 'rgba(255,255,255,0.08)');
    sheen.addColorStop(1,   'rgba(0,0,0,0.22)');
    c.fillStyle = sheen;
    c.fillRect(0, 0, 256, 32);

    return _toTexture(cv, 1, 1);
}

// Pearl / iridescent — cream base + soft rainbow overlay + shimmer radials.
function _makeUnicornBodyTexture() {
    const size = 256;
    const cv   = _makeCanvas(size);
    const c    = cv.getContext('2d');

    c.fillStyle = '#FFF8FC';
    c.fillRect(0, 0, size, size);

    const iridGrad = c.createLinearGradient(0, 0, size, size);
    iridGrad.addColorStop(0,   'rgba(255,182,230,0.22)');
    iridGrad.addColorStop(0.3, 'rgba(200,180,255,0.22)');
    iridGrad.addColorStop(0.6, 'rgba(180,240,255,0.22)');
    iridGrad.addColorStop(1,   'rgba(255,230,180,0.22)');
    c.fillStyle = iridGrad;
    c.fillRect(0, 0, size, size);

    // Shimmer spots (deterministic)
    for (let i = 0; i < 14; i++) {
        const px = (i * 73)  % size;
        const py = (i * 113) % size;
        const r  = 12 + (i * 37) % 22;
        const g  = c.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, 'rgba(255,255,255,0.48)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
    }

    return _toTexture(cv, 1, 1);
}

// Fluffy grey-blue clouds with a faint yellow lightning tint at the base.
function _makeCloudTexture() {
    const size = 256;
    const cv   = _makeCanvas(size);
    const c    = cv.getContext('2d');

    c.fillStyle = '#4e6070';
    c.fillRect(0, 0, size, size);

    const puffs = [
        [128, 118, 58], [88, 100, 42], [168, 106, 40],
        [108, 152, 38], [152, 150, 34], [76,  138, 30], [178, 142, 32],
    ];
    puffs.forEach(([px, py, pr]) => {
        const g = c.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0,   'rgba(215,228,235,0.92)');
        g.addColorStop(0.6, 'rgba(180,200,212,0.60)');
        g.addColorStop(1,   'rgba(145,162,175,0)');
        c.fillStyle = g;
        c.beginPath(); c.arc(px, py, pr, 0, Math.PI * 2); c.fill();
    });

    // Yellow glow at base — hints at lightning below
    c.fillStyle = 'rgba(255,240,50,0.18)';
    c.fillRect(0, 185, size, size - 185);

    return _toTexture(cv, 1, 1);
}

// Dark forest-green with vine network — bramble bomb skin.
function _makeBrambleTexture() {
    const size = 256;
    const cv   = _makeCanvas(size);
    const c    = cv.getContext('2d');

    c.fillStyle = '#111f0d';
    c.fillRect(0, 0, size, size);

    // Vine segments
    c.strokeStyle = 'rgba(28,72,20,0.85)';
    c.lineWidth   = 3;
    const vines = [
        [0, 60, 90, 60, 90, 180, 256, 180],
        [40, 0, 40, 90, 160, 90, 160, 256],
        [120, 0, 120, 40, 200, 40, 200, 145, 256, 145],
        [0, 210, 80, 210, 80, 256],
    ];
    vines.forEach(pts => {
        c.beginPath();
        for (let j = 0; j < pts.length; j += 2) {
            j === 0 ? c.moveTo(pts[j], pts[j+1]) : c.lineTo(pts[j], pts[j+1]);
        }
        c.stroke();
    });

    // Thorn crosses at key junctions
    c.strokeStyle = 'rgba(18,48,12,0.9)';
    c.lineWidth   = 2;
    [[90, 60], [90, 100], [40, 90], [160, 90], [160, 130], [200, 40]].forEach(([tx, ty]) => {
        c.beginPath(); c.moveTo(tx - 7, ty - 7); c.lineTo(tx + 7, ty + 7); c.stroke();
        c.beginPath(); c.moveTo(tx + 7, ty - 7); c.lineTo(tx - 7, ty + 7); c.stroke();
    });

    return _toTexture(cv, 1, 1);
}

// Deep purple with glowing violet rune circles + radial spokes.
function _makeRuneTexture() {
    const size = 256;
    const cv   = _makeCanvas(size);
    const c    = cv.getContext('2d');

    c.fillStyle = '#100030';
    c.fillRect(0, 0, size, size);

    // Rune circles
    [[128, 128, 72], [60, 60, 28], [196, 60, 28], [60, 196, 28], [196, 196, 28]].forEach(([rx, ry, rr]) => {
        // Glow fill
        const glow = c.createRadialGradient(rx, ry, 0, rx, ry, rr * 0.65);
        glow.addColorStop(0, 'rgba(120,0,200,0.14)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = glow;
        c.beginPath(); c.arc(rx, ry, rr, 0, Math.PI * 2); c.fill();
        // Ring outline
        c.strokeStyle = 'rgba(155,0,255,0.60)';
        c.lineWidth   = 2;
        c.beginPath(); c.arc(rx, ry, rr, 0, Math.PI * 2); c.stroke();
    });

    // Radial spokes from centre rune
    c.strokeStyle = 'rgba(175,55,255,0.45)';
    c.lineWidth   = 1.5;
    for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        c.beginPath();
        c.moveTo(128 + Math.cos(ang) * 30, 128 + Math.sin(ang) * 30);
        c.lineTo(128 + Math.cos(ang) * 68, 128 + Math.sin(ang) * 68);
        c.stroke();
    }

    return _toTexture(cv, 1, 1);
}

// ── Public API ────────────────────────────────────────────────────────

function getTextures() {
    const { isUnicorn } = getTheme();
    const key = isUnicorn ? 'unicorn' : 'default';

    if (_cachedTheme === key && _cachedTextures) return _cachedTextures;

    // Dispose old textures to free GPU memory
    if (_cachedTextures) {
        Object.values(_cachedTextures).forEach(v => {
            if (v && typeof v.dispose === 'function') v.dispose();
        });
    }

    if (isUnicorn) {
        // playerBody0/1 share one texture — per-player distinction comes from
        // material colour properties in _makeUnicornMaterials(), not the map.
        const unicornBody = _makeUnicornBodyTexture();
        _cachedTextures = {
            pipe:        _makeUnicornPipeTexture(),
            ring:        _makeUnicornRingTexture(),
            playerBody0: unicornBody,
            playerBody1: unicornBody,
            bumper:      _makeCloudTexture(),
            bomb:        _makeBrambleTexture(),
            barrier:     _makeRuneTexture(),
        };
    } else {
        _cachedTextures = {
            pipe:        _makeDefaultPipeTexture(),
            ring:        _makeDefaultRingTexture(),
            playerBody0: _makeDefaultPlayerBodyTexture(0),
            playerBody1: _makeDefaultPlayerBodyTexture(1),
            bumper:      _makeHazardTexture('#aa3300', 'rgba(0,0,0,0.42)'),
            bomb:        _makeHazardTexture('#111111', 'rgba(200,178,0,0.52)'),
            barrier:     _makeHazardTexture('#770010', 'rgba(255,255,255,0.28)'),
        };
    }

    _cachedTheme = key;
    return _cachedTextures;
}
