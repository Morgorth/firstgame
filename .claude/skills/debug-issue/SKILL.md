---
name: debug-issue
description: Use when investigating a bug or unexpected behavior in Wave Assault, Sonic Half-Pipe, or Licorne RPG. Traces the issue through the codebase systematically.
allowed-tools: Read, Grep, Glob
argument-hint: "<game: wave-assault|sonic-halfpipe|licorne-rpg> <bug-description>"
---

# Debug a Game Issue

This repo contains three games: `wave-assault/`, `sonic-halfpipe/`, and `aventure apprentissage/`. Read `$ARGUMENTS` to identify which game, then follow the matching section below.

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
| Player not moving / lane changes not working | `sonic-halfpipe/js/input.js` + `sonic-halfpipe/js/game.js` (updatePlayers) |
| Jump not working | `sonic-halfpipe/js/input.js` (triggerJump) + `sonic-halfpipe/js/game.js` (updatePlayers) |
| Crouch not working | `sonic-halfpipe/js/input.js` (triggerCrouch) + `sonic-halfpipe/js/game.js` (updatePlayers) |
| Rings not collected | `sonic-halfpipe/js/game.js` (checkCollisions — ring section) |
| Obstacle collision not working / player takes no damage | `sonic-halfpipe/js/game.js` (checkCollisions — obstacle section) |
| Player takes damage while invincible | `sonic-halfpipe/js/game.js` (checkCollisions) — invincibility guard must wrap only obstacle loop |
| Player can't collect rings after being hit | `sonic-halfpipe/js/game.js` (checkCollisions) — ring collection must be outside invincibility guard |
| Player mesh not appearing / wrong shape | `sonic-halfpipe/js/render-player.js` |
| Unicorn player mesh wrong | `sonic-halfpipe/js/render-theme-unicorn.js` |
| Player mesh in wrong position | `sonic-halfpipe/js/render-player.js` (updatePlayerMeshes) + `sonic-halfpipe/js/game.js` (laneToPosition) |
| Obstacle mesh not appearing / wrong shape | `sonic-halfpipe/js/render-obstacles.js` |
| Ring mesh not appearing / wrong shape | `sonic-halfpipe/js/render-rings.js` |
| Obstacle or ring mesh in wrong position | `sonic-halfpipe/js/render-obstacles.js` (updateObstacleMeshes) / `sonic-halfpipe/js/render-rings.js` (updateRingMeshes) |
| Pipe not scrolling / recycling | `sonic-halfpipe/js/render-pipe.js` (updatePipePool) |
| Particles not showing | `sonic-halfpipe/js/render-particles.js` |
| Wrong theme colours | `sonic-halfpipe/js/render.js` (RENDER_THEME) |
| HUD shows wrong rings / score | `sonic-halfpipe/js/ui.js` (updateHUD) + `sonic-halfpipe/index.html` (element IDs) |
| 2P keyboard mode only shows 1 player | `sonic-halfpipe/js/ui.js` (showSetupScreen) — verify `webcamState.playerCount` is set before `startGame()` |
| Game doesn't start / restart broken | `sonic-halfpipe/js/main.js` (startGame) |
| State not resetting between games | `sonic-halfpipe/js/main.js` (startGame reset list) + `sonic-halfpipe/js/state.js` |
| Camera/pose not detected | `sonic-halfpipe/js/webcam-core.js` (initWebcam/initPoseDetector) |
| Jump gesture not working (camera mode) | `sonic-halfpipe/js/webcam-gestures.js` (checkJumpGesture) + `sonic-halfpipe/js/config.js` (CONFIG.camera) |
| Crouch gesture not working (camera mode) | `sonic-halfpipe/js/webcam-gestures.js` (checkCrouchGesture) + `sonic-halfpipe/js/config.js` (CONFIG.camera) |
| Lane tracking wrong (camera mode) | `sonic-halfpipe/js/webcam-gestures.js` (poseToLane) |
| Player registration not completing | `sonic-halfpipe/js/webcam-registration.js` (handleRegistrationPoseTracking) |
| Wrong jump sound | `sonic-halfpipe/js/input.js` (triggerJump) — must call `audioSystem.playJump()` not `playRingCollect` |
| Audio issue | `sonic-halfpipe/js/audio.js` |
| High scores not saving / loading | `sonic-halfpipe/js/state.js` (loadHighScores + saveHighScores) |
| End screen not showing / win not triggered | `sonic-halfpipe/js/game.js` (triggerWin + triggerGameOver) + `sonic-halfpipe/js/ui.js` (showEndScreen) |

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
- **Pipe segment wrapping** (in `render-pipe.js`): `seg.position.z > segmentLength * 1.5` triggers recycle; total span must cover `visibleLength`
- **DOM element IDs**: HUD elements (`hudRings`, `hudScore`, `hudSpeed`, `hudP2`, `hudP2Rings`, `ringBarP1Fill`, `ringBarP2Fill`) must match between `ui.js` and `index.html`
- **Webcam files**: webcam logic is split across webcam-core.js / webcam-color.js / webcam-gestures.js / webcam-registration.js / webcam-pose.js — check the symptom table above to find the right file; never read all five

## Step 4: Report findings

Summarize:
1. **Root cause**: What's wrong and where
2. **Affected code**: File, function, line number
3. **Fix**: What needs to change

---

# Debug a Licorne RPG Issue

You are investigating a bug in a Canvas 2D educational RPG with voice challenges. Follow this workflow to find the root cause efficiently.

## Step 1: Classify the symptom

