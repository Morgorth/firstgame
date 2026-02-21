// Core game logic: collision detection, wave spawning, and per-frame update.

function checkCollision(a, b, aw, ah, bw, bh) {
    return a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y;
}

function activateSuperWeapon(playerIndex) {
    if (gameState.superWeaponCharges[playerIndex] <= 0) return false;
    if (gameState.countdownActive) return false;
    if (gameState.enemies.length === 0) return false;

    gameState.superWeaponCharges[playerIndex]--;

    const cfg = CONFIG.superWeapon;
    const particleColor = gameTheme === 'unicorn' ? '#FFD700' : '#00ffff';

    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.health <= 0) continue;
        gameState.score += e.points;
        gameState.enemiesKilled++;
        gameState.totalKills++;
        checkSuperWeaponThreshold(playerIndex);
        for (let j = 0; j < cfg.particlesPerEnemy; j++) {
            gameState.particles.push(createParticle(e.x, e.y, particleColor));
        }
    }
    gameState.enemies = [];

    gameState.superWeaponFlashEffect = cfg.flashDuration;
    gameState.screenShake = { x: cfg.shakeIntensity, y: cfg.shakeIntensity };
    audioSystem.playSuperWeapon();

    return true;
}

function checkSuperWeaponThreshold(playerIndex) {
    if (playerIndex === undefined) return; // no player attribution, skip
    gameState.playerKills[playerIndex]++;
    if (gameState.playerKills[playerIndex] >= gameState.superWeaponNextThreshold[playerIndex]) {
        gameState.superWeaponCharges[playerIndex]++;
        gameState.superWeaponNextThreshold[playerIndex] += CONFIG.superWeapon.killsPerCharge + gameState.wave;
    }
}

// ── Fleet donation ──────────────────────────────────────────────────

function performFleetDonation() {
    const p0 = gameState.players[0];
    const p1 = gameState.players[1];
    const cfg = CONFIG.fleetDonate;
    // Determine donor and receiver
    let donor, receiver, donorIdx, receiverIdx;

    if (!p0.active && p1.active) {
        donor = p1; receiver = p0; donorIdx = 1; receiverIdx = 0;
    } else if (!p1.active && p0.active) {
        donor = p0; receiver = p1; donorIdx = 0; receiverIdx = 1;
    } else if (p0.active && p1.active) {
        // Both alive: donor is player with more ships (or P1 if equal)
        if (p0.crowdSize >= p1.crowdSize) {
            donor = p0; receiver = p1; donorIdx = 0; receiverIdx = 1;
        } else {
            donor = p1; receiver = p0; donorIdx = 1; receiverIdx = 0;
        }
    } else {
        return; // Both eliminated, nothing to do
    }

    if (receiver.active) {
        // Normal transfer: 1 ship
        if (donor.crowdSize <= cfg.normalShips) return; // Can't self-eliminate
        donor.crowdSize -= cfg.normalShips;
        receiver.crowdSize += cfg.normalShips;
    } else {
        // Revive: costs reviveShips from donor
        if (donor.crowdSize <= cfg.reviveShips) return; // Can't self-eliminate
        donor.crowdSize -= cfg.reviveShips;
        receiver.crowdSize = cfg.reviveShips;
        receiver.active = true;

        // Position revived player at a sensible lane
        const lanePositions = gameState.lanePositions;
        if (lanePositions) {
            const targetLane = receiverIdx === 0 ? 1 : 3;
            receiver.x = lanePositions[Math.min(targetLane, lanePositions.length - 1)];
            receiver.targetLane = targetLane;
        }
        receiver.y = PLAY_AREA.height - 40;

        // Trigger revive flash on HUD
        showReviveFlash(receiverIdx);
    }

    // Update legacy compat
    if (donorIdx === 0) gameState.crowdSize = donor.crowdSize;
    if (receiverIdx === 0) gameState.crowdSize = receiver.crowdSize;
    updateCrowdDisplay();

    // Spawn particles along the connection line between players
    const particleColor = gameTheme === 'unicorn' ? '#FF69B4' : '#00ffff';
    const midX = (donor.x + receiver.x) / 2;
    const midY = (donor.y + receiver.y) / 2;
    for (let i = 0; i < 20; i++) {
        const t = i / 20;
        const px = donor.x + (receiver.x - donor.x) * t;
        const py = donor.y + (receiver.y - donor.y) * t + (Math.random() - 0.5) * 40;
        gameState.particles.push(createParticle(px, py, particleColor));
    }

    // Burst at both players
    for (let i = 0; i < 8; i++) {
        gameState.particles.push(createParticle(donor.x, donor.y, particleColor));
        gameState.particles.push(createParticle(receiver.x, receiver.y, particleColor));
    }
}

