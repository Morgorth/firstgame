/**
 * CONFIG validation — ensures all tuning constants are present
 * and within sensible bounds.
 */

'use strict';

module.exports = function runConfigTests(ctx, fw) {
    const C = ctx.CONFIG;

    fw.describe('CONFIG — existence', () => {
        fw.it('CONFIG is defined', () => {
            fw.assert(C !== undefined && C !== null, 'CONFIG is undefined');
        });
        fw.it('CONFIG.pipe exists',      () => fw.assert(typeof C.pipe      === 'object'));
        fw.it('CONFIG.player exists',    () => fw.assert(typeof C.player    === 'object'));
        fw.it('CONFIG.rings exists',     () => fw.assert(typeof C.rings     === 'object'));
        fw.it('CONFIG.obstacles exists', () => fw.assert(typeof C.obstacles === 'object'));
        fw.it('CONFIG.speed exists',     () => fw.assert(typeof C.speed     === 'object'));
        fw.it('CONFIG.camera exists',    () => fw.assert(typeof C.camera    === 'object'));
    });

    fw.describe('CONFIG.pipe', () => {
        fw.it('radius is a positive number', () => {
            fw.assertGreater(C.pipe.radius, 0);
        });
        fw.it('laneCount is an integer >= 3', () => {
            fw.assert(
                Number.isInteger(C.pipe.laneCount) && C.pipe.laneCount >= 3,
                `laneCount=${C.pipe.laneCount}`
            );
        });
        fw.it('segmentLength is positive', () => {
            fw.assertGreater(C.pipe.segmentLength, 0);
        });
        fw.it('segmentCount is a positive integer', () => {
            fw.assert(
                Number.isInteger(C.pipe.segmentCount) && C.pipe.segmentCount > 0
            );
        });
        fw.it('arcDegrees is between 90 and 360', () => {
            fw.assert(
                C.pipe.arcDegrees > 90 && C.pipe.arcDegrees < 360,
                `arcDegrees=${C.pipe.arcDegrees}`
            );
        });
    });

    fw.describe('CONFIG.player', () => {
        fw.it('jumpHeight is positive', () => fw.assertGreater(C.player.jumpHeight, 0));
        fw.it('jumpDuration is a positive integer', () => {
            fw.assert(Number.isInteger(C.player.jumpDuration) && C.player.jumpDuration > 0);
        });
        fw.it('crouchScaleY is between 0 and 1', () => {
            fw.assert(C.player.crouchScaleY > 0 && C.player.crouchScaleY < 1,
                `crouchScaleY=${C.player.crouchScaleY}`);
        });
        fw.it('laneChangeSpeed is in (0, 1)', () => {
            fw.assert(C.player.laneChangeSpeed > 0 && C.player.laneChangeSpeed < 1,
                `laneChangeSpeed=${C.player.laneChangeSpeed}`);
        });
        fw.it('hitRadius is positive', () => fw.assertGreater(C.player.hitRadius, 0));
        fw.it('invincibleFrames is a positive integer', () => {
            fw.assert(Number.isInteger(C.player.invincibleFrames) && C.player.invincibleFrames > 0);
        });
        fw.it('startLane is within [0, laneCount-1]', () => {
            fw.assert(
                C.player.startLane >= 0 && C.player.startLane <= C.pipe.laneCount - 1,
                `startLane=${C.player.startLane}`
            );
        });
    });

    fw.describe('CONFIG.rings', () => {
        fw.it('goal is a positive integer', () => {
            fw.assert(Number.isInteger(C.rings.goal) && C.rings.goal > 0);
        });
        fw.it('collectRadius > outerRadius (can actually collect rings)', () => {
            fw.assertGreater(C.rings.collectRadius, C.rings.outerRadius);
        });
        fw.it('pointsEach is positive', () => fw.assertGreater(C.rings.pointsEach, 0));
        fw.it('spinSpeed is positive', () => fw.assertGreater(C.rings.spinSpeed, 0));
    });

    fw.describe('CONFIG.obstacles', () => {
        fw.it('spawnInterval is a positive integer', () => {
            fw.assert(Number.isInteger(C.obstacles.spawnInterval) && C.obstacles.spawnInterval > 0);
        });
        fw.it('bumperRadius is positive', () => fw.assertGreater(C.obstacles.bumperRadius, 0));
        fw.it('bombRadius is positive',   () => fw.assertGreater(C.obstacles.bombRadius, 0));
        fw.it('barrierWidth is positive', () => fw.assertGreater(C.obstacles.barrierWidth, 0));
        fw.it('spawnZ is negative (spawns ahead of player)', () => {
            fw.assert(C.obstacles.spawnZ < 0, `spawnZ=${C.obstacles.spawnZ}`);
        });
        fw.it('passZ is positive (removed after player passes)', () => {
            fw.assertGreater(C.obstacles.passZ, 0);
        });
    });

    fw.describe('CONFIG.speed', () => {
        fw.it('initial is positive', () => fw.assertGreater(C.speed.initial, 0));
        fw.it('max > initial',       () => fw.assertGreater(C.speed.max, C.speed.initial));
        fw.it('accelPerFrame is positive', () => fw.assertGreater(C.speed.accelPerFrame, 0));
        fw.it('speedUpEveryRings is a positive integer', () => {
            fw.assert(
                Number.isInteger(C.speed.speedUpEveryRings) && C.speed.speedUpEveryRings > 0
            );
        });
    });

    fw.describe('CONFIG.camera', () => {
        fw.it('jumpHoldFrames is a positive integer', () => {
            fw.assert(Number.isInteger(C.camera.jumpHoldFrames) && C.camera.jumpHoldFrames > 0);
        });
        fw.it('crouchHoldFrames is a positive integer', () => {
            fw.assert(Number.isInteger(C.camera.crouchHoldFrames) && C.camera.crouchHoldFrames > 0);
        });
        fw.it('jumpCooldownFrames >= jumpHoldFrames', () => {
            fw.assert(C.camera.jumpCooldownFrames >= C.camera.jumpHoldFrames);
        });
    });
};
