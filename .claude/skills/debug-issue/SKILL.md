---
name: debug-issue
description: Use when investigating a bug or unexpected behavior in Wave Assault or Sonic Half-Pipe. Traces the issue through the codebase systematically.
allowed-tools: Read, Grep, Glob
argument-hint: "<game: wave-assault|sonic-halfpipe> <bug-description>"
---

# Debug a Game Issue

This repo contains two games: `wave-assault/` and `sonic-halfpipe/`. Read `$ARGUMENTS` to identify which game, then follow the matching section below.

**CRITICAL**: Never mix file paths between games.

---

# Debug a Wave Assault Issue

You are investigating a bug in a browser-based wave shooter. Follow this workflow to find the root cause efficiently.

## Step 1: Classify the symptom

| Symptom | Start reading |
|---------|--------------|
| Wrong numbers / balance feels off | `wave-assault/js/config.js` |
| Enemy/bullet/powerup not appearing | `wave-assault/js/entities.js` + `wave-assault/js/game.js` (spawn + filter logic) |
| Collision not working | `wave-assault/js/game.js:checkCollision` + collision loops in `update()` |
| Visual glitch / wrong sprite | `wave-assault/js/render.js` |
| HUD shows wrong value | `wave-assault/js/ui.js:updateHUD` + `wave-assault/index.html` (element IDs) |
| Game doesn't start / restart broken | `wave-assault/js/main.js:startGame` |
| State not resetting between games | `wave-assault/js/main.js:startGame` (check reset list) + `wave-assault/js/state.js` |
| Camera/pose not detected | `wave-assault/js/webcam.js` |
| Super weapon not charging / firing | `wave-assault/js/game.js:checkSuperWeaponThreshold+activateSuperWeapon` + `wave-assault/js/state.js` |
| Audio issue | `wave-assault/js/audio.js` |
| Affects only one theme | `wave-assault/js/render.js` (search for `isUnicorn`) |
| Affects only 2P mode | `wave-assault/js/game.js` (search for `playerCount` or `players.forEach`) |

## Step 2: Trace the data flow

For the identified area, trace how data flows:
1. **Where is the value set?** (initial state in `wave-assault/js/state.js`, reset in `wave-assault/js/main.js:startGame`)
2. **Where is it modified?** (game logic in `wave-assault/js/game.js:update`)
3. **Where is it read/displayed?** (rendering in `wave-assault/js/render.js`, HUD in `wave-assault/js/ui.js`)

Use `Grep` to find all references to the relevant state field or function.

## Step 3: Check common Wave Assault pitfalls

- **State not reset**: New fields added to `wave-assault/js/state.js` but not reset in `startGame()` — stale values carry over between games
- **Legacy compat forgotten**: `gameState.player` or `gameState.crowdSize` not updated after changing `players[0]`
- **Per-player arrays**: Using a scalar where an array is needed (e.g., `superWeaponNextThreshold` must be `[n, n]`)
- **Theme branching**: Missing `isUnicorn` check causes one theme to render incorrectly
- **Bullet owner**: `bullet.owner` defaults to 0 — ensure `createBullet(x, y, idx)` passes the right player index
- **Off-by-one in player index**: Player 1 = index 0, Player 2 = index 1
- **DOM element missing**: HUD element referenced in JS but not in `wave-assault/index.html`

## Step 4: Report findings

Summarize:
1. **Root cause**: What's wrong and where
2. **Affected code**: File, function, line
3. **Fix**: What needs to change

---

# Debug a Sonic Half-Pipe Issue

You are investigating a bug in a Three.js 3D half-pipe runner. Follow this workflow to find the root cause efficiently.

## Step 1: Classify the symptom

