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
pages/historical-match-data.html             exercise 1 source (links css/js by relative path)
pages/final-score-probability-matrix.html    exercise 2 source
pages/correct-score-odds.html                exercise 3 source
pages/odd-even-market.html                   exercise 4 source
pages/over-under-market.html                 exercise 5 source
pages/opening-over-under-market.html         exercise 6 source
pages/adding-a-spread.html                   exercise 7 source
css/style.css                                shared styles
js/data.js                                   shared fixed dataset + all shared probability/odds math (see below)
js/exercise-common.js                        shared exercise mechanics (see below)
js/nav.js                                    renders the exercise index, page footer (Reset All + prev/next arrows) and page manifest (PAGES)
js/historical-match-data.js                  exercise 1-specific table building and wiring
js/final-score-probability-matrix.js         exercise 2-specific table building and wiring
js/correct-score-odds.js                     exercise 3-specific table building and wiring
js/odd-even-market.js                        exercise 4-specific table building and wiring
js/over-under-market.js                      exercise 5-specific table building and wiring
js/opening-over-under-market.js              exercise 6-specific table building and wiring
js/adding-a-spread.js                        exercise 7-specific table building and wiring
scripts/build.js                             bundler: inlines css/js into dist/*.html for sharing
dist/                                        generated, self-contained HTML files (git-ignore or regenerate as needed)
```

## The exercises

All seven pages share one fixed 10-match dataset (`MATCH_HISTORY` in `js/data.js`) so the numbers stay consistent end to end.

1. **Historical Match Data** ([pages/historical-match-data.html](pages/historical-match-data.html)) — three gated parts, each unlocked by passing a Check on the previous one: Part 1 fills in each match's Total Score and the Home/Away/Total averages; Part 2 is a COUNTIF-style goal-count frequency table (0-6 goals); Part 3 converts those counts into probabilities (count / 10).
2. **Final Score Probability Matrix** ([pages/final-score-probability-matrix.html](pages/final-score-probability-matrix.html)) — takes Part 3's Home/Away probabilities as given, and builds the Home×Away joint matrix `P(home=h, away=a) = P(home=h) * P(away=a)` over goals 0-4 (`MATRIX_GOAL_VALUES`). Only the 3×3 core (Home ≤ 2, Away ≤ 2) is a fill-in exercise; the rest of the grid reveals once the core checks out.
3. **Correct Score & Odds** ([pages/correct-score-odds.html](pages/correct-score-odds.html)) — carries the matrix over as given data, then builds a Correct Score board (0:0 … 4:4, plus AOS) split into three sub-tables by Home value. Only the Away = 0 column is the exercise; passing it reveals the rest. Each scoreline converts True Probability → Euro → HK → Malay.
4. **Odd / Even Market** ([pages/odd-even-market.html](pages/odd-even-market.html)) — the matrix cells become click targets: paint every Odd-total cell, then every Even-total cell (two ungraded steps), then Check verifies the whole grid at once (right/wrong cells get a green/red background). Passing unlocks an Odd/Even True Odds table (Probability → Euro → HK → Malay).
5. **Over / Under Market** ([pages/over-under-market.html](pages/over-under-market.html)) — a Point dropdown (2, 2.25, 2.5, 2.75) changes the classification: a whole-number point has 3 categories (Under/Draw/Over, Draw being a real push), a `.25`/`.75` point also has 3 (Under/Half Lose or Half Win/Over, per the reference slides' EV derivation), and a `.5` point has only 2 (Under/Over, no push possible). The BetTeam conversion table only ever lists Under/Over, since a push or a half win/lose isn't itself bettable.
6. **Opening the Over / Under Market** ([pages/opening-over-under-market.html](pages/opening-over-under-market.html)) — a given reference table sweeping every point from 0.25 to 4 (16 rows) with Over/Under Probability, Euro, HK and Malay odds. The exercise: pick the 1, 2, or 3 point(s) (a "Markets" dropdown) whose Over probability sits closest to 50/50 — the bookmaker's natural opening line(s).
7. **Adding a Spread** ([pages/adding-a-spread.html](pages/adding-a-spread.html)) — takes the main market from exercise 6 (point 2.75) and asks the user to fill in a second row: a 0.10 spread applied to the fair Malay odds (half off each side), from which HK, Euro, and the resulting (now merely *implied*, margin-inclusive) Probability are derived.

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
