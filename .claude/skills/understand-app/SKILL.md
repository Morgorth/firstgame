---
name: understand-app
description: Use at the start of any session or when you need to orient yourself in the Wave Assault or Sonic Half-Pipe codebase. Provides file map, globals reference, and task-to-file routing to minimize token usage.
allowed-tools: Read, Grep, Glob
argument-hint: "[game: wave-assault|sonic-halfpipe] [area-to-focus: config|state|entities|input|webcam|audio|game|render|ui|main|all]"
---

# Repo Structure

This repo contains **two separate games** in sibling directories:

| Directory | Game | Engine |
|-----------|------|--------|
| `wave-assault/` | Wave Assault — browser wave shooter, 2D canvas | Canvas 2D |
| `sonic-halfpipe/` | Sonic Half-Pipe — 3D half-pipe runner, collect rings | Three.js |

Both games share the same webcam / MoveNet pose-detection stack (1–2 players, keyboard or camera control).

**CRITICAL**: Never mix file paths between games. Check which game is being discussed before reading any file.

---

# Wave Assault — Codebase Guide

This is a browser-based wave shooter game with four themes (space/unicorn/pacificrim/dragon) and two control modes (keyboard/camera with MoveNet pose detection). Supports 1–2 players.

## File Map (read ONLY what you need)

| Area | File | What's inside |
|------|------|---------------|
| **Tuning** | `wave-assault/js/config.js` | `CONFIG` (player/bullet/enemy/powerup/wave/superWeapon stats), `SKELETON_CONNECTIONS`, `PLAYER_COLORS` |
| **State** | `wave-assault/js/state.js` | `canvas`, `ctx`, `PLAY_AREA`, `gameState`, `webcamState`, `keys`, `controlMode`, `gameTheme` |
| **Entities** | `wave-assault/js/entities.js` | `createPlayer/Bullet/Enemy/Powerup/Particle/Stars()`, `getCrowdPositions()` |
| **Input** | `wave-assault/js/input.js` | Keyboard `keydown/keyup` → `keys` map |
| **Camera** | `wave-assault/js/webcam.js` | Webcam init, MoveNet pose detector, wave-gesture detection, player registration, debug overlays, fallback edge detection |
| **Audio** | `wave-assault/js/audio.js` | `audioSystem` — music, SFX, speech synthesis, tempo control |
| **Logic** | `wave-assault/js/game.js` | `checkCollision()`, `activateSuperWeapon()`, `checkSuperWeaponThreshold()`, `spawnWave()`, `update()` (movement, shooting, collisions, wave progression), `checkGameOver()` |
| **UI** | `wave-assault/js/ui.js` | `updateHUD/Wave/CrowdDisplay()`, `selectControlMode/PlayerCount/Theme()`, registration UI, countdown |
| **Lifecycle** | `wave-assault/js/main.js` | `startGame()`, `gameOver()`, `gameLoop()`, all DOM event bindings, boot |
| **HTML** | `wave-assault/index.html` | DOM structure only — no logic, no styles |
| **CSS** | `wave-assault/styles.css` | All styling |

### Render sub-modules (render.js is now split — read only the relevant file)

| File | What's inside |
|------|---------------|
| `wave-assault/js/render-sprites.js` | Sprite/image cache (`_ensureSprite`, `_getSparkleSprite`, `_getHeartSprite`, `_getStarEmojiSprite`), background gradient cache, `RENDER_THEME` constants table, `getTheme()` helper |
| `wave-assault/js/render-theme-unicorn.js` | `drawUnicorn()`, `drawWolf()`, `drawUnicornEnemy()` |
| `wave-assault/js/render-theme-pacificrim.js` | `drawJaeger()`, `drawKaiju()` |
| `wave-assault/js/render-theme-space.js` | `drawSpaceShip()`, `drawSpaceEnemy()` |
| `wave-assault/js/render-theme-dragon.js` | `drawDragon()`, `drawBlackKnight()` |
| `wave-assault/js/render-background.js` | `drawBackground()`, `drawDragonEnvironment()`, `drawPacificRimEnvironment()`, `drawStars()` |
| `wave-assault/js/render-entities.js` | `drawParticles()`, `drawPlayers()`, `drawBullets()`, `drawEnemies()`, `drawPowerups()` |
| `wave-assault/js/render-effects.js` | `drawHitFlash()`, `drawSuperWeaponFlash()`, `drawDonationBeams()`, `drawChargeIndicators()` |
| `wave-assault/js/render.js` | Thin `render()` orchestrator — calls all sub-modules in draw order |

