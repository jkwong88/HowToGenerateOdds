# How To Open Odds

## Goal

Teach how a sportsbook's football odds — see [bookie_example.png](bookie_example.png) — are derived from raw match data, as a sequence of self-checking HTML exercises.

The reference materials [Football Probability_Jiankun.xlsx](Football%20Probability_Jiankun.xlsx) and [Point 0.25 & 0.75 calculation.pptx](Point%200.25%20%26%200.75%20calculation.pptx) were the starting inspiration and worked-math source, but the HTML exercises are not a 1:1 port of either — they cover **Correct Score, Odd/Even, 1X2, Double Chance, Total Goal, Over/Under, HDP (including a simple spread on Over/Under and HDP)**. Markets shown in bookie_example.png that aren't built here: First Half markets and live/in-play odds decay.

- Tech stack: plain HTML/CSS/JS, no build step for development.
- Source layout: each page lives in `pages/`, referencing shared `css/` and `js/` files — this keeps the source editable and reusable across pages.
- Sharing a single page: run `node scripts/build.js` to inline every page's linked CSS/JS/images into a self-contained file under `dist/` (e.g. `pages/historical-match-data.html` → `dist/historical-match-data.html`). Share the file from `dist/`, not the one under `pages/`.
- Sharing the whole site as one file: run `node scripts/build-single-file.js` to produce `dist/how-to-open-odds-single-file.html` - a single file with every page and its full navigation (sidebar, prev/next, Reset All) working, safe to move/email/upload anywhere. It works by embedding each page (via `build.js`'s inlining) as an `<iframe srcdoc>` the shell swaps on navigation, rather than merging every page's markup and JS into one document - the market-specific scripts all reuse names like `CATEGORY_CLASS`/`checkAllCells`, which only works because each page still runs in its own script scope.
- All code, comments, and strings in this folder must be written in English.

## Project structure

```
index.html                                   landing page listing exercises
pages/introduction.html                      1. Introduction
pages/generate-final-score-matrix.html       2. overview
pages/historical-match-data.html             2.1 source (links css/js by relative path)
pages/final-score-probability-matrix.html    2.2 source
pages/market-types-overview.html             3. overview
pages/correct-score-odds.html                3.1 source
pages/odd-even-market.html                   3.2 source
pages/1x2-double-chance-market.html          3.3 source
pages/total-goal-market.html                 3.4 source
pages/over-under-market.html                 3.5 source
pages/hdp-market.html                        3.6 source
pages/opening-market.html                    4. overview
pages/opening-over-under-market.html         4.1 source (Over/Under and Handicap, toggled)
pages/adding-a-spread.html                   4.2 source (Over/Under and Handicap, toggled)
pages/poisson-distribution.html              5. source
css/style.css                                shared styles
js/data.js                                   shared fixed dataset + all shared probability/odds math (see below)
js/exercise-common.js                        shared exercise mechanics (see below)
js/nav.js                                    renders the exercise index, page footer (Reset All + prev/next arrows) and page manifest (PAGE_SECTIONS / PAGES)
js/historical-match-data.js                  2.1-specific table building and wiring
js/final-score-probability-matrix.js         2.2-specific table building and wiring
js/correct-score-odds.js                     3.1-specific table building and wiring
js/odd-even-market.js                        3.2-specific table building and wiring
js/1x2-double-chance-market.js               3.3-specific table building and wiring
js/total-goal-market.js                      3.4-specific table building and wiring
js/over-under-market.js                      3.5-specific table building and wiring
js/hdp-market.js                             3.6-specific table building and wiring
js/opening-over-under-market.js              4.1-specific table building and wiring (Over/Under + Handicap)
js/adding-a-spread.js                        4.2-specific table building and wiring (Over/Under + Handicap)
js/poisson-distribution.js                   5-specific dynamic tables/values (Poisson PMF, λ, comparison chart)
scripts/build.js                             bundler: inlines css/js/images into dist/*.html for sharing
scripts/build-single-file.js                 bundles every page into one dist/how-to-open-odds-single-file.html
dist/                                        generated, self-contained HTML files (git-ignore or regenerate as needed)
```

## The exercises

All pages share one fixed 10-match dataset (`MATCH_HISTORY` in `js/data.js`) so the numbers stay consistent end to end.

- **2. How To Generate Final Score Probability Matrix** ([pages/generate-final-score-matrix.html](pages/generate-final-score-matrix.html)) — why the matrix matters, and what 2.1/2.2 each build toward it.
  - **2.1** ([pages/historical-match-data.html](pages/historical-match-data.html)) — three gated parts, each unlocked by passing a Check on the previous one: Part 1 shows the raw 10-match history (Home/Away goals) as given data; Part 2 is a COUNTIF-style Home/Away goal-count frequency table (0-6 goals); Part 3 converts those counts into probabilities (count / 10).
  - **2.2** ([pages/final-score-probability-matrix.html](pages/final-score-probability-matrix.html)) — takes Part 3's Home/Away probabilities as given, and builds the Home×Away joint matrix `P(home=h, away=a) = P(home=h) * P(away=a)` over goals 0-4 (`MATRIX_GOAL_VALUES`). Only the 3×3 core (Home ≤ 2, Away ≤ 2) is a fill-in exercise; the rest of the grid reveals once the core checks out.
- **3. Odds For Different Market Type** ([pages/market-types-overview.html](pages/market-types-overview.html)) — the given matrix every market in this section starts from, settlement logic (which scorelines make a bet win, and which don't settle cleanly), and the shared odds conversion chain.
  - **3.1 Correct Score** ([pages/correct-score-odds.html](pages/correct-score-odds.html)) — carries the matrix over as given data, then builds a Correct Score board (0:0 … 4:4, plus AOS) split into three sub-tables by Home value. Only the Away = 0 column is the exercise; passing it reveals the rest. Each scoreline converts True Probability → Euro → HK → Malay.
  - **3.2 Odd / Even** ([pages/odd-even-market.html](pages/odd-even-market.html)) — the matrix cells become click targets: paint every Odd-total cell, then every Even-total cell (two ungraded steps), then Check verifies the whole grid at once (right/wrong cells get a green/red background). Passing unlocks an Odd/Even True Odds table (Probability → Euro → HK → Malay).
  - **3.3 1X2 & Double Chance** ([pages/1x2-double-chance-market.html](pages/1x2-double-chance-market.html)) — Part 1 (1X2): paint every cell Home/Draw/Away, then Check verifies the grid and unlocks a 1X2 True Odds table (Probability → Euro Odds only - no HK/Malay for this market). Passing that table's Check unlocks Part 2 (Double Chance): fill in the Probability for 1X/12/X2 by summing the matching pair of 1X2 probabilities; Euro Odds is a pure derived value that reveals once Probability checks out (see [ADR 0001](docs/adr/0001-merge-1x2-and-double-chance.md)).
  - **3.4 Total Goal** ([pages/total-goal-market.html](pages/total-goal-market.html)) — the matrix cells become click targets across four fixed buckets from `bookie_example.png` (0~1 / 2~3 / 4~6 / 7 & Over), then Check verifies the whole grid and unlocks a Total Goal True Odds table (Probability → Euro Odds only - no HK/Malay for this market).
  - **3.5 Over / Under** ([pages/over-under-market.html](pages/over-under-market.html)) — a Point dropdown (2, 2.25, 2.5, 2.75) changes the classification: a whole-number point has 3 categories (Under/Draw/Over, Draw being a real push), a `.25`/`.75` point also has 3 (Under/Half Lose or Half Win/Over, per the reference slides' EV derivation), and a `.5` point has only 2 (Under/Over, no push possible). The BetTeam conversion table only ever lists Under/Over, since a push or a half win/lose isn't itself bettable.
  - **3.6 HDP** ([pages/hdp-market.html](pages/hdp-market.html)) — a Line dropdown (-1 to +1 in quarter-point steps, standard Asian Handicap sign) reuses Over/Under's exact point-type math, just classifying Home − Away instead of Home + Away (see [ADR 0002](docs/adr/0002-generalize-point-type-math-for-hdp.md)). Paint every cell Away Covers / Push-or-half / Home Covers, then Check unlocks an HDP True Odds table.
- **4. Opening Market** ([pages/opening-market.html](pages/opening-market.html)) — explains what "opening" a market means (choosing a specific line from everything section 3 makes possible) and how it gets priced once quoted.
  - **4.1 Opening the Market** ([pages/opening-over-under-market.html](pages/opening-over-under-market.html)) — a Market dropdown toggles between Over/Under (sweeping points 0.5–4) and Handicap (sweeping lines -2 to 2, both in quarter-point steps), reusing the same sweep-and-pick-the-fairest-market mechanic either way (see [ADR 0003](docs/adr/0003-extend-opening-market-with-market-type-toggle.md)). The exercise: pick the 1, 2, or 3 point(s)/line(s) (a "Markets" dropdown) whose two BetTeam probabilities are closest to 50/50 — the bookmaker's natural opening line(s).
  - **4.2 Adding a Spread** ([pages/adding-a-spread.html](pages/adding-a-spread.html)) — same Market toggle as 4.1; takes a fixed main market (Over/Under point 2.75, or Handicap line -0.25 — the fairest line for this dataset) and asks the user to fill in a second row: a 0.10 spread applied to the fair Malay odds (half off each side), from which HK, Euro, and the resulting (now merely *implied*, margin-inclusive) Probability are derived. The spread only ever shifts the price, never the line.
- **5. Relationship between Poisson and Probability** ([pages/poisson-distribution.html](pages/poisson-distribution.html)) — recaps the historical/empirical method from section 2, shows its small-sample limitation (e.g. 0% for a goal count that just never happened in 10 matches), introduces the Poisson PMF `P(X=k) = e^-λ × λ^k / k!` with λ = expected goals, compares historical vs Poisson probabilities for Home goals side by side, and shows that Poisson only changes how the Home/Away goal probabilities are estimated — the matrix/market/odds pipeline from sections 2&ndash;4 is unchanged. All numbers are computed live from `MATCH_HISTORY`, not hardcoded.

## Shared probability/odds math (`js/data.js`)

- `computeGoalStats()` — averages and COUNTIF-style counts/probabilities for Home, Away, and Total goals from `MATCH_HISTORY`.
- `matrixExpected(expected, home, away)` — joint scoreline probability, assuming Home/Away are independent.
- `getPointType` / `hasMiddleCategory` / `middleWeight` / `classifyTotal` / `primaryBetTeamKey` / `ouBetTeamProbability` — the point-type-aware (integer / half / quarter) classification and bettable-probability math shared by 3.5, 3.6, 4.1, and 4.2. Sign-safe (`getPointType`/`primaryBetTeamKey` work for negative points too), so 3.6's Home − Away axis reuses them unchanged (see [ADR 0002](docs/adr/0002-generalize-point-type-math-for-hdp.md)).
- `computeCategoryProbabilities(expected, point, axisValue)` — generic Under/Middle/Over split, parameterized by axis; `computeHDPCategoryProbabilities` (Home − Away) is a thin wrapper over it, and 4.1/4.2 call it directly with either axis via `MARKET_AXIS_CONFIGS`.
- `betTeamProbabilityFromStats(stats, point, key)` / `getCategories` / `pivotForDisplay` / `getMiddleActionLabel(point, integerLabel)` / `getMiddleLabel(point, integerLabel, sideLabels)` — the category-list/label/BetTeam-adapter helpers shared by 3.5 and 3.6. A quarter point's pivot settles the two bettable sides *oppositely* (one's Half Lose, the other's Half Win), so `getMiddleLabel` names both (e.g. "Over: Half Lose / Under: Half Win") for display; `getMiddleActionLabel` stays a single neutral word ("Middle") for the paint button, which doesn't belong to either side.
- `hdpLineToPoint(line)` / `MARKET_AXIS_CONFIGS` — the Asian-Handicap sign flip and the shared Over/Under-vs-Handicap axis config, so 3.6, 4.1, and 4.2 all derive the Home − Away axis the same way instead of three separate copies.
- `isUndefinedOdds` / `toEuro` / `toHK` / `toMalay` / `malayToHK` — the odds conversion chain (True Probability ⇄ Euro ⇄ HK ⇄ Malay), including the sign-based inverse used by 4.2's spread.
- `normalizeMalay(malay)` — real Malay odds are always quoted with `|Malay| ≤ 1`; 4.2's spread (the only place doing arithmetic directly on an already-converted Malay) can push it past that, so this re-expresses it in valid notation before it's shown or converted further.

## Shared exercise mechanics (`js/exercise-common.js`)

- **Formula-hover tooltips**: an empty input shows its `data-formula` on hover (to the right of the cell), toggled globally by "Formula Hover: On/Off".
- **Cross-cell highlighting**: `data-cell` / `data-refs` let a formula's hover also highlight (or, on exercises 4/5, fade) the source cell(s) it depends on.
- **Answer checking**: `markInput(input, expected, tolerance, decimals)` marks a cell correct/incorrect within a tolerance.
- **Section gating**: `lockSection` / `unlockSection` disable/enable a part's inputs and buttons until a prior part is solved.
- **Matrix classifier**: `createMatrixClassifier({idPrefix, expected, categoryClass})` builds a Home x Away click-to-paint grid and returns `wireClicks`/`checkAll`/`fillAll`/`reset`/`computeStats` - shared by every exercise that classifies scorelines into categories (3.2, 3.3, 3.4, 3.5, 3.6), instead of each hand-rolling the same paint/verify/reset loop.
- **Dim-complement hover**: `attachDimComplement(inputId, key, getStats, getCategories)` fades the *other* categories' matrix cells while hovering a probability formula - shared by the same five exercises.
- **Simple odds table**: `buildSimpleOddsTable` / `checkSimpleOddsTable` / `fillSimpleOddsTable` build/check/fill a plain Probability -> Euro (-> HK -> Malay) table with no push/half-win exclusion - shared by 3.2, 3.3, and 3.4. The `includeHkMalay` option (default `true`) drops the HK/Malay columns entirely; only 3.2 Odd/Even uses the default, since 3.1, 3.3, and 3.4 only ever show Euro Odds. Over/Under and HDP (3.5, 3.6) still build their own push-aware True-Probability + BetTeam table, since that logic is more involved and only duplicated twice.
