---
name: modify-game
description: Use when making any code change to the Wave Assault or Sonic Half-Pipe game. Routes you to the exact files needed for any modification type. Use this before editing game code.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
argument-hint: "<game: wave-assault|sonic-halfpipe> <what-to-change>"
---

# Modify a Game

This repo contains two games: `wave-assault/` and `sonic-halfpipe/`. Read `$ARGUMENTS` to identify which game, then follow the matching section below.

**CRITICAL**: Never mix file paths between games.

---

# Modify Wave Assault

You are modifying a browser-based wave shooter. Follow this workflow strictly to minimize token usage.

## Step 1: Classify the change

Read `$ARGUMENTS` and classify into one of these categories:

| Category | Files to read | Files to edit |
|----------|--------------|---------------|
| **Balance/tuning** (speeds, health, damage, spawn rates) | `wave-assault/js/config.js` | `wave-assault/js/config.js`, maybe `wave-assault/js/game.js` |
| **New enemy type** | `wave-assault/js/config.js`, `wave-assault/js/entities.js`, `wave-assault/js/game.js:spawnWave`, relevant `wave-assault/js/render-theme-*.js` | All four |
| **New powerup type** | `wave-assault/js/entities.js`, `wave-assault/js/game.js:update` (bullet-powerup section), `wave-assault/js/render-entities.js:drawPowerups` | All three + `wave-assault/js/config.js` |
| **Player movement** | `wave-assault/js/game.js:update` (player movement section) | `wave-assault/js/game.js` |
| **Shooting mechanics** | `wave-assault/js/game.js:update` (auto-fire section), `wave-assault/js/entities.js:createBullet` | Both |
| **Player sprite changes** | matching `wave-assault/js/render-theme-*.js` | that file only |
| **Enemy sprite changes** | matching `wave-assault/js/render-theme-*.js` | that file only |
| **Background / environment visuals** | `wave-assault/js/render-background.js` | `wave-assault/js/render-background.js` |
| **Particle / explosion effects** | `wave-assault/js/render-entities.js` | `wave-assault/js/render-entities.js` |
| **Screen overlays (hit flash, nuke flash)** | `wave-assault/js/render-effects.js` | `wave-assault/js/render-effects.js` |
| **Fleet donation beam visuals** | `wave-assault/js/render-effects.js` | `wave-assault/js/render-effects.js` |
| **Charge-ready indicator** | `wave-assault/js/render-effects.js`, `wave-assault/js/render-sprites.js:RENDER_THEME` | Both |
| **Powerup rendering** | `wave-assault/js/render-entities.js:drawPowerups` | `wave-assault/js/render-entities.js` |
| **HUD/UI changes** | `wave-assault/js/ui.js`, `wave-assault/index.html` | Both, maybe `wave-assault/styles.css` |
| **Camera/pose behavior** | `wave-assault/js/webcam.js` | `wave-assault/js/webcam.js` |
| **Game flow** (start, end, restart) | `wave-assault/js/main.js` | `wave-assault/js/main.js`, maybe `wave-assault/js/ui.js` |
| **New theme** | `wave-assault/js/render-sprites.js:RENDER_THEME`, `wave-assault/js/render-background.js`, `wave-assault/js/render-entities.js`, `wave-assault/js/render-effects.js`, `wave-assault/js/render.js`, `wave-assault/js/ui.js:selectTheme` | All + new `wave-assault/js/render-theme-<name>.js` + `wave-assault/styles.css` + `wave-assault/index.html` |
| **Theme-specific colour or icon** | `wave-assault/js/render-sprites.js:RENDER_THEME` | `wave-assault/js/render-sprites.js` |
| **Styling only** | `wave-assault/styles.css` | `wave-assault/styles.css` |
| **Super weapon / nuke** | `wave-assault/js/game.js` (activateSuperWeapon + checkSuperWeaponThreshold), `wave-assault/js/state.js`, `wave-assault/js/render-effects.js` (flash + charge icon), `wave-assault/js/render-sprites.js:RENDER_THEME` (icon/colour), `wave-assault/js/ui.js` (HUD progress) | All four + `wave-assault/js/config.js` for tuning |
| **Audio/music** | `wave-assault/js/audio.js` | `wave-assault/js/audio.js` |
| **New game mechanic** | `wave-assault/js/state.js` (add state), `wave-assault/js/game.js` (add logic), relevant render sub-module (add visuals) | All three + `wave-assault/js/main.js` (reset in startGame) |