// ── Wave spawning ───────────────────────────────────────────────────

function spawnWave() {
    const w = gameState.wave;

    const lanes = gameState.lanePositions ||
        [PLAY_AREA.width * 0.33, PLAY_AREA.width * 0.5, PLAY_AREA.width * 0.67];
    const numLanes = lanes.length;

    // Boss wave every 10 waves
    if (w % 10 === 0) {
        const bossHpScale = 1 + Math.floor(w / 10) * 0.2;
        const twoBosses = gameState.playerCount === 2 && w >= 20;

        if (twoBosses) {
            // Spawn two bosses side by side
            const boss1 = createEnemy('boss', lanes[Math.floor(numLanes / 2) - 1] || lanes[0], -100);
            boss1.health = Math.ceil(CONFIG.enemy.boss.health * bossHpScale);
            boss1.maxHealth = boss1.health;
            boss1.bossDirection = 1;
            gameState.enemies.push(boss1);

            const boss2 = createEnemy('boss', lanes[Math.floor(numLanes / 2) + 1] || lanes[numLanes - 1], -100);
            boss2.health = Math.ceil(CONFIG.enemy.boss.health * bossHpScale);
            boss2.maxHealth = boss2.health;
            boss2.bossDirection = -1;
            gameState.enemies.push(boss2);

            // Add 2-3 basic minions
            const minionCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < minionCount; i++) {
                const m = createEnemy('basic', lanes[i % numLanes], -80 - (i + 1) * 90);
                gameState.enemies.push(m);
            }

            gameState.enemiesInWave = 2 + minionCount;
        } else {
            const boss = createEnemy('boss', lanes[Math.floor(numLanes / 2)], -100);
            boss.health = Math.ceil(CONFIG.enemy.boss.health * bossHpScale);
            boss.maxHealth = boss.health;
            gameState.enemies.push(boss);

            // Add 2-3 basic minions
            const minionCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < minionCount; i++) {
                const m = createEnemy('basic', lanes[i % numLanes], -80 - (i + 1) * 90);
                gameState.enemies.push(m);
            }

            gameState.enemiesInWave = 1 + minionCount;
        }

        gameState.enemiesKilled = 0;
        audioSystem.startMusic();
        return;
    }

    let count, hp, spd;

    if (w === 1)      { count = 3;                  hp = 0.5; spd = 0.7;  }
    else if (w === 2) { count = 5;                  hp = 0.6; spd = 0.8;  }
    else if (w === 3) { count = 6;                  hp = 0.7; spd = 0.85; }
    else if (w <= 5)  { count = 6 + w;              hp = 0.8; spd = 0.9;  }
    else if (w <= 10) { count = 8 + (w - 5) * 2;   hp = 1;   spd = 1;    }
    else              { count = 18 + (w - 10) * 2;  hp = Math.min(1 + (w - 10) * 0.06, 2.5); spd = Math.min(1 + (w - 10) * 0.03, 1.5); }

    if (gameState.playerCount === 2) count = Math.ceil(count * 1.3);
    count = Math.min(count, 50);

    gameState.enemiesInWave = count;
    gameState.enemiesKilled = 0;

    // Start music when wave spawns
    audioSystem.startMusic();

    for (let i = 0; i < count; i++) {
        let type = 'basic';
        if (w >= 8) {
            const r = Math.random();
            type = r < 0.12 ? 'shifter' : r < 0.27 ? 'tank' : r < 0.52 ? 'fast' : 'basic';
        } else if (w >= 5) {
            const r = Math.random();
            type = r < 0.10 ? 'shifter' : r < 0.35 ? 'fast' : 'basic';
        } else if (w >= 3) {
            type = Math.random() < 0.15 ? 'fast' : 'basic';
        }

        // Shifters must spawn in a lane that already has another enemy
        let laneIdx = i % numLanes;
        if (type === 'shifter') {
            const occupiedLanes = [];
            for (let li = 0; li < numLanes; li++) {
                if (gameState.enemies.some(ex => ex.health > 0 && Math.abs(ex.x - lanes[li]) < 40)) {
                    occupiedLanes.push(li);
                }
            }
            if (occupiedLanes.length > 0) {
                laneIdx = occupiedLanes[Math.floor(Math.random() * occupiedLanes.length)];
            }
        }

        const enemy = createEnemy(type, lanes[laneIdx], -80 - Math.floor(i / numLanes) * 90);
        enemy.health = Math.ceil(enemy.maxHealth * hp);
        enemy.maxHealth = enemy.health;
        enemy.speed *= spd;
        gameState.enemies.push(enemy);
    }
}

