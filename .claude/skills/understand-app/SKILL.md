---
name: understand-app
description: Use at the start of any session or when you need to orient yourself in the Wave Assault codebase. Provides file map, globals reference, and task-to-file routing to minimize token usage.
allowed-tools: Read, Grep, Glob
argument-hint: "[area-to-focus: config|state|entities|input|webcam|audio|game|render|ui|main|all]"
---

# Wave Assault — Codebase Guide

This is a browser-based wave shooter game with two themes (space/unicorn) and two control modes (keyboard/camera with MoveNet pose detection). Supports 1–2 players.

## File Map (read ONLY what you need)

| Area | File | What's inside |
|------|------|---------------|
| **Tuning** | `js/config.js` | `CONFIG` (player/bullet/enemy/powerup/wave/superWeapon stats), `SKELETON_CONNECTIONS`, `PLAYER_COLORS` |
| **State** | `js/state.js` | `canvas`, `ctx`, `PLAY_AREA`, `gameState`, `webcamState`, `keys`, `controlMode`, `gameTheme` |
| **Entities** | `js/entities.js` | `createPlayer/Bullet/Enemy/Powerup/Particle/Stars()`, `getCrowdPositions()` |
| **Input** | `js/input.js` | Keyboard `keydown/keyup` → `keys` map (4 lines) |
| **Camera** | `js/webcam.js` | Webcam init, MoveNet pose detector, wave-gesture detection, player registration, debug overlays, fallback edge detection |
| **Audio** | `js/audio.js` | `audioSystem` — music, SFX, speech synthesis, tempo control |
| **Logic** | `js/game.js` | `checkCollision()`, `activateSuperWeapon()`, `checkSuperWeaponThreshold()`, `spawnWave()`, `update()` (movement, shooting, collisions, wave progression), `checkGameOver()` |
| **Drawing** | `js/render.js` | `drawUnicorn/Wolf/SpaceShip/SpaceEnemy()`, `render()` (background, stars, players, bullets, enemies, powerups, effects, super weapon flash) |
| **UI** | `js/ui.js` | `updateHUD/Wave/CrowdDisplay()`, `selectControlMode/PlayerCount/Theme()`, registration UI, countdown |
| **Lifecycle** | `js/main.js` | `startGame()`, `gameOver()`, `gameLoop()`, all DOM event bindings, boot |
| **HTML** | `index.html` | DOM structure only — no logic, no styles |
| **CSS** | `styles.css` | All styling |

**Script load order**: config → state → entities → input → webcam → audio → game → render → ui → main

## How to efficiently work on a task

### Step 1: Identify which files to read

- **Changing game balance** (enemy speed, health, damage, spawn rates) → `js/config.js` + `js/game.js:spawnWave`
- **Changing player movement or shooting** → `js/game.js:update`
- **Changing visuals/sprites** → `js/render.js`
- **Changing HUD or screens** → `js/ui.js` + `index.html`
- **Changing camera/pose behavior** → `js/webcam.js`
- **Adding new entity types** → `js/config.js` + `js/entities.js` + `js/game.js` + `js/render.js`
- **Changing game flow** (start, restart, game over) → `js/main.js`
- **Changing styling** → `styles.css`
- **Super weapon / nuke changes** → `js/game.js` (activation + threshold), `js/state.js` (charges/kills state), `js/render.js` (flash effect), `js/ui.js` (HUD progress)
- **Audio/music changes** → `js/audio.js`

### Step 2: Understand the globals

All files share these globals (no modules):
- `CONFIG` — immutable game constants
- `gameState` — mutable runtime state (see key fields below)
- `webcamState` — camera/pose state (`.active`, `.targetLane`, `.registeredPlayers[]`, etc.)
- `canvas`, `ctx` — the game canvas and its 2D context
- `PLAY_AREA` — virtual coordinate space (2× viewport)
- `controlMode` — `'keyboard'` or `'camera'`
- `gameTheme` — `'space'` or `'unicorn'`
- `keys` — keyboard state map

### Step 3: Key gameState fields

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

### Step 4: Key patterns

- **Players array**: `gameState.players[0]` (cyan, P1) and `gameState.players[1]` (magenta, P2). Each has `.active`, `.x`, `.y`, `.crowdSize`, `.targetLane`, `.faceImage`.
- **Legacy compat**: `gameState.player` and `gameState.crowdSize` mirror player 0. Always update both when modifying player 0.
- **Entity lifecycle**: Factory → push to array → filtered out when dead/expired in `update()`.
- **Collision**: AABB via `checkCollision(a, b, aw, ah, bw, bh)`.
- **Kill attribution**: Bullet kills → `bullet.owner`, shield/collision kills → player index `i`, enemies passing bottom → no player attribution (no nuke charge).
- **Super weapon**: Per-player. `playerKills[i]` hits `superWeaponNextThreshold[i]` → charge earned → threshold advances by `killsPerCharge`. Activation: keyboard=Space (P1), camera=hands-up gesture.
- **Auto-fire**: Every `CONFIG.player.fireRate` frames, bullets from all `getCrowdPositions()`.
- **Wave progression**: All enemies killed + none on screen → countdown → next wave.
- **Rendering**: Virtual coords scaled to screen via `ctx.scale()`. Unicorn theme: rainbow wave nuke, wolves as enemies, unicorns as players. Space theme: cyan flash nuke, spaceships.

## If the user asks to focus on a specific area

Read `$ARGUMENTS` and load only the relevant file(s) listed above. Do NOT read the entire codebase — that wastes tokens.
