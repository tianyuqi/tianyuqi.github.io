Personal website made in conjunction with Claude Code and Codex.

Hex Pairs is a client-side React + TypeScript puzzle at **https://tianyuqi.github.io/hex-pairs/**. The existing website remains static HTML; the game has its own styles and assets.

- `npm ci` installs dependencies (Node 24).
- `npm run dev` serves the game at http://localhost:5173/hex-pairs/.
- `npm test` runs both games’ tests, including Hex Pairs solver, generation, adjacency, completion, history, and settings tests.
- `npm run build` type-checks the app and assembles the complete website in `_site/`.
- `npm run preview` previews the production game at http://localhost:4173/hex-pairs/. To preview the entire site, serve `_site/` with any static HTTP server.

Choose Addition with 1–3 digit numbers or Multiplication with Easy, Medium, and Hard levels. Multiplication uses factor-rich targets from 24 to 120 and positive factors up to 24. Easy has no competing matches; Medium has 1–2 and Hard has 3 legal matches outside the unique solution. Operation, addition digit range, and multiplication difficulty persist independently.

The seeded generator constructs candidate boards from edge matchings, then uses a backtracking solver to reject boards unless they have exactly one solution. Hints solve the remaining board with current pairs locked. Settings persist locally; each visit starts a fresh puzzle.

To deploy, select **GitHub Actions** under the repository’s **Settings → Pages → Build and deployment → Source**, then merge to `main` (or run the “Build and deploy website” workflow). The workflow tests and builds both games, copies all existing site pages, assets, posts, and PDFs unchanged, and deploys `_site/` with the games under `/hex-pairs/` and `/estimathon/`. Pull requests build and test without deploying. No backend, API keys, or custom domain changes are needed.

Estimathon is an entirely client-side estimation game at **https://tianyuqi.github.io/estimathon/**, also linked from Home and Projects. Players create or play exactly five questions, then share a score and challenge friends to the same questions.

- `npm run dev:estimathon` serves it at http://localhost:5173/estimathon/.
- `npm test -- estimathon/src` tests validation, exact scoring, compressed serialization, URL round-tripping, and challenge sharing.
- `npm run build` includes Estimathon in `_site/estimathon/`; serve `_site/` to check the complete production site.

Version 1 state is compact JSON compressed with bundled `lz-string` and escaped with `URLSearchParams` in `?d=`. Builder drafts, question position, player intervals, and challenge results reconstruct from the URL without browser storage. Edits replace the current URL after 250 ms; navigation pushes history entries. Share links include only the current participant, so challenges never accumulate a chain of results. Scores are recomputed with `BigInt`, with integer values kept as decimal strings (up to 100 digits). Question text is limited to 200 characters, titles to 60, and names to 30. Invalid, unsupported, or oversized links show a recovery screen; unusually long generated links show a warning.

Links contain correct answers in compressed form. Compression is **not encryption**; anyone who decodes a link can read them. Answers are visually hidden until submission or explicit spoiler confirmation. There is no backend, API, account, or external persistence.
