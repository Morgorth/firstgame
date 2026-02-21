# Morgorth Games

A browser-based monorepo hosting multiple games built with vanilla Canvas 2D,
Three.js, and Phaser 3. Open `index.html` at the root to reach the game
selection menu.

## Repository structure

```
firstgame/
├── index.html              ← Game selection menu (root entry point)
├── styles.css              ← Menu styles only
├── README.md
│
├── wave-assault/           ← Wave Assault game (vanilla Canvas 2D)
│   ├── index.html
│   ├── styles.css
│   ├── js/
│   │   ├── audio.js
│   │   ├── config.js
│   │   ├── entities.js
│   │   ├── game.js
│   │   ├── input.js
│   │   ├── main.js
│   │   ├── render-background.js
│   │   ├── render-effects.js
│   │   ├── render-entities.js
│   │   ├── render-sprites.js
│   │   ├── render-theme-dragon.js
│   │   ├── render-theme-pacificrim.js
│   │   ├── render-theme-space.js
│   │   ├── render-theme-unicorn.js
│   │   ├── render.js
│   │   ├── state.js
│   │   ├── ui.js
│   │   └── webcam.js
│   └── tests/
│
└── shared/                 ← Code shared across games (future use)
    ├── js/                 ← audio.js, webcam.js, input.js candidates
    └── assets/
        ├── sounds/
        └── fonts/
```

## Games

| Game | Folder | Tech | Status |
|------|--------|------|--------|
| Wave Assault | `wave-assault/` | Vanilla Canvas 2D | Playable |
| 3D Void Runner | _(planned)_ | Three.js | Coming soon |
| Dungeon Crawler | _(planned)_ | Phaser 3 | Coming soon |

## Adding a new game

1. **Create a game folder** at the repo root, e.g. `my-new-game/`.
2. **Add an `index.html`** inside it. Reference game-local assets with relative
   paths (`js/`, `assets/`, etc.).
3. **Import shared utilities** from the parent directory where applicable:
   ```html
   <script src="../shared/js/audio.js"></script>
   ```
4. **Add a card** to the root `index.html` inside the `.game-grid` section,
   following the pattern of the Wave Assault card. Change the `href` to
   `my-new-game/index.html` and set the badge class to `badge-playable`.
5. **Commit** your new folder and the updated root `index.html`.

## Running locally

Any static file server works. For example:

```bash
# Python 3
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Then open `http://localhost:8080` in your browser.
