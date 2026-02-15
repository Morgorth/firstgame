// Factory functions for creating game entities.

function createPlayer() {
    return { x: PLAY_AREA.width / 2, y: PLAY_AREA.height - 60 };
}

function createBullet(x, y, owner = 0) {
    return { x, y, active: true, owner };
}

function createEnemy(type, x, y) {
    const cfg = CONFIG.enemy[type];
    return { type, x, y, health: cfg.health, maxHealth: cfg.health, ...cfg };
}

function createPowerup(x, y) {
    return { x, y, active: true, health: 20, maxHealth: 20 };
}

function createParticle(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color
    };
}

function createStars() {
    const stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * PLAY_AREA.width,
            y: Math.random() * PLAY_AREA.height,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.2
        });
    }
    return stars;
}

// Returns an array of {x,y} positions for the fleet grid around a player.
function getCrowdPositions(playerIndex = 0) {
    let playerX, playerY, size;

    if (gameState.playerCount > 1) {
        const player = gameState.players[playerIndex];
        if (!player || !player.active) return [];
        playerX = player.x;
        playerY = player.y;
        size = player.crowdSize;
    } else {
        if (!gameState.player) return [];
        playerX = gameState.player.x;
        playerY = gameState.player.y;
        size = gameState.crowdSize;
    }

    const positions = [];
    const spacing = 28;
    // Wider formation: more columns than rows to stay flat at the bottom
    const cols = Math.ceil(Math.sqrt(size * 2));
    const rows = Math.ceil(size / cols);
    let idx = 0;

    // Grid grows upward from player position (row 0 = bottom, at playerY)
    for (let r = 0; r < rows && idx < size; r++) {
        const inRow = Math.min(cols, size - idx);
        for (let c = 0; c < inRow; c++) {
            positions.push({
                x: playerX + (c - (inRow - 1) / 2) * spacing,
                y: playerY - r * spacing
            });
            idx++;
        }
    }
    return positions;
}