**Script load order**: config → state → entities → input → webcam → audio → game → render-sprites → render-theme-unicorn → render-theme-pacificrim → render-theme-space → render-theme-dragon → render-background → render-entities → render-effects → render → ui → main

## Key Wave Assault globals

All files share these globals (no modules):
- `CONFIG` — immutable game constants
- `RENDER_THEME` — per-theme visual constants (donateColor, shieldColor, chargeIcon, etc.)
- `gameState` — mutable runtime state (see key fields below)
- `webcamState` — camera/pose state (`.active`, `.targetLane`, `.registeredPlayers[]`, etc.)
- `canvas`, `ctx` — the game canvas and its 2D context
- `PLAY_AREA` — virtual coordinate space (2× viewport)
- `controlMode` — `'keyboard'` or `'camera'`
- `gameTheme` — `'space'` | `'unicorn'` | `'pacificrim'` | `'dragon'`
- `keys` — keyboard state map

## Key Wave Assault gameState fields

```
gameState.running           // bool
gameState.players[]         // [{active, x, y, crowdSize, faceImage, color, targetLane}, ...]
gameState.player            // legacy mirror of players[0]
gameState.crowdSize         // legacy mirror of players[0].crowdSize
gameState.bullets[]         // [{x, y, active, owner}, ...]
gameState.enemies[]         // [{type, x, y, health, maxHealth, speed, ...}, ...]
gameState.powerups[]        // [{x, y, active, health, type, owner?}, ...]
gameState.particles[]       // [{x, y, vx, vy, life, maxLife, color}, ...]
gameState.score             // number
gameState.wave              // current wave number
gameState.totalKills        // global kill counter (for scoring)
gameState.playerKills[]     // [p1Kills, p2Kills] — per-player kill counters (for nuke charges)
gameState.superWeaponCharges[]       // [p1Charges, p2Charges]
gameState.superWeaponNextThreshold[] // [p1Next, p2Next] — next kill count to earn a charge
gameState.superWeaponFlashEffect     // frames remaining of nuke flash
gameState.activeEffects     // {shield: [p1, p2], spread: [p1, p2]} — remaining frames
gameState.playerCount       // 1 or 2
```

## Key Wave Assault patterns

- **Players array**: `gameState.players[0]` (cyan, P1) and `gameState.players[1]` (magenta, P2). Each has `.active`, `.x`, `.y`, `.crowdSize`, `.targetLane`, `.faceImage`.
- **Legacy compat**: `gameState.player` and `gameState.crowdSize` mirror player 0. Always update both when modifying player 0.
- **Entity lifecycle**: Factory → push to array → filtered out when dead/expired in `update()`.
- **Collision**: AABB via `checkCollision(a, b, aw, ah, bw, bh)`.
- **Kill attribution**: Bullet kills → `bullet.owner`, shield/collision kills → player index `i`, enemies passing bottom → no player attribution (no nuke charge).
- **Super weapon**: Per-player. `playerKills[i]` hits `superWeaponNextThreshold[i]` → charge earned → threshold advances by `killsPerCharge`. Activation: keyboard=Space (P1), camera=hands-up gesture.
- **Auto-fire**: Every `CONFIG.player.fireRate` frames, bullets from all `getCrowdPositions()`.
- **Wave progression**: All enemies killed + none on screen → countdown → next wave.
- **Theme helper**: Every render sub-function receives `T = getTheme()` → `{ isUnicorn, isPacificRim, isDragon, isSpace, theme }` where `theme` is the matching `RENDER_THEME` entry.
- **Rendering**: Virtual coords scaled to screen via `ctx.scale()`. Use `RENDER_THEME[gameTheme]` for per-theme colours instead of inline ternary chains.

## Wave Assault task-to-file routing

