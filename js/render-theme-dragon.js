// render-theme-dragon.js — Player (dragon) and enemy (Black Knight) sprites for the dragon theme.

// ── Dragon player ────────────────────────────────────────────────────
// P1: crimson/gold    P2: emerald/gold

function drawDragon(pos, playerIndex) {
    const isP2       = playerIndex === 1;
    const bodyColor  = isP2 ? '#1a6632' : '#8b1a1a';
    const scaleColor = isP2 ? '#2a9a50' : '#bb2a2a';
    const wingColor  = isP2 ? '#0f4422' : '#6a1010';
    const eyeColor   = isP2 ? '#00ff88' : '#ff7700';
    const hornColor  = '#ccaa00';

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Left wing (behind body)
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(-32, -18); ctx.lineTo(-36, 8); ctx.lineTo(-18, 12); ctx.lineTo(-5, 5);
    ctx.closePath(); ctx.fill();
    // Wing veins
    ctx.strokeStyle = scaleColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(-32, -18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 2);  ctx.lineTo(-26, -5);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 7);  ctx.lineTo(-20, 10);  ctx.stroke();

    // Right wing
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.moveTo(5, -5);
    ctx.lineTo(32, -18); ctx.lineTo(36, 8); ctx.lineTo(18, 12); ctx.lineTo(5, 5);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, -4); ctx.lineTo(32, -18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 2);  ctx.lineTo(26, -5);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 7);  ctx.lineTo(20, 10);  ctx.stroke();

    // Body / torso (oval)
    ctx.fillStyle = bodyColor;
    ctx.beginPath(); ctx.ellipse(0, 5, 11, 14, 0, 0, Math.PI * 2); ctx.fill();

    // Scale highlights
    ctx.fillStyle = scaleColor;
    ctx.beginPath(); ctx.ellipse(-4, 0, 3, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, 0, 3, 4, 0.3, 0, Math.PI * 2);   ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 8, 3, 4, 0, 0, Math.PI * 2);     ctx.fill();

    // Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath(); ctx.ellipse(0, -13, 10, 9, 0, 0, Math.PI * 2); ctx.fill();

    // Horns
    ctx.fillStyle = hornColor;
    ctx.beginPath(); ctx.moveTo(-6, -18); ctx.lineTo(-11, -31); ctx.lineTo(-2, -19); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -18);  ctx.lineTo(11, -31);  ctx.lineTo(2, -19);  ctx.closePath(); ctx.fill();

    // Snout
    ctx.fillStyle = scaleColor;
    ctx.beginPath(); ctx.ellipse(0, -8, 6, 4, 0, 0, Math.PI * 2); ctx.fill();

    // Eyes (pulsing glow)
    const eyePulse = Math.sin((gameState.frameCount || 0) * 0.10) * 0.3 + 0.7;
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-5, -14, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -14, 3.5, 0, Math.PI * 2);  ctx.fill();
    ctx.fillStyle = eyeColor;
    ctx.globalAlpha = eyePulse;
    ctx.beginPath(); ctx.arc(-5, -14, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -14, 2, 0, Math.PI * 2);  ctx.fill();
    ctx.globalAlpha = 1;

    // Tail
    ctx.strokeStyle = bodyColor; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 18); ctx.quadraticCurveTo(18, 26, 22, 18); ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(22, 18); ctx.quadraticCurveTo(28, 12, 24, 8); ctx.stroke();

    ctx.restore();
}

// ── Black Knight enemies ─────────────────────────────────────────────
// basic   → plate-armoured footsoldier
// fast    → scout knight with twin daggers
// shifter → shadow knight (flickers in/out)
// tank    → heavy gothic knight with halberd
// boss    → Dark Lord mounted on spectral warhorse

