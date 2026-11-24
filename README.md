# TJJF 40th Anniversary Rhythm Game

Browser-first rhythm action prototype for the TJJF 40th anniversary grading game.

The v0.1 goal is a small vertical slice: one grading-room encounter where instructor callouts become rhythm inputs, successful timing produces evasions and throws, and failures produce light comedic hits. The project is built with Phaser, TypeScript, and Vite.

## Quick Start

```bash
npm install
npm run dev
```

## Current Shape

- `PROJECT_BRIEF.md` preserves the current concept from the referenced design conversation.
- `GAME_DESIGN.md` captures rules, visual direction, grades, characters, and v0.1 scope.
- `public/references/` contains placeholders for screenshots and concept references.
- `src/game/` contains the first playable scaffold: scenes, data, systems, and placeholder entities.

## Scripts

- `npm run dev` starts the local browser build.
- `npm run build` type-checks and builds the game.
- `npm run preview` serves the production build locally.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.
After pushing to GitHub, enable Pages with **GitHub Actions** as the source.

The Vite base path is inferred from the GitHub repository name. For this repo,
that should publish under `/jitsu-london-40-game/`. For a custom domain, set the
repository variable `VITE_BASE_PATH` to `/`.
