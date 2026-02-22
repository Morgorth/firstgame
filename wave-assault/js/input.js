// Keyboard input tracking.

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
