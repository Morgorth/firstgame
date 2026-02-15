// All canvas rendering: backgrounds, players, enemies, bullets, powerups, effects.

// Cached Image objects for player face icons (camera mode)
const _faceImageCache = {};

// ── Theme-specific sprite drawing ───────────────────────────────────

function drawUnicorn(x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);

    ctx.fillStyle = '#FFB6C1';

    // Head
    ctx.beginPath(); ctx.arc(0, 5, 18, 0, Math.PI * 2); ctx.fill();
    // Ear
    ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(-8, -20); ctx.lineTo(-4, -8); ctx.closePath(); ctx.fill();

    // Horn (rainbow gradient)
    const hornGrad = ctx.createLinearGradient(-2, -15, 2, -35);
    hornGrad.addColorStop(0, '#FFD700');
    hornGrad.addColorStop(0.5, '#FF69B4');
    hornGrad.addColorStop(1, '#87CEEB');
    ctx.fillStyle = hornGrad;
    ctx.beginPath(); ctx.moveTo(-4, -15); ctx.lineTo(0, -35); ctx.lineTo(4, -15); ctx.closePath(); ctx.fill();

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(6, 2, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(7, 1, 1.5, 0, Math.PI * 2); ctx.fill();

    // Mane (rainbow)
    ctx.fillStyle = '#FF6B6B'; ctx.beginPath(); ctx.ellipse(-15, -5, 8, 12, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFE66D'; ctx.beginPath(); ctx.ellipse(-18, 5, 7, 10, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4ECDC4'; ctx.beginPath(); ctx.ellipse(-16, 15, 6, 8, 0.1, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
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

    // Background
    if (isUnicorn) {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(0.3, '#FFB6C1');
        grad.addColorStop(0.6, '#DDA0DD');
        grad.addColorStop(1, '#98FB98');
        ctx.fillStyle = grad;
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

    // Stars / sparkles
    gameState.stars.forEach(s => {
        if (isUnicorn) {
            ctx.fillStyle = `rgba(255,255,255,${s.size / 2 + 0.3})`;
            ctx.font = `${s.size * 8}px Arial`;
            ctx.fillText('\u2728', s.x, s.y);
        } else {
            ctx.fillStyle = `rgba(255,255,255,${s.size / 2})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
    });

    // Particles
    gameState.particles.forEach(p => {
        if (isUnicorn) {
            ctx.fillStyle = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF69B4'][Math.floor(p.life) % 4];
            ctx.font = '12px Arial';
            ctx.fillText('\u2728', p.x, p.y);
        } else {
            ctx.fillStyle = p.color.replace(')', `,${p.life / p.maxLife})`).replace('rgb', 'rgba');
            ctx.fillRect(p.x, p.y, 3, 3);
        }
    });

    // Player fleets
    if (gameState.running) {
        gameState.players.forEach((player, playerIndex) => {
            if (!player.active) return;

            (gameState._cachedCrowdPositions?.[playerIndex] || getCrowdPositions(playerIndex)).forEach(pos => {
                if (isUnicorn) {
                    drawUnicorn(pos.x, pos.y, 0.8);
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
                const faceY = player.y - 50 - Math.sqrt(player.crowdSize) * 10;
                const playerColor = player.color || PLAYER_COLORS[playerIndex].primary;

                // Clipped face circle
                ctx.save();
                ctx.translate(player.x, faceY);
                ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.clip();
                ctx.drawImage(img, -25, -25, 50, 50);
                ctx.restore();

                // Border ring
                ctx.save();
                ctx.translate(player.x, faceY);
                ctx.strokeStyle = isUnicorn ? '#FF69B4' : playerColor;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();

                // Label
                ctx.fillStyle = playerColor;
                ctx.font = 'bold 14px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`P${playerIndex + 1}`, player.x, faceY - 35);
            }
        });
    }

    // Bullets
    gameState.bullets.forEach(b => {
        if (!b.active) return;
        const owner = gameState.players[b.owner || 0];
        if (isUnicorn) {
            ctx.fillStyle = '#FF69B4';
            ctx.font = '16px Arial';
            ctx.fillText('\uD83D\uDC96', b.x - 8, b.y + 5);
        } else {
            const bulletColor = owner?.color || '#ff00ff';
            ctx.fillStyle = bulletColor;
            ctx.fillRect(b.x - 1.5, b.y, 3, 10);
        }
    });

    // Enemies
    gameState.enemies.forEach(e => {
        if (e.y < -100 || e.health <= 0) return; // skip off-screen or dead enemies
        const ships = Math.ceil(e.health / CONFIG.bullet.damage);
        const sc = (e.type === 'tank' ? 1.2 : e.type === 'fast' ? 0.9 : 1) * (1 + ships * 0.08);

        if (isUnicorn) {
            const wolfColor = e.type === 'tank' ? '#8B4513' : e.type === 'fast' ? '#A0A0A0' : '#696969';
            drawWolf(e.x, e.y, sc * 0.9, wolfColor);
        } else {
            drawSpaceEnemy(e, sc);
        }

        // Health number overlay
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 18px Orbitron,monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(ships, 0, 0);
        ctx.fillText(ships, 0, 0);
        ctx.restore();
    });

    // Powerups
    gameState.powerups.forEach(p => {
        if (!p.active) return;
        ctx.save();
        ctx.translate(p.x, p.y);
        const pulse = Math.sin(gameState.frameCount * 0.15) * 0.5 + 1;

        if (isUnicorn) {
            ctx.shadowBlur = 50;
            ctx.shadowColor = '#FFD700';
            ctx.font = `${40 * pulse}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('\uD83C\uDF1F', 0, 0);
        } else {
            ctx.shadowBlur = 50;
            ctx.shadowColor = '#ffff00';
            ctx.strokeStyle = 'rgba(255,255,0,0.6)';
            ctx.lineWidth = 8;
            ctx.beginPath(); ctx.arc(0, 0, 35 * pulse, 0, Math.PI * 2); ctx.stroke();

            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 40 * pulse;
            ctx.scale(1.3, 1.3);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, -15); ctx.lineTo(-10, 6); ctx.lineTo(-6, 10);
            ctx.lineTo(6, 10); ctx.lineTo(10, 6);
            ctx.closePath();
            ctx.stroke(); ctx.fill();

            ctx.fillStyle = '#ffaa00';
            ctx.beginPath(); ctx.arc(0, -3, 4, 0, Math.PI * 2); ctx.fill();
        }

        // Ships-to-destroy count
        const ships = Math.ceil(p.health / CONFIG.bullet.damage);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#000';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.font = 'bold 22px Orbitron,monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelY = isUnicorn ? 35 : 18;
        ctx.strokeText(ships, 0, labelY);
        ctx.fillText(ships, 0, labelY);
        ctx.restore();
    });

    // Hit flash overlay
    if (gameState.hitEffect > 0) {
        const flashColor = isUnicorn ? '128,0,128' : '255,0,0';
        ctx.fillStyle = `rgba(${flashColor},${gameState.hitEffect / 50})`;
        ctx.fillRect(0, 0, PLAY_AREA.width, PLAY_AREA.height);
    }

    ctx.restore();
}
