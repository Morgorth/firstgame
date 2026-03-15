---
name: modify-game
description: Use when making any code change to the Wave Assault, Sonic Half-Pipe, or Licorne RPG game. Routes you to the exact files needed for any modification type. Use this before editing game code.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
argument-hint: "<game: wave-assault|sonic-halfpipe|licorne-rpg> <what-to-change>"
---

# Modify a Game

This repo contains three games: `wave-assault/`, `sonic-halfpipe/`, and `aventure apprentissage/`. Read `$ARGUMENTS` to identify which game, then follow the matching section below.

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
| **Player movement / lane smoothing** | `sonic-halfpipe/js/game.js` | `sonic-halfpipe/js/game.js` |
| **Jump or crouch physics** | `sonic-halfpipe/js/game.js` | `sonic-halfpipe/js/game.js` |
| **Obstacle / ring spawning** | `sonic-halfpipe/js/game.js` | `sonic-halfpipe/js/game.js` |
| **Collision detection** | `sonic-halfpipe/js/game.js` | `sonic-halfpipe/js/game.js` |
| **Speed curve** | `sonic-halfpipe/js/game.js`, `sonic-halfpipe/js/config.js` | Both |
| **Player mesh — default theme** | `sonic-halfpipe/js/render-player.js` | `sonic-halfpipe/js/render-player.js` |
| **Player mesh — unicorn theme** | `sonic-halfpipe/js/render-theme-unicorn.js` | `sonic-halfpipe/js/render-theme-unicorn.js` |
| **Obstacle mesh** | `sonic-halfpipe/js/render-obstacles.js` | `sonic-halfpipe/js/render-obstacles.js` |
| **Unicorn obstacle mesh** | `sonic-halfpipe/js/render-theme-unicorn.js` | `sonic-halfpipe/js/render-theme-unicorn.js` |
| **Ring mesh** | `sonic-halfpipe/js/render-rings.js` | `sonic-halfpipe/js/render-rings.js` |
| **Unicorn ring mesh** | `sonic-halfpipe/js/render-theme-unicorn.js` | `sonic-halfpipe/js/render-theme-unicorn.js` |
| **Pipe geometry / materials** | `sonic-halfpipe/js/render-pipe.js` | `sonic-halfpipe/js/render-pipe.js` |
| **Theme colours (pipe/rings/lights)** | `sonic-halfpipe/js/render.js` (RENDER_THEME) | `sonic-halfpipe/js/render.js` |
| **Particle effects** | `sonic-halfpipe/js/render-particles.js`, `sonic-halfpipe/js/game.js` | Both |
| **Lighting / scene setup** | `sonic-halfpipe/js/render.js` | `sonic-halfpipe/js/render.js` |
| **Camera angle** | `sonic-halfpipe/js/render.js` (initScene camera position + lookAt) | `sonic-halfpipe/js/render.js` |
| **HUD / screens** | `sonic-halfpipe/js/ui.js`, `sonic-halfpipe/index.html` | Both, maybe `sonic-halfpipe/styles.css` |
| **Keyboard input mapping** | `sonic-halfpipe/js/input.js` | `sonic-halfpipe/js/input.js` |
| **Camera gesture thresholds** | `sonic-halfpipe/js/config.js` (CONFIG.camera) | `sonic-halfpipe/js/config.js` |
| **Jump/crouch gesture logic** | `sonic-halfpipe/js/webcam-gestures.js` | `sonic-halfpipe/js/webcam-gestures.js` |
| **Lane tracking (camera)** | `sonic-halfpipe/js/webcam-gestures.js` (poseToLane) | `sonic-halfpipe/js/webcam-gestures.js` |
| **Player registration (camera mode)** | `sonic-halfpipe/js/webcam-registration.js` | `sonic-halfpipe/js/webcam-registration.js` |
| **Webcam init / lifecycle** | `sonic-halfpipe/js/webcam-core.js` | `sonic-halfpipe/js/webcam-core.js` |
| **Game flow** (start, restart, end) | `sonic-halfpipe/js/main.js`, `sonic-halfpipe/js/ui.js` | Both |
| **High scores** | `sonic-halfpipe/js/state.js`, `sonic-halfpipe/js/ui.js` | Both |
| **Audio** | `sonic-halfpipe/js/audio.js` | `sonic-halfpipe/js/audio.js` |
| **Styling** | `sonic-halfpipe/styles.css` | `sonic-halfpipe/styles.css` |

