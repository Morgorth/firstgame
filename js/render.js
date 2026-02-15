// All canvas rendering: backgrounds, players, enemies, bullets, powerups, effects.

// Cached Image objects for player face icons (camera mode)
const _faceImageCache = {};

// ── Pre-rendered sprite cache (avoids per-frame emoji text / gradient work) ──

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
    const key = 'sparkle_' + size;
    return _ensureSprite(key, size + 4, size + 4, (cx, w, h) => {
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

// Cached background gradient (invalidated on resize)
let _bgGradientCache = null;
let _bgGradientH = 0;

// ── Theme-specific sprite drawing ───────────────────────────────────

// Pre-rendered unicorn sprite (drawn once, stamped via drawImage)
let _unicornSpriteCanvas = null;
let _unicornSpriteSize = 0;

function _getUnicornSprite() {
    if (_unicornSpriteCanvas) return _unicornSpriteCanvas;
    const c = document.createElement('canvas');
    // Draw at size 1.0 with padding; the sprite covers -20..20 x and -35..25 y
    const pad = 4;
    const w = 44 + pad * 2, h = 64 + pad * 2;
    c.width = w; c.height = h;
    const cx = c.getContext('2d');
    cx.translate(22 + pad, 37 + pad); // center origin

    cx.fillStyle = '#FFB6C1';
    // Head
    cx.beginPath(); cx.arc(0, 5, 18, 0, Math.PI * 2); cx.fill();
    // Ear
    cx.beginPath(); cx.moveTo(-12, -8); cx.lineTo(-8, -20); cx.lineTo(-4, -8); cx.closePath(); cx.fill();
    // Horn
    const hornGrad = cx.createLinearGradient(-2, -15, 2, -35);
    hornGrad.addColorStop(0, '#FFD700');
    hornGrad.addColorStop(0.5, '#FF69B4');
    hornGrad.addColorStop(1, '#87CEEB');
    cx.fillStyle = hornGrad;
    cx.beginPath(); cx.moveTo(-4, -15); cx.lineTo(0, -35); cx.lineTo(4, -15); cx.closePath(); cx.fill();
    // Eye
    cx.fillStyle = '#000';
    cx.beginPath(); cx.arc(6, 2, 4, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#fff';
    cx.beginPath(); cx.arc(7, 1, 1.5, 0, Math.PI * 2); cx.fill();
    // Mane
    cx.fillStyle = '#FF6B6B'; cx.beginPath(); cx.ellipse(-15, -5, 8, 12, 0.3, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#FFE66D'; cx.beginPath(); cx.ellipse(-18, 5, 7, 10, 0.2, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#4ECDC4'; cx.beginPath(); cx.ellipse(-16, 15, 6, 8, 0.1, 0, Math.PI * 2); cx.fill();

    _unicornSpriteCanvas = c;
    return c;
}

function drawUnicorn(x, y, size) {
    const sprite = _getUnicornSprite();
    const pad = 4;
    const w = sprite.width, h = sprite.height;
    ctx.drawImage(sprite, x - (22 + pad) * size, y - (37 + pad) * size, w * size, h * size);
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
    } else if (e.type === 'shifter') {
        // Shifter — sleek diamond/dart shape
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
        // Boss — large hull with red eye sockets and pulsing core
        // Main hull
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
        if (!_bgGradientCache || _bgGradientH !== canvas.height) {
            _bgGradientCache = ctx.createLinearGradient(0, 0, 0, canvas.height);
            _bgGradientCache.addColorStop(0, '#87CEEB');
            _bgGradientCache.addColorStop(0.3, '#FFB6C1');
            _bgGradientCache.addColorStop(0.6, '#DDA0DD');
            _bgGradientCache.addColorStop(1, '#98FB98');
            _bgGradientH = canvas.height;
        }
        ctx.fillStyle = _bgGradientCache;
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
    if (isUnicorn) {
        for (let i = 0; i < gameState.stars.length; i++) {
            const s = gameState.stars[i];
            const spriteSize = Math.round(s.size * 8);
            if (spriteSize < 1) continue;
            const sprite = _getSparkleSprite(spriteSize);
            ctx.globalAlpha = s.size / 2 + 0.3;
            ctx.drawImage(sprite, s.x, s.y);
        }
        ctx.globalAlpha = 1;
    } else {
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < gameState.stars.length; i++) {
            const s = gameState.stars[i];
            ctx.globalAlpha = s.size / 2;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;
    }

    // Particles
    if (isUnicorn) {
        const sparkle12 = _getSparkleSprite(12);
        const pColors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF69B4'];
        for (let i = 0; i < gameState.particles.length; i++) {
            const p = gameState.particles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.drawImage(sparkle12, p.x, p.y);
        }
        ctx.globalAlpha = 1;
    } else {
        for (let i = 0; i < gameState.particles.length; i++) {
            const p = gameState.particles[i];
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
        }
        ctx.globalAlpha = 1;
    }

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
                const numRows = Math.ceil(player.crowdSize / Math.ceil(Math.sqrt(player.crowdSize * 2)));
                const faceY = player.y - numRows * 28 - 40;
                const playerColor = player.color || PLAYER_COLORS[playerIndex].primary;

                // Clipped face circle
                ctx.save();
                ctx.translate(player.x, faceY);
                ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.clip();
                ctx.drawImage(img, -25, -25, 50, 50);
                ctx.restore();

                // Border ring (no shadowBlur — use double stroke for glow effect)
                ctx.save();
                ctx.translate(player.x, faceY);
                const ringColor = isUnicorn ? '#FF69B4' : playerColor;
                ctx.strokeStyle = ringColor;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = 8;
                ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();

                // Label
                ctx.fillStyle = playerColor;
                ctx.font = 'bold 14px Orbitron, monospace';
                ctx.textAlign = 'center';
                ctx.fillText(`P${playerIndex + 1}`, player.x, faceY - 35);
            }

            // Shield overlay: pulsing circle around fleet when active
            if (gameState.activeEffects.shield[playerIndex] > 0) {
                const shieldPulse = Math.sin(gameState.frameCount * 0.12) * 0.15 + 0.85;
                const shieldRadius = Math.sqrt(player.crowdSize) * 28 + 20;
                const shieldColor = isUnicorn ? 'rgba(255,182,193,' : 'rgba(0,170,255,';
                ctx.strokeStyle = shieldColor + (0.6 * shieldPulse) + ')';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(player.x, player.y - shieldRadius / 3, shieldRadius * shieldPulse, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = shieldColor + (0.2 * shieldPulse) + ')';
                ctx.lineWidth = 10;
                ctx.beginPath();
                ctx.arc(player.x, player.y - shieldRadius / 3, shieldRadius * shieldPulse, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    }

    // Bullets
    if (isUnicorn) {
        const heartSprite = _getHeartSprite();
        for (let i = 0; i < gameState.bullets.length; i++) {
            const b = gameState.bullets[i];
            if (!b.active) continue;
            ctx.drawImage(heartSprite, b.x - 8, b.y - 3);
        }
    } else {
        for (let i = 0; i < gameState.bullets.length; i++) {
            const b = gameState.bullets[i];
            if (!b.active) continue;
            const owner = gameState.players[b.owner || 0];
            ctx.fillStyle = owner?.color || '#ff00ff';
            ctx.fillRect(b.x - 1.5, b.y, 3, 10);
        }
    }

    // Enemies
    // Draw all enemy sprites first
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.y < -100 || e.health <= 0) continue;
        const ships = Math.ceil(e.health / CONFIG.bullet.damage);
        const sc = (e.type === 'boss' ? 1.8 : e.type === 'tank' ? 1.2 : e.type === 'fast' ? 0.9 : e.type === 'shifter' ? 0.7 : 1) * (1 + ships * 0.08);
        if (isUnicorn) {
            const wolfColor = e.type === 'boss' ? '#8B0000' : e.type === 'tank' ? '#8B4513' : e.type === 'fast' ? '#A0A0A0' : e.type === 'shifter' ? '#9B30FF' : '#696969';
            drawWolf(e.x, e.y, sc * 0.9, wolfColor);
        } else {
            drawSpaceEnemy(e, sc);
        }
    }
    // Batch health overlays — set font once
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 18px Orbitron,monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.y < -100 || e.health <= 0) continue;
        const ships = Math.ceil(e.health / CONFIG.bullet.damage);
        ctx.strokeText(ships, e.x, e.y);
        ctx.fillText(ships, e.x, e.y);
    }

    // Powerups
    ctx.font = 'bold 22px Orbitron,monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < gameState.powerups.length; i++) {
        const p = gameState.powerups[i];
        if (!p.active) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        const pulse = Math.sin(gameState.frameCount * 0.15) * 0.5 + 1;
        const puType = p.type || 'fleet';
        const typeCfg = CONFIG.powerup.types[puType];
        const puColor = isUnicorn ? typeCfg.unicornColor : typeCfg.color;

        if (isUnicorn) {
            const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 45 * pulse);
            grd.addColorStop(0, puColor + '80');
            grd.addColorStop(1, puColor + '00');
            ctx.fillStyle = grd;
            ctx.fillRect(-50, -50, 100, 100);
            if (puType === 'fleet') {
                const starSprite = _getStarEmojiSprite();
                const sz = 44 * pulse;
                ctx.drawImage(starSprite, -sz / 2, -sz / 2, sz, sz);
            } else if (puType === 'shield') {
                ctx.font = `${Math.round(36 * pulse)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = puColor;
                ctx.fillText('\uD83D\uDEE1\uFE0F', 0, 0);
            } else {
                ctx.font = `${Math.round(36 * pulse)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = puColor;
                ctx.fillText('\u2728', 0, 0);
            }
        } else {
            const grd = ctx.createRadialGradient(0, 0, 10, 0, 0, 50 * pulse);
            grd.addColorStop(0, puColor + '66');
            grd.addColorStop(1, puColor + '00');
            ctx.fillStyle = grd;
            ctx.fillRect(-55, -55, 110, 110);

            ctx.strokeStyle = puColor + '99';
            ctx.lineWidth = 8;
            ctx.beginPath(); ctx.arc(0, 0, 35 * pulse, 0, Math.PI * 2); ctx.stroke();

            ctx.scale(1.3, 1.3);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 4;

            if (puType === 'fleet') {
                ctx.fillStyle = puColor;
                ctx.beginPath();
                ctx.moveTo(0, -15); ctx.lineTo(-10, 6); ctx.lineTo(-6, 10);
                ctx.lineTo(6, 10); ctx.lineTo(10, 6);
                ctx.closePath();
                ctx.stroke(); ctx.fill();
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath(); ctx.arc(0, -3, 4, 0, Math.PI * 2); ctx.fill();
            } else if (puType === 'shield') {
                // Shield shape
                ctx.fillStyle = puColor;
                ctx.beginPath();
                ctx.moveTo(0, -15); ctx.lineTo(-12, -5); ctx.lineTo(-10, 10);
                ctx.lineTo(0, 15); ctx.lineTo(10, 10); ctx.lineTo(12, -5);
                ctx.closePath();
                ctx.stroke(); ctx.fill();
            } else {
                // Spread: triple bars
                ctx.fillStyle = puColor;
                ctx.fillRect(-8, -10, 16, 4);
                ctx.fillRect(-12, -2, 24, 4);
                ctx.fillRect(-8, 6, 16, 4);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(-8, -10, 16, 4);
                ctx.strokeRect(-12, -2, 24, 4);
                ctx.strokeRect(-8, 6, 16, 4);
            }
        }

        // Ships-to-destroy count
        ctx.font = 'bold 22px Orbitron,monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const ships = Math.ceil(p.health / CONFIG.bullet.damage);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        const labelY = isUnicorn ? 35 : 18;
        ctx.strokeText(ships, 0, labelY);
        ctx.fillText(ships, 0, labelY);
        ctx.restore();
    }

    // Hit flash overlay
    if (gameState.hitEffect > 0) {
        const flashColor = isUnicorn ? '128,0,128' : '255,0,0';
        ctx.fillStyle = `rgba(${flashColor},${gameState.hitEffect / 50})`;
        ctx.fillRect(0, 0, PLAY_AREA.width, PLAY_AREA.height);
    }

    // Super weapon flash overlay
    if (gameState.superWeaponFlashEffect > 0) {
        const flashDuration = CONFIG.superWeapon.flashDuration;
        const effect = gameState.superWeaponFlashEffect;

        if (isUnicorn) {
            // Rainbow wave sweeping bottom-to-top
            const progress = 1 - (effect / flashDuration);
            const waveFrontY = PLAY_AREA.height * (1 - progress);
            const bandHeight = 100;

            // Rainbow gradient band
            const rainbowGrad = ctx.createLinearGradient(0, 0, PLAY_AREA.width, 0);
            rainbowGrad.addColorStop(0, '#FF0000');
            rainbowGrad.addColorStop(0.16, '#FF8800');
            rainbowGrad.addColorStop(0.33, '#FFFF00');
            rainbowGrad.addColorStop(0.5, '#00FF00');
            rainbowGrad.addColorStop(0.66, '#0088FF');
            rainbowGrad.addColorStop(0.83, '#8800FF');
            rainbowGrad.addColorStop(1, '#FF00FF');

            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.fillStyle = rainbowGrad;
            ctx.fillRect(0, waveFrontY - bandHeight / 2, PLAY_AREA.width, bandHeight);

            // White sparkle leading edge
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, waveFrontY - 3, PLAY_AREA.width, 6);
            ctx.restore();
        } else {
            // Space theme: cyan flash (unchanged)
            const alpha = effect / flashDuration * 0.6;
            ctx.fillStyle = `rgba(0,255,255,${alpha})`;
            ctx.fillRect(0, 0, PLAY_AREA.width, PLAY_AREA.height);
        }
    }

    // Charge-ready indicator above player fleet
    if (gameState.running) {
        gameState.players.forEach((player, idx) => {
            if (!player.active || gameState.superWeaponCharges[idx] <= 0) return;
            const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.font = 'bold 28px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const numRows = Math.ceil(player.crowdSize / Math.ceil(Math.sqrt(player.crowdSize * 2)));
            const iconY = player.y - numRows * 28 - 70;

            if (isUnicorn) {
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.strokeText('\u2B50', player.x, iconY);
                ctx.fillText('\u2B50', player.x, iconY);
            } else {
                ctx.fillStyle = '#00ffff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                // Triangle/nuke symbol
                ctx.beginPath();
                ctx.moveTo(player.x, iconY - 20);
                ctx.lineTo(player.x - 12, iconY);
                ctx.lineTo(player.x + 12, iconY);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        });
    }

    ctx.restore();
}
