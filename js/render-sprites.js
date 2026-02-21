// render-sprites.js — Sprite/image cache infrastructure and theme helper.
// Loaded first among render-* files; all others depend on it.

// ── Per-player face image cache (camera mode) ────────────────────────
const _faceImageCache = {};

// ── Off-screen sprite cache (draw-once, stamp-many) ─────────────────
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
    return _ensureSprite('sparkle_' + size, size + 4, size + 4, (cx) => {
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

// ── Background gradient cache ────────────────────────────────────────
let _bgGradientCache = null;
let _bgGradientH = 0;
let _bgGradientTheme = '';

// ── Theme flags + per-theme constants ───────────────────────────────
//
// RENDER_THEME centralises every theme-specific visual value so
// render-*.js files can look up one object instead of repeating
// long ternary chains.
//
// Fields:
//   donateColor   — colour for fleet-donation reach beams
//   ringColor     — colour for player face-icon ring (null → use PLAYER_COLORS)
//   shieldColor   — rgba prefix for shield overlay (alpha appended at runtime)
//   hitFlashRGB   — RGB string for hit-flash overlay
//   chargeIcon    — emoji / null for charge-ready indicator (null → draw triangle)
//   chargeColor   — fill colour for charge-ready indicator

const RENDER_THEME = {
    unicorn: {
        donateColor:  '#FF69B4',
        ringColor:    '#FF69B4',
        shieldColor:  'rgba(255,182,193,',
        hitFlashRGB:  '128,0,128',
        chargeIcon:   '\u2B50',
        chargeColor:  '#FFD700',
    },
    pacificrim: {
        donateColor:  '#FF8C00',
        ringColor:    '#FF8C00',
        shieldColor:  'rgba(0,200,255,',
        hitFlashRGB:  '255,80,0',
        chargeIcon:   '\u26A1',
        chargeColor:  '#FF8C00',
    },
    dragon: {
        donateColor:  '#ff6600',
        ringColor:    '#ff6600',
        shieldColor:  'rgba(255,100,0,',
        hitFlashRGB:  '200,50,0',
        chargeIcon:   '\uD83D\uDD25',
        chargeColor:  '#ff6600',
    },
    space: {
        donateColor:  '#00ffff',
        ringColor:    null,          // falls back to PLAYER_COLORS[idx].primary
        shieldColor:  'rgba(0,170,255,',
        hitFlashRGB:  '255,0,0',
        chargeIcon:   null,          // draw a triangle instead
        chargeColor:  '#00ffff',
    },
};

// Returns booleans + the matching RENDER_THEME entry.
// Call once per render() and pass the result down to sub-functions.
function getTheme() {
    const isUnicorn    = gameTheme === 'unicorn';
    const isPacificRim = gameTheme === 'pacificrim';
    const isDragon     = gameTheme === 'dragon';
    const isSpace      = !isUnicorn && !isPacificRim && !isDragon;
    const theme        = RENDER_THEME[gameTheme] || RENDER_THEME.space;
    return { isUnicorn, isPacificRim, isDragon, isSpace, theme };
}
