// Shared page manifest driving the exercise index, prev/next navigation,
// and the page footer (Reset All only shows for "exercise" pages). Add new
// pages here (in order) as they are created.
const PAGES = [
  { file: "introduction.html", title: "Introduction", type: "explanation" },
  { file: "historical-match-data.html", title: "Exercise 1: Historical Match Data", type: "exercise" },
  { file: "final-score-probability-matrix.html", title: "Exercise 2: Final Score Probability Matrix", type: "exercise" },
  { file: "correct-score-odds.html", title: "Exercise 3: Correct Score & Odds", type: "exercise" },
  { file: "odd-even-market.html", title: "Exercise 4: Odd / Even Market", type: "exercise" },
  { file: "over-under-market.html", title: "Exercise 5: Over / Under Market", type: "exercise" },
  { file: "opening-over-under-market.html", title: "Exercise 6: Opening the Over / Under Market", type: "exercise" },
  { file: "adding-a-spread.html", title: "Exercise 7: Adding a Spread", type: "exercise" },
];

function currentPageFile() {
  return window.location.pathname.split("/").pop();
}

function currentPageIndex() {
  return PAGES.findIndex((page) => page.file === currentPageFile());
}

function renderExerciseIndex() {
  const root = document.getElementById("exercise-index-root");
  if (!root) return;

  const current = currentPageFile();
  const items = PAGES.map((page) => {
    const isCurrent = page.file === current;
    return `<li><a href="${page.file}" class="${isCurrent ? "current" : ""}">${page.title}</a></li>`;
  }).join("");

  root.innerHTML = `
    <button id="hint-toggle-btn">Hint: On</button>
    <nav>
      <ul id="exercise-index-list">${items}</ul>
    </nav>
  `;
}

function renderPageFooter() {
  const root = document.getElementById("page-footer-root");
  if (!root) return;

  const index = currentPageIndex();
  const page = PAGES[index];
  const prevFile = index > 0 ? PAGES[index - 1].file : null;
  const nextFile = index >= 0 && index < PAGES.length - 1 ? PAGES[index + 1].file : null;

  const resetButton = page && page.type === "exercise" ? '<button id="reset-btn">Reset All</button>' : "";

  root.innerHTML = `
    ${resetButton}
    <div class="page-nav" id="page-nav">
      <a class="page-nav-btn${prevFile ? "" : " disabled"}" href="${prevFile || "#"}" aria-label="Previous page">&#8592;</a>
      <a class="page-nav-btn${nextFile ? "" : " disabled"}" href="${nextFile || "#"}" aria-label="Next page">&#8594;</a>
    </div>
  `;
}

renderPageFooter();
renderExerciseIndex();
