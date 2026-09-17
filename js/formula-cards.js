// Standard reference formulas shown in the right-hand Formula Card panel,
// one entry per exercise. Independent of the per-cell hint tooltips: this is
// a fixed teaching reference, not the terse strings used for those popups.
const FORMULA_CARDS = {
  "historical-match-data.html": [
    { label: "Goal Count", formula: "COUNTIF(Home or Away, value)" },
    { label: "Goal Probability", formula: "Count(value) / N (N = 10 matches)" },
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
    { label: "Category Probability", formula: "Σ P(scoreline) in Under / Draw / Over" },
    { label: "BetTeam Probability", formula: "Category P / (1 − push weight × Draw P)" },
    { label: "Euro Odds", formula: "1 / Probability" },
    { label: "HK Odds", formula: "Euro − 1" },
    { label: "Malay Odds", formula: "HK if HK ≤ 1, else −1 / HK" },
  ],
  "opening-over-under-market.html": [
    { label: "BetTeam Probability", formula: "Same as 3.6 Over / Under, swept over points 0.25 – 4.00" },
    { label: "Main Market", formula: "Point(s) where P(Over) is closest to 0.50" },
    { label: "Euro / HK / Malay", formula: "Same odds-conversion chain as 3.6 Over / Under" },
  ],
  "adding-a-spread.html": [
    { label: "Spread Malay Odds", formula: "Fair Malay − Spread / 2 (per side)" },
    { label: "HK Odds", formula: "Malay if Malay ≥ 0, else −1 / Malay" },
    { label: "Euro Odds", formula: "HK + 1" },
    { label: "Probability", formula: "1 / Euro" },
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
