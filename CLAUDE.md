# CLAUDE.md — Morgorth Games

> Ce fichier est la source de vérité pour Claude Code dans ce repo.
> Quand Claude fait une erreur → ajouter une règle dans "Ne jamais faire".
> Terminer chaque correction par : *"Mets à jour le CLAUDE.md."*

---

## Vue d'ensemble

Monorepo de 3 jeux browser, tous vanilla JS, **aucun build step** :

| Dossier | Jeu | Moteur | Public |
|---------|-----|--------|--------|
| `wave-assault/` | Wave Assault — shooter 2D | Canvas 2D | tous |
| `sonic-halfpipe/` | Sonic Half-Pipe — runner 3D | Three.js | tous |
| `aventure apprentissage/` | Licorne RPG — RPG éducatif | Canvas 2D | enfants 6 ans |

`index.html` à la racine = menu de sélection des jeux.
Chaque jeu est **entièrement autonome** — dossier + assets + scripts propres.

## Lancer un jeu

Ouvrir `index.html` (racine) ou le `index.html` d'un jeu directement dans **Chrome**.
Chrome obligatoire : Web Speech API (Licorne RPG) + MoveNet webcam (tous les jeux).
Aucun serveur, aucune installation.

```sh
# sonic-halfpipe a des dépendances npm (pour les tests uniquement)
cd sonic-halfpipe && npm install
```

## Stack technique

- **Rendu** : Canvas 2D (wave-assault, aventure-apprentissage) ou Three.js (sonic-halfpipe)
- **Webcam / Pose** : TensorFlow.js + MoveNet — chargés via CDN dans chaque `index.html`
- **Voix** : Web Speech API native (fr-FR / en-US) — Licorne RPG seulement
- **Persistance** : localStorage
- **Pas de modules ES6** : tous les fichiers partagent des globaux (`var` / `const` top-level)
- **Pas de TypeScript** : JS pur, pas de types, pas de lint

## Pattern de code commun aux 3 jeux

```
index.html          ← charge les scripts dans l'ordre exact, structure DOM
styles.css          ← tout le CSS
js/config.js        ← CONFIG : constantes immuables
js/state.js         ← variables globales mutables partagées (gameState, webcamState…)
js/input.js         ← clavier
js/webcam-core.js   ← lifecycle caméra + MoveNet
js/webcam-gestures.js ← gestes spécifiques au jeu
js/game.js          ← logique principale
js/render*.js       ← rendu canvas (souvent découpé en sous-modules)
js/ui.js            ← écrans HTML overlays
js/main.js          ← bootstrap, game loop, window.load
```

**L'ordre de chargement des scripts dans `index.html` est critique.**
`config.js` → `state.js` → … → `main.js` (toujours en dernier).

## Skills — utiliser en priorité

Avant tout travail, invoquer le skill correspondant :

| Besoin | Skill |
|--------|-------|
| S'orienter dans le code | `/understand-app` |
| Modifier du code | `/modify-game` |
| Planifier une feature | `/plan-feature` |
| Débugger un bug | `/debug-issue` |

Les skills contiennent les file maps détaillés, les globals clés, et le routing tâche→fichier.
**Ne pas lire tout le codebase** — utiliser les skills pour cibler les bons fichiers.

## Boucle de vérification

Après chaque modification :

```sh
# 1. Tests sonic-halfpipe
cd sonic-halfpipe && node tests/run-tests.js

# 2. Vérification manuelle : ouvrir dans Chrome, confirmer que le jeu charge
# 3. Vérifier la console browser — 0 erreur JS au démarrage
```

Pour les features webcam/voix : tester avec une vraie caméra/micro dans Chrome.

## Règles — ne jamais faire

- **Aventure Apprentissage — zones walkables** : ne jamais appliquer de marge interne (`margin > 0`) dans `_isWalkable`. Les zones ROOMS et CORRIDORS se touchent bord à bord ; une marge positive crée des trous de `margin*2` px à chaque jonction, bloquant le joueur devant toutes les salles.

- **Ne jamais mélanger les fichiers entre jeux.** `wave-assault/js/game.js` et `sonic-halfpipe/js/game.js` sont deux fichiers distincts. Toujours confirmer quel jeu est concerné avant de lire ou modifier.
- **Ne jamais ajouter `import` / `export`.** Tous les jeux utilisent des globaux. Introduire des modules ES6 casse tout.
- **Ne jamais ajouter un build step** (webpack, vite, esbuild…). Les jeux s'ouvrent directement dans le browser.
- **Ne jamais créer de fichiers supplémentaires** sans avoir discuté. Chaque jeu a une liste de fichiers définie. Vérifier avant d'en ajouter.
- **Ne jamais proposer de modifications sans avoir lu le fichier.** Lire d'abord, modifier ensuite.
- **Ne jamais éditer `index.html` racine** sans vérifier que les 3 cartes de jeux sont toujours présentes et pointent vers les bons chemins.
- **Ne pas confondre `CONFIG` entre jeux.** Chaque jeu a son propre objet `CONFIG` — ils ne sont pas partagés.

## Structure .claude

```
.claude/
  settings.json          ← SessionStart hook (npm install pour sonic-halfpipe)
  hooks/
    session-start.sh
  skills/
    understand-app/       ← /understand-app
    modify-game/          ← /modify-game
    plan-feature/         ← /plan-feature
    debug-issue/          ← /debug-issue
```

---

*Mis à jour : mars 2026*
