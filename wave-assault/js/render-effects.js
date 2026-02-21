// render-effects.js — Screen overlays and HUD effects:
//   hit flash, super-weapon flash, fleet-donation beams, charge-ready indicators.
// Depends on: render-sprites.js

// ── Hit flash overlay ────────────────────────────────────────────────

function drawHitFlash({ theme }) {
    if (gameState.hitEffect <= 0) return;
    ctx.fillStyle = `rgba(${theme.hitFlashRGB},${gameState.hitEffect / 50})`;
    ctx.fillRect(0, 0, PLAY_AREA.width, PLAY_AREA.height);
}

// ── Super-weapon flash overlay ───────────────────────────────────────

function drawSuperWeaponFlash({ isUnicorn, isPacificRim, isDragon }) {
    const effect = gameState.superWeaponFlashEffect;
    if (effect <= 0) return;

    const flashDuration = CONFIG.superWeapon.flashDuration;

    if (isUnicorn) {
        // Rainbow wave sweeping bottom-to-top
        const progress    = 1 - (effect / flashDuration);
        const waveFrontY  = PLAY_AREA.height * (1 - progress);
        const bandHeight  = 100;

        const rainbowGrad = ctx.createLinearGradient(0, 0, PLAY_AREA.width, 0);
        rainbowGrad.addColorStop(0,    '#FF0000');
        rainbowGrad.addColorStop(0.16, '#FF8800');
        rainbowGrad.addColorStop(0.33, '#FFFF00');
        rainbowGrad.addColorStop(0.5,  '#00FF00');
        rainbowGrad.addColorStop(0.66, '#0088FF');
        rainbowGrad.addColorStop(0.83, '#8800FF');
        rainbowGrad.addColorStop(1,    '#FF00FF');

        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = rainbowGrad;
        ctx.fillRect(0, waveFrontY - bandHeight / 2, PLAY_AREA.width, bandHeight);
        // White sparkle leading edge
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, waveFrontY - 3, PLAY_AREA.width, 6);
        ctx.restore();

    } else if (isPacificRim) {
        // EMP shockwave — white blast ring expanding outward
        const progress  = 1 - (effect / flashDuration);
        const centerX   = PLAY_AREA.width / 2;
        const centerY   = PLAY_AREA.height / 2;
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * 1.4;

        // Blinding white flash at start
        const flashAlpha = Math.max(0, (1 - progress * 2.5) * 0.8);
        if (flashAlpha > 0) {
            ctx.fillStyle = `rgba(200,240,255,${flashAlpha})`;
            ctx.fillRect(0, 0, PLAY_AREA.width, PLAY_AREA.height);
        }

        // Expanding shockwave ring
        const ringRadius = maxRadius * progress;
        const ringAlpha  = (1 - progress) * 0.9;
        ctx.save();
        ctx.strokeStyle = `rgba(0,200,255,${ringAlpha})`;
        ctx.lineWidth   = 20 * (1 - progress);
        ctx.beginPath(); ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2); ctx.stroke();
        // Inner glow ring
        ctx.strokeStyle = `rgba(255,255,255,${ringAlpha * 0.6})`;
        ctx.lineWidth   = 8 * (1 - progress);
        ctx.beginPath(); ctx.arc(centerX, centerY, ringRadius * 0.95, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

    } else if (isDragon) {
        // Molten lava wave erupting from the bottom
        const progress   = 1 - (effect / flashDuration);
        const waveFrontY = PLAY_AREA.height * (1 - progress);
        const bandHeight = 120;

        // Full-screen heat wash at start
        const heatAlpha = Math.max(0, (1 - progress * 2) * 0.5);
        if (heatAlpha > 0) {
            ctx.fillStyle = `rgba(180,40,0,${heatAlpha})`;
            ctx.fillRect(0, 0, PLAY_AREA.width, PLAY_AREA.height);
        }

        const lavaGrad = ctx.createLinearGradient(0, 0, PLAY_AREA.width, 0);
        lavaGrad.addColorStop(0.0, '#ff2200'); lavaGrad.addColorStop(0.2, '#ff6600');
        lavaGrad.addColorStop(0.4, '#ffaa00'); lavaGrad.addColorStop(0.6, '#ff6600');
        lavaGrad.addColorStop(0.8, '#ff2200'); lavaGrad.addColorStop(1.0, '#ffaa00');

        ctx.save();
        ctx.globalAlpha = (1 - progress) * 0.55;
        ctx.fillStyle = lavaGrad;
        ctx.fillRect(0, waveFrontY - bandHeight / 2, PLAY_AREA.width, bandHeight);
        // Bright molten leading edge
        ctx.globalAlpha = (1 - progress) * 0.8;
        ctx.fillStyle = '#ffdd88';
        ctx.fillRect(0, waveFrontY - 4, PLAY_AREA.width, 8);
        ctx.restore();

    } else {
        // Space — cyan flash
        const alpha = effect / flashDuration * 0.6;
        ctx.fillStyle = `rgba(0,255,255,${alpha})`;
        ctx.fillRect(0, 0, PLAY_AREA.width, PLAY_AREA.height);
    }
}

// ── Fleet donation reach beams (2P only) ─────────────────────────────

