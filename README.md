# How To Open Odds

## Goal

Teach how a sportsbook's football odds table — see [bookie_example.png](bookie_example.png) — is derived from raw match data, then reproduce the same calculations as a static HTML page.

The reference spreadsheet [Football Probability_Jiankun.xlsx](Football%20Probability_Jiankun.xlsx) already implements the math across separate sheets (one topic per tab). The HTML version covers the same math but is **not** a 1:1 port of the spreadsheet — sheet-by-sheet layout is an Excel convenience, not a requirement of the model itself.

- Tech stack: plain HTML/CSS/JS, no build step for development.
- Source layout: each page lives in `pages/`, referencing shared `css/` and `js/` files — this keeps the source editable and reusable across pages.
- Sharing a single file: run `node scripts/build.js` to inline every page's linked CSS/JS into a self-contained file under `dist/` (e.g. `pages/page1.html` → `dist/page1.html`). Share the file from `dist/`, not the one under `pages/`.
- All code, comments, and strings in this folder must be written in English.

## Project structure

```
index.html              landing page listing exercises
pages/page1.html         exercise 1 source (links css/js by relative path)
pages/page2.html         exercise 2 source
pages/page3.html         exercise 3 source
pages/page4.html         exercise 4 source
css/style.css            shared styles
js/data.js               shared fixed dataset + computeGoalStats()/matrixExpected() (counts/averages/probabilities/joint scoreline probability)
js/exercise-common.js    shared exercise mechanics: formula-hover tooltips, answer checking, section locking
js/nav.js                shared prev/next page arrows, driven by PAGE_ORDER
js/page1.js              page1-specific table building and wiring
js/page2.js              page2-specific table building and wiring
js/page3.js              page3-specific table building and wiring
js/page4.js              page4-specific table building and wiring
scripts/build.js         bundler: inlines css/js into dist/*.html for sharing
dist/                    generated, self-contained HTML files (git-ignore or regenerate as needed)
```

## What bookie_example.png actually shows

One row of a bookie's non-live board packs several independent bet markets, all derived from the **same** underlying home/away goal model:

| Section | Markets |
|---|---|
| Full Time | HDP (handicap), OU (over/under), 1X2 (home/draw/away), OE (odd/even total goals) |
| First Half | HDP, OU, 1X2 (same markets, computed on first-half-only goals) |
| Total Goal | Bucketed OU (0~1, 2~3, 4~6, 7 & over) |
| Double Chance | 1X, 12, X2 (combinations of 1X2) |
| Correct Score | Odds for each exact scoreline (0:0, 0:1, ... AOS = "any other score") |

Every price shown is a **true probability** ("fair odds") first, then adjusted by the bookmaker's margin (see [Margin and spread](#5-margin-and-spread-tor--spread-sheets)). This document focuses on getting the true probability right; the margin step is a separate, later multiplier.

## The underlying model

Everything in the spreadsheet reduces to one idea: model home goals and away goals as two Poisson-ish random variables, build a **Home × Away scoreline probability matrix**, then read every market off that matrix.

```
raw match history → estimate goal-scoring rate per side → Home×Away matrix → read off any market
```

### 1. Estimate team strength (`non-live prediction` sheet)