## Step 2: Read ONLY the files from the table above

Do NOT read the full codebase. Read the minimum files needed.

## Step 3: Make the change

Key rules:
- All files share globals — no imports/exports needed
- Script load order: config → state → entities → input → webcam → audio → game → render-sprites → render-theme-unicorn → render-theme-pacificrim → render-theme-space → render-theme-dragon → render-background → render-entities → render-effects → render → ui → main
- `gameState.players[]` is the source of truth for player data
- After modifying player 0's `.crowdSize`, also set `gameState.crowdSize` (legacy compat)
- New CONFIG entries go in `wave-assault/js/config.js`
- New state fields go in `wave-assault/js/state.js` AND must be reset in `wave-assault/js/main.js:startGame()`
- New entity factories go in `wave-assault/js/entities.js`
- Drawing code goes in the relevant render sub-module, NOT in `render.js` (orchestrator only)
- Game logic stays in `wave-assault/js/game.js`
- Per-player arrays use index 0 for P1, index 1 for P2
- Kill attribution: bullet kills → `bullet.owner`, shield/collision → player index `i`, enemies passing bottom → no player (skip nuke credit)
- Super weapon charges are per-player: `gameState.playerKills[i]`, `superWeaponCharges[i]`, `superWeaponNextThreshold[i]`
- All render sub-functions receive `T = getTheme()` → use `T.isUnicorn`, `T.isPacificRim`, `T.isDragon`, `T.theme` instead of reading `gameTheme` directly
- Per-theme visual constants (colours, icons) live in `RENDER_THEME` in `wave-assault/js/render-sprites.js` — add new keys there, don't scatter inline ternary chains
- HUD: single-player elements in `#singlePlayerHud` (right side), multi-player in `#multiPlayerHud` with `#p1Hud`/`#p2Hud`

## Step 4: Test considerations

- Open `wave-assault/index.html` in a browser (no build step needed)
- Check all four themes (space / unicorn / pacificrim / dragon) if you changed rendering
- Check both control modes (keyboard + camera) if you changed input/movement
- Check both 1P and 2P if you changed per-player logic
- Nuke progress is shown on the right-side HUD (single: `#nukeProgress`, multi: `#p1Nuke`/`#p2Nuke`)

---

# Modify Sonic Half-Pipe

You are modifying a Three.js 3D half-pipe runner. Follow this workflow strictly.

## Step 1: Classify the change

