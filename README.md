Personal website made in conjunction with Claude Code and Codex.

Hex Pairs is a client-side React + TypeScript puzzle at **https://tianyuqi.github.io/hex-pairs/**. The existing website remains static HTML; the game has its own styles and assets.

- `npm ci` installs dependencies (Node 24).
- `npm run dev` serves the game at http://localhost:5173/hex-pairs/.
- `npm test` runs the solver, generation, adjacency, completion, history, and settings tests.
- `npm run build` type-checks the app and assembles the complete website in `_site/`.
- `npm run preview` previews the production game at http://localhost:4173/hex-pairs/. To preview the entire site, serve `_site/` with any static HTTP server.

Choose Addition with 1–3 digit numbers or Multiplication with Easy, Medium, and Hard levels. Multiplication uses factor-rich targets from 24 to 120 and positive factors up to 24. Easy has no competing matches; Medium has 1–2 and Hard has 3 legal matches outside the unique solution. Operation, addition digit range, and multiplication difficulty persist independently.

The seeded generator constructs candidate boards from edge matchings, then uses a backtracking solver to reject boards unless they have exactly one solution. Hints solve the remaining board with current pairs locked. Settings persist locally; each visit starts a fresh puzzle.

To deploy, select **GitHub Actions** under the repository’s **Settings → Pages → Build and deployment → Source**, then merge to `main` (or run the “Build and deploy website” workflow). The workflow tests and builds the game, copies all existing site pages, assets, posts, and PDFs unchanged, and deploys `_site/` with the game under `/hex-pairs/`. Pull requests build and test without deploying. No backend, API keys, or custom domain changes are needed.