## Step 2: Read ONLY the files from the table above

Do NOT read the full codebase.

## Step 3: Make the change

Key rules:
- All files share globals — no imports/exports needed
- Script load order: config → state → audio → input → webcam-core → webcam-color → webcam-gestures → webcam-registration → webcam-pose → game → render → render-pipe → render-theme-unicorn → render-player → render-obstacles → render-rings → render-particles → ui → main
- `gameState.players[i]` is the source of truth. P1 = index 0 (cyan), P2 = index 1 (magenta)
- New CONFIG entries go in `sonic-halfpipe/js/config.js`
- New state fields go in `sonic-halfpipe/js/state.js` AND must be reset in `sonic-halfpipe/js/main.js:startGame()`
- **Player count**: For keyboard mode, `showSetupScreen` sets `webcamState.playerCount` before calling `startGame()`. Always go through `webcamState.playerCount`.
- **Invincibility scope**: `player.invincible` only blocks obstacle collision — ring collection must remain active during invincibility
- **Lane geometry**: All positions computed from `laneToPosition(lane)` in game.js. The pipe surface normal for player offset is `{nx: -sin(angle), ny: cos(angle)}`
- **Three.js objects**: Meshes assigned to `obs.mesh`, `ring.mesh`, `pt.mesh`, `player.mesh`. Always call `gameState.scene.remove(mesh)` before nulling
- **Pipe recycling**: `updatePipePool()` in render-pipe.js wraps segments; segment count × segmentLength must span `visibleLength`
- **Theme colours**: Add/change colours in `RENDER_THEME` in `render.js`; for new theme shapes add a `render-theme-<name>.js` file
- **No build step**: CDN scripts only; open `sonic-halfpipe/index.html` directly in browser

## Step 4: Test considerations

- Open `sonic-halfpipe/index.html` in a browser
- Test both 1P and 2P keyboard modes (verify P2 active and HUD shown)
- Test jump (Up/W/Space) clears barriers in the air; crouch (Down/S) slides under barriers
- Test ring collection during invincibility (after taking a hit)
- Test camera mode if webcam gesture logic was changed

---

# Modify Licorne RPG

You are modifying a Canvas 2D educational RPG. Follow this workflow strictly.

## Step 1: Classify the change

