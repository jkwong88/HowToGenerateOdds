// Shared page order for the prev/next navigation arrows and the exercise
// index. Add new exercise pages here (in order) as they are created.
const PAGE_ORDER = [
  "introduction.html",
  "historical-match-data.html",
  "final-score-probability-matrix.html",
  "correct-score-odds.html",
  "odd-even-market.html",
  "over-under-market.html",
  "opening-over-under-market.html",
  "adding-a-spread.html",
];

const PAGE_TITLES = {
  "introduction.html": "Introduction",
  "historical-match-data.html": "Exercise 1: Historical Match Data",
  "final-score-probability-matrix.html": "Exercise 2: Final Score Probability Matrix",
  "correct-score-odds.html": "Exercise 3: Correct Score & Odds",
  "odd-even-market.html": "Exercise 4: Odd / Even Market",
  "over-under-market.html": "Exercise 5: Over / Under Market",
  "opening-over-under-market.html": "Exercise 6: Opening the Over / Under Market",
  "adding-a-spread.html": "Exercise 7: Adding a Spread",
};

function currentPageFile() {
  return window.location.pathname.split("/").pop();
}

function renderExerciseIndex() {
  const list = document.getElementById("exercise-index-list");
  if (!list) return;

  const current = currentPageFile();
  list.innerHTML = PAGE_ORDER.map((file) => {
    const isCurrent = file === current;
    return `<li><a href="${file}" class="${isCurrent ? "current" : ""}">${PAGE_TITLES[file]}</a></li>`;
  }).join("");
}

function renderPageNav() {
  const nav = document.getElementById("page-nav");
  if (!nav) return;

  const index = PAGE_ORDER.indexOf(currentPageFile());
  const prevFile = index > 0 ? PAGE_ORDER[index - 1] : null;
  const nextFile = index >= 0 && index < PAGE_ORDER.length - 1 ? PAGE_ORDER[index + 1] : null;

  nav.innerHTML = `
    <a class="page-nav-btn${prevFile ? "" : " disabled"}" href="${prevFile || "#"}" aria-label="Previous page">&#8592;</a>
    <a class="page-nav-btn${nextFile ? "" : " disabled"}" href="${nextFile || "#"}" aria-label="Next page">&#8594;</a>
  `;
}

renderPageNav();
renderExerciseIndex();