- **Game balance** (speed, health, damage, spawn rates) → `wave-assault/js/config.js` + `wave-assault/js/game.js:spawnWave`
- **Player movement or shooting** → `wave-assault/js/game.js:update`
- **Player/enemy sprite** → matching `wave-assault/js/render-theme-*.js`
- **Background / environment** → `wave-assault/js/render-background.js`
- **Particle effects** → `wave-assault/js/render-entities.js:drawParticles`
- **Screen overlays (hit flash, nuke flash)** → `wave-assault/js/render-effects.js`
- **HUD or screens** → `wave-assault/js/ui.js` + `wave-assault/index.html`
- **Camera/pose behavior** → `wave-assault/js/webcam.js`
- **Game flow** (start, restart, game over) → `wave-assault/js/main.js`
- **Super weapon / nuke** → `wave-assault/js/game.js`, `wave-assault/js/state.js`, `wave-assault/js/render-effects.js`, `wave-assault/js/render-sprites.js:RENDER_THEME`, `wave-assault/js/ui.js`
- **Audio** → `wave-assault/js/audio.js`
- **Styling** → `wave-assault/styles.css`

---

# Sonic Half-Pipe — Codebase Guide

A 3D half-pipe runner built on Three.js. The player skates along a neon half-pipe, collecting rings and dodging obstacles. Goal: collect 50 rings. Supports 1–2 players, keyboard or camera control.

## File Map (read ONLY what you need)

| Area | File | What's inside |
|------|------|---------------|
| **Tuning** | `sonic-halfpipe/js/config.js` | `CONFIG.pipe`, `CONFIG.player`, `CONFIG.rings`, `CONFIG.obstacles`, `CONFIG.speed`, `CONFIG.camera`, `CONFIG.waveGesture`, `CONFIG.colorTracking` |
| **State** | `sonic-halfpipe/js/state.js` | `keys`, `controlMode`, `webcamState`, `gameState`, `highScores`, `loadHighScores()`, `saveHighScores()`, `addHighScore()` |
| **Input** | `sonic-halfpipe/js/input.js` | `keydown/keyup` → `keys` map; `applyKeyboardInput()` (P1: arrows/WASD, P2: IJKL); `triggerJump(playerIndex)`, `triggerCrouch(playerIndex)` |
| **Webcam — lifecycle** | `sonic-halfpipe/js/webcam-core.js` | `initWebcam()`, `initPoseDetector()`, `stopWebcam()`; shared keypoint helpers: `getKeypoint()`, `getPoseCenterX()`, `getWrists()`, `pruneByTime()` |
| **Webcam — color** | `sonic-halfpipe/js/webcam-color.js` | `sampleTorsoColor()`, `compareColorSignatures()`, `updateColorSignature()` |
| **Webcam — gestures** | `sonic-halfpipe/js/webcam-gestures.js` | `checkJumpGesture()`, `checkCrouchGesture()`, `poseToLane()`, `handleGameplayPoseTracking()`, `findPoseForPlayer()`, `trackMotion()`, `scoreWristHistory()` |
| **Webcam — registration** | `sonic-halfpipe/js/webcam-registration.js` | `startPlayerRegistration()`, `handleRegistrationPoseTracking()`, `captureFaceImage()`, `onPlayerRegistered()`; registration UI helpers |
| **Webcam — tracking loop** | `sonic-halfpipe/js/webcam-pose.js` | `trackPoses()`, `updatePositionMarkers()`, `drawPoseDebug()`, `drawRegistrationDebug()` |
| **Audio** | `sonic-halfpipe/js/audio.js` | `audioSystem` — `playRingCollect()`, `playRingsWin()`, `playHit()`, `playGameOver()`, `playJump()`, `playSpeedUp()`, `playCountdownBeep()`, `playStart()` |
| **Logic** | `sonic-halfpipe/js/game.js` | `laneToPosition()`, `jumpHeightAt()`, `spawnObstacles()`, `spawnRings()`, `checkCollisions()`, `updatePlayers()`, `updateSpeedAndDistance()`, `scrollWorld()`, `gameTick()`, `startCountdown()`, `triggerWin()`, `triggerGameOver()` |
| **Render — orchestrator** | `sonic-halfpipe/js/render.js` | `RENDER_THEME` constants, `getTheme()`, `initScene()`, `buildStarfield()`, `applyThemeToScene()`, `clearSceneItems()`, `renderFrame()` |
| **Render — pipe** | `sonic-halfpipe/js/render-pipe.js` | `buildPipeSegment()`, `buildPipePool()`, `updatePipePool()` |
| **Render — unicorn player** | `sonic-halfpipe/js/render-theme-unicorn-player.js` | `_makeUnicornMaterials()`, `_addUnicornBody()`, `_addUnicornRider()`, `_addUnicornTrail()`, `buildUnicornPlayerMesh()` |
| **Render — unicorn obstacles** | `sonic-halfpipe/js/render-theme-unicorn-obstacles.js` | `_buildUnicornBumper()`, `_buildUnicornBomb()`, `_buildUnicornBarrier()`, `buildUnicornObstacleMesh()` |
| **Render — unicorn rings** | `sonic-halfpipe/js/render-theme-unicorn-rings.js` | `buildUnicornRingMesh()` |
| **Render — player** | `sonic-halfpipe/js/render-player.js` | `_buildDefaultPlayerMesh()`, `buildPlayerMeshes()`, `updatePlayerMeshes()` |
| **Render — obstacles** | `sonic-halfpipe/js/render-obstacles.js` | `buildObstacleMesh()`, `updateObstacleMeshes()` |
| **Render — rings** | `sonic-halfpipe/js/render-rings.js` | `buildRingMesh()`, `updateRingMeshes()` |
| **Render — particles** | `sonic-halfpipe/js/render-particles.js` | `getParticleMesh()`, `updateParticleMeshes()` |
| **UI** | `sonic-halfpipe/js/ui.js` | Screen management (`showScreen()`), `showTitleScreen()`, `showSetupScreen()`, `updateHUD()`, `showEndScreen()`, `submitHighScore()`, `renderHighScoreTable()` |
| **Lifecycle** | `sonic-halfpipe/js/main.js` | `loop()`, `startGame()`, `restartGame()`, button callbacks (`onTitlePlay1/2`, `onTitleCamera1/2`, `onSetupStart`, `onEndRestart/Title/SubmitScore`), `window.load` boot |
| **HTML** | `sonic-halfpipe/index.html` | DOM structure — titleScreen, setupScreen, gameScreen (HUD + countdown), endScreen, webcamContainer |
| **CSS** | `sonic-halfpipe/styles.css` | All styling |

