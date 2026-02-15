---
name: debug-issue
description: Use when investigating a bug or unexpected behavior in Wave Assault. Traces the issue through the codebase systematically.
allowed-tools: Read, Grep, Glob
argument-hint: "<bug-description>"
---

# Debug a Wave Assault Issue

You are investigating a bug in a browser-based wave shooter. Follow this workflow to find the root cause efficiently.

## Step 1: Classify the symptom

Read `$ARGUMENTS` and classify:

| Symptom | Start reading |
|---------|--------------|
| Wrong numbers / balance feels off | `js/config.js` |
| Enemy/bullet/powerup not appearing | `js/entities.js` + `js/game.js` (spawn + filter logic) |
| Collision not working | `js/game.js:checkCollision` + collision loops in `update()` |
| Visual glitch / wrong sprite | `js/render.js` |
| HUD shows wrong value | `js/ui.js:updateHUD` + `index.html` (element IDs) |
| Game doesn't start / restart broken | `js/main.js:startGame` |
| State not resetting between games | `js/main.js:startGame` (check reset list) + `js/state.js` |
| Camera/pose not detected | `js/webcam.js` |
| Super weapon not charging / firing | `js/game.js:checkSuperWeaponThreshold+activateSuperWeapon` + `js/state.js` |
| Audio issue | `js/audio.js` |
| Affects only one theme | `js/render.js` (search for `isUnicorn`) |
| Affects only 2P mode | `js/game.js` (search for `playerCount` or `players.forEach`) |

## Step 2: Trace the data flow

For the identified area, trace how data flows:
1. **Where is the value set?** (initial state in `js/state.js`, reset in `js/main.js:startGame`)
2. **Where is it modified?** (game logic in `js/game.js:update`)
3. **Where is it read/displayed?** (rendering in `js/render.js`, HUD in `js/ui.js`)

Use `Grep` to find all references to the relevant state field or function.

## Step 3: Check common pitfalls

- **State not reset**: New fields added to `js/state.js` but not reset in `startGame()` — stale values carry over between games
- **Legacy compat forgotten**: `gameState.player` or `gameState.crowdSize` not updated after changing `players[0]`
- **Per-player arrays**: Using a scalar where an array is needed (e.g., `superWeaponNextThreshold` must be `[n, n]`)
- **Theme branching**: Missing `isUnicorn` check causes one theme to render incorrectly
- **Bullet owner**: `bullet.owner` defaults to 0 — ensure `createBullet(x, y, idx)` passes the right player index
- **Off-by-one in player index**: Player 1 = index 0, Player 2 = index 1
- **DOM element missing**: HUD element referenced in JS but not in `index.html`

## Step 4: Report findings

Summarize:
1. **Root cause**: What's wrong and where
2. **Affected code**: File, function, line
3. **Fix**: What needs to change
