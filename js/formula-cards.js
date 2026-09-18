// Standard reference formulas shown in the right-hand Formula Card panel,
// one entry per exercise. Independent of the per-cell hint tooltips: this is
// a fixed teaching reference, not the terse strings used for those popups.
const FORMULA_CARDS = {
  "historical-match-data.html": [
    { label: "Goal Count", formula: "Count(Home/Away = Goal Value)" },
    { label: "Goal Probability", formula: "Goal Count ÷ 10 Matches" },
  ],
  "final-score-probability-matrix.html": [
    { label: "Joint Score Probability", formula: "P(Home = h, Away = a) = P(Home = h) × P(Away = a)" },
  ],
  "correct-score-odds.html": [
    { label: "Score Probability", formula: "P(Score = h-a) = P(Home = h) × P(Away = a)" },
    { label: "Euro Odds", formula: "1 / Probability" },
  ],
  "odd-even-market.html": [
    { label: "P(Odd)", formula: "Σ P(scoreline) where Home + Away is odd" },
    { label: "P(Even)", formula: "1 − P(Odd)" },
    { label: "Euro Odds", formula: "1 / Probability" },
    { label: "HK Odds", formula: "Euro − 1" },
    { label: "Malay Odds", formula: "HK if HK ≤ 1, else −1 / HK" },
  ],
  "over-under-market.html": [
    { label: "Raw Outcome Probability", formula: "Σ P(scoreline) in Under / Push (or Split Settlement) / Over" },
    { label: "Half Line, e.g. 2.5", formula: "No middle category — Settlement-Adjusted Fair Probability = Raw Outcome Probability" },
    { label: "Integer Line, e.g. 2.0", formula: "Settlement-Adjusted Fair Probability = Raw Outcome Probability ÷ (1 − Push Probability) — Push is excluded entirely" },
    { label: "Quarter Line, e.g. 2.25 / 2.75", formula: "One side = Raw Outcome Probability ÷ (1 − 0.5 × Split Probability); Other side = 1 − that side" },
    { label: "Euro Odds", formula: "1 / Settlement-Adjusted Fair Probability" },
    { label: "HK Odds", formula: "Euro − 1" },
    { label: "Malay Odds", formula: "HK if HK ≤ 1, else −1 / HK" },
  ],
  "1x2-double-chance-market.html": [
    { label: "1X2 Probability", formula: "Σ P(scoreline) for Home Win / Draw / Away Win" },
    { label: "Double Chance Probability", formula: "P(1X2 outcome A) + P(1X2 outcome B)" },
    { label: "Euro Odds", formula: "1 / Probability" },
  ],
  "total-goal-market.html": [
    { label: "Bucket Probability", formula: "Σ P(scoreline) where Home + Away falls in the bucket" },
    { label: "Euro Odds", formula: "1 / Probability" },
  ],
  "hdp-market.html": [
    { label: "Raw Outcome Probability", formula: "Σ P(scoreline) in Away Covers / Push (or Split Settlement) / Home Covers, classified by Home − Away" },
    { label: "Settlement-Adjusted Fair Probability", formula: "Same three cases (Half / Integer / Quarter Line) as 3.5 Over / Under, applied to Home − Away instead of Home + Away" },
    { label: "Euro / HK / Malay", formula: "Same odds-conversion chain as 3.5 Over / Under" },
  ],
  "opening-over-under-market.html": [
    { label: "Settlement-Adjusted Fair Probability", formula: "Same settlement-adjusted math as 3.5 Over / Under or 3.6 HDP, swept over the selected market's range" },
    { label: "Candidate Main Line", formula: "This course's rule: line(s) where the two fair probabilities are closest to 50% each" },
    { label: "Euro / HK / Malay", formula: "Same odds-conversion chain as 3.5 Over / Under" },
  ],
  "adding-a-spread.html": [
    { label: "Spread Malay Odds", formula: "Fair Malay − Spread / 2 (per side); if |result| > 1, re-express as −1 / result (valid Malay notation)" },
    { label: "HK Odds", formula: "Malay if Malay ≥ 0, else −1 / Malay" },
    { label: "Euro Odds", formula: "HK + 1" },
    { label: "Implied Probability", formula: "1 / Euro — no longer a fair probability once the spread is applied" },
    { label: "Overround", formula: "Σ Implied Probability (Over + Under) − 100%" },
  ],
  "poisson-distribution.html": [
    { label: "Historical Probability", formula: "Count(k goals) / N matches" },
    { label: "Expected Goal Count / Mean Scoring Rate (λ)", formula: "Total goals / N matches" },
    { label: "Poisson PMF", formula: "P(X = k) = e⁻λ × λᵏ / k!" },
    { label: "Joint Score Probability", formula: "P(Home = h, Away = a) = P(Home = h) × P(Away = a)" },
  ],
};

function renderFormulaCard() {
  const root = document.getElementById("formula-card-root");
  if (!root) return;

  const formulas = FORMULA_CARDS[currentPageFile()] || [];
  const items = formulas
    .map(({ label, formula }) => `<div class="formula-item"><dt>${label}</dt><dd>${formula}</dd></div>`)
    .join("");

  root.innerHTML = `
    <details class="collapsible-panel">
      <summary>Formulas</summary>
      <dl id="formula-card-list">${items}</dl>
    </details>
  `;

  // A closed <details>'s content is hidden by the browser's own UA
  // stylesheet with `!important`, which no CSS in this file can override -
  // so forcing the panel open at wider viewports is done here, by setting
  // `open` directly, not through CSS alone (see style.css's comment above
  // its `.formula-card .collapsible-panel summary` rule).
  const details = root.querySelector(".collapsible-panel");
  const mql = window.matchMedia("(min-width: 1600px)");
  const syncOpen = () => {
    details.open = mql.matches;
  };
  syncOpen();
  mql.addEventListener("change", syncOpen);
}

renderFormulaCard();
