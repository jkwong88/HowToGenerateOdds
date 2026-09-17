// Shared page order for the prev/next navigation arrows and the exercise
// index. Add new exercise pages here (in order) as they are created.
const PAGE_ORDER = [
  "page1.html",
  "page2.html",
  "page3.html",
  "page4.html",
  "page5.html",
  "page6.html",
  "page7.html",
];

const PAGE_TITLES = {
  "page1.html": "Exercise 1: Historical Match Data",
  "page2.html": "Exercise 2: Final Score Probability Matrix",
  "page3.html": "Exercise 3: Correct Score & Odds",
  "page4.html": "Exercise 4: Odd / Even Market",
  "page5.html": "Exercise 5: Over / Under Market",
  "page6.html": "Exercise 6: Opening the Over / Under Market",
  "page7.html": "Exercise 7: Adding a Spread",
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
