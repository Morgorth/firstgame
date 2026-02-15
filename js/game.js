// Core game logic: collision detection, wave spawning, and per-frame update.

function checkCollision(a, b, aw, ah, bw, bh) {
    return a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y;
}

// ── Wave spawning ───────────────────────────────────────────────────

function spawnWave() {
    const w = gameState.wave;
    let count, hp, spd;

    if (w === 1)      { count = 3;                  hp = 0.5; spd = 0.7;  }
    else if (w === 2) { count = 5;                  hp = 0.6; spd = 0.8;  }
    else if (w === 3) { count = 6;                  hp = 0.7; spd = 0.85; }
    else if (w <= 5)  { count = 6 + w;              hp = 0.8; spd = 0.9;  }
    else if (w <= 10) { count = 8 + (w - 5) * 2;   hp = 1;   spd = 1;    }
    else              { count = 18 + (w - 10) * 2;  hp = 1 + (w - 10) * 0.1; spd = 1 + (w - 10) * 0.05; }

    if (gameState.playerCount === 2) count = Math.ceil(count * 1.3);
    count = Math.min(count, 50);

    gameState.enemiesInWave = count;
    gameState.enemiesKilled = 0;

    const lanes = gameState.lanePositions ||
        [PLAY_AREA.width * 0.33, PLAY_AREA.width * 0.5, PLAY_AREA.width * 0.67];
    const numLanes = lanes.length;

    // Start music when wave spawns
    audioSystem.startMusic();

    for (let i = 0; i < count; i++) {
        let type = 'basic';
        if (w >= 8) {
            const r = Math.random();
            type = r < 0.15 ? 'tank' : r < 0.4 ? 'fast' : 'basic';
        } else if (w >= 5) {
            type = Math.random() < 0.25 ? 'fast' : 'basic';
        } else if (w >= 3) {
            type = Math.random() < 0.15 ? 'fast' : 'basic';
        }

        const enemy = createEnemy(type, lanes[i % numLanes], -80 - Math.floor(i / numLanes) * 90);
        enemy.health = Math.ceil(enemy.maxHealth * hp);
        enemy.maxHealth = enemy.health;
        enemy.speed *= spd;
        gameState.enemies.push(enemy);
    }
}

// ── Per-frame update ────────────────────────────────────────────────