**Script load order**: config → state → audio → input → webcam-core → webcam-color → webcam-gestures → webcam-registration → webcam-pose → game → render → render-pipe → render-theme-unicorn-player → render-theme-unicorn-obstacles → render-theme-unicorn-rings → render-background-unicorn → render-player → render-obstacles → render-rings → render-particles → ui → main

## Key Sonic Half-Pipe globals

All files share globals (no modules):
- `CONFIG` — immutable game constants (pipe geometry, player physics, ring/obstacle params, speed curve, camera gesture thresholds)
- `gameState` — mutable runtime state
- `webcamState` — camera/pose state
- `keys` — keyboard state map
- `controlMode` — `'keyboard'` | `'camera'`
- `highScores` — persisted array (localStorage)

## Key Sonic Half-Pipe gameState fields

```
gameState.running           // bool
gameState.frameCount        // incremented each gameTick
gameState.speed             // current scroll speed (accelerates to CONFIG.speed.max)
gameState.distance          // total distance scrolled
gameState.score             // points (rings × CONFIG.rings.pointsEach)
gameState.playerCount       // 1 or 2 — set from webcamState.playerCount in startGame()
gameState.phase             // 'start' | 'countdown' | 'playing' | 'win' | 'gameover'
gameState.countdownActive   // bool — gameTick returns early when true

gameState.players[]         // 2 entries, index 0 = P1 (cyan), index 1 = P2 (magenta)
  player.active             // false for unused P2 slot in 1P mode
  player.lane               // current fractional lane (0…laneCount-1), smoothed
  player.targetLane         // desired lane set by input
  player.rings              // rings collected by this player
  player.jumping            // bool
  player.jumpFrame          // 0…jumpDuration
  player.crouching          // bool
  player.crouchFrame        // 0…crouchDuration
  player.invincible         // frames remaining of invincibility (obstacle-only; rings still collected)
  player.mesh               // Three.js Group assigned by render.js

gameState.obstacles[]       // [{type:'bumper'|'bomb'|'barrier', lane, z, active, mesh, hitFrame}]
gameState.ringItems[]       // [{lane, z, active, mesh, spin}]
gameState.particles[]       // [{x,y,z, vx,vy,vz, life, decay, color, mesh}]

gameState.scene / camera / renderer  // Three.js objects, assigned by initScene()
gameState.pipeSegments[]    // recycled pipe mesh pool
```

## Key Sonic Half-Pipe patterns