| Category | Files to read | Files to edit |
|----------|--------------|---------------|
| **Balance/tuning** (speeds, ring goal, spawn interval, hit radii, jump height) | `sonic-halfpipe/js/config.js` | `sonic-halfpipe/js/config.js` |
| **Player movement / lane smoothing** | `sonic-halfpipe/js/game.js:updatePlayers` | `sonic-halfpipe/js/game.js` |
| **Jump or crouch physics** | `sonic-halfpipe/js/game.js:jumpHeightAt + updatePlayers` | `sonic-halfpipe/js/game.js` |
| **Obstacle / ring spawning** | `sonic-halfpipe/js/game.js:spawnObstacles + spawnRings` | `sonic-halfpipe/js/game.js` |
| **Collision detection** | `sonic-halfpipe/js/game.js:checkCollisions` | `sonic-halfpipe/js/game.js` |
| **Speed curve** | `sonic-halfpipe/js/game.js:updateSpeedAndDistance`, `sonic-halfpipe/js/config.js` | Both |
| **Player mesh / appearance** | `sonic-halfpipe/js/render.js:buildPlayerMeshes + updatePlayerMeshes` | `sonic-halfpipe/js/render.js` |
| **Obstacle mesh / appearance** | `sonic-halfpipe/js/render.js:buildObstacleMesh + updateObstacleMeshes` | `sonic-halfpipe/js/render.js` |
| **Ring mesh / appearance** | `sonic-halfpipe/js/render.js:buildRingMesh + updateRingMeshes` | `sonic-halfpipe/js/render.js` |
| **Pipe geometry / materials** | `sonic-halfpipe/js/render.js:buildPipeSegment` | `sonic-halfpipe/js/render.js` |
| **Particle effects** | `sonic-halfpipe/js/game.js:spawnCollectParticles`, `sonic-halfpipe/js/render.js:updateParticleMeshes` | Both |
| **Lighting / scene setup** | `sonic-halfpipe/js/render.js:initScene` | `sonic-halfpipe/js/render.js` |
| **Camera angle** | `sonic-halfpipe/js/render.js:initScene` (camera position + lookAt) | `sonic-halfpipe/js/render.js` |
| **HUD / screens** | `sonic-halfpipe/js/ui.js`, `sonic-halfpipe/index.html` | Both, maybe `sonic-halfpipe/styles.css` |
| **Keyboard input mapping** | `sonic-halfpipe/js/input.js` | `sonic-halfpipe/js/input.js` |
| **Camera gesture thresholds** | `sonic-halfpipe/js/config.js` (CONFIG.camera section) | `sonic-halfpipe/js/config.js` |
| **Camera gesture logic** | `sonic-halfpipe/js/webcam.js:checkJumpGesture + checkCrouchGesture + poseToLane` | `sonic-halfpipe/js/webcam.js` |
| **Player registration (camera mode)** | `sonic-halfpipe/js/webcam.js:startPlayerRegistration + handleRegistrationPoseTracking` | `sonic-halfpipe/js/webcam.js` |
| **Game flow** (start, restart, end) | `sonic-halfpipe/js/main.js`, `sonic-halfpipe/js/ui.js:showEndScreen` | Both |
| **High scores** | `sonic-halfpipe/js/state.js`, `sonic-halfpipe/js/ui.js:renderHighScoreTable` | Both |
| **Audio** | `sonic-halfpipe/js/audio.js` | `sonic-halfpipe/js/audio.js` |
| **Styling** | `sonic-halfpipe/styles.css` | `sonic-halfpipe/styles.css` |

## Step 2: Read ONLY the files from the table above

Do NOT read the full codebase.

## Step 3: Make the change

Key rules:
- All files share globals — no imports/exports needed
- Script load order: config → state → audio → input → webcam → game → render → ui → main
- `gameState.players[i]` is the source of truth. P1 = index 0 (cyan), P2 = index 1 (magenta)
- New CONFIG entries go in `sonic-halfpipe/js/config.js`
- New state fields go in `sonic-halfpipe/js/state.js` AND must be reset in `sonic-halfpipe/js/main.js:startGame()`
- **Player count**: For keyboard mode, `showSetupScreen` sets `webcamState.playerCount` before calling `startGame()`. Always go through `webcamState.playerCount`.
- **Invincibility scope**: `player.invincible` only blocks obstacle collision — ring collection must remain active during invincibility
- **Lane geometry**: All positions computed from `laneToPosition(lane)` in game.js. The pipe surface normal for player offset is `{nx: -sin(angle), ny: cos(angle)}`
- **Three.js objects**: Meshes assigned to `obs.mesh`, `ring.mesh`, `pt.mesh`, `player.mesh`. Always call `gameState.scene.remove(mesh)` before nulling
- **Pipe recycling**: `updatePipePool()` wraps segments; segment count × segmentLength must span `visibleLength`
- **No build step**: CDN scripts only; open `sonic-halfpipe/index.html` directly in browser

## Step 4: Test considerations

- Open `sonic-halfpipe/index.html` in a browser
- Test both 1P and 2P keyboard modes (verify P2 active and HUD shown)
- Test jump (Up/W/Space) clears barriers in the air; crouch (Down/S) slides under barriers
- Test ring collection during invincibility (after taking a hit)
- Test camera mode if webcam gesture logic was changed
