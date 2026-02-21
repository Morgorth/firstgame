// render-theme-space.js — Player (spaceship) and enemy (space fighter) sprites for the space theme.

// ── Spaceship player ─────────────────────────────────────────────────

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

// ── Space enemy fighters ─────────────────────────────────────────────
// basic   → angular heavy interceptor
// fast    → slim dart fighter
// shifter → diamond/dart with flickering core
// tank    → armoured bruiser
// boss    → massive dreadnought

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
        // Sleek diamond/dart
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
        // Large hull with red eye sockets and pulsing core
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
        // Tank — armoured bruiser
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
