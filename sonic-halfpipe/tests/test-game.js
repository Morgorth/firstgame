/**
 * Game logic tests — covers pure physics and game-loop functions:
 *   laneToPosition, jumpHeightAt, updateSpeedAndDistance,
 *   scrollWorld, updatePlayers, spawnObstacles, spawnRings,
 *   checkCollisions (rings & obstacles), updateParticles.
 */

'use strict';

module.exports = function runGameTests(ctx, fw) {

    // ── Helpers ──────────────────────────────────────────────────────

    /** Return a freshly-initialised gameState and reset spawn timers. */
    function fresh(playerCount) {
        playerCount = playerCount || 1;
        const cfg = ctx.CONFIG;

        ctx.gameState = {
            running:        true,
            frameCount:     0,
            speed:          cfg.speed.initial,
            distance:       0,
            score:          0,
            playerCount,
            players: [
                {
                    active:      true,
                    lane:        cfg.player.startLane,
                    targetLane:  cfg.player.startLane,
                    rings:       0,
                    jumping:     false,
                    jumpFrame:   0,
                    crouching:   false,
                    crouchFrame: 0,
                    invincible:  0,
                    color:       '#00ffff',
                    faceImage:   null,
                    mesh:        null,
                },
                {
                    active:      playerCount === 2,
                    lane:        cfg.player.startLane,
                    targetLane:  cfg.player.startLane,
                    rings:       0,
                    jumping:     false,
                    jumpFrame:   0,
                    crouching:   false,
                    crouchFrame: 0,
                    invincible:  0,
                    color:       '#ff00ff',
                    faceImage:   null,
                    mesh:        null,
                },
            ],
            obstacles:          [],
            ringItems:          [],
            particles:          [],
            phase:              'playing',
            countdownActive:    false,
            lastSpeedUpRings:   [0, 0],
            // Minimal Three.js stub
            scene:              { remove: () => {} },
            camera:             null,
            renderer:           null,
            pipeSegments:       [],
        };

        ctx._nextObstacleFrame = 0;
        ctx._ringSpawnTimer    = 0;
    }

    /** Place a ring exactly at player 0's lane, z = 0 (right on top of player). */
    function ringAtPlayer() {
        ctx.gameState.ringItems.push({
            lane:   ctx.gameState.players[0].lane,
            z:      0,
            active: true,
            mesh:   null,
            spin:   0,
        });
    }

    /** Place a bumper exactly at player 0's lane, z = 0. */
    function bumperAtPlayer() {
        ctx.gameState.obstacles.push({
            type:     'bumper',
            lane:     ctx.gameState.players[0].lane,
            z:        0,
            active:   true,
            mesh:     null,
            hitFrame: -1,
        });
    }

    // ── laneToPosition() ─────────────────────────────────────────────

    fw.describe('laneToPosition()', () => {
        fw.it('lane 0 yields x < 0 (left side)', () => {
            const p = ctx.laneToPosition(0);
            fw.assert(p.x < 0, `Expected x < 0, got ${p.x}`);
        });

        fw.it('lane (laneCount-1) yields x > 0 (right side)', () => {
            const maxLane = ctx.CONFIG.pipe.laneCount - 1;
            const p = ctx.laneToPosition(maxLane);
            fw.assert(p.x > 0, `Expected x > 0, got ${p.x}`);
        });

        fw.it('center lane yields x ≈ 0', () => {
            const center = (ctx.CONFIG.pipe.laneCount - 1) / 2;
            const p = ctx.laneToPosition(center);
            fw.assertApprox(p.x, 0, 1, `Expected x ≈ 0, got ${p.x}`);
        });

        fw.it('y is always >= 0 across all integer lanes', () => {
            for (let lane = 0; lane < ctx.CONFIG.pipe.laneCount; lane++) {
                const p = ctx.laneToPosition(lane);
                fw.assert(p.y >= 0, `Lane ${lane}: Expected y >= 0, got ${p.y}`);
            }
        });

        fw.it('lane 0 and lane (laneCount-1) are symmetric (|x| equal, y equal)', () => {
            const left  = ctx.laneToPosition(0);
            const right = ctx.laneToPosition(ctx.CONFIG.pipe.laneCount - 1);
            fw.assertApprox(left.x, -right.x, 0.001, 'x values should be symmetric');
            fw.assertApprox(left.y,  right.y, 0.001, 'y values should be equal for symmetric lanes');
        });

        fw.it('returns an object with numeric x and y', () => {
            const p = ctx.laneToPosition(2);
            fw.assert(typeof p.x === 'number' && typeof p.y === 'number');
        });
    });

    // ── jumpHeightAt() ───────────────────────────────────────────────

    fw.describe('jumpHeightAt()', () => {
        const dur = ctx.CONFIG.player.jumpDuration;
        const h   = ctx.CONFIG.player.jumpHeight;

        fw.it('returns 0 at frame 0 (launch)', () => {
            fw.assertEqual(ctx.jumpHeightAt(0), 0);
        });

        fw.it('returns 0 at jumpDuration (landing)', () => {
            fw.assertEqual(ctx.jumpHeightAt(dur), 0);
        });

        fw.it('peaks near the middle of the arc', () => {
            const mid  = Math.floor(dur / 2);
            const peak = ctx.jumpHeightAt(mid);
            fw.assertApprox(peak, h, h * 0.05,
                `Peak height should be ≈${h}, got ${peak}`);
        });

        fw.it('is always non-negative throughout the arc', () => {
            for (let f = 0; f <= dur; f++) {
                const ht = ctx.jumpHeightAt(f);
                fw.assert(ht >= 0, `Frame ${f}: height ${ht} < 0`);
            }
        });

        fw.it('is symmetric — same height at t and (dur-t)', () => {
            const t = Math.floor(dur / 4);
            fw.assertApprox(
                ctx.jumpHeightAt(t),
                ctx.jumpHeightAt(dur - t),
                0.001,
                'Arc should be symmetric around mid-point'
            );
        });
    });

    // ── updateSpeedAndDistance() ──────────────────────────────────────

    fw.describe('updateSpeedAndDistance()', () => {
        fw.it('increases speed each frame (below max)', () => {
            fresh();
            const before = ctx.gameState.speed;
            ctx.updateSpeedAndDistance();
            fw.assertGreater(ctx.gameState.speed, before);
        });

        fw.it('caps speed at CONFIG.speed.max', () => {
            fresh();
            ctx.gameState.speed = ctx.CONFIG.speed.max;
            ctx.updateSpeedAndDistance();
            fw.assertLessOrEqual(ctx.gameState.speed, ctx.CONFIG.speed.max);
        });

        fw.it('exactly at max — speed stays at max (no overshoot)', () => {
            fresh();
            ctx.gameState.speed = ctx.CONFIG.speed.max;
            ctx.updateSpeedAndDistance();
            fw.assertApprox(ctx.gameState.speed, ctx.CONFIG.speed.max, 0.0001);
        });

        fw.it('increases distance by the post-acceleration speed', () => {
            fresh();
            const speedBefore = ctx.gameState.speed;
            const distBefore  = ctx.gameState.distance;
            ctx.updateSpeedAndDistance();
            // speed is incremented first, then the new speed is added to distance
            const expectedSpeed = Math.min(
                ctx.CONFIG.speed.max,
                speedBefore + ctx.CONFIG.speed.accelPerFrame
            );
            fw.assertApprox(ctx.gameState.distance - distBefore, expectedSpeed, 0.001);
        });
    });

    // ── updatePlayers() ──────────────────────────────────────────────

    fw.describe('updatePlayers()', () => {
        fw.it('smooths lane toward targetLane (moves closer each frame)', () => {
            fresh();
            const p = ctx.gameState.players[0];
            p.lane       = 0;
            p.targetLane = 4;
            ctx.updatePlayers();
            fw.assert(p.lane > 0 && p.lane < 4,
                `Lane should move toward target, got ${p.lane}`);
        });

        fw.it('lane never overshoots targetLane', () => {
            fresh();
            const p = ctx.gameState.players[0];
            p.lane       = 4;
            p.targetLane = 0;
            for (let i = 0; i < 100; i++) ctx.updatePlayers();
            fw.assert(p.lane >= 0, `Lane should not go below 0, got ${p.lane}`);
        });

        fw.it('advances jumpFrame when jumping', () => {
            fresh();
            const p = ctx.gameState.players[0];
            p.jumping   = true;
            p.jumpFrame = 5;
            ctx.updatePlayers();
            fw.assertEqual(p.jumpFrame, 6);
        });

        fw.it('stops jumping when jumpDuration is reached', () => {
            fresh();
            const p = ctx.gameState.players[0];
            p.jumping   = true;
            p.jumpFrame = ctx.CONFIG.player.jumpDuration - 1;
            ctx.updatePlayers();
            fw.assert(!p.jumping,    'jumping should be false after arc ends');
            fw.assertEqual(p.jumpFrame, 0);
        });

        fw.it('advances crouchFrame when crouching', () => {
            fresh();
            const p = ctx.gameState.players[0];
            p.crouching   = true;
            p.crouchFrame = 3;
            ctx.updatePlayers();
            fw.assertEqual(p.crouchFrame, 4);
        });

        fw.it('stops crouching when crouchDuration is reached', () => {
            fresh();
            const p = ctx.gameState.players[0];
            p.crouching   = true;
            p.crouchFrame = ctx.CONFIG.player.crouchDuration - 1;
            ctx.updatePlayers();
            fw.assert(!p.crouching,   'crouching should be false after duration ends');
            fw.assertEqual(p.crouchFrame, 0);
        });
    });

    // ── scrollWorld() ────────────────────────────────────────────────

    fw.describe('scrollWorld()', () => {
        fw.it('moves obstacle z toward player each frame (+z direction)', () => {
            fresh();
            ctx.gameState.obstacles.push({ type: 'bumper', lane: 2, z: -500, active: true, mesh: null, hitFrame: -1 });
            const before = ctx.gameState.obstacles[0].z;
            ctx.scrollWorld();
            fw.assertGreater(ctx.gameState.obstacles[0].z, before);
        });

        fw.it('removes obstacles that pass passZ threshold', () => {
            fresh();
            ctx.gameState.obstacles.push({ type: 'bumper', lane: 2, z: 300, active: true, mesh: null, hitFrame: -1 });
            ctx.scrollWorld();
            fw.assertEqual(ctx.gameState.obstacles.length, 0, 'Passed obstacle should be removed');
        });

        fw.it('removes inactive obstacles', () => {
            fresh();
            ctx.gameState.obstacles.push({ type: 'bumper', lane: 2, z: -100, active: false, mesh: null, hitFrame: -1 });
            ctx.scrollWorld();
            fw.assertEqual(ctx.gameState.obstacles.length, 0, 'Inactive obstacle should be removed');
        });

        fw.it('moves ring z toward player each frame', () => {
            fresh();
            ctx.gameState.ringItems.push({ lane: 2, z: -800, active: true, mesh: null, spin: 0 });
            const before = ctx.gameState.ringItems[0].z;
            ctx.scrollWorld();
            fw.assertGreater(ctx.gameState.ringItems[0].z, before);
        });

        fw.it('removes inactive rings', () => {
            fresh();
            ctx.gameState.ringItems.push({ lane: 2, z: -200, active: false, mesh: null, spin: 0 });
            ctx.scrollWorld();
            fw.assertEqual(ctx.gameState.ringItems.length, 0, 'Inactive ring should be removed');
        });

        fw.it('removes rings that pass passZ threshold', () => {
            fresh();
            ctx.gameState.ringItems.push({ lane: 2, z: 999, active: true, mesh: null, spin: 0 });
            ctx.scrollWorld();
            fw.assertEqual(ctx.gameState.ringItems.length, 0, 'Passed ring should be removed');
        });
    });

    // ── spawnObstacles() ─────────────────────────────────────────────

    fw.describe('spawnObstacles()', () => {
        fw.it('spawns an obstacle when frameCount >= _nextObstacleFrame', () => {
            fresh();
            ctx._nextObstacleFrame = 0;
            ctx.gameState.frameCount = 10;
            ctx.spawnObstacles();
            fw.assertGreater(ctx.gameState.obstacles.length, 0, 'Should spawn at least one obstacle');
        });

        fw.it('does not spawn when frameCount < _nextObstacleFrame', () => {
            fresh();
            ctx._nextObstacleFrame = 9999;
            ctx.gameState.frameCount = 10;
            ctx.spawnObstacles();
            fw.assertEqual(ctx.gameState.obstacles.length, 0, 'Should not spawn before interval');
        });

        fw.it('spawned obstacle has a valid type', () => {
            fresh();
            ctx._nextObstacleFrame = 0;
            ctx.gameState.frameCount = 1;
            ctx.spawnObstacles();
            const validTypes = ['bumper', 'bomb', 'barrier'];
            fw.assert(
                validTypes.includes(ctx.gameState.obstacles[0].type),
                `Unexpected type: ${ctx.gameState.obstacles[0].type}`
            );
        });

        fw.it('spawned obstacle is active', () => {
            fresh();
            ctx._nextObstacleFrame = 0;
            ctx.gameState.frameCount = 1;
            ctx.spawnObstacles();
            fw.assert(ctx.gameState.obstacles[0].active, 'Spawned obstacle should be active');
        });

        fw.it('spawned obstacle lane is within pipe arc [0, laneCount-1]', () => {
            fresh();
            ctx._nextObstacleFrame = 0;
            ctx.gameState.frameCount = 1;
            ctx.spawnObstacles();
            const lane     = ctx.gameState.obstacles[0].lane;
            const maxLane  = ctx.CONFIG.pipe.laneCount - 1;
            fw.assert(lane >= 0 && lane <= maxLane,
                `lane=${lane} out of [0, ${maxLane}]`);
        });

        fw.it('advances _nextObstacleFrame after spawn', () => {
            fresh();
            ctx._nextObstacleFrame = 0;
            ctx.gameState.frameCount = 1;
            ctx.spawnObstacles();
            fw.assertGreater(ctx._nextObstacleFrame, 1, 'Next spawn frame should be in the future');
        });
    });

    // ── spawnRings() ─────────────────────────────────────────────────

    fw.describe('spawnRings()', () => {
        fw.it('does not spawn before timer reaches 40', () => {
            fresh();
            ctx._ringSpawnTimer = 5;
            ctx.spawnRings();
            fw.assertEqual(ctx.gameState.ringItems.length, 0, 'Too early to spawn rings');
        });

        fw.it('spawns a cluster when timer rolls over at 40', () => {
            fresh();
            ctx._ringSpawnTimer = 39;  // next call increments to 40 → triggers spawn
            ctx.spawnRings();
            fw.assertGreater(ctx.gameState.ringItems.length, 0, 'Should spawn rings at threshold');
        });

        fw.it('resets timer to 0 after spawn', () => {
            fresh();
            ctx._ringSpawnTimer = 39;
            ctx.spawnRings();
            fw.assertEqual(ctx._ringSpawnTimer, 0, 'Timer should reset after spawn');
        });

        fw.it('spawns between 2 and 4 rings per cluster', () => {
            fresh();
            ctx._ringSpawnTimer = 39;
            ctx.spawnRings();
            const count = ctx.gameState.ringItems.length;
            fw.assert(count >= 2 && count <= 4, `Expected 2–4 rings, got ${count}`);
        });

        fw.it('all spawned rings are active', () => {
            fresh();
            ctx._ringSpawnTimer = 39;
            ctx.spawnRings();
            fw.assert(
                ctx.gameState.ringItems.every(r => r.active),
                'All spawned rings should start as active'
            );
        });

        fw.it('ring lane is within pipe arc [0, laneCount-1]', () => {
            fresh();
            ctx._ringSpawnTimer = 39;
            ctx.spawnRings();
            const maxLane = ctx.CONFIG.pipe.laneCount - 1;
            ctx.gameState.ringItems.forEach((r, i) => {
                fw.assert(r.lane >= 0 && r.lane <= maxLane,
                    `Ring ${i} lane=${r.lane} out of [0, ${maxLane}]`);
            });
        });
    });

    // ── checkCollisions() — ring collection ──────────────────────────

    fw.describe('checkCollisions() — ring collection', () => {
        fw.it('collects a ring within collectRadius', () => {
            fresh();
            ringAtPlayer();
            ctx.checkCollisions();
            fw.assertEqual(ctx.gameState.players[0].rings, 1, 'Ring should be collected');
        });

        fw.it('marks collected ring as inactive', () => {
            fresh();
            ringAtPlayer();
            ctx.checkCollisions();
            fw.assert(!ctx.gameState.ringItems[0].active, 'Collected ring should be inactive');
        });

        fw.it('adds pointsEach to score on collection', () => {
            fresh();
            ringAtPlayer();
            ctx.checkCollisions();
            fw.assertEqual(
                ctx.gameState.score,
                ctx.CONFIG.rings.pointsEach,
                'Score should increase by pointsEach'
            );
        });

        fw.it('does not collect a ring beyond collectRadius', () => {
            fresh();
            ctx.gameState.ringItems.push({
                lane: ctx.gameState.players[0].lane,
                z:    -5000,   // very far away
                active: true, mesh: null, spin: 0,
            });
            ctx.checkCollisions();
            fw.assertEqual(ctx.gameState.players[0].rings, 0, 'Distant ring should not be collected');
        });

        fw.it('collecting final ring triggers win (phase → win)', () => {
            fresh();
            ctx.gameState.players[0].rings = ctx.CONFIG.rings.goal - 1;
            ringAtPlayer();
            ctx.checkCollisions();
            fw.assertEqual(ctx.gameState.phase, 'win', 'Collecting last ring should trigger win');
        });

        fw.it('win sets gameState.running to false', () => {
            fresh();
            ctx.gameState.players[0].rings = ctx.CONFIG.rings.goal - 1;
            ringAtPlayer();
            ctx.checkCollisions();
            fw.assert(!ctx.gameState.running, 'running should be false after win');
        });

        fw.it('ring in different lane at z=0 is still collected if within 3D radius', () => {
            // Put ring one lane away — may or may not be within collectRadius depending on config.
            // We test explicitly: distance formula must be < collectRadius.
            fresh();
            const p    = ctx.gameState.players[0];
            const adjacent = Math.min(p.lane + 1, ctx.CONFIG.pipe.laneCount - 1);
            const ppos = ctx.laneToPosition(p.lane);
            const rpos = ctx.laneToPosition(adjacent);
            const dx   = ppos.x - rpos.x;
            const dy   = ppos.y - rpos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);  // z == 0

            ctx.gameState.ringItems.push({ lane: adjacent, z: 0, active: true, mesh: null, spin: 0 });
            ctx.checkCollisions();

            if (dist < ctx.CONFIG.rings.collectRadius) {
                fw.assertEqual(ctx.gameState.players[0].rings, 1, 'Adjacent ring should be collected');
            } else {
                fw.assertEqual(ctx.gameState.players[0].rings, 0, 'Adjacent ring too far to collect');
            }
        });
    });

    // ── checkCollisions() — obstacles ────────────────────────────────

    fw.describe('checkCollisions() — obstacles', () => {
        fw.it('hit subtracts 10 rings', () => {
            fresh();
            ctx.gameState.players[0].rings = 20;
            bumperAtPlayer();
            ctx.checkCollisions();
            fw.assertEqual(ctx.gameState.players[0].rings, 10);
        });

        fw.it('rings cannot drop below 0 on hit', () => {
            fresh();
            ctx.gameState.players[0].rings = 5;
            bumperAtPlayer();
            ctx.checkCollisions();
            fw.assert(ctx.gameState.players[0].rings >= 0, 'Rings should not go below 0');
        });

        fw.it('hit grants invincibility frames', () => {
            fresh();
            ctx.gameState.players[0].rings = 20;
            bumperAtPlayer();
            ctx.checkCollisions();
            fw.assertGreater(ctx.gameState.players[0].invincible, 0);
        });

        fw.it('invincible player takes no damage (rings unchanged)', () => {
            fresh();
            const p  = ctx.gameState.players[0];
            p.rings      = 20;
            p.invincible = 90;
            bumperAtPlayer();
            ctx.checkCollisions();
            fw.assertEqual(p.rings, 20, 'Invincible player should not lose rings');
        });

        fw.it('invincible frames count down each tick', () => {
            fresh();
            ctx.gameState.players[0].invincible = 90;
            bumperAtPlayer();
            ctx.checkCollisions();
            fw.assertEqual(ctx.gameState.players[0].invincible, 89,
                'Invincible frames should decrement by 1');
        });

        fw.it('crouching player passes under barrier (no damage)', () => {
            fresh();
            const p = ctx.gameState.players[0];
            p.rings    = 20;
            p.crouching = true;
            ctx.gameState.obstacles.push({
                type: 'barrier', lane: p.lane, z: 0, active: true, mesh: null, hitFrame: -1,
            });
            ctx.checkCollisions();
            fw.assertEqual(p.rings, 20, 'Crouching player should slide under barriers');
        });

        fw.it('crouching does NOT skip bumpers', () => {
            fresh();
            const p = ctx.gameState.players[0];
            p.rings    = 20;
            p.crouching = true;
            bumperAtPlayer();
            ctx.checkCollisions();
            fw.assertEqual(p.rings, 10, 'Crouching player should still be hit by bumpers');
        });

        fw.it('far-away bumper does not hit player', () => {
            fresh();
            ctx.gameState.players[0].rings = 20;
            ctx.gameState.obstacles.push({
                type: 'bumper', lane: ctx.gameState.players[0].lane,
                z: -3000, active: true, mesh: null, hitFrame: -1,
            });
            ctx.checkCollisions();
            fw.assertEqual(ctx.gameState.players[0].rings, 20, 'Distant bumper should not hit');
        });

        fw.it('hit deactivates the obstacle', () => {
            fresh();
            ctx.gameState.players[0].rings = 20;
            bumperAtPlayer();
            ctx.checkCollisions();
            fw.assert(!ctx.gameState.obstacles[0].active, 'Hit obstacle should be deactivated');
        });
    });

    // ── updateParticles() ────────────────────────────────────────────

    fw.describe('updateParticles()', () => {
        fw.it('decreases particle life by decay each frame', () => {
            fresh();
            ctx.gameState.particles.push({
                x: 0, y: 0, z: 0,
                vx: 0, vy: 0, vz: 0,
                life: 1, decay: 0.1,
                color: '#fff', mesh: null,
            });
            const before = ctx.gameState.particles[0].life;
            ctx.updateParticles();
            fw.assert(ctx.gameState.particles[0].life < before, 'Life should decrease');
        });

        fw.it('removes particles whose life <= 0', () => {
            fresh();
            ctx.gameState.particles.push({
                x: 0, y: 0, z: 0,
                vx: 0, vy: 0, vz: 0,
                life: 0.05, decay: 0.1,
                color: '#fff', mesh: null,
            });
            ctx.updateParticles();
            fw.assertEqual(ctx.gameState.particles.length, 0, 'Dead particle should be removed');
        });

        fw.it('keeps particles with remaining life > 0', () => {
            fresh();
            ctx.gameState.particles.push({
                x: 0, y: 0, z: 0,
                vx: 0, vy: 0, vz: 0,
                life: 0.9, decay: 0.05,
                color: '#fff', mesh: null,
            });
            ctx.updateParticles();
            fw.assertEqual(ctx.gameState.particles.length, 1, 'Alive particle should stay');
        });

        fw.it('moves particle along velocity vector', () => {
            fresh();
            ctx.gameState.particles.push({
                x: 0, y: 0, z: 0,
                vx: 100, vy: 50, vz: -30,
                life: 1, decay: 0.01,
                color: '#FFD700', mesh: null,
            });
            ctx.updateParticles();
            const pt = ctx.gameState.particles[0];
            fw.assert(pt.x > 0,  'Particle should move in +x direction');
            fw.assert(pt.y > 0,  'Particle should move in +y direction');
            fw.assert(pt.z < 0,  'Particle should move in -z direction');
        });

        fw.it('handles an empty particle array without error', () => {
            fresh();
            // Should not throw
            ctx.updateParticles();
            fw.assertEqual(ctx.gameState.particles.length, 0);
        });
    });
};
