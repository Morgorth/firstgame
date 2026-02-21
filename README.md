# Morgorth Games

A monorepo of browser-based games.

## Structure

```
/
├── index.html          ← Game selection menu (start here)
├── styles.css          ← Menu styles
├── shared/
│   ├── js/             ← Shared modules (audio, webcam, input)
│   └── assets/         ← Shared fonts, sounds
└── wave-assault/       ← Wave shooter game (Canvas 2D)
    ├── index.html
    ├── styles.css
    └── js/
```

## Games

| Game | Stack | Status |
|------|-------|--------|
| [Wave Assault](wave-assault/) | Vanilla Canvas 2D | Playable |

## Adding a new game

1. Create a new folder at the repo root: `my-game/`
2. Add `my-game/index.html` and `my-game/js/`
3. Add a card to the root `index.html` game grid
4. Import from `../shared/js/` for audio, webcam, and input utilities