function update() {
    if (!gameState.running) return;
    if (gameState.players.filter(p => p.active).length === 0) return;

    gameState.frameCount++;

    // Scroll stars
    gameState.stars.forEach(s => {
        s.y += s.speed;
        if (s.y > PLAY_AREA.height) { s.y = 0; s.x = Math.random() * PLAY_AREA.width; }
    });

    // Move players
    gameState.players.forEach((player, idx) => {
        if (!player.active) return;

        if (controlMode === 'camera' && webcamState.active) {
            const lanePositions = gameState.lanePositions ||
                [PLAY_AREA.width * 0.33, PLAY_AREA.width * 0.5, PLAY_AREA.width * 0.67];
            const targetLane = Math.min(player.targetLane, lanePositions.length - 1);
            player.x += (lanePositions[targetLane] - player.x) * 0.2;
        } else if (idx === 0) {
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= CONFIG.player.speed;
            if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += CONFIG.player.speed;
        }

        player.x = Math.max(50, Math.min(PLAY_AREA.width - 50, player.x));

        // Sync legacy player reference
        if (idx === 0) {
            gameState.player.x = player.x;
            gameState.player.y = player.y;
        }
    });

    // Cache crowd positions for this frame (used by both update and render)
    gameState._cachedCrowdPositions = gameState.players.map((p, i) =>
        p.active ? getCrowdPositions(i) : []
    );

    // Auto-fire for all active players
    if (gameState.frameCount - gameState.lastShot >= CONFIG.player.fireRate) {
        gameState.players.forEach((player, idx) => {
            if (!player.active) return;
            gameState._cachedCrowdPositions[idx].forEach(p => gameState.bullets.push(createBullet(p.x, p.y, idx)));
        });
        gameState.lastShot = gameState.frameCount;
    }

    // Move bullets
    gameState.bullets = gameState.bullets.filter(b => {
        b.y -= CONFIG.bullet.speed;
        return b.y > -20 && b.active;
    });

    // Move enemies
    gameState.enemies.forEach(e => e.y += e.speed);

    // Bullet vs enemy collisions
    gameState.bullets.forEach(bullet => {
        if (!bullet.active) return;

        gameState.enemies.forEach(enemy => {
            if (!bullet.active || enemy.health <= 0) return;
            if (!checkCollision(bullet, enemy, CONFIG.bullet.width, CONFIG.bullet.height, enemy.width, enemy.height)) return;

            bullet.active = false;
            enemy.health -= CONFIG.bullet.damage;
            enemy.lastHitBy = bullet.owner;

            if (enemy.health <= 0) {
                audioSystem.playEnemyKill();
                gameState.score += enemy.points;
                gameState.enemiesKilled++;

                // Powerup drop chance (higher in early waves)
                const chance = gameState.wave <= 3 ? 0.25 : gameState.wave <= 5 ? 0.18 : CONFIG.powerup.spawnChance;
                if (Math.random() < chance) {
                    const pu = createPowerup(enemy.x, enemy.y);
                    pu.owner = bullet.owner;
                    gameState.powerups.push(pu);
                }

                for (let i = 0; i < 10; i++) {
                    gameState.particles.push(createParticle(enemy.x, enemy.y, enemy.color));
                }
                enemy.health = -999;
            }
        });

        // Bullet vs powerup collisions
        gameState.powerups.forEach(pu => {
            if (!bullet.active || !pu.active) return;
            if (!checkCollision(bullet, pu, CONFIG.bullet.width, CONFIG.bullet.height, CONFIG.powerup.width, CONFIG.powerup.height)) return;
            if (pu.owner !== undefined && pu.owner !== bullet.owner) return;

            bullet.active = false;
            pu.health -= CONFIG.bullet.damage;

            if (pu.health <= 0) {
                const ownerIdx = bullet.owner || 0;
                const owner = gameState.players[ownerIdx];
                if (owner && owner.active && owner.crowdSize < CONFIG.player.maxCrowd) {
                    owner.crowdSize++;
                    if (ownerIdx === 0) gameState.crowdSize = owner.crowdSize;
                    updateCrowdDisplay();
                }
                for (let i = 0; i < 8; i++) {
                    gameState.particles.push(createParticle(pu.x, pu.y, owner?.color || '#ffff00'));
                }
                pu.active = false;
            }
        });
    });

    // Enemy vs player collisions & enemies passing screen
    gameState.enemies = gameState.enemies.filter(e => {
        // Skip enemies already killed by bullets this frame
        if (e.health <= 0) return false;

        // Check collision with each active player
        for (let i = 0; i < gameState.players.length; i++) {
            const player = gameState.players[i];
            if (!player.active) continue;

            const crowdRadius = Math.sqrt(player.crowdSize) * 35;
            if (checkCollision(
                { x: player.x - crowdRadius / 2, y: player.y - crowdRadius / 2 },
                e, crowdRadius, crowdRadius, e.width, e.height
            )) {
                const dmg = Math.ceil(e.health / CONFIG.bullet.damage);
                player.crowdSize = Math.max(0, player.crowdSize - dmg);
                if (i === 0) gameState.crowdSize = player.crowdSize;
                gameState.enemiesKilled++;
                gameState.hitEffect = 20;
                gameState.screenShake = { x: 10, y: 10 };
                for (let j = 0; j < 15; j++) {
                    gameState.particles.push(createParticle(player.x, player.y, '#ff0000'));
                }
                if (player.crowdSize <= 0) { player.active = false; checkGameOver(); }
                updateCrowdDisplay();
                return false;
            }
        }

        // Enemy passed the bottom — explosion!
        if (e.y > PLAY_AREA.height + 50) {
            audioSystem.playExplosion();
            const dmg = Math.ceil(e.health / CONFIG.bullet.damage / 2);
            gameState.players.forEach((player, i) => {
                if (!player.active) return;
                player.crowdSize = Math.max(0, player.crowdSize - dmg);
                if (i === 0) gameState.crowdSize = player.crowdSize;
                if (player.crowdSize <= 0) player.active = false;
            });
            gameState.enemiesKilled++;
            gameState.hitEffect = 15;
            gameState.screenShake = { x: 5, y: 5 };
            checkGameOver();
            updateCrowdDisplay();
            return false;
        }

        return e.health > 0;
    });

    // Move powerups & particles
    gameState.powerups = gameState.powerups.filter(p => p.active && (p.y += CONFIG.powerup.speed) < PLAY_AREA.height);
    gameState.particles = gameState.particles.filter(p => { p.x += p.vx; p.y += p.vy; return --p.life > 0; });

    // Wave progression
    if (gameState.enemiesKilled >= gameState.enemiesInWave && gameState.enemies.length === 0 && !gameState.countdownActive) {
        // Stop music as soon as wave is cleared
        if (audioSystem.isPlaying) audioSystem.stopMusic();
        if (++gameState.waveTimer >= 60) {
            gameState.wave++;
            gameState.waveTimer = 0;
            gameState.enemiesKilled = 0;

            // Every 2 waves in 2-player mode: balance fleet sizes
            if (gameState.playerCount === 2 && gameState.wave % 2 === 0) {
                const p1 = gameState.players[0];
                const p2 = gameState.players[1];
                if (p1.active && p2.active && p1.crowdSize !== p2.crowdSize) {
                    const total = p1.crowdSize + p2.crowdSize;
                    const half = Math.floor(total / 2);
                    // Bigger fleet donates to the smaller one
                    p1.crowdSize = half;
                    p2.crowdSize = total - half; // gets the extra 1 if total is odd
                    gameState.crowdSize = p1.crowdSize;
                    updateCrowdDisplay();
                }
            }

            updateWave();

            // Countdown before next wave
            gameState.countdownActive = true;
            startWaveCountdown(() => {
                if (!gameState.running) return;
                gameState.countdownActive = false;
                spawnWave();
            });
        }
    }

    // Decay hit effect
    if (gameState.hitEffect > 0) {
        gameState.hitEffect--;
        gameState.screenShake.x *= 0.9;
        gameState.screenShake.y *= 0.9;
    }

    // Update music tempo based on how close enemies are to the deadline
    audioSystem.updateTempo(gameState.enemies, PLAY_AREA.height);

    updateHUD();
}

function checkGameOver() {
    if (!gameState.players.some(p => p.active)) gameOver();
}
