# How To Open Odds

## Goal

Teach how a sportsbook's football odds — see [bookie_example.png](bookie_example.png) — are derived from raw match data, as a sequence of self-checking HTML exercises.

The reference materials [Football Probability_Jiankun.xlsx](Football%20Probability_Jiankun.xlsx) and [Point 0.25 & 0.75 calculation.pptx](Point%200.25%20%26%200.75%20calculation.pptx) were the starting inspiration and worked-math source, but the HTML exercises are not a 1:1 port of either — they cover **Correct Score, Odd/Even, and Over/Under (including a simple spread)**. Markets shown in bookie_example.png that aren't built here: HDP, 1X2, Double Chance, Total Goal buckets, First Half markets, and live/in-play odds decay.

- Tech stack: plain HTML/CSS/JS, no build step for development.
- Source layout: each page lives in `pages/`, referencing shared `css/` and `js/` files — this keeps the source editable and reusable across pages.
- Sharing a single file: run `node scripts/build.js` to inline every page's linked CSS/JS into a self-contained file under `dist/` (e.g. `pages/historical-match-data.html` → `dist/historical-match-data.html`). Share the file from `dist/`, not the one under `pages/`.
- All code, comments, and strings in this folder must be written in English.

## Project structure

```
index.html                                   landing page listing exercises
pages/introduction.html                      1. Introduction
pages/generate-final-score-matrix.html       2. overview (placeholder, no content yet)
pages/historical-match-data.html             2.1 source (links css/js by relative path)
pages/final-score-probability-matrix.html    2.2 source
pages/market-types-overview.html             3. overview (placeholder, no content yet)
pages/correct-score-odds.html                3.1 source
pages/odd-even-market.html                   3.2 source
pages/1x2-market.html                        3.3 source (placeholder, no content yet)
pages/double-chance-market.html              3.4 source (placeholder, no content yet)
pages/total-goal-market.html                 3.5 source (placeholder, no content yet)
pages/over-under-market.html                 3.6 source
pages/hdp-market.html                        3.7 source (placeholder, no content yet)
pages/opening-market.html                    4. overview (placeholder, no content yet)
pages/opening-over-under-market.html         4.1 source
pages/adding-a-spread.html                   4.2 source
pages/poisson-distribution.html              5. source (placeholder, no content yet)
css/style.css                                shared styles
js/data.js                                   shared fixed dataset + all shared probability/odds math (see below)
js/exercise-common.js                        shared exercise mechanics (see below)
js/nav.js                                    renders the exercise index, page footer (Reset All + prev/next arrows) and page manifest (PAGE_SECTIONS / PAGES)
js/historical-match-data.js                  2.1-specific table building and wiring
js/final-score-probability-matrix.js         2.2-specific table building and wiring
js/correct-score-odds.js                     3.1-specific table building and wiring
js/odd-even-market.js                        3.2-specific table building and wiring
js/over-under-market.js                      3.6-specific table building and wiring
js/opening-over-under-market.js              4.1-specific table building and wiring
js/adding-a-spread.js                        4.2-specific table building and wiring
scripts/build.js                             bundler: inlines css/js into dist/*.html for sharing
dist/                                        generated, self-contained HTML files (git-ignore or regenerate as needed)
```

## The exercises

All pages share one fixed 10-match dataset (`MATCH_HISTORY` in `js/data.js`) so the numbers stay consistent end to end. Sections 3.3, 3.4, 3.5, 3.7, and 5 are placeholders — wired into navigation but not yet implemented.

- **2. How To Generate Final Score Probability Matrix** ([pages/generate-final-score-matrix.html](pages/generate-final-score-matrix.html)) — placeholder.
  - **2.1** ([pages/historical-match-data.html](pages/historical-match-data.html)) — three gated parts, each unlocked by passing a Check on the previous one: Part 1 fills in each match's Total Score and the Home/Away/Total averages; Part 2 is a COUNTIF-style goal-count frequency table (0-6 goals); Part 3 converts those counts into probabilities (count / 10).
  - **2.2** ([pages/final-score-probability-matrix.html](pages/final-score-probability-matrix.html)) — takes Part 3's Home/Away probabilities as given, and builds the Home×Away joint matrix `P(home=h, away=a) = P(home=h) * P(away=a)` over goals 0-4 (`MATRIX_GOAL_VALUES`). Only the 3×3 core (Home ≤ 2, Away ≤ 2) is a fill-in exercise; the rest of the grid reveals once the core checks out.
