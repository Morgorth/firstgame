// Keyboard + touch input tracking.

// Keys that need default browser action suppressed (scrolling, etc.)
const GAME_KEYS = new Set([
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    ' ', 'a', 'd', 'w', 's', 'A', 'D', 'W', 'S'
]);

window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (GAME_KEYS.has(e.key)) e.preventDefault();
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
});

window.addEventListener('keyup', e => { keys[e.key] = false; });

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}

// ── Touch input (mobile play) ──────────────────────────────────────
// Drag anywhere on the canvas → player follows finger horizontally.
// We track a single primary touch identifier so a second finger (e.g. the
// nuke button) doesn't disturb steering.
const touchInput = {
    active: false,
    worldX: 0,        // target X in PLAY_AREA coords
    pointerId: null
};

function _touchToWorldX(clientX) {
    const rect = canvas.getBoundingClientRect();
    const t = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    return Math.max(0, Math.min(1, t)) * PLAY_AREA.width;
}

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    document.body.classList.add('touch-active');
    if (touchInput.active) return;
    const t = e.changedTouches[0];
    touchInput.active = true;
    touchInput.pointerId = t.identifier;
    touchInput.worldX = _touchToWorldX(t.clientX);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchInput.pointerId) {
            touchInput.worldX = _touchToWorldX(t.clientX);
            return;
        }
    }
}, { passive: false });

function _endCanvasTouch(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchInput.pointerId) {
            touchInput.active = false;
            touchInput.pointerId = null;
            return;
        }
    }
}
canvas.addEventListener('touchend', _endCanvasTouch, { passive: false });
canvas.addEventListener('touchcancel', _endCanvasTouch, { passive: false });