function drawDonationBeams({ isUnicorn, isPacificRim, isDragon, theme }) {
    if (!gameState.running || gameState.playerCount !== 2) return;

    const r0 = webcamState.registeredPlayers[0].reachingOut;
    const r1 = webcamState.registeredPlayers[1].reachingOut;
    if (!r0 && !r1) return;

    const p0 = gameState.players[0];
    const p1 = gameState.players[1];
    const ds  = gameState.fleetDonateState;
    const donateColor = theme.donateColor;

    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    const beamAlpha = 0.4 + Math.sin(gameState.frameCount * 0.15) * 0.15;

    // Individual reach beams
    if (r0) {
        const endX = r1 ? midX : p0.x + (p1.x - p0.x) * 0.3;
        ctx.save();
        ctx.globalAlpha = beamAlpha; ctx.strokeStyle = donateColor;
        ctx.lineWidth = 4; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(endX, midY); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
    }
    if (r1) {
        const endX = r0 ? midX : p1.x + (p0.x - p1.x) * 0.3;
        ctx.save();
        ctx.globalAlpha = beamAlpha; ctx.strokeStyle = donateColor;
        ctx.lineWidth = 4; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(endX, midY); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
    }

    // Connected full beam when both reaching and cooldown clear
    if (r0 && r1 && ds.cooldown === 0) {
        const progress = Math.min(ds.holdFrames / CONFIG.fleetDonate.holdFrames, 1);
        ctx.save();
        ctx.globalAlpha  = 0.3 + progress * 0.5;
        ctx.strokeStyle  = donateColor;
        ctx.lineWidth    = 3 + progress * 6;
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        // Glow
        ctx.globalAlpha  = 0.15 + progress * 0.2;
        ctx.lineWidth    = 12 + progress * 12;
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        ctx.restore();

        // Theme-specific energy particles along the beam
        if (isDragon && progress > 0.3) {
            const numSparks = Math.floor(progress * 5) + 2;
            for (let i = 0; i < numSparks; i++) {
                const t  = (i + 1) / (numSparks + 1);
                const bx = p0.x + (p1.x - p0.x) * t;
                const by = p0.y + (p1.y - p0.y) * t;
                const jitter = Math.sin(gameState.frameCount * 0.18 + i * 1.7) * 14;
                ctx.fillStyle  = `rgba(255,${Math.floor(100 + progress * 100)},0,${0.6 + progress * 0.4})`;
                ctx.globalAlpha = 0.8;
                ctx.beginPath(); ctx.arc(bx, by + jitter, 4 + progress * 3, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }

        } else if (isPacificRim && progress > 0.3) {
            const numSparks = Math.floor(progress * 6) + 2;
            ctx.strokeStyle = `rgba(255,180,0,${0.6 + progress * 0.4})`; ctx.lineWidth = 2;
            for (let i = 0; i < numSparks; i++) {
                const t  = (i + 1) / (numSparks + 1);
                const bx = p0.x + (p1.x - p0.x) * t;
                const by = p0.y + (p1.y - p0.y) * t;
                const jitter = Math.sin(gameState.frameCount * 0.2 + i * 1.5) * 12;
                ctx.beginPath();
                ctx.moveTo(bx - 6, by + jitter - 6); ctx.lineTo(bx + 2, by + jitter);
                ctx.lineTo(bx - 2, by + jitter + 4); ctx.lineTo(bx + 6, by + jitter + 10);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;

        } else if (isUnicorn && progress > 0.3) {
            const heartSprite = _getHeartSprite();
            const numHearts   = Math.floor(progress * 5) + 1;
            for (let i = 0; i < numHearts; i++) {
                const t      = (i + 1) / (numHearts + 1);
                const offset = Math.sin(gameState.frameCount * 0.1 + i * 2) * 15;
                const hx = p0.x + (p1.x - p0.x) * t;
                const hy = p0.y + (p1.y - p0.y) * t + offset;
                ctx.globalAlpha = 0.6 + progress * 0.4;
                ctx.drawImage(heartSprite, hx - 8, hy - 8);
            }
            ctx.globalAlpha = 1;
        }
    }
}

// ── Charge-ready indicator above fleet ───────────────────────────────

function drawChargeIndicators({ isUnicorn, isPacificRim, isDragon, theme }) {
    if (!gameState.running) return;

    gameState.players.forEach((player, idx) => {
        if (!player.active || gameState.superWeaponCharges[idx] <= 0) return;

        const pulse   = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
        const numRows = Math.ceil(player.crowdSize / Math.ceil(Math.sqrt(player.crowdSize * 2)));
        const iconY   = player.y - numRows * 28 - 70;

        ctx.globalAlpha = pulse;
        ctx.font        = 'bold 28px Orbitron, monospace';
        ctx.textAlign   = 'center';
        ctx.textBaseline = 'bottom';

        if (theme.chargeIcon) {
            // Emoji indicator
            ctx.fillStyle   = theme.chargeColor;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.strokeText(theme.chargeIcon, player.x, iconY);
            ctx.fillText(theme.chargeIcon, player.x, iconY);
        } else {
            // Space — geometric triangle / nuke symbol
            ctx.fillStyle   = theme.chargeColor;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(player.x, iconY - 20);
            ctx.lineTo(player.x - 12, iconY);
            ctx.lineTo(player.x + 12, iconY);
            ctx.closePath();
            ctx.stroke(); ctx.fill();
        }
        ctx.globalAlpha = 1;
    });
}
