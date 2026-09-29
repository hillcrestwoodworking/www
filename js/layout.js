// Shared header and footer, injected into every page.
(function () {
  const S = window.SITE;
  const links = [
    ["index.html", "Home"],
    ["gallery.html", "Gallery"],
    ["quote.html", "Get a Quote"],
    ["schedule.html", "Schedule"],
    ["order.html", "Order"],
    ["pay.html", "Pay"],
  ];
  const page = location.pathname.split("/").pop().replace(/\.html$/, "") || "index";
  const logo = `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M3 26 L12 12 L17 19 L21 14 L29 26 Z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M9 26v-4M16 26v-3M23 26v-4" stroke="currentColor" stroke-width="2"/></svg>`;

  const header = document.getElementById("site-header");
  if (header) {
    header.innerHTML = `
      <div class="container header-inner">
        <a class="brand" href="index.html">${logo}<span>${S.name}</span></a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <nav id="site-nav" class="site-nav">
          ${links.map(([href, label]) => {
            const current = href.replace(".html", "") === page;
            return `<a href="${href}"${current ? ' aria-current="page"' : ""}>${label}</a>`;
          }).join("")}
        </nav>
      </div>`;
    const toggle = header.querySelector(".nav-toggle");
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      header.classList.toggle("nav-open", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    // Close the phone menu on a link tap, a tap outside it, Escape, or rotating to a wide screen.
    header.querySelector(".site-nav").addEventListener("click", (e) => e.target.closest("a") && setOpen(false));
    document.addEventListener("click", (e) => !header.contains(e.target) && setOpen(false));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
    matchMedia("(min-width: 861px)").addEventListener("change", (e) => e.matches && setOpen(false));
  }

  // Phones: sticky Call / Get a Quote bar on browsing pages (not on form pages,
  // where it would cover fields and jump around with the on-screen keyboard).
  if (page === "index" || page === "gallery") {
    const bar = document.createElement("div");
    bar.className = "action-bar";
    bar.innerHTML = [
      S.phone && `<a class="btn btn-outline" href="tel:${S.phone.replace(/[^\d+]/g, "")}">Call</a>`,
      `<a class="btn btn-primary" href="quote.html">Get an Estimate</a>`,
    ].filter(Boolean).join("");
    document.body.appendChild(bar);
    document.body.classList.add("has-action-bar");
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    const contact = [
      S.phone && `<a href="tel:${S.phone.replace(/[^\d+]/g, "")}">${S.phone}</a>`,
      S.email && `<a href="mailto:${S.email}">${S.email}</a>`,
      S.serviceArea && `<span>${S.serviceArea}</span>`,
    ].filter(Boolean).join("");
    footer.innerHTML = `
      <div class="container footer-inner">
        <div>
          <a class="brand" href="index.html">${logo}<span>${S.name}</span></a>
          <div class="footer-contact">${contact}</div>
        </div>
        <nav class="footer-nav">${links.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}</nav>
      </div>
      <div class="container footer-copy">© ${new Date().getFullYear()} ${S.name}</div>`;
  }

  // Fill any element marked data-site="phone" etc.
  document.querySelectorAll("[data-site]").forEach((el) => {
    const v = S[el.dataset.site];
    if (v) el.textContent = v;
    else if (el.hasAttribute("data-hide-empty")) el.hidden = true;
  });
})();
