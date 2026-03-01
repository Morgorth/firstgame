// Core game-loop logic for Sonic Half-Pipe.
// Manages physics, collisions, obstacle/ring spawning, and scoring.
// render.js handles all Three.js visual output.

// ── Lane geometry helper ─────────────────────────────────────────────

// Returns the { x, y } surface position on the pipe for a given fractional lane.
function laneToPosition(lane) {
    const cfg = CONFIG.pipe;
    const halfArc = (cfg.arcDegrees / 2) * Math.PI / 180;
    const numLanes = cfg.laneCount;
    // Map lane 0…(laneCount-1) to angle across the half-pipe arc
    const t = lane / (numLanes - 1);
    const angle = -halfArc + t * 2 * halfArc;
    return {
        x: Math.sin(angle) * cfg.radius,
        y: -Math.cos(angle) * cfg.radius + cfg.radius,
    };
}

// Returns the Y offset above the surface for a jump frame.
function jumpHeightAt(frame) {
    const cfg = CONFIG.player;
    if (frame >= cfg.jumpDuration) return 0;
    // Parabolic arc
    const t = frame / cfg.jumpDuration;
    return cfg.jumpHeight * 4 * t * (1 - t);
}

// ── Obstacle / ring spawning ─────────────────────────────────────────

let _nextObstacleFrame = 0;
let _ringSpawnTimer = 0;

function spawnObstacles() {
    if (gameState.frameCount < _nextObstacleFrame) return;
    _nextObstacleFrame = gameState.frameCount + CONFIG.obstacles.spawnInterval;

    const numLanes = CONFIG.pipe.laneCount;
    // Randomly pick one of three obstacle types
    const types = ['bumper', 'bomb', 'barrier'];
    const type = types[Math.floor(Math.random() * types.length)];
    // Spawn at any continuous position across the full pipe arc
    const lane = Math.random() * (numLanes - 1);

    gameState.obstacles.push({
        type,
        lane,
        z: CONFIG.obstacles.spawnZ,
        active: true,
        mesh: null,
        hitFrame: -1,
    });
}

function spawnRings() {
    _ringSpawnTimer++;
    if (_ringSpawnTimer < 40) return;
    _ringSpawnTimer = 0;

    const numLanes = CONFIG.pipe.laneCount;
    // Spawn a short run of 2–4 rings at a continuous position on the pipe arc
    const lane = Math.random() * (numLanes - 1);
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        gameState.ringItems.push({
            lane,
            z: CONFIG.obstacles.spawnZ - i * 180,
            active: true,
            mesh: null,
            spin: Math.random() * Math.PI * 2,
        });
    }
}

// ── Collision detection ──────────────────────────────────────────────

function checkCollisions() {
    for (let pi = 0; pi < gameState.playerCount; pi++) {
        const p = gameState.players[pi];
        if (!p.active) continue;

        const pos = laneToPosition(p.lane);
        const jumpOff = jumpHeightAt(p.jumpFrame);
        const playerZ = 0; // player sits at world Z 0

        // ── Ring collection ───────────────────────────────────────────
        for (const ring of gameState.ringItems) {
            if (!ring.active) continue;
            const rpos = laneToPosition(ring.lane);
            const dx = pos.x - rpos.x;
            const dy = (pos.y - jumpOff) - rpos.y;
            const dz = ring.z - playerZ;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < CONFIG.rings.collectRadius) {
                ring.active = false;
                p.rings++;
                gameState.score += CONFIG.rings.pointsEach;

                // Speed-up jingle every N rings
                if (p.rings > 0 && p.rings % CONFIG.speed.speedUpEveryRings === 0) {
                    audioSystem.playSpeedUp();
                }

                audioSystem.playRingCollect();
                spawnCollectParticles(rpos.x, rpos.y, ring.z, '#FFD700');
                updateHUD();

                if (p.rings >= CONFIG.rings.goal) {
                    triggerWin(pi);
                    return;
                }
            }
        }

        // ── Obstacle collision ────────────────────────────────────────
        if (p.invincible > 0) {
            p.invincible--;
        } else {
            for (const obs of gameState.obstacles) {
                if (!obs.active) continue;
                const opos = laneToPosition(obs.lane);
                const dx = pos.x - opos.x;
                const dy = (pos.y - jumpOff) - opos.y;
                const dz = obs.z - playerZ;

                // Use type-specific radius
                let r;
                if (obs.type === 'bumper') r = CONFIG.obstacles.bumperRadius;
                else if (obs.type === 'bomb') r = CONFIG.obstacles.bombRadius;
                else r = CONFIG.obstacles.barrierWidth / 2;

                // Crouching skips over barriers
                if (obs.type === 'barrier' && p.crouching) continue;

                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const hitRadius = CONFIG.player.hitRadius + r;

                if (dist < hitRadius) {
                    audioSystem.playHit();
                    p.invincible = CONFIG.player.invincibleFrames;
                    spawnCollectParticles(opos.x, opos.y, obs.z, '#FF4444');

                    // Lose 10 rings on hit, remove obstacle
                    p.rings = Math.max(0, p.rings - 10);
                    obs.active = false;
                    updateHUD();
                }
            }
        }
    }
}

