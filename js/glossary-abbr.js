// glossary-abbr.js
// Auto-génère un glossaire à partir des balises <abbr title="..."> présentes sur la page.
(function () {
  const list = document.getElementById("glossaryList");
  const empty = document.getElementById("glossaryEmpty");
  if (!list) return;

  const nodes = Array.from(document.querySelectorAll("abbr[title]"));
  const map = new Map();

  for (const n of nodes) {
    const key = (n.textContent || "").trim();
    const def = (n.getAttribute("title") || "").trim();
    if (!key || !def) continue;
    if (!map.has(key)) map.set(key, def);
  }

  const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "fr"));

  if (!entries.length) {
    if (empty) empty.classList.remove("hidden");
    return;
  }

  for (const [sigle, def] of entries) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="font-mono text-slate-100">${sigle}</span> — <span class="text-slate-200">${def}</span>`;
    list.appendChild(li);
  }
})();