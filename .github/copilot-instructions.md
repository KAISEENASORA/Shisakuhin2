# Copilot Instructions

## Project shape

Skyfall Dodge is a dependency-free, static browser game. There is no package manager, build step, test framework, or linter configuration.

- `index.html` defines the page structure, HUD, game canvas, overlays, and controls.
- `styles.css` contains layout and visual styling, including responsive and short-screen overrides.
- `script.js` contains the complete game loop, input handling, collision detection, rendering, pause/restart flow, and persistent best score.

## Run and validation

Serve the repository root from the workspace:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

Check JavaScript syntax with:

```bash
node --check script.js
```

After starting the server, verify that the page and assets are reachable:

```bash
curl -sSf http://127.0.0.1:4173/ >/dev/null
curl -sSf http://127.0.0.1:4173/script.js >/dev/null
curl -sSf http://127.0.0.1:4173/styles.css >/dev/null
```

There is currently no automated test suite or individual test command.

## Architecture

The app initializes the canvas and DOM references in `script.js`, then uses `requestAnimationFrame` for one update/render loop:

1. `resize()` measures the canvas, applies the device pixel ratio, and keeps the player inside the play area.
2. `update(dt)` advances elapsed time and score, handles movement and obstacle spawning, updates difficulty, checks collisions, and expires particles.
3. `draw()` clears and redraws the playfield, obstacles, player, and particles.
4. `startGame()`, `togglePause()`, and `endGame()` control the lifecycle and overlay state.

The canvas coordinate system always follows the rendered CSS dimensions. Call `resize()` after viewport changes and preserve DPR-aware drawing through `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`.

The falling obstacle and particle data live in module-level arrays. Best score is persisted in `localStorage` under `skyfall-best`; score formatting is centralized in `formatScore()`.

## Conventions

- Keep input state in `keys.left` and `keys.right`; keyboard and touch controls both mutate this shared state.
- Use delta time in seconds for movement, spawning, and particle updates. Keep frame-rate-independent behavior by clamping large deltas in `gameLoop()`.
- Obstacles are objects with `x`, `y`, `w`, `h`, `speed`, `angle`, `spin`, and `type`.
- Movement and collision bounds are tied to `width` and `height`, not fixed pixels, so new rendering changes must remain responsive.
- UI state changes should stay synchronized with the overlay classes and `startButton` text used by `startGame()`, `togglePause()`, and `endGame()`.
- Preserve the existing visual tokens in `styles.css` (`--ink`, `--text`, `--accent`, `--danger`, and related variables).