// ── Particle helpers ─────────────────────────────────────────────────

function spawnCollectParticles(x, y, z, color) {
    for (let i = 0; i < 8; i++) {
        gameState.particles.push({
            x, y, z,
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60,
            vz: (Math.random() - 0.5) * 60,
            life: 1,
            decay: 0.055 + Math.random() * 0.03,
            color,
            mesh: null,
        });
    }
}

function updateParticles() {
    for (const pt of gameState.particles) {
        pt.x += pt.vx * 0.016;
        pt.y += pt.vy * 0.016;
        pt.z += pt.vz * 0.016;
        pt.life -= pt.decay;
    }
    // Remove dead particles (render.js also cleans up meshes)
    gameState.particles = gameState.particles.filter(pt => pt.life > 0);
}

// ── Player physics ───────────────────────────────────────────────────

function updatePlayers() {
    for (let pi = 0; pi < gameState.playerCount; pi++) {
        const p = gameState.players[pi];
        if (!p.active) continue;

        // Smooth lane transition
        p.lane += (p.targetLane - p.lane) * CONFIG.player.laneChangeSpeed;

        // Jump arc
        if (p.jumping) {
            p.jumpFrame++;
            if (p.jumpFrame >= CONFIG.player.jumpDuration) {
                p.jumping = false;
                p.jumpFrame = 0;
            }
        }

        // Crouch timer
        if (p.crouching) {
            p.crouchFrame++;
            if (p.crouchFrame >= CONFIG.player.crouchDuration) {
                p.crouching = false;
                p.crouchFrame = 0;
            }
        }
    }
}

// ── Speed & distance ─────────────────────────────────────────────────

function updateSpeedAndDistance() {
    gameState.speed = Math.min(
        CONFIG.speed.max,
        gameState.speed + CONFIG.speed.accelPerFrame
    );
    gameState.distance += gameState.speed;
}

// ── World scrolling ──────────────────────────────────────────────────

function scrollWorld() {
    const spd = gameState.speed;

    for (const obs of gameState.obstacles) obs.z += spd;
    for (const ring of gameState.ringItems) ring.z += spd;
    for (const pt of gameState.particles) pt.z += spd;

    // Remove items that have passed the player
    gameState.obstacles = gameState.obstacles.filter(o => {
        if (!o.active || o.z > CONFIG.obstacles.passZ) {
            if (o.mesh) { gameState.scene.remove(o.mesh); o.mesh = null; }
            return false;
        }
        return true;
    });
    gameState.ringItems = gameState.ringItems.filter(r => {
        if (!r.active || r.z > CONFIG.obstacles.passZ) {
            if (r.mesh) { gameState.scene.remove(r.mesh); r.mesh = null; }
            return false;
        }
        return true;
    });
}

// ── Win / Game-over ──────────────────────────────────────────────────

function triggerWin(playerIndex) {
    gameState.running = false;
    gameState.phase = 'win';
    audioSystem.playRingsWin();
    showEndScreen(true, playerIndex);
}

function triggerGameOver() {
    gameState.running = false;
    gameState.phase = 'gameover';
    audioSystem.playGameOver();
    showEndScreen(false, 0);
}

// ── Terrain variation (camera banking / pitch) ────────────────────────