// ── Per-frame update ────────────────────────────────────────────────

function update() {
    if (!gameState.running) return;
    if (!gameState.players.some(p => p.active)) return;

    gameState.frameCount++;
    const lanes = gameState.lanePositions ||
        [PLAY_AREA.width * 0.33, PLAY_AREA.width * 0.5, PLAY_AREA.width * 0.67];

    // Scroll stars
    gameState.stars.forEach(s => {
        s.y += s.speed;
        if (s.y > PLAY_AREA.height) { s.y = 0; s.x = Math.random() * PLAY_AREA.width; }
    });

    // Move players
    gameState.players.forEach((player, idx) => {
        if (!player.active) return;

        if (controlMode === 'camera' && webcamState.active) {
            const targetLane = Math.min(player.targetLane, lanes.length - 1);
            player.x += (lanes[targetLane] - player.x) * 0.2;
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

        // Super weapon activation (keyboard mode: Space for player 0)
        if (controlMode === 'keyboard' && idx === 0 && keys[CONFIG.superWeapon.activationKey] && gameState.superWeaponCharges[0] > 0) {
            activateSuperWeapon(0);
            keys[CONFIG.superWeapon.activationKey] = false;
        }
    });

    // Cache crowd positions for this frame (used by both update and render)
    gameState._cachedCrowdPositions = gameState.players.map((p, i) =>
        p.active ? getCrowdPositions(i) : []
    );

    // Auto-fire for all active players (paused during countdown)
    if (!gameState.countdownActive && gameState.frameCount - gameState.lastShot >= CONFIG.player.fireRate) {
        gameState.players.forEach((player, idx) => {
            if (!player.active) return;
            const nCols = CONFIG.player.fireColumns;
            const fSpacing = CONFIG.player.fireSpacing;
            for (let c = 0; c < nCols; c++) {
                const fx = player.x + (c - (nCols - 1) / 2) * fSpacing;
                gameState.bullets.push(createBullet(fx, player.y, idx));
                if (gameState.activeEffects.spread[idx] > 0) {
                    gameState.bullets.push(createBullet(fx - 15, player.y, idx));
                    gameState.bullets.push(createBullet(fx + 15, player.y, idx));
                }
            }
        });
        gameState.lastShot = gameState.frameCount;
    }

    // Move bullets
    gameState.bullets = gameState.bullets.filter(b => {
        b.y -= CONFIG.bullet.speed;
        return b.y > -20 && b.active;
    });

    // Skip combat logic during countdown (no enemies to process)
    if (gameState.countdownActive) {
        gameState.particles = gameState.particles.filter(p => { p.x += p.vx; p.y += p.vy; return --p.life > 0; });
        if (gameState.hitEffect > 0) { gameState.hitEffect--; gameState.screenShake.x *= 0.9; gameState.screenShake.y *= 0.9; }
        updateHUD();
        return;
    }

    // Move enemies
    gameState.enemies.forEach(e => {
        e.y += e.speed;
        // Boss horizontal movement
        if (e.type === 'boss') {
            e.x += (e.horizontalSpeed || CONFIG.enemy.boss.horizontalSpeed) * e.bossDirection;
            if (e.x <= e.width / 2 + 20) { e.bossDirection = 1; }
            else if (e.x >= PLAY_AREA.width - e.width / 2 - 20) { e.bossDirection = -1; }
        }
    });

    // Boss enemy spawning: each live boss spawns a minion every 60 frames (~1 second)
    if (gameState.frameCount % 60 === 0) {
        for (let i = 0; i < gameState.enemies.length; i++) {
            const e = gameState.enemies[i];
            if (e.type !== 'boss' || e.health <= 0) continue;
            const spawnLane = lanes[Math.floor(Math.random() * lanes.length)];
            const minion = createEnemy('basic', spawnLane, e.y + e.height / 2 + 10);
            gameState.enemies.push(minion);
            gameState.enemiesInWave++;
        }
    }

    // Shifter dodge logic
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.type !== 'shifter' || e.health <= 0 || e.y <= 0) continue;
        if (gameState.frameCount - e.lastDodgeFrame < e.dodgeCooldown) continue;

        // Check if any bullet is heading toward this shifter
        let threatened = false;
        for (let bi = 0; bi < gameState.bullets.length; bi++) {
            const b = gameState.bullets[bi];
            if (!b.active) continue;
            if (b.y < e.y && b.y > e.y - e.dodgeRange && Math.abs(b.x - e.x) < 40) {
                threatened = true;
                break;
            }
        }
        if (!threatened) continue;

        // Find current lane index
        let curLane = 0;
        let minDist = Infinity;
        for (let li = 0; li < lanes.length; li++) {
            const d = Math.abs(e.x - lanes[li]);
            if (d < minDist) { minDist = d; curLane = li; }
        }

        // Find adjacent lanes with alive enemies
        const candidates = [];
        for (const adj of [curLane - 1, curLane + 1]) {
            if (adj < 0 || adj >= lanes.length) continue;
            const count = gameState.enemies.filter(
                other => other !== e && other.health > 0 && Math.abs(other.x - lanes[adj]) < 40
            ).length;
            if (count > 0) candidates.push({ lane: adj, count });
        }
        if (candidates.length === 0) continue;

        // Prefer the lane with more cover
        candidates.sort((a, b) => b.count - a.count);
        const pick = (candidates.length > 1 && candidates[0].count === candidates[1].count)
            ? candidates[Math.floor(Math.random() * 2)]
            : candidates[0];

        e.x = lanes[pick.lane];
        e.lastDodgeFrame = gameState.frameCount;
    }

    // Bullet vs enemy collisions (lane-bucketed for performance)
    // Bucket enemies by horizontal lane for O(bullets * enemies_in_lane) instead of O(bullets * enemies)
    const laneW = 120; // bucket width in game units
    const enemyBuckets = {};
    for (let i = 0; i < gameState.enemies.length; i++) {
        const e = gameState.enemies[i];
        if (e.health <= 0) continue;
        const bucket = Math.floor(e.x / laneW);
        // Place enemy in its bucket and adjacent ones (for overlap)
        for (let b = bucket - 1; b <= bucket + 1; b++) {
            if (!enemyBuckets[b]) enemyBuckets[b] = [];
            enemyBuckets[b].push(e);
        }
    }

    const bw = CONFIG.bullet.width, bh = CONFIG.bullet.height;
    const pw = CONFIG.powerup.width, ph = CONFIG.powerup.height;

    for (let bi = 0; bi < gameState.bullets.length; bi++) {
        const bullet = gameState.bullets[bi];
        if (!bullet.active) continue;

        const bulletBucket = Math.floor(bullet.x / laneW);
        const nearby = enemyBuckets[bulletBucket];
        if (nearby) {
            for (let ei = 0; ei < nearby.length; ei++) {
                const enemy = nearby[ei];
                if (!bullet.active || enemy.health <= 0) continue;
                if (!checkCollision(bullet, enemy, bw, bh, enemy.width, enemy.height)) continue;

                bullet.active = false;
                enemy.health -= CONFIG.bullet.damage;
                enemy.lastHitBy = bullet.owner;

                if (enemy.health <= 0) {
                    audioSystem.playEnemyKill();
                    gameState.score += enemy.points;
                    gameState.enemiesKilled++;
                    gameState.totalKills++;
                    checkSuperWeaponThreshold(bullet.owner);

                    const chance = gameState.wave <= 3 ? 0.25 : gameState.wave <= 5 ? 0.18 : gameState.wave <= 10 ? CONFIG.powerup.spawnChance : Math.min(CONFIG.powerup.spawnChance + (gameState.wave - 10) * 0.004, 0.22);
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
            }
        }

        // Bullet vs powerup collisions (few powerups, no bucketing needed)
        if (!bullet.active) continue;
        for (let pi = 0; pi < gameState.powerups.length; pi++) {
            const pu = gameState.powerups[pi];
            if (!pu.active) continue;
            if (!checkCollision(bullet, pu, bw, bh, pw, ph)) continue;
            if (pu.owner !== undefined && pu.owner !== bullet.owner) continue;

            bullet.active = false;
            pu.health -= CONFIG.bullet.damage;

            if (pu.health <= 0) {
                const ownerIdx = bullet.owner || 0;
                const owner = gameState.players[ownerIdx];
                const puType = pu.type || 'fleet';
                const typeCfg = CONFIG.powerup.types[puType];
                const particleColor = gameTheme === 'unicorn' ? (typeCfg?.unicornColor || '#FFD700') : (typeCfg?.color || '#ffff00');

                if (puType === 'fleet') {
                    if (owner && owner.active && owner.crowdSize < CONFIG.player.maxCrowd) {
                        owner.crowdSize++;
                        if (ownerIdx === 0) gameState.crowdSize = owner.crowdSize;
                        updateCrowdDisplay();
                    }
                } else if (puType === 'shield') {
                    gameState.activeEffects.shield[ownerIdx] = CONFIG.powerup.types.shield.duration;
                } else if (puType === 'spread') {
                    gameState.activeEffects.spread[ownerIdx] = CONFIG.powerup.types.spread.duration;
                }

                for (let i = 0; i < 8; i++) {
                    gameState.particles.push(createParticle(pu.x, pu.y, particleColor));
                }
                pu.active = false;
            }
            break;
        }
    }

    // Enemy vs player collisions & enemies passing screen
    gameState.enemies = gameState.enemies.filter(e => {
        // Skip enemies already killed by bullets this frame
        if (e.health <= 0) return false;

        // Check collision with each active player
        for (let i = 0; i < gameState.players.length; i++) {
            const player = gameState.players[i];
            if (!player.active) continue;

            const crowdRadius = Math.sqrt(player.crowdSize) * 28;
            if (checkCollision(
                { x: player.x - crowdRadius / 2, y: player.y - crowdRadius / 2 },
                e, crowdRadius, crowdRadius, e.width, e.height
            )) {
                // Shield absorbs the hit
                if (gameState.activeEffects.shield[i] > 0) {
                    gameState.activeEffects.shield[i] = 0;
                    gameState.enemiesKilled++;
                    gameState.totalKills++;
                    checkSuperWeaponThreshold(i);
                    for (let j = 0; j < 15; j++) {
                        gameState.particles.push(createParticle(e.x, e.y, '#00aaff'));
                    }
                    return false;
                }

                const dmg = Math.ceil(e.health / CONFIG.bullet.damage);
                player.crowdSize = Math.max(0, player.crowdSize - dmg);
                if (i === 0) gameState.crowdSize = player.crowdSize;
                gameState.enemiesKilled++;
                gameState.totalKills++;
                checkSuperWeaponThreshold(i);
                gameState.hitEffect = 20;
                gameState.screenShake = { x: 10, y: 10 };
                for (let j = 0; j < 15; j++) {
                    gameState.particles.push(createParticle(player.x, player.y, '#ff0000'));
                }
                if (player.crowdSize <= 0) { player.active = false; }
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
                if (gameState.activeEffects.shield[i] > 0) {
                    gameState.activeEffects.shield[i] = 0;
                    for (let j = 0; j < 10; j++) {
                        gameState.particles.push(createParticle(player.x, player.y, '#00aaff'));
                    }
                    return;
                }
                player.crowdSize = Math.max(0, player.crowdSize - dmg);
                if (i === 0) gameState.crowdSize = player.crowdSize;
                if (player.crowdSize <= 0) player.active = false;
            });
            gameState.enemiesKilled++;
            gameState.totalKills++;
            // No specific player attribution for enemies passing the bottom
            gameState.hitEffect = 15;
            gameState.screenShake = { x: 5, y: 5 };
            updateCrowdDisplay();
            return false;
        }

        return e.health > 0;
    });

    // Single game-over check after all enemy processing is complete
    checkGameOver();

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

    // Tick down active effects
    for (let i = 0; i < gameState.players.length; i++) {
        if (gameState.activeEffects.shield[i] > 0) gameState.activeEffects.shield[i]--;
        if (gameState.activeEffects.spread[i] > 0) gameState.activeEffects.spread[i]--;
    }

    // Decay super weapon flash effect
    if (gameState.superWeaponFlashEffect > 0) {
        gameState.superWeaponFlashEffect--;
    }

    // Update music tempo based on how close enemies are to the deadline
    audioSystem.updateTempo(gameState.enemies, PLAY_AREA.height);

    updateHUD();
}

function checkGameOver() {
    if (!gameState.players.some(p => p.active)) gameOver();
}
