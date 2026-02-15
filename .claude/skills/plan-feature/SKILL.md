---
name: plan-feature
description: Use when planning a new feature or significant change to Wave Assault. Produces a structured implementation plan with exact file/function targets before any code is written.
allowed-tools: Read, Grep, Glob
argument-hint: "<feature-description>"
---

# Plan a Wave Assault Feature

You are planning a change to a browser-based wave shooter. Produce a detailed implementation plan WITHOUT writing any code yet.

## Step 1: Understand the request

Read `$ARGUMENTS` and identify:
- What gameplay behavior changes
- What new state is needed
- What visual changes are needed
- Whether it affects 1P, 2P, or both
- Whether it affects one theme or both

## Step 2: Read relevant code

Use the file routing table to read ONLY the files you need:

| Area | File |
|------|------|
| Tuning constants | `js/config.js` |
| Game state shape | `js/state.js` |
| Entity factories | `js/entities.js` |
| Core game logic | `js/game.js` |
| Rendering | `js/render.js` |
| HUD & UI | `js/ui.js` + `index.html` |
| Game lifecycle | `js/main.js` |
| Camera/pose | `js/webcam.js` |
| Audio | `js/audio.js` |
| Styling | `styles.css` |

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
- Flag if new state needs to be reset in `startGame()` (it almost always does)
- Flag if HUD elements need to be added to `index.html`