| Category | Files to read | Files to edit |
|----------|--------------|---------------|
| **Challenge balance** (trigger radius, gate score) | `aventure apprentissage/js/config.js` | `aventure apprentissage/js/config.js` |
| **Math difficulty per level** | `aventure apprentissage/js/config.js:generateCalcul` | `aventure apprentissage/js/config.js` |
| **Word/phrase pools** (lecture or English vocab) | `aventure apprentissage/js/config.js` | `aventure apprentissage/js/config.js` |
| **Room positions / castle layout** | `aventure apprentissage/js/config.js:CONFIG.ROOMS + CORRIDORS` | `aventure apprentissage/js/config.js` |
| **Exit zone** | `aventure apprentissage/js/config.js:CONFIG.EXIT_ZONE` | `aventure apprentissage/js/config.js` |
| **Level themes (colors)** | `aventure apprentissage/js/config.js:CONFIG.THEMES` | `aventure apprentissage/js/config.js` |
| **Player movement / collision** | `aventure apprentissage/js/main.js:movePlayer + _isWalkable` | `aventure apprentissage/js/main.js` |
| **Room triggers** | `aventure apprentissage/js/main.js:checkRoomTriggers` | `aventure apprentissage/js/main.js` |
| **Level progression / exit** | `aventure apprentissage/js/main.js:checkExitTrigger + _completeLevel` | `aventure apprentissage/js/main.js` |
| **Challenge logic** (start, answer evaluation, hints) | `aventure apprentissage/js/challenges.js` | `aventure apprentissage/js/challenges.js` |
| **Speech recognition / TTS** | `aventure apprentissage/js/speech.js` | `aventure apprentissage/js/speech.js` |
| **XP, leveling, cosmetics** | `aventure apprentissage/js/rpg.js` | `aventure apprentissage/js/rpg.js` |
| **Save / load** | `aventure apprentissage/js/save.js` | `aventure apprentissage/js/save.js` |
| **World rendering** (map, player sprite, HUD) | `aventure apprentissage/js/world.js` | `aventure apprentissage/js/world.js` |
| **Challenge overlay UI** | `aventure apprentissage/js/ui.js`, `aventure apprentissage/index.html` | Both, maybe `aventure apprentissage/styles.css` |
| **Menu / level-complete screens** | `aventure apprentissage/js/ui.js`, `aventure apprentissage/index.html` | Both |
| **Keyboard input** | `aventure apprentissage/js/input.js` | `aventure apprentissage/js/input.js` |
| **Camera gestures** | `aventure apprentissage/js/webcam-gestures.js` | `aventure apprentissage/js/webcam-gestures.js` |
| **Webcam init** | `aventure apprentissage/js/webcam-core.js` | `aventure apprentissage/js/webcam-core.js` |
| **Audio** | `aventure apprentissage/js/main.js` (audioSystem at top) | `aventure apprentissage/js/main.js` |
| **Game boot / loop** | `aventure apprentissage/js/main.js` | `aventure apprentissage/js/main.js` |
| **Styling** | `aventure apprentissage/styles.css` | `aventure apprentissage/styles.css` |
| **New challenge type** | `aventure apprentissage/js/config.js`, `aventure apprentissage/js/challenges.js`, `aventure apprentissage/js/ui.js` | All three |
| **New game mechanic** | `aventure apprentissage/js/state.js` (add state), `aventure apprentissage/js/main.js` (add logic) | Both |

## Step 2: Read ONLY the files from the table above

Do NOT read the full codebase.

## Step 3: Make the change

Key rules:
- All files share globals — no imports/exports needed
- Script load order: config → state → save → speech → input → webcam-core → webcam-gestures → rpg → challenges → world → ui → main
- **CRITICAL — walkable zones**: `_isWalkable` in `main.js` uses margin=0. NEVER add a positive margin — it creates gaps at room/corridor junctions and blocks the player
- New CONFIG entries go in `aventure apprentissage/js/config.js`
- New state fields go in `aventure apprentissage/js/state.js` AND must be reset in `main.js:_resetLevelState()` or `startGame()`
- Challenge types: `'lecture'` (fr reading/speech), `'calcul'` (fr math), `'anglais'` (en-US speech)
- `challengeSystem.processAnswer()` receives normalized spoken text + alternatives array
- `speechSystem.startListening(lang, onResult, onEnd, grammar, onInterim)` — use `'fr-FR'` for lecture/calcul, `'en-US'` for anglais
- `rpgSystem.addXP(currentProfile, skill, points)` — then call `saveSystem.saveProfile(currentProfile)`
- `gameState.floatingXP[]` is read by `worldSystem.render()` for animated feedback
- `currentProfile` and `currentProgress` are module-level `let` vars in `state.js`, loaded by `saveSystem` at boot

## Step 4: Test considerations

- Open `aventure apprentissage/index.html` in **Chrome** (Speech API + MoveNet require Chrome)
- Enter a player name, choose keyboard mode, and confirm the map renders
- Walk into a room — challenge overlay must appear and mic must start (check browser mic permission)
- Complete 5 rooms — confirm exit portal appears and walking into it advances the level
- Check browser console — 0 JS errors on load
- Test camera mode if webcam gesture code was changed