- **Lane system**: Fractional 0…(laneCount-1). `laneToPosition(lane)` → `{x, y}` on pipe surface. Player/obstacle `z` increases each frame by `gameState.speed` (world scrolls toward camera).
- **Jump arc**: Parabolic — `jumpHeightAt(frame)` = `jumpHeight * 4 * t * (1-t)`. Applied as offset along the pipe surface normal in `render.js:updatePlayerMeshes`.
- **Invincibility scope**: Only blocks *obstacle* collision. Ring collection always active.
- **Pipe recycling**: `updatePipePool()` moves segments along Z and wraps them back when they pass the camera.
- **Player count propagation**: `webcamState.playerCount` → `gameState.playerCount` in `startGame()`. For keyboard mode, `showSetupScreen` must set `webcamState.playerCount` before calling `startGame()`.
- **Controls — P1**: Arrow keys / WASD for lanes; Up/W/Space = jump; Down/S = crouch.
- **Controls — P2**: J/L for lanes; I = jump; K = crouch.
- **Camera controls**: Lateral body position → `targetLane` via `poseToLane()`; hands-above-nose → jump; shoulders drop → crouch.
- **Win condition**: First player to reach `CONFIG.rings.goal` (50) rings → `triggerWin(playerIndex)`.
- **No build step**: Open `sonic-halfpipe/index.html` directly in a browser. CDN scripts for Three.js and TensorFlow/MoveNet.

## Sonic Half-Pipe task-to-file routing

- **Game balance** (speed, ring goal, obstacle spawn rate, hit radius) → `sonic-halfpipe/js/config.js`
- **Jump/crouch physics** → `sonic-halfpipe/js/game.js:jumpHeightAt + updatePlayers`
- **Lane movement smoothing** → `sonic-halfpipe/js/game.js:updatePlayers` (`laneChangeSpeed` in config)
- **Collision detection** → `sonic-halfpipe/js/game.js:checkCollisions`
- **Obstacle / ring spawning** → `sonic-halfpipe/js/game.js:spawnObstacles + spawnRings`
- **Player mesh visuals (default theme)** → `sonic-halfpipe/js/render-player.js`
- **Player mesh visuals (unicorn theme)** → `sonic-halfpipe/js/render-theme-unicorn-player.js:buildUnicornPlayerMesh`
- **Obstacle mesh visuals (unicorn theme)** → `sonic-halfpipe/js/render-theme-unicorn-obstacles.js:buildUnicornObstacleMesh`
- **Ring mesh visuals (unicorn theme)** → `sonic-halfpipe/js/render-theme-unicorn-rings.js:buildUnicornRingMesh`
- **Obstacle mesh visuals** → `sonic-halfpipe/js/render-obstacles.js`
- **Ring mesh visuals** → `sonic-halfpipe/js/render-rings.js`
- **Pipe geometry / materials** → `sonic-halfpipe/js/render-pipe.js`; colour constants → `sonic-halfpipe/js/render.js:RENDER_THEME`
- **Particle effects** → `sonic-halfpipe/js/game.js:spawnCollectParticles` + `sonic-halfpipe/js/render-particles.js`
- **Lighting / scene / camera angle** → `sonic-halfpipe/js/render.js:initScene`
- **Theme colours** → `sonic-halfpipe/js/render.js:RENDER_THEME`
- **HUD / screens** → `sonic-halfpipe/js/ui.js` + `sonic-halfpipe/index.html`
- **Game flow** (start, restart, end) → `sonic-halfpipe/js/main.js` + `sonic-halfpipe/js/ui.js:showEndScreen`
- **Keyboard input** → `sonic-halfpipe/js/input.js`
- **Jump/crouch gesture logic** → `sonic-halfpipe/js/webcam-gestures.js`
- **Lane tracking (camera)** → `sonic-halfpipe/js/webcam-gestures.js:poseToLane`
- **Player registration (camera mode)** → `sonic-halfpipe/js/webcam-registration.js`
- **Webcam init / lifecycle** → `sonic-halfpipe/js/webcam-core.js`
- **Audio** → `sonic-halfpipe/js/audio.js`
- **High scores** → `sonic-halfpipe/js/state.js` (`loadHighScores`, `saveHighScores`, `addHighScore`) + `sonic-halfpipe/js/ui.js:renderHighScoreTable`
- **Styling** → `sonic-halfpipe/styles.css`

## If the user asks to focus on a specific area

Read `$ARGUMENTS` to determine which game and area, then load only the relevant file(s) listed above. Do NOT read the entire codebase — that wastes tokens.
