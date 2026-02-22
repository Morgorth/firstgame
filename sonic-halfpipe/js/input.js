// Keyboard input handler.
// Populates the shared `keys` map and issues direct player actions.

document.addEventListener('keydown', e => {
    keys[e.code] = true;

    // Prevent arrow keys / space from scrolling the page
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// Called each frame by game.js to translate key state → player intent.
// Works for both 1P and 2P keyboard play.
function applyKeyboardInput() {
    if (controlMode !== 'keyboard') return;
    if (!gameState.running || gameState.countdownActive) return;

    const p1 = gameState.players[0];
    const p2 = gameState.players[1];

    // ── Player 1: Arrow keys or WASD ────────────────────────────────
    if (p1.active) {
        if (keys['ArrowLeft'] || keys['KeyA']) {
            p1.targetLane = Math.max(0, p1.targetLane - 0.12);
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            p1.targetLane = Math.min(CONFIG.pipe.laneCount - 1, p1.targetLane + 0.12);
        }
        if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && !p1.jumping) {
            triggerJump(0);
        }
        if ((keys['ArrowDown'] || keys['KeyS']) && !p1.crouching) {
            triggerCrouch(0);
        }
    }

    // ── Player 2: IJKL ──────────────────────────────────────────────
    if (p2.active && gameState.playerCount === 2) {
        if (keys['KeyJ']) {
            p2.targetLane = Math.max(0, p2.targetLane - 0.12);
        }
        if (keys['KeyL']) {
            p2.targetLane = Math.min(CONFIG.pipe.laneCount - 1, p2.targetLane + 0.12);
        }
        if (keys['KeyI'] && !p2.jumping) {
            triggerJump(1);
        }
        if (keys['KeyK'] && !p2.crouching) {
            triggerCrouch(1);
        }
    }
}

// Trigger a jump for playerIndex — called from keyboard or webcam gesture.
function triggerJump(playerIndex) {
    const p = gameState.players[playerIndex];
    if (p.jumping) return;
    p.jumping = true;
    p.jumpFrame = 0;
    audioSystem.playJump();
}

// Trigger a crouch for playerIndex.
function triggerCrouch(playerIndex) {
    const p = gameState.players[playerIndex];
    if (p.crouching) return;
    p.crouching = true;
    p.crouchFrame = 0;
}
