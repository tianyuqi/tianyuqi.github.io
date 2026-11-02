Personal website made in conjunction with Claude Code and Codex.

Hex Pairs is a client-side React + TypeScript puzzle at **https://tianyuqi.github.io/hex-pairs/**. The existing website remains static HTML; the game has its own styles and assets.

- `npm ci` installs dependencies (Node 24).
- `npm run dev` serves the game at http://localhost:5173/hex-pairs/.
- `npm test` runs all games’ tests, including Hex Pairs solver, generation, adjacency, completion, history, and settings tests.
- `npm run build` type-checks the app and assembles the complete website in `_site/`.
- `npm run preview` previews the production game at http://localhost:4173/hex-pairs/. To preview the entire site, serve `_site/` with any static HTTP server.

Choose Addition with 1–3 digit numbers or Multiplication with Easy, Medium, and Hard levels. Multiplication uses factor-rich targets from 24 to 120 and positive factors up to 24. Easy has no competing matches; Medium has 1–2 and Hard has 3 legal matches outside the unique solution. Operation, addition digit range, and multiplication difficulty persist independently.

The seeded generator constructs candidate boards from edge matchings, then uses a backtracking solver to reject boards unless they have exactly one solution. Hints solve the remaining board with current pairs locked. Settings persist locally; each visit starts a fresh puzzle.

To deploy, select **GitHub Actions** under the repository’s **Settings → Pages → Build and deployment → Source**, then merge to `main` (or run the “Build and deploy website” workflow). The workflow tests and builds all four games, copies all existing site pages, assets, posts, and PDFs unchanged, and deploys `_site/` with the games under `/hex-pairs/`, `/estimathon/`, `/homebuyer/`, and `/number-hunt/`. Pull requests build and test without deploying. No backend, API keys, or custom domain changes are needed.

Estimathon is an entirely client-side estimation game at **https://tianyuqi.github.io/estimathon/**, also linked from Home and Projects. Players create or play exactly five questions, then share a score and challenge friends to the same questions.

- `npm run dev:estimathon` serves it at http://localhost:5173/estimathon/.
- `npm test -- estimathon/src` tests validation, exact scoring, compressed serialization, URL round-tripping, and challenge sharing.
- `npm run build` includes Estimathon in `_site/estimathon/`; serve `_site/` to check the complete production site.

Version 1 state is compact JSON compressed with bundled `lz-string` and escaped with `URLSearchParams` in `?d=`. Builder drafts, question position, player intervals, and challenge results reconstruct from the URL without browser storage. Edits replace the current URL after 250 ms; navigation pushes history entries. Share links include only the current participant, so challenges never accumulate a chain of results. Scores are recomputed with `BigInt`, with integer values kept as decimal strings (up to 100 digits). Question text is limited to 200 characters, titles to 60, and names to 30. Invalid, unsupported, or oversized links show a recovery screen; unusually long generated links show a warning.

Links contain correct answers in compressed form. Compression is **not encryption**; anyone who decodes a link can read them. Answers are visually hidden until submission or explicit spoiler confirmation. There is no backend, API, account, or external persistence.

SF Home Buying Game is a static React + TypeScript app at `/homebuyer/`. Players bid on ten seeded homes with ten active seconds per home, then share a compressed challenge and compare results. The app uses no player storage or external gameplay API.

**Playable demo:** until the supplied `listing_data.csv` is imported, the app plays ten seeded homes from the existing 20-home synthetic fixture. The game and shared results label these as simulated homes. Demo links use `d=simulated-test-20` and remain playable after real sales are published. See [the import and versioning guide](homebuyer/data/README.md) for normalization, polygon provenance, immutable releases, and the share format.

- `npm run dev:homebuyer` serves the game at http://localhost:5173/homebuyer/.
- `npm run data:homebuyer -- /path/to/listing_data.csv 2026-11` publishes the first real dataset (default inclusive $5M cutoff).
- `npm test -- homebuyer/src` checks exact scoring, active-time deadlines, sampling, and sharing.
- `npm run test:homebuyer-data` checks CSV normalization, polygon lookup, deduplication, and immutable publication.
- `npm run build` includes the game and versioned JSON in `_site/homebuyer/` for the existing Pages workflow.

Number Search is a mobile-first timed arithmetic game at **https://tianyuqi.github.io/number-hunt/**, linked from Projects.

- `npm run dev:number-hunt` serves it at http://localhost:5173/number-hunt/.
- `npm test -- number-hunt/src` checks all operation combinations across six preset/rule combinations, distribution, expression validity, timer resets, URL validation, and refresh recovery.
- `npm run build` publishes it to `_site/number-hunt/` with the existing Pages workflow.

Clear nine 9s, eight 8s, down through one 1, then five 0s. Choose settings and read the instructions on the setup screen. Press Start game to open the dedicated play screen and start the clock; every correct answer resets it to the preset's starting time, and wrong taps cost time. Easy starts at 90s (−1s per wrong tap), Normal at 30s (−2s), and Hard at 20s (−3s). Choose any combination of addition, subtraction, multiplication, and division independently of the pace. At least one operation must stay selected; a single operation may repeat expressions so every target remains solvable. Exact answers are the default; Last digit accepts nonnegative integer results with the matching units digit. Shared boards preserve the selected operations. Tuning and operand limits are in `number-hunt/src/game.ts`.

Version 1 concrete boards use compact `[left, operator, right, hiddenDigit]` tuples compressed with bundled `lz-string.compressToEncodedURIComponent` in `?g=`. Validation bounds both encoded and expanded data and checks every expression and the complete digit distribution. Typical full URLs are well below 2,000 characters. Compression is **not encryption**: a decoded URL exposes the board answers. Shares contain the complete puzzle and a fresh timer, never transient run state. Copy result adds an emoji stage summary without listing answers; native sharing is available on supported browsers, with manual copy fallback.

The most recent run is saved locally under its exact board payload. Refresh restores that run, counting all real elapsed time, including time spent away. Opening an unseen shared board starts fresh; revisiting the current board can resume its local run. Restart resets the identical board; New game and setting changes create a new board and URL. Storage is optional and no backend is required. Keyboard players can Tab to the board, move with arrows/Home/End, and select with Enter/Space. Feedback is announced, and reduced-motion preferences suppress tile animation.
