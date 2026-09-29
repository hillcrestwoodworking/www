// Gallery grid, category filter and lightbox.
// Renders into #gallery (full gallery page) or #gallery-preview (home page).
(function () {
  const { categories, photos } = window.GALLERY;
  const catName = (id) => (categories.find((c) => c.id === id) || {}).name || id;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let visible = [];
  let index = 0;
  let lightbox;

  function tile(p, i) {
    return `<figure class="tile">
        <button type="button" data-i="${i}" aria-label="Enlarge: ${esc(p.caption || catName(p.category))}">
          <img src="${esc(p.src)}" alt="${esc(p.caption || catName(p.category))}" loading="lazy">
        </button>
        <figcaption><span class="tag">${esc(catName(p.category))}</span>${esc(p.caption)}</figcaption>
      </figure>`;
  }

  function renderGrid(grid, list, emptyHtml) {
    visible = list;
    grid.innerHTML = list.length ? list.map(tile).join("") : emptyHtml;
  }

  function openLightbox(i) {
    index = i;
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.className = "lightbox";
      lightbox.setAttribute("role", "dialog");
      lightbox.setAttribute("aria-modal", "true");
      lightbox.innerHTML = `
        <button class="lb-close" aria-label="Close">×</button>
        <button class="lb-prev" aria-label="Previous">‹</button>
        <figure><img alt=""><figcaption></figcaption></figure>
        <button class="lb-next" aria-label="Next">›</button>`;
      document.body.appendChild(lightbox);
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || e.target.closest(".lb-close")) closeLightbox();
        else if (e.target.closest(".lb-prev")) step(-1);
        else if (e.target.closest(".lb-next")) step(1);
      });
      document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      });
    }
    showCurrent();
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    lightbox.querySelector(".lb-close").focus();
  }

  function showCurrent() {
    const p = visible[index];
    const img = lightbox.querySelector("img");
    img.src = p.src;
    img.alt = p.caption || catName(p.category);
    lightbox.querySelector("figcaption").textContent =
      [catName(p.category), p.caption].filter(Boolean).join(" — ");
  }

  function step(d) {
    index = (index + d + visible.length) % visible.length;
    showCurrent();
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  function wireClicks(grid) {
    grid.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-i]");
      if (b) openLightbox(Number(b.dataset.i));
    });
  }

  // Full gallery page
  const grid = document.getElementById("gallery");
  if (grid) {
    const filters = document.getElementById("gallery-filters");
    const all = [{ id: "all", name: "All" }, ...categories];
    const counts = (id) => (id === "all" ? photos.length : photos.filter((p) => p.category === id).length);
    filters.innerHTML = all
      .map((c) => `<button type="button" class="chip" data-cat="${c.id}">${esc(c.name)} <small>${counts(c.id)}</small></button>`)
      .join("");

    function select(cat) {
      if (!all.some((c) => c.id === cat)) cat = "all";
      filters.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat)));
      const list = cat === "all" ? photos : photos.filter((p) => p.category === cat);
      const label = cat === "all" ? "our work" : catName(cat).toLowerCase();
      renderGrid(grid, list, `
        <div class="empty">
          <p>Photos of ${esc(label)} are coming soon.</p>
          <p>Want to see examples? <a href="quote.html">Ask for a quote</a> and we'll send some over.</p>
        </div>`);
      const url = new URL(location.href);
      if (cat === "all") url.searchParams.delete("cat");
      else url.searchParams.set("cat", cat);
      history.replaceState(null, "", url);
    }

    filters.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (b) select(b.dataset.cat);
    });
    wireClicks(grid);
    select(new URLSearchParams(location.search).get("cat") || "all");
  }

  // Home page preview: first 6 photos, hidden entirely if there are none yet
  const preview = document.getElementById("gallery-preview");
  if (preview) {
    if (!photos.length) {
      preview.closest("section").hidden = true;
    } else {
      renderGrid(preview, photos.slice(0, 6), "");
      wireClicks(preview);
    }
  }
})();
