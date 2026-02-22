/**
 * Input handling tests — covers:
 *   triggerJump(), triggerCrouch(), applyKeyboardInput()
 *
 * These tests manipulate the vm context's `keys` map directly
 * to simulate key presses without real browser events.
 */

'use strict';

module.exports = function runInputTests(ctx, fw) {

    // ── Helpers ──────────────────────────────────────────────────────

    function fresh(playerCount) {
        playerCount = playerCount || 1;
        const cfg = ctx.CONFIG;

        ctx.controlMode = 'keyboard';

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
                },
            ],
            obstacles:       [],
            ringItems:       [],
            particles:       [],
            phase:           'playing',
            countdownActive: false,
            scene: { remove: () => {} },
        };

        // Clear all key states
        Object.keys(ctx.keys).forEach(k => delete ctx.keys[k]);
    }

    function press(key)    { ctx.keys[key] = true;  }
    function release(key)  { ctx.keys[key] = false; }

    // ── triggerJump() ────────────────────────────────────────────────

    fw.describe('triggerJump()', () => {
        fw.it('sets player.jumping = true', () => {
            fresh();
            ctx.triggerJump(0);
            fw.assert(ctx.gameState.players[0].jumping, 'Player should be jumping');
        });

        fw.it('resets jumpFrame to 0', () => {
            fresh();
            ctx.gameState.players[0].jumpFrame = 15;
            ctx.triggerJump(0);
            fw.assertEqual(ctx.gameState.players[0].jumpFrame, 0);
        });

        fw.it('does nothing if player is already jumping', () => {
            fresh();
            ctx.gameState.players[0].jumping   = true;
            ctx.gameState.players[0].jumpFrame = 8;
            ctx.triggerJump(0);
            fw.assertEqual(ctx.gameState.players[0].jumpFrame, 8,
                'jumpFrame should not be reset when already jumping');
        });

        fw.it('works for player 2', () => {
            fresh(2);
            ctx.triggerJump(1);
            fw.assert(ctx.gameState.players[1].jumping, 'P2 should be jumping');
            fw.assertEqual(ctx.gameState.players[1].jumpFrame, 0);
        });

        fw.it('does not affect the other player', () => {
            fresh(2);
            ctx.triggerJump(0);
            fw.assert(!ctx.gameState.players[1].jumping, 'P2 should not be jumping');
        });
    });

    // ── triggerCrouch() ──────────────────────────────────────────────

    fw.describe('triggerCrouch()', () => {
        fw.it('sets player.crouching = true', () => {
            fresh();
            ctx.triggerCrouch(0);
            fw.assert(ctx.gameState.players[0].crouching, 'Player should be crouching');
        });

        fw.it('resets crouchFrame to 0', () => {
            fresh();
            ctx.gameState.players[0].crouchFrame = 12;
            ctx.triggerCrouch(0);
            fw.assertEqual(ctx.gameState.players[0].crouchFrame, 0);
        });

        fw.it('does nothing if player is already crouching', () => {
            fresh();
            ctx.gameState.players[0].crouching   = true;
            ctx.gameState.players[0].crouchFrame = 6;
            ctx.triggerCrouch(0);
            fw.assertEqual(ctx.gameState.players[0].crouchFrame, 6,
                'crouchFrame should not be reset when already crouching');
        });

        fw.it('works for player 2', () => {
            fresh(2);
            ctx.triggerCrouch(1);
            fw.assert(ctx.gameState.players[1].crouching, 'P2 should be crouching');
        });

        fw.it('does not affect the other player', () => {
            fresh(2);
            ctx.triggerCrouch(1);
            fw.assert(!ctx.gameState.players[0].crouching, 'P1 should not be crouching');
        });
    });

    // ── applyKeyboardInput() — P1 movement ───────────────────────────

    fw.describe('applyKeyboardInput() — P1 lane movement', () => {
        fw.it('ArrowLeft decreases P1 targetLane', () => {
            fresh();
            const before = ctx.gameState.players[0].targetLane;
            press('ArrowLeft');
            ctx.applyKeyboardInput();
            fw.assert(
                ctx.gameState.players[0].targetLane < before,
                'ArrowLeft should decrease targetLane'
            );
        });

        fw.it('ArrowRight increases P1 targetLane', () => {
            fresh();
            const before = ctx.gameState.players[0].targetLane;
            press('ArrowRight');
            ctx.applyKeyboardInput();
            fw.assert(
                ctx.gameState.players[0].targetLane > before,
                'ArrowRight should increase targetLane'
            );
        });

        fw.it('KeyA (WASD) decreases P1 targetLane', () => {
            fresh();
            const before = ctx.gameState.players[0].targetLane;
            press('KeyA');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[0].targetLane < before, 'KeyA should move left');
        });

        fw.it('KeyD (WASD) increases P1 targetLane', () => {
            fresh();
            const before = ctx.gameState.players[0].targetLane;
            press('KeyD');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[0].targetLane > before, 'KeyD should move right');
        });

        fw.it('targetLane is clamped at minimum 0 (no underflow)', () => {
            fresh();
            ctx.gameState.players[0].targetLane = 0;
            press('ArrowLeft');
            ctx.applyKeyboardInput();
            fw.assert(
                ctx.gameState.players[0].targetLane >= 0,
                'targetLane must not go below 0'
            );
        });

        fw.it('targetLane is clamped at maximum laneCount-1 (no overflow)', () => {
            fresh();
            const max = ctx.CONFIG.pipe.laneCount - 1;
            ctx.gameState.players[0].targetLane = max;
            press('ArrowRight');
            ctx.applyKeyboardInput();
            fw.assertLessOrEqual(
                ctx.gameState.players[0].targetLane, max,
                'targetLane must not exceed laneCount-1'
            );
        });
    });

    // ── applyKeyboardInput() — P1 jump / crouch ──────────────────────

    fw.describe('applyKeyboardInput() — P1 jump & crouch', () => {
        fw.it('Space triggers P1 jump', () => {
            fresh();
            press('Space');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[0].jumping, 'Space should trigger jump');
        });

        fw.it('ArrowUp triggers P1 jump', () => {
            fresh();
            press('ArrowUp');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[0].jumping, 'ArrowUp should trigger jump');
        });

        fw.it('KeyW triggers P1 jump', () => {
            fresh();
            press('KeyW');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[0].jumping, 'KeyW should trigger jump');
        });

        fw.it('ArrowDown triggers P1 crouch', () => {
            fresh();
            press('ArrowDown');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[0].crouching, 'ArrowDown should trigger crouch');
        });

        fw.it('KeyS triggers P1 crouch', () => {
            fresh();
            press('KeyS');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[0].crouching, 'KeyS should trigger crouch');
        });

        fw.it('does not re-trigger jump if already jumping', () => {
            fresh();
            ctx.gameState.players[0].jumping   = true;
            ctx.gameState.players[0].jumpFrame = 10;
            press('Space');
            ctx.applyKeyboardInput();
            fw.assertEqual(ctx.gameState.players[0].jumpFrame, 10,
                'jumpFrame should not be reset while already jumping');
        });

        fw.it('does not re-trigger crouch if already crouching', () => {
            fresh();
            ctx.gameState.players[0].crouching   = true;
            ctx.gameState.players[0].crouchFrame = 7;
            press('ArrowDown');
            ctx.applyKeyboardInput();
            fw.assertEqual(ctx.gameState.players[0].crouchFrame, 7,
                'crouchFrame should not be reset while already crouching');
        });
    });

    // ── applyKeyboardInput() — P2 (IJKL) ────────────────────────────

    fw.describe('applyKeyboardInput() — P2 (IJKL)', () => {
        fw.it('KeyJ decreases P2 targetLane', () => {
            fresh(2);
            const before = ctx.gameState.players[1].targetLane;
            press('KeyJ');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[1].targetLane < before, 'KeyJ should move P2 left');
        });

        fw.it('KeyL increases P2 targetLane', () => {
            fresh(2);
            const before = ctx.gameState.players[1].targetLane;
            press('KeyL');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[1].targetLane > before, 'KeyL should move P2 right');
        });

        fw.it('KeyI triggers P2 jump', () => {
            fresh(2);
            press('KeyI');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[1].jumping, 'KeyI should trigger P2 jump');
        });

        fw.it('KeyK triggers P2 crouch', () => {
            fresh(2);
            press('KeyK');
            ctx.applyKeyboardInput();
            fw.assert(ctx.gameState.players[1].crouching, 'KeyK should trigger P2 crouch');
        });

        fw.it('P2 controls are ignored in 1P mode', () => {
            fresh(1);   // playerCount = 1
            const before = ctx.gameState.players[1].targetLane;
            press('KeyJ');
            ctx.applyKeyboardInput();
            fw.assertEqual(
                ctx.gameState.players[1].targetLane, before,
                'P2 controls should not fire in 1P mode'
            );
        });
    });

    // ── applyKeyboardInput() — mode guard ────────────────────────────

    fw.describe('applyKeyboardInput() — mode guard', () => {
        fw.it('does nothing when controlMode is "camera"', () => {
            fresh();
            ctx.controlMode = 'camera';
            const before = ctx.gameState.players[0].targetLane;
            press('ArrowLeft');
            ctx.applyKeyboardInput();
            fw.assertEqual(
                ctx.gameState.players[0].targetLane, before,
                'Camera mode should not process keyboard input'
            );
        });

        fw.it('does nothing when game is not running', () => {
            fresh();
            ctx.gameState.running = false;
            const before = ctx.gameState.players[0].targetLane;
            press('ArrowLeft');
            ctx.applyKeyboardInput();
            fw.assertEqual(
                ctx.gameState.players[0].targetLane, before,
                'Stopped game should not process keyboard input'
            );
        });

        fw.it('does nothing during countdown', () => {
            fresh();
            ctx.gameState.countdownActive = true;
            const before = ctx.gameState.players[0].targetLane;
            press('ArrowRight');
            ctx.applyKeyboardInput();
            fw.assertEqual(
                ctx.gameState.players[0].targetLane, before,
                'Countdown phase should not process keyboard input'
            );
        });
    });
};
