---
name: plan-feature
description: Use when planning a new feature or significant change to Wave Assault, Sonic Half-Pipe, or Licorne RPG. Produces a structured implementation plan with exact file/function targets before any code is written.
allowed-tools: Read, Grep, Glob
argument-hint: "<game: wave-assault|sonic-halfpipe|licorne-rpg> <feature-description>"
---

# Plan a Game Feature

This repo contains three games: `wave-assault/`, `sonic-halfpipe/`, and `aventure apprentissage/`. Read `$ARGUMENTS` to identify which game, then follow the matching section below.

**CRITICAL**: Never mix file paths between games.

---

# Plan a Wave Assault Feature

You are planning a change to a browser-based wave shooter. Produce a detailed implementation plan WITHOUT writing any code yet.

## Step 1: Understand the request

Read `$ARGUMENTS` and identify:
- What gameplay behaviour changes
- What new state is needed
- What visual changes are needed
- Whether it affects 1P, 2P, or both
- Whether it affects one theme or all themes

## Step 2: Read relevant code

Use the file routing table to read ONLY the files you need:

| Area | File |
|------|------|
| Tuning constants | `wave-assault/js/config.js` |
| Game state shape | `wave-assault/js/state.js` |
| Entity factories | `wave-assault/js/entities.js` |
| Core game logic | `wave-assault/js/game.js` |
| Theme constants + sprite cache | `wave-assault/js/render-sprites.js` |
| Background rendering | `wave-assault/js/render-background.js` |
| Entity rendering | `wave-assault/js/render-entities.js` |
| Effects rendering | `wave-assault/js/render-effects.js` |
| Render orchestrator | `wave-assault/js/render.js` |
| HUD & UI | `wave-assault/js/ui.js` + `wave-assault/index.html` |
| Game lifecycle | `wave-assault/js/main.js` |
| Camera/pose | `wave-assault/js/webcam.js` |
| Audio | `wave-assault/js/audio.js` |
| Styling | `wave-assault/styles.css` |

## Step 3: Write the plan

Output a structured plan with these sections:

### Context
1-2 sentences on what exists today and what needs to change.

### Changes
For each file that needs modification, list:
- **File**: path
- **Function/section**: which function or block
- **What changes**: specific description of the edit
- **New state** (if any): field name, type, initial value, where it resets

### Files Modified
Summary table: `| File | Changes |`

### Verification
Numbered checklist of how to manually test the feature works correctly.

## Rules
- Do NOT write code — only describe changes
- Be specific about function names and line locations
- Call out any per-player, per-theme, or per-control-mode considerations
- Flag if new state needs to be reset in `wave-assault/js/main.js:startGame()` (it almost always does)
- Flag if HUD elements need to be added to `wave-assault/index.html`

---

# Plan a Sonic Half-Pipe Feature

You are planning a change to a Three.js 3D half-pipe runner. Produce a detailed implementation plan WITHOUT writing any code yet.

## Step 1: Understand the request

Read `$ARGUMENTS` and identify:
- What gameplay behaviour changes
- What new state is needed
- What visual changes are needed (meshes, materials, particles)
- Whether it affects 1P, 2P, or both
- Whether it affects the default theme, unicorn theme, or both

## Step 2: Read relevant code

Use the file routing table to read ONLY the files you need:

| Area | File |
|------|------|
| Tuning constants | `sonic-halfpipe/js/config.js` |
| Game state shape | `sonic-halfpipe/js/state.js` |
| Core game logic | `sonic-halfpipe/js/game.js` |
| Render orchestrator + RENDER_THEME | `sonic-halfpipe/js/render.js` |
| Pipe geometry | `sonic-halfpipe/js/render-pipe.js` |
| Player meshes | `sonic-halfpipe/js/render-player.js` |
| Unicorn theme meshes | `sonic-halfpipe/js/render-theme-unicorn.js` |
| Obstacle meshes | `sonic-halfpipe/js/render-obstacles.js` |
| Ring meshes | `sonic-halfpipe/js/render-rings.js` |
| Particle meshes | `sonic-halfpipe/js/render-particles.js` |
| HUD & UI | `sonic-halfpipe/js/ui.js` + `sonic-halfpipe/index.html` |
| Game lifecycle | `sonic-halfpipe/js/main.js` |
| Keyboard input | `sonic-halfpipe/js/input.js` |
| Gesture detection | `sonic-halfpipe/js/webcam-gestures.js` |
| Player registration | `sonic-halfpipe/js/webcam-registration.js` |
| Webcam init | `sonic-halfpipe/js/webcam-core.js` |
| Audio | `sonic-halfpipe/js/audio.js` |
| High scores | `sonic-halfpipe/js/state.js` |
| Styling | `sonic-halfpipe/styles.css` |