| Symptom | Start reading |
|---------|--------------|
| Player can't move / gets stuck at room junctions | `aventure apprentissage/js/main.js:_isWalkable` — check margin is 0; check ROOMS+CORRIDORS zones cover the junction |
| Player walks through walls | `aventure apprentissage/js/main.js:_isWalkable + movePlayer` |
| Room challenge not triggering | `aventure apprentissage/js/main.js:checkRoomTriggers` — check `triggerRadius` and `recentlyExitedRooms` |
| Challenge triggers repeatedly / immediately re-triggers | `aventure apprentissage/js/main.js:recentlyExitedRooms` cooldown logic |
| Exit portal not appearing | `aventure apprentissage/js/main.js:_markRoomDone + checkRoomTriggers` — `exitUnlocked` only true when `roomsDone.length >= gateScore` |
| Exit portal not walkable | `aventure apprentissage/js/main.js:movePlayer` — `EXIT_ZONE + EXIT_CORRIDOR` must be added to `walkable` when `exitUnlocked` |
| Level not advancing after exit | `aventure apprentissage/js/main.js:checkExitTrigger + _completeLevel` |
| Challenge overlay not showing | `aventure apprentissage/js/ui.js:showChallenge` + `aventure apprentissage/index.html` (#screen-challenge element) |
| Mic not starting / speech not recognized | `aventure apprentissage/js/speech.js:startListening` — check browser permissions; check `speechSystem.available` |
| Answer never accepted (always wrong) | `aventure apprentissage/js/speech.js:matches + normalize` — check normalization; check language code (`'fr-FR'` vs `'en-US'`) |
| Calcul answer wrong | `aventure apprentissage/js/challenges.js:processAnswer` (calcul branch) + `speechSystem._replaceSpokenNumbers` |
| XP not awarded / stat not leveling up | `aventure apprentissage/js/rpg.js:addXP` + `aventure apprentissage/js/challenges.js:end` |
| Cosmetics not unlocking | `aventure apprentissage/js/rpg.js:checkUnlocks` — check unlock thresholds vs profile stats |
| Progress not saving / lost on reload | `aventure apprentissage/js/save.js:saveProgress + loadProgress` — check localStorage keys (`licornerpg_progress`) |
| Profile not saving | `aventure apprentissage/js/save.js:saveProfile + loadProfile` — check `licornerpg_profile` key |
| Map not rendering | `aventure apprentissage/js/world.js:render` + `aventure apprentissage/js/state.js` (canvas/ctx init) |
| Wrong theme colors | `aventure apprentissage/js/config.js:CONFIG.THEMES[levelNum]` |
| Floating XP notifications not showing | `aventure apprentissage/js/world.js:render` (floatingXP drawing) + `gameState.floatingXP` |
| Camera mode not moving player | `aventure apprentissage/js/webcam-gestures.js` → `webcamState.webcamInput.{dx,dy}` + `aventure apprentissage/js/main.js:gameLoop` |
| Game doesn't start / restart broken | `aventure apprentissage/js/main.js:startGame + _resetLevelState` |
| State not resetting between levels | `aventure apprentissage/js/main.js:_resetLevelState` |
| Audio not playing | `aventure apprentissage/js/main.js:audioSystem` — check AudioContext state (may need user click to unlock) |
| Screen not switching (menu/game/challenge) | `aventure apprentissage/js/ui.js` + `aventure apprentissage/index.html` (`.screen.active` class toggling) |

## Step 2: Trace the data flow

For the identified area:
1. **Where is the value initialized?** (`aventure apprentissage/js/state.js`, or `main.js:_resetLevelState`)
2. **Where is it modified?** (game loop in `main.js`, challenge in `challenges.js`, RPG in `rpg.js`)
3. **Where is it read/displayed?** (`worldSystem.render()` for canvas, `uiSystem` for HTML overlays)

Use `Grep` to find all references to the relevant field or function.

## Step 3: Check common Licorne RPG pitfalls

- **Walkable zone margin**: `_isWalkable` must use `margin = 0`. Any positive margin creates gaps of `margin*2` px at room/corridor junctions — blocks the player in front of every room
- **recentlyExitedRooms cooldown**: After a challenge ends, the room is added to `recentlyExitedRooms`. It's only removed once the player moves far enough away (`> radius * 1.5`). If the player can't re-enter a room, check this list
- **challengeActive guard**: `checkRoomTriggers` and `checkExitTrigger` both return early if `challengeActive` is true. If triggers don't fire, verify `challengeActive` was reset to false in `challengeSystem.end()`
- **Speech language mismatch**: Lecture/Calcul use `'fr-FR'`; Anglais uses `'en-US'`. Passing the wrong language to `startListening()` causes near-zero recognition rate
- **Number normalization**: `speechSystem.normalize()` calls `_replaceSpokenNumbers()` which converts French number words to digits. If calcul answers are never accepted, trace through this function
- **Profile / progress not loaded**: `currentProfile` and `currentProgress` are `let` vars in `state.js`. They are assigned in `window.load` and `startGame()`. If null at challenge time, `rpgSystem.addXP` will silently no-op
- **exitUnlocked flag**: Set only when `gameState.roomsDone.length >= CONFIG.challenge.gateScore` (5). Check `_markRoomDone` is called in the `onComplete` callback inside `checkRoomTriggers`
- **AudioContext unlock**: `audioSystem._resume()` is called on first user click. Audio may be silent if no click has occurred yet (autoplay policy)
- **Screen visibility**: Screens use CSS `.screen.active` — only one should be active at a time. If overlay is stuck, check `uiSystem.hideChallenge()` is called after `challengeSystem.end()`

## Step 4: Report findings

Summarize:
1. **Root cause**: What's wrong and where
2. **Affected code**: File, function, line number
3. **Fix**: What needs to change
