// render-entities.js — Drawing of game entities: players, bullets, enemies, powerups.
// Depends on: render-sprites.js, all render-theme-*.js files

// ── Player fleets ────────────────────────────────────────────────────

function drawPlayers({ isUnicorn, isPacificRim, isDragon, theme }) {
    gameState.players.forEach((player, playerIndex) => {
        if (!player.active) return;

        // Fleet sprites
        (gameState._cachedCrowdPositions?.[playerIndex] || getCrowdPositions(playerIndex)).forEach(pos => {
            if (isUnicorn) {
                drawUnicorn(pos.x, pos.y, 0.8);
            } else if (isPacificRim) {
                drawJaeger(pos, playerIndex);
            } else if (isDragon) {
                drawDragon(pos, playerIndex);
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

            // Border ring (double-stroke glow effect)
            ctx.save();
            ctx.translate(player.x, faceY);
            const ringColor = theme.ringColor || playerColor;
            ctx.strokeStyle = ringColor;
            ctx.globalAlpha = 0.3; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();

            // Label
            ctx.fillStyle = playerColor;
            ctx.font = 'bold 14px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`P${playerIndex + 1}`, player.x, faceY - 35);
        }

        // Shield overlay — pulsing circle when active
        if (gameState.activeEffects.shield[playerIndex] > 0) {
            const shieldPulse  = Math.sin(gameState.frameCount * 0.12) * 0.15 + 0.85;
            const shieldRadius = Math.sqrt(player.crowdSize) * 28 + 20;
            ctx.strokeStyle = theme.shieldColor + (0.6 * shieldPulse) + ')';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(player.x, player.y - shieldRadius / 3, shieldRadius * shieldPulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = theme.shieldColor + (0.2 * shieldPulse) + ')';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(player.x, player.y - shieldRadius / 3, shieldRadius * shieldPulse, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

// ── Bullets ──────────────────────────────────────────────────────────

function drawBullets({ isUnicorn, isPacificRim, isDragon }) {
    if (isUnicorn) {
        const heartSprite = _getHeartSprite();
        for (let i = 0; i < gameState.bullets.length; i++) {
            const b = gameState.bullets[i];
            if (!b.active) continue;
            ctx.drawImage(heartSprite, b.x - 8, b.y - 3);
        }

    } else if (isDragon) {
        // Fire breath — glowing fireballs
        for (let i = 0; i < gameState.bullets.length; i++) {
            const b = gameState.bullets[i];
            if (!b.active) continue;
            const isP2 = (b.owner || 0) === 1;
            const coreColor  = isP2 ? '#88ff44' : '#ffaa00';
            const outerColor = isP2 ? 'rgba(0,180,0,0.35)' : 'rgba(255,80,0,0.35)';
            ctx.fillStyle = outerColor;
            ctx.beginPath(); ctx.arc(b.x, b.y + 5, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = coreColor;
            ctx.beginPath(); ctx.arc(b.x, b.y + 5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(b.x, b.y + 4, 2, 0, Math.PI * 2); ctx.fill();
        }

    } else if (isPacificRim) {
        // Plasma cannon bolts — wide amber/cyan beams with glow
        for (let i = 0; i < gameState.bullets.length; i++) {
            const b = gameState.bullets[i];
            if (!b.active) continue;
            const isP2 = (b.owner || 0) === 1;
            const boltColor = isP2 ? '#ff6600' : '#00ccff';
            const glowColor = isP2 ? 'rgba(255,100,0,0.3)' : 'rgba(0,200,255,0.3)';
            ctx.fillStyle = glowColor; ctx.fillRect(b.x - 5, b.y - 2, 10, 14);
            ctx.fillStyle = boltColor; ctx.fillRect(b.x - 2, b.y, 4, 12);
            ctx.fillStyle = '#ffffff';  ctx.fillRect(b.x - 1, b.y + 1, 2, 8);
        }

    } else {
        // Space — thin coloured laser
        for (let i = 0; i < gameState.bullets.length; i++) {
            const b = gameState.bullets[i];
            if (!b.active) continue;
            const owner = gameState.players[b.owner || 0];
            ctx.fillStyle = owner?.color || '#ff00ff';
            ctx.fillRect(b.x - 1.5, b.y, 3, 10);
        }
    }
}

// ── Enemies ──────────────────────────────────────────────────────────

function drawEnemies({ isUnicorn, isPacificRim, isDragon }) {
    // Sprites first
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.y < -100 || e.health <= 0) continue;
        const ships = Math.ceil(e.health / CONFIG.bullet.damage);
        const ecfg  = CONFIG.enemy[e.type] || CONFIG.enemy.basic;
        const sc    = ecfg.renderScale * (1 + ships * ecfg.sizePerShip);

        if (isUnicorn) {
            drawUnicornEnemy(e, sc);
        } else if (isPacificRim) {
            drawKaiju(e, sc);
        } else if (isDragon) {
            drawBlackKnight(e, sc);
        } else {
            drawSpaceEnemy(e, sc);
        }
    }

    // Health labels — set context state once for the whole batch
    ctx.fillStyle   = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 3;
    ctx.font        = 'bold 18px Orbitron,monospace';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.y < -100 || e.health <= 0) continue;
        const ships = Math.ceil(e.health / CONFIG.bullet.damage);
        ctx.strokeText(ships, e.x, e.y);
        ctx.fillText(ships, e.x, e.y);
    }
}

// ── Powerups ─────────────────────────────────────────────────────────

function drawPowerups({ isUnicorn, isPacificRim, isDragon }) {
    ctx.font         = 'bold 22px Orbitron,monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < gameState.powerups.length; i++) {
        const p = gameState.powerups[i];
        if (!p.active) continue;
        ctx.save();
        ctx.translate(p.x, p.y);

        const pulse   = Math.sin(gameState.frameCount * 0.15) * 0.5 + 1;
        const puType  = p.type || 'fleet';
        const typeCfg = CONFIG.powerup.types[puType];
        const puColor = isUnicorn     ? typeCfg.unicornColor
                      : isPacificRim  ? typeCfg.pacificrimColor
                      : isDragon      ? typeCfg.dragonColor
                      :                 typeCfg.color;

        if (isUnicorn) {
            // Unicorn style — emoji icons with radial glow
            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 45 * pulse);
            grd.addColorStop(0, puColor + '80');
            grd.addColorStop(1, puColor + '00');
            ctx.fillStyle = grd; ctx.fillRect(-50, -50, 100, 100);

            if (puType === 'fleet') {
                const starSprite = _getStarEmojiSprite();
                const sz = 44 * pulse;
                ctx.drawImage(starSprite, -sz / 2, -sz / 2, sz, sz);
            } else {
                const emojiChar = puType === 'shield' ? '\uD83D\uDEE1\uFE0F' : '\u2728';
                ctx.font = `${Math.round(36 * pulse)}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = puColor;
                ctx.fillText(emojiChar, 0, 0);
            }

        } else {
            // Space / Pacific Rim / Dragon style — geometric icons
            const grd = ctx.createRadialGradient(0, 0, 10, 0, 0, 50 * pulse);
            grd.addColorStop(0, puColor + '66');
            grd.addColorStop(1, puColor + '00');
            ctx.fillStyle = grd; ctx.fillRect(-55, -55, 110, 110);

            ctx.strokeStyle = puColor + '99'; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.arc(0, 0, 35 * pulse, 0, Math.PI * 2); ctx.stroke();

            ctx.scale(1.3, 1.3);
            ctx.strokeStyle = '#000'; ctx.lineWidth = 4;

            if (puType === 'fleet') {
                ctx.fillStyle = puColor;
                ctx.beginPath();
                ctx.moveTo(0, -15); ctx.lineTo(-10, 6); ctx.lineTo(-6, 10);
                ctx.lineTo(6, 10);  ctx.lineTo(10, 6);
                ctx.closePath(); ctx.stroke(); ctx.fill();
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath(); ctx.arc(0, -3, 4, 0, Math.PI * 2); ctx.fill();
            } else if (puType === 'shield') {
                ctx.fillStyle = puColor;
                ctx.beginPath();
                ctx.moveTo(0, -15); ctx.lineTo(-12, -5); ctx.lineTo(-10, 10);
                ctx.lineTo(0, 15);  ctx.lineTo(10, 10);  ctx.lineTo(12, -5);
                ctx.closePath(); ctx.stroke(); ctx.fill();
            } else {
                // Spread — triple bars
                ctx.fillStyle = puColor;
                ctx.fillRect(-8, -10, 16, 4); ctx.fillRect(-12, -2, 24, 4); ctx.fillRect(-8, 6, 16, 4);
                ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
                ctx.strokeRect(-8, -10, 16, 4); ctx.strokeRect(-12, -2, 24, 4); ctx.strokeRect(-8, 6, 16, 4);
            }
        }

        // Ships-to-destroy count label
        ctx.font         = 'bold 22px Orbitron,monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        const ships  = Math.ceil(p.health / CONFIG.bullet.damage);
        const labelY = isUnicorn ? 35 : 18;
        ctx.fillStyle   = '#fff';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
        ctx.strokeText(ships, 0, labelY);
        ctx.fillText(ships, 0, labelY);

        ctx.restore();
    }
}

// ── Game particles ───────────────────────────────────────────────────

function drawParticles({ isUnicorn, isPacificRim, isDragon }) {
    if (isUnicorn) {
        const sparkle12 = _getSparkleSprite(12);
        for (let i = 0; i < gameState.particles.length; i++) {
            const p = gameState.particles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.drawImage(sparkle12, p.x, p.y);
        }
        ctx.globalAlpha = 1;

    } else if (isDragon) {
        // Fire sparks — glowing orange/red embers
        for (let i = 0; i < gameState.particles.length; i++) {
            const p     = gameState.particles[i];
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = alpha > 0.6 ? '#ffaa00' : alpha > 0.3 ? '#ff5500' : '#cc2200';
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = alpha * 0.35;
            ctx.fillStyle = '#ff8800';
            ctx.beginPath(); ctx.arc(p.x - p.vx, p.y - p.vy, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

    } else if (isPacificRim) {
        // Debris sparks — larger, fiery square pixels
        for (let i = 0; i < gameState.particles.length; i++) {
            const p     = gameState.particles[i];
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
            ctx.globalAlpha = alpha * 0.4;
            ctx.fillRect(p.x - p.vx, p.y - p.vy, 2, 2);
        }
        ctx.globalAlpha = 1;

    } else {
        // Space — small coloured squares
        for (let i = 0; i < gameState.particles.length; i++) {
            const p = gameState.particles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
        }
        ctx.globalAlpha = 1;
    }
}