## Step 3: Write the plan

Output a structured plan with these sections:

### Context
1-2 sentences on what exists today and what needs to change.

### Changes
For each file that needs modification, list:
- **File**: path
- **Function/section**: which function or block
- **What changes**: specific description of the edit
- **New state** (if any): field name, type, initial value, where it resets

### Files Modified
Summary table: `| File | Changes |`

### Verification
Numbered checklist of how to manually test the feature works correctly.

## Rules
- Do NOT write code — only describe changes
- Be specific about function names and Three.js object types
- Call out whether changes need to apply to both default and unicorn themes
- Flag if new state needs to be reset in `sonic-halfpipe/js/main.js:startGame()` (it almost always does)
- Flag if HUD elements need to be added to `sonic-halfpipe/index.html`
- Flag if new Three.js meshes need to be removed from the scene on reset (`clearSceneItems()` in render.js)
- Script load order: config → state → audio → input → webcam-core → webcam-color → webcam-gestures → webcam-registration → webcam-pose → game → render → render-pipe → render-theme-unicorn → render-player → render-obstacles → render-rings → render-particles → ui → main

---

# Plan a Licorne RPG Feature

You are planning a change to a Canvas 2D educational RPG. Produce a detailed implementation plan WITHOUT writing any code yet.

## Step 1: Understand the request

Read `$ARGUMENTS` and identify:
- What gameplay or educational behaviour changes
- What new state is needed (level, profile, or session data)
- What new UI screens or overlays are needed
- Whether it affects challenge types (lecture / calcul / anglais) or all
- Whether it affects the RPG progression system (XP, cosmetics, stats)
- Whether it requires speech input/output changes

## Step 2: Read relevant code

Use the file routing table to read ONLY the files you need:

| Area | File |
|------|------|
| Tuning constants + challenge data | `aventure apprentissage/js/config.js` |
| Game state shape | `aventure apprentissage/js/state.js` |
| Save / load | `aventure apprentissage/js/save.js` |
| Speech recognition + TTS | `aventure apprentissage/js/speech.js` |
| Challenge logic | `aventure apprentissage/js/challenges.js` |
| RPG / XP / cosmetics | `aventure apprentissage/js/rpg.js` |
| World rendering | `aventure apprentissage/js/world.js` |
| UI screens / overlays | `aventure apprentissage/js/ui.js` + `aventure apprentissage/index.html` |
| Game lifecycle + movement | `aventure apprentissage/js/main.js` |
| Keyboard input | `aventure apprentissage/js/input.js` |
| Camera gestures | `aventure apprentissage/js/webcam-gestures.js` |
| Styling | `aventure apprentissage/styles.css` |

## Step 3: Write the plan

Output a structured plan with these sections:

### Context
1-2 sentences on what exists today and what needs to change.

### Changes
For each file that needs modification, list:
- **File**: path
- **Function/section**: which function or block
- **What changes**: specific description of the edit
- **New state** (if any): field name, type, initial value, where it resets

### Files Modified
Summary table: `| File | Changes |`

### Verification
Numbered checklist of how to manually test the feature works correctly.

## Rules
- Do NOT write code — only describe changes
- Be specific about function names and data flow
- Call out if walkable zone changes risk creating gaps (margin must stay 0 in `_isWalkable`)
- Flag if new state needs to be reset in `main.js:_resetLevelState()` or `startGame()`
- Flag if challenge type routing in `challenges.js:_buildChallengeData` needs updating
- Flag if new UI HTML elements need to be added to `aventure apprentissage/index.html`
- Flag if the speech language needs to change (`'fr-FR'` vs `'en-US'`)
- Flag if `rpgSystem.addXP` or `checkUnlocks` needs updating for new skill/stat types
- Script load order: config → state → save → speech → input → webcam-core → webcam-gestures → rpg → challenges → world → ui → main
