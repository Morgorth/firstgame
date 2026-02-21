---
name: modify-game
description: Use when making any code change to the Wave Assault game. Routes you to the exact files needed for any modification type. Use this before editing game code.
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
argument-hint: "<what-to-change>"
---

# Modify Wave Assault

You are modifying a browser-based wave shooter. Follow this workflow strictly to minimize token usage.

## Step 1: Classify the change

Read `$ARGUMENTS` and classify into one of these categories:

| Category | Files to read | Files to edit |
|----------|--------------|---------------|
| **Balance/tuning** (speeds, health, damage, spawn rates) | `js/config.js` | `js/config.js`, maybe `js/game.js` |
| **New enemy type** | `js/config.js`, `js/entities.js`, `js/game.js:spawnWave`, relevant `js/render-theme-*.js` | All four |
| **New powerup type** | `js/entities.js`, `js/game.js:update` (bullet-powerup section), `js/render-entities.js:drawPowerups` | All three + `js/config.js` |
| **Player movement** | `js/game.js:update` (player movement section) | `js/game.js` |
| **Shooting mechanics** | `js/game.js:update` (auto-fire section), `js/entities.js:createBullet` | Both |
| **Player sprite changes** | matching `js/render-theme-*.js` | that file only |
| **Enemy sprite changes** | matching `js/render-theme-*.js` | that file only |
| **Background / environment visuals** | `js/render-background.js` | `js/render-background.js` |
| **Particle / explosion effects** | `js/render-entities.js` | `js/render-entities.js` |
| **Screen overlays (hit flash, nuke flash)** | `js/render-effects.js` | `js/render-effects.js` |
| **Fleet donation beam visuals** | `js/render-effects.js` | `js/render-effects.js` |
| **Charge-ready indicator** | `js/render-effects.js`, `js/render-sprites.js:RENDER_THEME` | Both |
| **Powerup rendering** | `js/render-entities.js:drawPowerups` | `js/render-entities.js` |
| **HUD/UI changes** | `js/ui.js`, `index.html` | Both, maybe `styles.css` |
| **Camera/pose behavior** | `js/webcam.js` | `js/webcam.js` |
| **Game flow** (start, end, restart) | `js/main.js` | `js/main.js`, maybe `js/ui.js` |
| **New theme** | `js/render-sprites.js:RENDER_THEME`, `js/render-background.js`, `js/render-entities.js`, `js/render-effects.js`, `js/render.js`, `js/ui.js:selectTheme` | All + new `js/render-theme-<name>.js` + `styles.css` + `index.html` |
| **Theme-specific colour or icon** | `js/render-sprites.js:RENDER_THEME` | `js/render-sprites.js` |
| **Styling only** | `styles.css` | `styles.css` |
| **Super weapon / nuke** | `js/game.js` (activateSuperWeapon + checkSuperWeaponThreshold), `js/state.js`, `js/render-effects.js` (flash + charge icon), `js/render-sprites.js:RENDER_THEME` (icon/colour), `js/ui.js` (HUD progress) | All four + `js/config.js` for tuning |
| **Audio/music** | `js/audio.js` | `js/audio.js` |
| **New game mechanic** | `js/state.js` (add state), `js/game.js` (add logic), relevant render sub-module (add visuals) | All three + `js/main.js` (reset in startGame) |

## Step 2: Read ONLY the files from the table above

Do NOT read the full codebase. Read the minimum files needed.

## Step 3: Make the change

Key rules:
- All files share globals — no imports/exports needed
- Script load order: config → state → entities → input → webcam → audio → game → render-sprites → render-theme-unicorn → render-theme-pacificrim → render-theme-space → render-theme-dragon → render-background → render-entities → render-effects → render → ui → main
- `gameState.players[]` is the source of truth for player data
- After modifying player 0's `.crowdSize`, also set `gameState.crowdSize` (legacy compat)
- New CONFIG entries go in `js/config.js`
- New state fields go in `js/state.js` AND must be reset in `js/main.js:startGame()`
- New entity factories go in `js/entities.js`
- Drawing code goes in the relevant render sub-module, NOT in `render.js` (orchestrator only)
- Game logic stays in `js/game.js`
- Per-player arrays use index 0 for P1, index 1 for P2
- Kill attribution: bullet kills → `bullet.owner`, shield/collision → player index `i`, enemies passing bottom → no player (skip nuke credit)
- Super weapon charges are per-player: `gameState.playerKills[i]`, `superWeaponCharges[i]`, `superWeaponNextThreshold[i]`
- All render sub-functions receive `T = getTheme()` → use `T.isUnicorn`, `T.isPacificRim`, `T.isDragon`, `T.theme` instead of reading `gameTheme` directly
- Per-theme visual constants (colours, icons) live in `RENDER_THEME` in `js/render-sprites.js` — add new keys there, don't scatter inline ternary chains
- HUD: single-player elements in `#singlePlayerHud` (right side), multi-player in `#multiPlayerHud` with `#p1Hud`/`#p2Hud`

## Step 4: Test considerations

- Open `index.html` in a browser (no build step needed)
- Check all four themes (space / unicorn / pacificrim / dragon) if you changed rendering
- Check both control modes (keyboard + camera) if you changed input/movement
- Check both 1P and 2P if you changed per-player logic
- Nuke progress is shown on the right-side HUD (single: `#nukeProgress`, multi: `#p1Nuke`/`#p2Nuke`)
