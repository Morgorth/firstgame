// render.js — Main render orchestrator.
// Calls sub-modules in draw order; do not add drawing logic here.
//
// Sub-module responsibilities:
//   render-sprites.js        → sprite cache, getTheme(), RENDER_THEME
//   render-theme-unicorn.js  → drawUnicorn, drawWolf / drawUnicornEnemy
//   render-theme-pacificrim.js → drawJaeger, drawKaiju
//   render-theme-space.js    → drawSpaceShip, drawSpaceEnemy
//   render-theme-dragon.js   → drawDragon, drawBlackKnight
//   render-background.js     → drawBackground, drawDragonEnvironment,
//                              drawPacificRimEnvironment, drawStars
//   render-entities.js       → drawParticles, drawPlayers, drawBullets,
//                              drawEnemies, drawPowerups
//   render-effects.js        → drawHitFlash, drawSuperWeaponFlash,
//                              drawDonationBeams, drawChargeIndicators

function render() {
    const T = getTheme(); // { isUnicorn, isPacificRim, isDragon, isSpace, theme }

    // ── Canvas-space: background fill ─────────────────────────────────
    drawBackground(T);

    // ── Enter play-area virtual coordinate space ───────────────────────
    ctx.save();
    const scale = Math.min(canvas.width / PLAY_AREA.width, canvas.height / PLAY_AREA.height);
    ctx.translate(
        (canvas.width  - PLAY_AREA.width  * scale) / 2,
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

    // ── Environment (under stars/embers) ──────────────────────────────
    if (T.isDragon)     drawDragonEnvironment();

    // ── Ambient particles (stars / embers / rain) ──────────────────────
    drawStars(T);

    // Pacific Rim city ruins interleaved after rain so debris is visible
    if (T.isPacificRim) drawPacificRimEnvironment();

    // ── Game particles (explosions, sparks) ────────────────────────────
    drawParticles(T);

    // ── Game entities ──────────────────────────────────────────────────
    if (gameState.running) drawPlayers(T);
    drawBullets(T);
    drawEnemies(T);
    drawPowerups(T);

    // ── Overlay effects ────────────────────────────────────────────────
    drawHitFlash(T);
    drawSuperWeaponFlash(T);
    drawDonationBeams(T);
    drawChargeIndicators(T);

    ctx.restore();
}
