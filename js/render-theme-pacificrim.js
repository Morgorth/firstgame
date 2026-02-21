// render-theme-pacificrim.js — Player (Jaeger) and enemy (Kaiju) sprites for the Pacific Rim theme.

// ── Jaeger player ────────────────────────────────────────────────────
// P1: blue/silver Gipsy Danger   P2: red/gold Crimson Typhoon

function drawJaeger(pos, playerIndex) {
    const isP2      = playerIndex === 1;
    const primary   = isP2 ? '#cc2200' : '#0066cc';
    const secondary = isP2 ? '#ffaa00' : '#00ccff';
    const visor     = isP2 ? '#ff6600' : '#00ffff';

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Legs
    ctx.fillStyle = primary;
    ctx.fillRect(-9, 10, 7, 14);
    ctx.fillRect(2, 10, 7, 14);

    // Torso
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(-14, -5); ctx.lineTo(-12, 10); ctx.lineTo(12, 10); ctx.lineTo(14, -5);
    ctx.lineTo(10, -12); ctx.lineTo(-10, -12);
    ctx.closePath(); ctx.fill();

    // Chest detail
    ctx.fillStyle = secondary;
    ctx.fillRect(-5, -8, 10, 8);

    // Shoulders
    ctx.fillStyle = secondary;
    ctx.beginPath(); ctx.arc(-16, -8, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(16, -8, 7, 0, Math.PI * 2); ctx.fill();

    // Arms
    ctx.fillStyle = primary;
    ctx.fillRect(-20, -4, 6, 12);
    ctx.fillRect(14, -4, 6, 12);

    // Head
    ctx.fillStyle = primary;
    ctx.fillRect(-8, -24, 16, 13);

    // Visor glow (pulses each frame)
    const visorPulse = Math.sin((gameState.frameCount || 0) * 0.08) * 0.3 + 0.7;
    ctx.fillStyle = visor;
    ctx.globalAlpha = visorPulse;
    ctx.fillRect(-6, -22, 12, 5);
    ctx.globalAlpha = 1;

    // Conn-Pod (top knot)
    ctx.fillStyle = secondary;
    ctx.fillRect(-4, -28, 8, 5);

    ctx.restore();
}

// ── Kaiju enemies ────────────────────────────────────────────────────
// basic → Category II (Leatherback-like)
// fast  → Category I  (Raiju-like)
// shifter → Category III (Otachi-like)
// tank  → Category IV  (Knifehead-like)
// boss  → Category V   (Slattern)

function drawKaiju(e, sc) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(sc, sc);

    const biolumPulse = Math.sin((gameState.frameCount || 0) * 0.12) * 0.5 + 0.5;

    if (e.type === 'basic') {
        // Hunched bruiser
        ctx.fillStyle = '#2a5a2a';
        ctx.beginPath();
        ctx.moveTo(0, -20); ctx.lineTo(-22, -5); ctx.lineTo(-25, 18);
        ctx.lineTo(0, 25); ctx.lineTo(25, 18); ctx.lineTo(22, -5);
        ctx.closePath(); ctx.fill();
        // Bioluminescent vents
        ctx.fillStyle = `rgba(0,255,80,${0.4 + biolumPulse * 0.5})`;
        ctx.beginPath(); ctx.ellipse(-10, 5, 4, 8, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(10, 5, 4, 8, -0.3, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = `rgba(0,255,80,${0.7 + biolumPulse * 0.3})`;
        ctx.beginPath(); ctx.arc(-8, -8, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -8, 5, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'fast') {
        // Sleek quad runner
        ctx.fillStyle = '#1a3a4a';
        ctx.beginPath();
        ctx.moveTo(0, -28); ctx.lineTo(-14, -5); ctx.lineTo(-16, 18);
        ctx.lineTo(16, 18); ctx.lineTo(14, -5);
        ctx.closePath(); ctx.fill();
        // Streamlined fins
        ctx.beginPath(); ctx.moveTo(-14, -5); ctx.lineTo(-22, -12); ctx.lineTo(-14, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(22, -12); ctx.lineTo(14, 0); ctx.fill();
        // Glowing eye stripe
        ctx.fillStyle = `rgba(0,200,255,${0.6 + biolumPulse * 0.4})`;
        ctx.fillRect(-10, -14, 20, 5);

    } else if (e.type === 'shifter') {
        // Tentacled phaser
        ctx.fillStyle = '#3a1a4a';
        ctx.beginPath();
        ctx.moveTo(0, -18); ctx.lineTo(-12, 0); ctx.lineTo(0, 20); ctx.lineTo(12, 0);
        ctx.closePath(); ctx.fill();
        // Tentacle fins
        ctx.fillStyle = '#5a2a6a';
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-22, -8); ctx.lineTo(-18, 10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(22, -8); ctx.lineTo(18, 10); ctx.fill();
        // Phase glow
        ctx.fillStyle = `rgba(180,0,255,${biolumPulse * 0.8})`;
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'tank') {
        // Armored titan
        ctx.fillStyle = '#3a2a1a';
        ctx.beginPath();
        ctx.moveTo(0, -30); ctx.lineTo(-32, -15); ctx.lineTo(-38, 22);
        ctx.lineTo(-22, 30); ctx.lineTo(22, 30); ctx.lineTo(38, 22); ctx.lineTo(32, -15);
        ctx.closePath(); ctx.fill();
        // Armored brow plates
        ctx.fillStyle = '#5a3a1a';
        ctx.beginPath(); ctx.moveTo(-20, -28); ctx.lineTo(0, -40); ctx.lineTo(20, -28); ctx.fill();
        // Biolum belly
        ctx.fillStyle = `rgba(255,80,0,${0.3 + biolumPulse * 0.4})`;
        ctx.beginPath(); ctx.ellipse(0, 12, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = `rgba(255,60,0,${0.8 + biolumPulse * 0.2})`;
        ctx.beginPath(); ctx.arc(-12, -10, 7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(12, -10, 7, 0, Math.PI * 2); ctx.fill();

    } else {
        // Category V Boss — Slattern (triple tail, massive)
        ctx.fillStyle = '#1a1a3a';
        ctx.beginPath();
        ctx.moveTo(0, -55); ctx.lineTo(-55, -25); ctx.lineTo(-65, 28);
        ctx.lineTo(-45, 48); ctx.lineTo(45, 48); ctx.lineTo(65, 28); ctx.lineTo(55, -25);
        ctx.closePath(); ctx.fill();
        // Triple forehead crests
        ctx.fillStyle = '#2a2a5a';
        ctx.beginPath(); ctx.moveTo(-16, -52); ctx.lineTo(-8, -70); ctx.lineTo(0, -52); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(8, -70); ctx.lineTo(16, -52); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-26, -44); ctx.lineTo(-18, -60); ctx.lineTo(-10, -44); ctx.fill();
        // Tail spikes (side cannons)
        ctx.fillStyle = '#3a3a6a';
        ctx.fillRect(-78, -12, 18, 44);
        ctx.fillRect(60, -12, 18, 44);
        // Eyes — four, bioluminescent blue
        const eyeColor = `rgba(0,150,255,${0.7 + biolumPulse * 0.3})`;
        ctx.fillStyle = eyeColor;
        ctx.beginPath(); ctx.arc(-22, -8, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(22, -8, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-10, -22, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -22, 6, 0, Math.PI * 2); ctx.fill();
        // Pulsing PPDC blue core
        ctx.fillStyle = `rgba(0,200,255,${biolumPulse * 0.7})`;
        ctx.beginPath(); ctx.arc(0, 20, 16, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
}
