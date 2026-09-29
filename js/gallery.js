// Gallery: project/product cards with price, category filter and a photo lightbox.
// Items come from the Admin page (/api/gallery); js/gallery-data.js is the fallback.
// Renders into #gallery (gallery page) or #gallery-preview (home page).
(function () {
  const { categories } = window.GALLERY;
  const category = (id) => categories.find((c) => c.id === id) || { id, name: id, orderAs: "" };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const priceText = (it) => (it.price == null ? "" : (it.priceFrom ? "Starting at " : "") + money(it.price));

  let photos = []; // flat list of { src, item, n, of } for the lightbox
  let index = 0;
  let lightbox;

  async function loadItems() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch("/api/gallery", { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) return data.items;
      }
    } catch (e) { /* fall through to the static list */ }
    return window.GALLERY.items || [];
  }

  function actionLink(it) {
    const q = new URLSearchParams({ item: category(it.category).orderAs, product: it.title });
    if (it.price != null) q.set("price", priceText(it));
    return it.price != null
      ? `<a class="btn btn-primary btn-sm" href="order.html?${q}">Order This</a>`
      : `<a class="btn btn-outline btn-sm" href="quote.html?${q}">Get a Quote</a>`;
  }

  function card(it, firstPhoto) {
    const cover = it.photos[0];
    const price = priceText(it);
    return `<article class="item">
        <button type="button" class="item-photo" data-i="${firstPhoto}" aria-label="View photos: ${esc(it.title)}">
          <img src="${esc(cover.thumb || cover.src)}" alt="${esc(it.title)}" loading="lazy">
          ${it.photos.length > 1 ? `<span class="photo-count">${it.photos.length} photos</span>` : ""}
        </button>
        <div class="item-body">
          <span class="tag">${esc(category(it.category).name)}</span>
          <h3>${esc(it.title)}</h3>
          ${price ? `<p class="price">${esc(price)}</p>` : ""}
          ${it.description ? `<p class="desc">${esc(it.description)}</p>` : ""}
          <div class="item-actions">${actionLink(it)}</div>
        </div>
      </article>`;
  }

  function renderGrid(grid, items, emptyHtml) {
    photos = [];
    const html = items.map((it) => {
      const first = photos.length;
      it.photos.forEach((p, n) => photos.push({ src: p.src, item: it, n: n + 1, of: it.photos.length }));
      return card(it, first);
    });
    grid.innerHTML = items.length ? html.join("") : emptyHtml;
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
      // Swipe left/right on phones to move between photos.
      let startX = null, startY = 0;
      lightbox.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return (startX = null); // ignore pinch-zoom
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });
      lightbox.addEventListener("touchend", (e) => {
        if (startX === null) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        startX = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
      }, { passive: true });
      document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("open")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") step(-1);
        if (e.key === "ArrowRight") step(1);
      });
    }
    showCurrent();
    lightbox.classList.add("open");
    // Lock page scrolling behind the viewer (html + body needed for iOS Safari).
    document.documentElement.style.overflow = document.body.style.overflow = "hidden";
    lightbox.querySelector(".lb-close").focus();
  }

  function showCurrent() {
    const p = photos[index];
    const img = lightbox.querySelector("img");
    img.src = p.src;
    img.alt = p.item.title;
    const price = priceText(p.item);
    lightbox.querySelector("figcaption").textContent =
      [p.item.title, price].filter(Boolean).join(" · ") + (p.of > 1 ? `  (${p.n} of ${p.of})` : "");
    const single = photos.length < 2;
    lightbox.querySelector(".lb-prev").hidden = lightbox.querySelector(".lb-next").hidden = single;
  }

  function step(d) {
    index = (index + d + photos.length) % photos.length;
    showCurrent();
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.documentElement.style.overflow = document.body.style.overflow = "";
  }

  function wireClicks(grid) {
    grid.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-i]");
      if (b) openLightbox(Number(b.dataset.i));
    });
  }

  const loaded = loadItems();

  // Full gallery page
  const grid = document.getElementById("gallery");
  if (grid) {
    const filters = document.getElementById("gallery-filters");
    const all = [{ id: "all", name: "All" }, ...categories];
    wireClicks(grid);
    grid.innerHTML = `<div class="empty">Loading…</div>`;

    loaded.then((items) => {
      const count = (id) => (id === "all" ? items.length : items.filter((it) => it.category === id).length);
      filters.innerHTML = all
        .map((c) => `<button type="button" class="chip" data-cat="${c.id}">${esc(c.name)} <small>${count(c.id)}</small></button>`)
        .join("");

      function select(cat) {
        if (!all.some((c) => c.id === cat)) cat = "all";
        filters.querySelectorAll(".chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === cat)));
        const list = cat === "all" ? items : items.filter((it) => it.category === cat);
        const label = cat === "all" ? "our work" : category(cat).name.toLowerCase();
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
      select(new URLSearchParams(location.search).get("cat") || "all");
    });
  }

  // Home page preview: first 6 items, hidden entirely if there are none yet
  const preview = document.getElementById("gallery-preview");
  if (preview) {
    const section = preview.closest("section");
    section.hidden = true;
    loaded.then((items) => {
      if (!items.length) return;
      renderGrid(preview, items.slice(0, 6), "");
      wireClicks(preview);
      section.hidden = false;
    });
  }
})();
