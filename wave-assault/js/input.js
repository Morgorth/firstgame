// Keyboard input tracking.

window.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.key] = false; });