// Terrain event presets: [targetOffsetX, targetOffsetY, targetRoll]
// No "flat" entry — every event is a meaningful turn, hill, or bank.
const _TERRAIN_EVENTS = [
    [ -180,   0,  -0.30  ],   // sharp left turn
    [  180,   0,   0.30  ],   // sharp right turn
    [ -110,   0,  -0.18  ],   // gentle left turn
    [  110,   0,   0.18  ],   // gentle right turn
    [    0,  80,     0   ],   // steep ascent
    [    0, -65,     0   ],   // steep descent
    [  -80,  55,  -0.14  ],   // banked left ascent
    [   80,  55,   0.14  ],   // banked right ascent
    [  -80, -50,  -0.14  ],   // banked left descent
    [   80, -50,   0.14  ],   // banked right descent
];

function _pickNextTerrainEvent() {
    const t = gameState.terrain;
    const cfg = CONFIG.terrain;
    const e = _TERRAIN_EVENTS[Math.floor(Math.random() * _TERRAIN_EVENTS.length)];
    t.targetOffsetX = e[0];
    t.targetOffsetY = e[1];
    t.targetRoll    = e[2];
    t.nextEventDistance = gameState.distance
        + cfg.minEventGap
        + Math.random() * (cfg.maxEventGap - cfg.minEventGap);
}

function updateTerrain() {
    const t   = gameState.terrain;
    const cfg = CONFIG.terrain;
    const cam = gameState.camera;
    if (!cam) return;

    // Trigger a new terrain event when the distance threshold is crossed
    if (gameState.distance >= t.nextEventDistance) {
        _pickNextTerrainEvent();
    }

    // Smoothly interpolate current values toward targets
    const k = cfg.lerpSpeed;
    t.currentOffsetX += (t.targetOffsetX - t.currentOffsetX) * k;
    t.currentOffsetY += (t.targetOffsetY - t.currentOffsetY) * k;
    t.currentRoll    += (t.targetRoll    - t.currentRoll)    * k;

    // Base camera constants (matching initScene)
    const baseY    = CONFIG.pipe.radius * 0.55;
    const baseZ    = 580;
    const lookY    = -CONFIG.pipe.radius * 0.15;

    // Apply offsets to camera position
    cam.position.set(
        t.currentOffsetX,
        baseY + t.currentOffsetY,
        baseZ
    );

    // Tilt the up-vector for banking; then re-point at shifted target.
    // A larger lookAt X multiplier makes the pipe appear to curve toward the turn.
    const r = t.currentRoll;
    cam.up.set(Math.sin(r), Math.cos(r), 0);
    cam.lookAt(
        t.currentOffsetX * 0.55,
        lookY + t.currentOffsetY * 0.40,
        -280
    );
}

// ── Main update tick ─────────────────────────────────────────────────

function gameTick() {
    if (!gameState.running || gameState.countdownActive) return;

    gameState.frameCount++;
    gameState.elapsedTime += 1 / 60;
    applyKeyboardInput();
    updateSpeedAndDistance();
    scrollWorld();
    spawnObstacles();
    spawnRings();
    updatePlayers();
    updateTerrain();
    checkCollisions();
    updateParticles();
    updateHUD();
}

// ── Countdown ────────────────────────────────────────────────────────

function startCountdown() {
    gameState.countdownActive = true;
    let count = 3;

    const el = document.getElementById('countdownEl');
    el.classList.remove('hidden');

    const tick = () => {
        if (count > 0) {
            el.textContent = count;
            el.classList.add('pulse');
            try { audioSystem.playCountdownBeep(false); } catch (e) { /* audio optional */ }
            setTimeout(() => el.classList.remove('pulse'), 400);
            count--;
            setTimeout(tick, 1000);
        } else {
            el.textContent = 'GO!';
            el.classList.add('pulse');
            try { audioSystem.playCountdownBeep(true); } catch (e) { /* audio optional */ }
            setTimeout(() => {
                el.classList.add('hidden');
                el.classList.remove('pulse');
                gameState.countdownActive = false;
                try { audioSystem.playStart(); } catch (e) { /* audio optional */ }
            }, 700);
        }
    };
    tick();
}