| Symptom | Start reading |
|---------|--------------|
| Wrong game balance (speed, ring counts, spawn rates) | `sonic-halfpipe/js/config.js` |
| Player not moving / lane changes not working | `sonic-halfpipe/js/input.js:applyKeyboardInput` + `sonic-halfpipe/js/game.js:updatePlayers` |
| Jump not working | `sonic-halfpipe/js/input.js:triggerJump` + `sonic-halfpipe/js/game.js:updatePlayers` |
| Crouch not working | `sonic-halfpipe/js/input.js:triggerCrouch` + `sonic-halfpipe/js/game.js:updatePlayers` |
| Rings not collected | `sonic-halfpipe/js/game.js:checkCollisions` (ring section) |
| Obstacle collision not working / player takes no damage | `sonic-halfpipe/js/game.js:checkCollisions` (obstacle section) |
| Player takes damage while invincible | `sonic-halfpipe/js/game.js:checkCollisions` — invincibility guard must wrap only obstacle loop |
| Player can't collect rings after being hit | `sonic-halfpipe/js/game.js:checkCollisions` — ring collection must be outside invincibility guard |
| Visual / mesh not appearing | `sonic-halfpipe/js/render.js` (build/update functions) |
| Player mesh in wrong position | `sonic-halfpipe/js/render.js:updatePlayerMeshes` + `sonic-halfpipe/js/game.js:laneToPosition` |
| Obstacle or ring mesh in wrong position | `sonic-halfpipe/js/render.js:updateObstacleMeshes` / `updateRingMeshes` |
| HUD shows wrong rings / score | `sonic-halfpipe/js/ui.js:updateHUD` + `sonic-halfpipe/index.html` (element IDs) |
| 2P keyboard mode only shows 1 player | `sonic-halfpipe/js/ui.js:showSetupScreen` — verify `webcamState.playerCount` is set before `startGame()` |
| Game doesn't start / restart broken | `sonic-halfpipe/js/main.js:startGame` |
| State not resetting between games | `sonic-halfpipe/js/main.js:startGame` (check all reset fields) + `sonic-halfpipe/js/state.js` |
| Camera/pose not detected | `sonic-halfpipe/js/webcam.js` |
| Jump gesture not working (camera mode) | `sonic-halfpipe/js/webcam.js:checkJumpGesture` + `sonic-halfpipe/js/config.js:CONFIG.camera` |
| Crouch gesture not working (camera mode) | `sonic-halfpipe/js/webcam.js:checkCrouchGesture` + `sonic-halfpipe/js/config.js:CONFIG.camera` |
| Lane tracking wrong (camera mode) | `sonic-halfpipe/js/webcam.js:poseToLane` |
| Wrong jump sound | `sonic-halfpipe/js/input.js:triggerJump` — must call `audioSystem.playJump()` not `playRingCollect` |
| Audio issue | `sonic-halfpipe/js/audio.js` |
| High scores not saving / loading | `sonic-halfpipe/js/state.js:loadHighScores + saveHighScores` |
| End screen not showing / win not triggered | `sonic-halfpipe/js/game.js:triggerWin + triggerGameOver` + `sonic-halfpipe/js/ui.js:showEndScreen` |
| Pipe not scrolling / recycling | `sonic-halfpipe/js/render.js:updatePipePool` |

## Step 2: Trace the data flow

For the identified area:
1. **Where is the value initialized?** (`sonic-halfpipe/js/state.js` initial values, reset in `sonic-halfpipe/js/main.js:startGame`)
2. **Where is it modified?** (`sonic-halfpipe/js/game.js:gameTick` and sub-functions)
3. **Where is it read?** (`sonic-halfpipe/js/render.js` for visuals, `sonic-halfpipe/js/ui.js` for HUD)

Use `Grep` to find all references to the relevant field or function.

## Step 3: Check common Sonic Half-Pipe pitfalls

- **Player count**: `gameState.playerCount` is set from `webcamState.playerCount` in `startGame()`. For keyboard mode, `showSetupScreen` must set `webcamState.playerCount = playerCount` before calling `startGame()`, otherwise it defaults to 1
- **Invincibility scope**: The invincibility guard (`if (p.invincible > 0)`) must only wrap the **obstacle collision** loop. Ring collection must run unconditionally (outside the guard)
- **Jump sound**: `triggerJump()` must call `audioSystem.playJump()`, not `audioSystem.playRingCollect()`
- **Three.js mesh lifecycle**: Always `gameState.scene.remove(mesh)` before setting `mesh = null`. Failing to remove from scene causes invisible ghost objects
- **Lane geometry**: `laneToPosition(lane)` uses `y = -cos(angle) * radius + radius`. At center lane (angle=0) y=0; at walls y increases. Normal vector is `{nx: -sin(angle), ny: cos(angle)}`
- **State not reset**: New fields added to `state.js` but not reset in `startGame()` — stale values persist across games
- **Off-by-one in player index**: P1 = index 0, P2 = index 1
- **Pipe segment wrapping**: `seg.position.z > segmentLength * 1.5` triggers recycle; total span must cover `visibleLength`
- **DOM element IDs**: HUD elements (`hudRings`, `hudScore`, `hudSpeed`, `hudP2`, `hudP2Rings`, `ringBarP1Fill`, `ringBarP2Fill`) must match between `ui.js` and `index.html`

## Step 4: Report findings

Summarize:
1. **Root cause**: What's wrong and where
2. **Affected code**: File, function, line number
3. **Fix**: What needs to change