- **3. Odds For Different Market Type** ([pages/market-types-overview.html](pages/market-types-overview.html)) — placeholder.
  - **3.1 Correct Score** ([pages/correct-score-odds.html](pages/correct-score-odds.html)) — carries the matrix over as given data, then builds a Correct Score board (0:0 … 4:4, plus AOS) split into three sub-tables by Home value. Only the Away = 0 column is the exercise; passing it reveals the rest. Each scoreline converts True Probability → Euro → HK → Malay.
  - **3.2 Odd / Even** ([pages/odd-even-market.html](pages/odd-even-market.html)) — the matrix cells become click targets: paint every Odd-total cell, then every Even-total cell (two ungraded steps), then Check verifies the whole grid at once (right/wrong cells get a green/red background). Passing unlocks an Odd/Even True Odds table (Probability → Euro → HK → Malay).
  - **3.3 1X2** ([pages/1x2-market.html](pages/1x2-market.html)) — placeholder.
  - **3.4 Double Chance** ([pages/double-chance-market.html](pages/double-chance-market.html)) — placeholder.
  - **3.5 Total Goal** ([pages/total-goal-market.html](pages/total-goal-market.html)) — placeholder.
  - **3.6 Over / Under** ([pages/over-under-market.html](pages/over-under-market.html)) — a Point dropdown (2, 2.25, 2.5, 2.75) changes the classification: a whole-number point has 3 categories (Under/Draw/Over, Draw being a real push), a `.25`/`.75` point also has 3 (Under/Half Lose or Half Win/Over, per the reference slides' EV derivation), and a `.5` point has only 2 (Under/Over, no push possible). The BetTeam conversion table only ever lists Under/Over, since a push or a half win/lose isn't itself bettable.
  - **3.7 HDP** ([pages/hdp-market.html](pages/hdp-market.html)) — placeholder.
- **4. Opening Market** ([pages/opening-market.html](pages/opening-market.html)) — placeholder.
  - **4.1** ([pages/opening-over-under-market.html](pages/opening-over-under-market.html)) — a given reference table sweeping every point from 0.25 to 4 (16 rows) with Over/Under Probability, Euro, HK and Malay odds. The exercise: pick the 1, 2, or 3 point(s) (a "Markets" dropdown) whose Over probability sits closest to 50/50 — the bookmaker's natural opening line(s).
  - **4.2 Adding a Spread** ([pages/adding-a-spread.html](pages/adding-a-spread.html)) — takes the main market from 4.1 (point 2.75) and asks the user to fill in a second row: a 0.10 spread applied to the fair Malay odds (half off each side), from which HK, Euro, and the resulting (now merely *implied*, margin-inclusive) Probability are derived.
- **5. Relationship between Poisson and Probability** ([pages/poisson-distribution.html](pages/poisson-distribution.html)) — placeholder.

## Shared probability/odds math (`js/data.js`)

- `computeGoalStats()` — averages and COUNTIF-style counts/probabilities for Home, Away, and Total goals from `MATCH_HISTORY`.
- `matrixExpected(expected, home, away)` — joint scoreline probability, assuming Home/Away are independent.
- `getPointType` / `hasMiddleCategory` / `middleWeight` / `classifyTotal` / `primaryBetTeamKey` / `computeOUCategoryProbabilities` / `ouBetTeamProbability` — the point-type-aware (integer / half / quarter) Over/Under classification and bettable-probability math shared by exercises 5, 6, and 7.
- `isUndefinedOdds` / `toEuro` / `toHK` / `toMalay` / `malayToHK` — the odds conversion chain (True Probability ⇄ Euro ⇄ HK ⇄ Malay), including the sign-based inverse used by exercise 7's spread.

## Shared exercise mechanics (`js/exercise-common.js`)

- **Formula-hover tooltips**: an empty input shows its `data-formula` on hover (to the right of the cell), toggled globally by "Formula Hover: On/Off".
- **Cross-cell highlighting**: `data-cell` / `data-refs` let a formula's hover also highlight (or, on exercises 4/5, fade) the source cell(s) it depends on.
- **Answer checking**: `markInput(input, expected, tolerance, decimals)` marks a cell correct/incorrect within a tolerance.
- **Section gating**: `lockSection` / `unlockSection` disable/enable a part's inputs and buttons until a prior part is solved.