Given N historical matches (head-to-head, or a team's own recent matches) with home/away goals per match:

- `home_strength = AVERAGE(home_goals)`
- `away_strength = AVERAGE(away_goals)`

These averages are the "fair point" estimate for the next match:

- `fair OU = home_strength + away_strength`
- `fair HDP = home_strength - away_strength`

This is the rough, non-live prediction — good for a sanity check, not yet a full probability distribution.

### 2. True probability from raw score frequency (`OU Probability` sheet)

With only historical counts (no distribution assumption), the true probability of each *total goal* value is just its empirical frequency:

```
P(total = k) = COUNTIF(history, k) / COUNT(history)
```

From that discrete distribution, every OU line is derived:

- **Integer / half lines** (e.g. 1.5, 2.5): `P(Over) = P(total > line)`, `P(Under) = 1 - P(Over)`.
- **Quarter lines** (e.g. 1.25, 1.75)**:** a quarter line is really two integer/half lines split 50/50. A bet on Over at a `.25` line:
  - wins in full ("win all", `x1`) if `total >= ceil(line)`
  - wins half / loses half ("push half", `x2`) if `total == floor(line)` — the *other* half is a loss
  - loses in full ("lose all", `x3`) if `total < floor(line)`

  ```
  P(Over) = x1 / (x1 + 0.5*x2 + 0.5*x2_loss + x3)
  ```

  (`x2` splits into a half-win and a half-lose component depending on which side of the line you bet; see the sheet for the exact win/half/lose score buckets per `.25`/`.75` point.)

- **Odds conversion** (applies everywhere, not just OU):
  ```
  Euro odds  = 1 / true_probability
  HK odds    = Euro odds - 1
  Malay odds = HK odds            if HK odds <= 1
             = -1 / HK odds       if HK odds > 1
  ```

### 3. When history is too small: statistical model (`Stats Model + Matrix` sheet)

Ten matches is not enough to trust raw frequency counts (many total-goal values will have zero observations). Instead, model each side's goal count as **Poisson**, parameterized by the average goal already computed in step 1:

```
P(home scores h) = POISSON(h, home_strength, false)
P(away scores a) = POISSON(a, away_strength, false)
```

Because home and away goals are treated as independent, the joint scoreline probability is just the product:

```
P(home = h, away = a) = P(home scores h) * P(away scores a)
```

This is the **Home × Away matrix** — a grid where cell `(h, a)` holds the probability of that exact scoreline. This single matrix is the answer to "what if sample data isn't enough": Poisson smooths over the gaps that raw counting leaves empty.

This matrix is also directly the source of **Correct Score** odds in bookie_example.png: `odds(h:a) = 1 / matrix[h][a]` (converted to house format), and "AOS" is `1 - sum(all listed scorelines)`.

### 4. Reading OU and HDP off the matrix (`OU Matrix values`, `HDP Probability` sheets)

Once the matrix exists, every market is just a sum over a region of cells — no re-modeling needed.

**OU point → diagonal bands.** For an OU line, classify every cell `(h, a)` by comparing `h + a` to the line:

- `lower` = cells where `h + a < line` (Under wins outright)
- `diag`  = cells where `h + a == round(line)` (only relevant for `.0`/`.5` lines, where a push/half is possible)
- `upper` = cells where `h + a > line` (Over wins outright)

The exact combination rule depends on how the line ends:

| Line ends with | Over probability | Under probability |
|---|---|---|
| `.0` | `lower / (lower + upper)` (draw/push removed) | `upper / (lower + upper)` |
| `.25` | `lower / (lower + 0.5*diag + upper)` | `1 - over` |
| `.5` | `lower + diag` | `upper` |
| `.75` | `1 - under` | `upper / (upper + 0.5*diag + lower)` |

(Sums are over the antidiagonal bands of the matrix defined by `h + a` vs. the rounded line — same shape for every OU point, just re-sliced.)

**HDP point → same idea, but diagonals offset by the handicap.** Instead of grouping by `h + a`, group by `h - a` relative to the handicap value; "Fav" and "Udg" (favourite / underdog) take the place of Over/Under, and win-all / push-half / lose-all follow the same `.0`/`.25`/`.5`/`.75` table shape as OU.

### 5. Home/Draw/Away, Odd/Even, Total Goal buckets, Double Chance

Not covered by a dedicated sheet, but they fall out of the same matrix with a different grouping rule — this is the part the HTML implementation needs to add on top of the spreadsheet's logic:

- **1X2:** `P(Home) = sum(h > a)`, `P(Draw) = sum(h == a)`, `P(Away) = sum(h < a)`.
- **OE (odd/even):** `P(Odd) = sum((h+a) is odd)`, `P(Even) = sum((h+a) is even)`.
- **Total Goal buckets:** e.g. `P(2~3) = sum(2 <= h+a <= 3)` — a coarser version of the OU banding in step 4.
- **Double Chance:** `P(1X) = P(Home) + P(Draw)`, `P(12) = P(Home) + P(Away)`, `P(X2) = P(Draw) + P(Away)`.
- **First Half markets:** same formulas, but the matrix is built from first-half-only goal averages instead of full-time averages.

### 6. Live odds: strength decay (`Poisson` sheet)

Once a match is in play, remaining strength scales down with remaining time:

```
decay_factor    = remaining_game_time / total_game_time
live_strength   = initial_strength * decay_factor
```

`live_strength` replaces `home_strength` / `away_strength` in step 3, so the matrix — and therefore every derived market — is recomputed live as the clock runs down.

### 7. Margin and spread (`TOR` / `Spread` sheets)

True odds (from steps 2–6) are what the bookmaker computes internally; the price shown to a player has a **margin** (overround) baked in by shrinking the payout ("spread"):

```
margin = 1/over_price + 1/under_price - 1
```

The `Spread` and `TOR` sheets work through how spreading the true odds unevenly between Over/Under changes the bookmaker's expected profit and the resulting margin — this is a separate step applied after true probability is known, not part of the probability model itself.

## Flow summary

```
1. non-live prediction   → rough fair point (OU, HDP) from historical averages
2. OU Probability         → true probability from raw score frequency (small-N, exact)
3. Stats Model + Matrix   → Poisson per side → Home×Away matrix (handles small-N gaps)
4. OU Matrix values       → OU probability read off the matrix (upper/diag/lower)
5. HDP Probability        → HDP probability read off the matrix (same idea, offset by handicap)
6. (new) 1X2 / OE / Total Goal / Double Chance / Correct Score → other groupings of the same matrix
7. Poisson (live)         → strength decay → live matrix → live odds
8. Spread / TOR           → true odds → bookmaker margin → displayed price
```

Steps 1–5 and 7–8 mirror the spreadsheet tabs of the same name; step 6 is the gap between the spreadsheet (which only worked out OU/HDP) and the full board in [bookie_example.png](bookie_example.png).
