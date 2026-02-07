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
| **New enemy type** | `js/config.js`, `js/entities.js`, `js/game.js:spawnWave`, `js/render.js:drawSpaceEnemy` | All four |
| **New powerup type** | `js/entities.js`, `js/game.js:update` (bullet-powerup section), `js/render.js` (powerups section) | All three |
| **Player movement** | `js/game.js:update` (player movement section) | `js/game.js` |
| **Shooting mechanics** | `js/game.js:update` (auto-fire section), `js/entities.js:createBullet` | Both |
| **Visual/sprite changes** | `js/render.js` | `js/render.js` |
| **HUD/UI changes** | `js/ui.js`, `index.html` | Both, maybe `styles.css` |
| **Camera/pose behavior** | `js/webcam.js` | `js/webcam.js` |
| **Game flow** (start, end, restart) | `js/main.js` | `js/main.js`, maybe `js/ui.js` |
| **New theme** | `js/render.js:render`, `js/ui.js:selectTheme` | Both, plus `styles.css` |
| **Styling only** | `styles.css` | `styles.css` |
| **New game mechanic** | `js/state.js` (add state), `js/game.js` (add logic), `js/render.js` (add visuals) | All three |

## Step 2: Read ONLY the files from the table above

Do NOT read the full codebase. Read the minimum files needed.

## Step 3: Make the change

Key rules:
- All files share globals — no imports/exports needed
- `gameState.players[]` is the source of truth for player data
- After modifying player 0's `.crowdSize`, also set `gameState.crowdSize` (legacy compat)
- New CONFIG entries go in `js/config.js`
- New state fields go in `js/state.js` (in the appropriate object)
- New entity factories go in `js/entities.js`
- Drawing code always goes in `js/render.js`, game logic in `js/game.js`
- Script load order: config → state → entities → input → webcam → game → render → ui → main

## Step 4: Test considerations

- Open `index.html` in a browser (no build step needed)
- The original `wave-shooter.html` is kept as reference — don't modify it
- Check both themes (space + unicorn) if you changed rendering
- Check both control modes if you changed input/movement
