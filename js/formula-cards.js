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
    { label: "Category Probability", formula: "Σ P(scoreline) in Under / Push / Over" },
    { label: "Selection Probability", formula: "Category P / (1 − push weight × Push P)" },
    { label: "Euro Odds", formula: "1 / Probability" },
    { label: "HK Odds", formula: "Euro − 1" },
    { label: "Malay Odds", formula: "HK if HK ≤ 1, else −1 / HK" },
  ],
  "1x2-double-chance-market.html": [
    { label: "1X2 Probability", formula: "Σ P(scoreline) where Home > / = / < Away" },
    { label: "Double Chance Probability", formula: "P(1X2 outcome A) + P(1X2 outcome B)" },
    { label: "Euro Odds", formula: "1 / Probability" },
  ],
  "total-goal-market.html": [
    { label: "Bucket Probability", formula: "Σ P(scoreline) where Home + Away falls in the bucket" },
    { label: "Euro Odds", formula: "1 / Probability" },
  ],
  "hdp-market.html": [
    { label: "Category Probability", formula: "Σ P(scoreline) in Away Covers / Push / Home Covers, classified by Home − Away" },
    { label: "Selection Probability", formula: "Same as 3.5 Over / Under, applied to Home − Away instead of Home + Away" },
    { label: "Euro / HK / Malay", formula: "Same odds-conversion chain as 3.5 Over / Under" },
  ],
  "opening-over-under-market.html": [
    { label: "Selection Probability", formula: "Same as 3.5 Over / Under or 3.6 HDP, swept over the selected market's range" },
    { label: "Main Market", formula: "Point(s)/Line(s) where the two Selection probabilities are closest to 0.50" },
    { label: "Euro / HK / Malay", formula: "Same odds-conversion chain as 3.5 Over / Under" },
  ],
  "adding-a-spread.html": [
    { label: "Spread Malay Odds", formula: "Fair Malay − Spread / 2 (per side)" },
    { label: "HK Odds", formula: "Malay if Malay ≥ 0, else −1 / Malay" },
    { label: "Euro Odds", formula: "HK + 1" },
    { label: "Probability", formula: "1 / Euro" },
  ],
  "poisson-distribution.html": [
    { label: "Historical Probability", formula: "Count(k goals) / N matches" },
    { label: "Expected Goals (λ)", formula: "Total goals / N matches" },
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
    <h2>Formulas</h2>
    <dl id="formula-card-list">${items}</dl>
  `;
}

renderFormulaCard();
