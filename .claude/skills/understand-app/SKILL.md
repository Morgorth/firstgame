---
name: understand-app
description: Use at the start of any session or when you need to orient yourself in the Wave Assault codebase. Provides file map, globals reference, and task-to-file routing to minimize token usage.
allowed-tools: Read, Grep, Glob
argument-hint: "[area-to-focus: config|state|entities|input|webcam|game|render|ui|main|all]"
---

# Wave Assault — Codebase Guide

This is a browser-based wave shooter game with two themes (space/unicorn) and two control modes (keyboard/camera with MoveNet pose detection). Supports 1–2 players.

## File Map (read ONLY what you need)

| Area | File | What's inside |
|------|------|---------------|
| **Tuning** | `js/config.js` | `CONFIG` (player/bullet/enemy/powerup stats), `SKELETON_CONNECTIONS`, `PLAYER_COLORS` |
| **State** | `js/state.js` | `canvas`, `ctx`, `PLAY_AREA`, `gameState`, `webcamState`, `keys`, `controlMode`, `gameTheme` |
| **Entities** | `js/entities.js` | `createPlayer/Bullet/Enemy/Powerup/Particle/Stars()`, `getCrowdPositions()` |
| **Input** | `js/input.js` | Keyboard `keydown/keyup` → `keys` map (4 lines) |
| **Camera** | `js/webcam.js` | Webcam init, MoveNet pose detector, wave-gesture detection, player registration, debug overlays, fallback edge detection |
| **Logic** | `js/game.js` | `checkCollision()`, `spawnWave()`, `update()` (movement, shooting, collisions, wave progression), `checkGameOver()` |
| **Drawing** | `js/render.js` | `drawUnicorn/Wolf/SpaceShip/SpaceEnemy()`, `render()` (background, stars, players, bullets, enemies, powerups, effects) |
| **UI** | `js/ui.js` | `updateHUD/Wave/CrowdDisplay()`, `selectControlMode/PlayerCount/Theme()`, registration UI flow |
| **Lifecycle** | `js/main.js` | `startGame()`, `gameOver()`, `gameLoop()`, all DOM event bindings, boot |
| **HTML** | `index.html` | DOM structure only — no logic, no styles |
| **CSS** | `styles.css` | All styling |

## How to efficiently work on a task

### Step 1: Identify which files to read

- **Changing game balance** (enemy speed, health, spawn rates) → read `js/config.js` + `js/game.js:spawnWave`
- **Changing player movement or shooting** → read `js/game.js:update`
- **Changing visuals/sprites** → read `js/render.js`
- **Changing HUD or screens** → read `js/ui.js` + `index.html`
- **Changing camera/pose behavior** → read `js/webcam.js`
- **Adding new entity types** → read `js/config.js` + `js/entities.js` + `js/game.js` + `js/render.js`
- **Changing game flow** (start, restart, game over) → read `js/main.js`
- **Changing styling** → read `styles.css`

### Step 2: Understand the globals

All files share these globals (no modules):
- `CONFIG` — immutable game constants
- `gameState` — mutable runtime state (`.running`, `.players[]`, `.bullets[]`, `.enemies[]`, `.score`, `.wave`, etc.)
- `webcamState` — camera/pose state (`.active`, `.targetLane`, `.registeredPlayers[]`, etc.)
- `canvas`, `ctx` — the game canvas and its 2D context
- `PLAY_AREA` — virtual coordinate space (2× viewport)
- `controlMode` — `'keyboard'` or `'camera'`
- `gameTheme` — `'space'` or `'unicorn'`
- `keys` — keyboard state map

### Step 3: Key patterns to know

- **Players array**: `gameState.players[0]` (cyan, P1) and `gameState.players[1]` (magenta, P2). Each has `.active`, `.x`, `.y`, `.crowdSize`, `.targetLane`, `.faceImage`.
- **Legacy compat**: `gameState.player` and `gameState.crowdSize` mirror player 0 for single-player code paths. Always update both when modifying player 0.
- **Entity lifecycle**: Entities created by factory → pushed to `gameState.enemies/bullets/powerups/particles` arrays → filtered out when dead/expired in `update()`.
- **Collision**: AABB via `checkCollision(a, b, aw, ah, bw, bh)`.
- **Auto-fire**: Every `CONFIG.player.fireRate` frames, bullets spawn from all `getCrowdPositions()`.
- **Wave progression**: All enemies killed + none on screen → wait `CONFIG.wave.delay` frames → next wave.
- **Camera control**: Pose X position → normalized → mapped to lane index → `player.targetLane` → smoothed movement in `update()`.
- **Rendering**: Virtual coords scaled to screen via `ctx.scale()` in `render()`. Draw order: background → stars → particles → players → bullets → enemies → powerups → hit flash.

## If the user asks to focus on a specific area

Read `$ARGUMENTS` and load only the relevant file(s) listed above. Do NOT read the entire codebase — that wastes tokens. Start with the file map, then drill into specifics.