function drawBlackKnight(e, sc) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(sc, sc);

    const armorPulse = Math.sin((gameState.frameCount || 0) * 0.08) * 0.3 + 0.7;

    if (e.type === 'basic') {
        // Round shield (left)
        ctx.fillStyle = '#1e1e1e';
        ctx.beginPath(); ctx.arc(-16, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(-20, -2, 8, 3);   // horizontal cross
        ctx.fillRect(-17, -6, 2, 11);  // vertical cross
        // Plate body
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(-9, -14); ctx.lineTo(-11, 10); ctx.lineTo(11, 10); ctx.lineTo(9, -14);
        ctx.closePath(); ctx.fill();
        // Gorget / collar
        ctx.fillStyle = '#222'; ctx.fillRect(-9, -16, 18, 5);
        // Sallet helmet
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.arc(0, -22, 10, 0, Math.PI * 2); ctx.fill();
        // Visor slit
        ctx.fillStyle = '#000'; ctx.fillRect(-8, -24, 16, 5);
        ctx.fillStyle = `rgba(255,80,0,${0.6 * armorPulse})`; ctx.fillRect(-5, -23, 10, 3);
        // Sword (right, angled)
        ctx.fillStyle = '#555';
        ctx.save(); ctx.rotate(-0.25);
        ctx.fillRect(14, -28, 3, 24);   // blade
        ctx.fillStyle = '#888'; ctx.fillRect(11, -6, 9, 3);  // crossguard
        ctx.fillStyle = '#996600'; ctx.fillRect(14, -3, 3, 7); // handle
        ctx.restore();

    } else if (e.type === 'fast') {
        // Slim torso
        ctx.fillStyle = '#1a1a2a';
        ctx.beginPath();
        ctx.moveTo(-7, -10); ctx.lineTo(-8, 8); ctx.lineTo(8, 8); ctx.lineTo(7, -10);
        ctx.closePath(); ctx.fill();
        // Bascinet helmet
        ctx.fillStyle = '#222233';
        ctx.beginPath(); ctx.arc(0, -16, 8, 0, Math.PI * 2); ctx.fill();
        // Pointed aventail
        ctx.fillStyle = '#1a1a2a';
        ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(0, -5); ctx.lineTo(6, -10); ctx.fill();
        // Blue-white visor slit
        ctx.fillStyle = `rgba(100,200,255,${0.7 * armorPulse})`; ctx.fillRect(-5, -18, 10, 3);
        // Twin daggers
        ctx.fillStyle = '#666';
        ctx.save(); ctx.rotate(0.3);  ctx.fillRect(-18, -20, 2, 14); ctx.restore();
        ctx.save(); ctx.rotate(-0.3); ctx.fillRect(16, -20, 2, 14);  ctx.restore();
        ctx.fillStyle = '#883300';
        ctx.fillRect(-19, -8, 4, 3); ctx.fillRect(15, -8, 4, 3);

    } else if (e.type === 'shifter') {
        // Flickering shadow knight
        const flicker = (gameState.frameCount || 0) % 8 < 5;
        ctx.globalAlpha = flicker ? 0.85 : 0.40;
        // Billowing cloak
        ctx.fillStyle = '#080808';
        ctx.beginPath();
        ctx.moveTo(0, -18); ctx.lineTo(-20, -2); ctx.lineTo(-24, 14); ctx.lineTo(24, 14); ctx.lineTo(20, -2);
        ctx.closePath(); ctx.fill();
        // Shadowy helm
        ctx.fillStyle = '#0f0f0f';
        ctx.beginPath(); ctx.arc(0, -22, 10, 0, Math.PI * 2); ctx.fill();
        // Curved horns
        ctx.fillStyle = '#1a0a2a';
        ctx.beginPath(); ctx.moveTo(-7, -28); ctx.lineTo(-13, -40); ctx.lineTo(-3, -28); ctx.fill();
        ctx.beginPath(); ctx.moveTo(7, -28);  ctx.lineTo(13, -40);  ctx.lineTo(3, -28);  ctx.fill();
        // Glowing purple eyes
        ctx.globalAlpha = flicker ? armorPulse : 0.5;
        ctx.fillStyle = '#bb00ff';
        ctx.beginPath(); ctx.arc(-4, -23, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4, -23, 3.5, 0, Math.PI * 2);  ctx.fill();
        ctx.globalAlpha = 1;

    } else if (e.type === 'tank') {
        // Tower shield (left)
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(-30, -20); ctx.lineTo(-30, 18); ctx.lineTo(-16, 24); ctx.lineTo(-14, -24);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-25, -12); ctx.lineTo(-25, 18); ctx.stroke();
        ctx.fillStyle = '#aa0000';
        ctx.fillRect(-28, -3, 10, 3); ctx.fillRect(-22, -9, 2, 13);
        // Armored body
        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        ctx.moveTo(-12, -22); ctx.lineTo(-13, 18); ctx.lineTo(13, 18); ctx.lineTo(12, -22);
        ctx.closePath(); ctx.fill();
        // Pauldrons
        ctx.fillStyle = '#181818';
        ctx.beginPath(); ctx.arc(-15, -16, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(15, -16, 8, 0, Math.PI * 2);  ctx.fill();
        // Great helm (flat-top)
        ctx.fillStyle = '#111';
        ctx.fillRect(-13, -36, 26, 16); ctx.fillRect(-11, -24, 22, 3);
        // Eye slit glow
        ctx.fillStyle = `rgba(255,40,0,${0.75 * armorPulse})`; ctx.fillRect(-8, -30, 16, 4);
        // Halberd (right)
        ctx.fillStyle = '#555'; ctx.fillRect(15, -46, 3, 62);
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.moveTo(15, -46); ctx.lineTo(26, -32); ctx.lineTo(18, -34); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#666';
        ctx.beginPath(); ctx.moveTo(18, -34); ctx.lineTo(26, -26); ctx.lineTo(15, -30); ctx.closePath(); ctx.fill();

    } else {
        // Boss — Dark Lord on spectral warhorse
        // Warhorse body
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.moveTo(-46, 2); ctx.lineTo(-50, 32); ctx.lineTo(-34, 40);
        ctx.lineTo(34, 40); ctx.lineTo(50, 32); ctx.lineTo(46, 2); ctx.lineTo(0, -8);
        ctx.closePath(); ctx.fill();
        // Spectral mane
        ctx.fillStyle = `rgba(200,0,60,${0.5 * armorPulse})`;
        ctx.beginPath(); ctx.ellipse(-30, -4, 14, 7, 0.5, 0, Math.PI * 2); ctx.fill();
        // Legs
        ctx.fillStyle = '#111';
        ctx.fillRect(-40, 32, 8, 22); ctx.fillRect(-22, 34, 8, 20);
        ctx.fillRect(14, 34, 8, 20);  ctx.fillRect(32, 32, 8, 22);
        // Dark Lord torso
        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        ctx.moveTo(-20, -32); ctx.lineTo(-22, 2); ctx.lineTo(22, 2); ctx.lineTo(20, -32);
        ctx.closePath(); ctx.fill();
        // Dark Lord cloak
        ctx.fillStyle = '#080808';
        ctx.beginPath();
        ctx.moveTo(-22, -10); ctx.lineTo(-32, 36); ctx.lineTo(32, 36); ctx.lineTo(22, -10);
        ctx.closePath(); ctx.fill();
        // Crown helm
        ctx.fillStyle = '#111'; ctx.fillRect(-16, -56, 32, 26);
        // Crown spikes
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath(); ctx.moveTo(-16, -56); ctx.lineTo(-11, -70); ctx.lineTo(-6, -56); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-3, -56);  ctx.lineTo(0, -74);   ctx.lineTo(3, -56);  ctx.fill();
        ctx.beginPath(); ctx.moveTo(6, -56);   ctx.lineTo(11, -70);  ctx.lineTo(16, -56); ctx.fill();
        // Glowing red eyes
        const eyeGlow = `rgba(255,0,0,${0.75 + armorPulse * 0.25})`;
        ctx.fillStyle = eyeGlow;
        ctx.beginPath(); ctx.arc(-8, -42, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -42, 6, 0, Math.PI * 2);  ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-8, -42, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -42, 2, 0, Math.PI * 2);  ctx.fill();
        // Two-handed sword (right)
        ctx.fillStyle = '#444'; ctx.fillRect(23, -76, 5, 96);
        ctx.fillStyle = '#777'; ctx.fillRect(18, -24, 15, 5);   // crossguard
        ctx.fillStyle = '#aa7700'; ctx.fillRect(24, -10, 4, 14); // handle
        // Rune glow on blade
        ctx.fillStyle = `rgba(255,0,0,${armorPulse * 0.8})`; ctx.fillRect(24, -76, 3, 52);
    }

    ctx.restore();
}
