// Shared page order for the prev/next navigation arrows. Add new exercise
// pages here (in order) as they are created.
const PAGE_ORDER = ["page1.html", "page2.html", "page3.html", "page4.html", "page5.html", "page6.html"];

function currentPageFile() {
  return window.location.pathname.split("/").pop();
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
