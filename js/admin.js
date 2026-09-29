// Admin page: log in, then add / edit / reorder / hide / delete gallery items.
(function () {
  const $ = (sel) => document.querySelector(sel);
  const { categories } = window.GALLERY;
  const catName = (id) => (categories.find((c) => c.id === id) || {}).name || id;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

  const views = ["loading", "login", "list", "edit"];
  function show(name) {
    views.forEach((v) => ($(`#view-${v}`).hidden = v !== name));
    $("#logout").hidden = !(name === "list" || name === "edit");
    window.scrollTo(0, 0);
  }

  let items = [];
  let etag = null;
  let draft = null; // item being added/edited

  // ---------- API ----------
  async function api(path, { method = "GET", json, body, headers = {} } = {}) {
    const res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: { "X-HW-Admin": "1", ...(json ? { "Content-Type": "application/json" } : {}), ...headers },
      body: json ? JSON.stringify(json) : body,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !path.endsWith("/login")) {
      show("login");
      throw new Error("Your login expired. Please log in again.");
    }
    if (!res.ok) throw new Error(data.error || `Something went wrong (error ${res.status}).`);
    return data;
  }

  function notice(html) {
    const n = $("#notice");
    n.innerHTML = html;
    n.hidden = !html;
  }

  let toastTimer;
  function toast(message, isError = false) {
    const t = $("#toast");
    t.textContent = message;
    t.className = `toast${isError ? " error" : ""}`;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), isError ? 6000 : 2500);
  }

  // ---------- Start ----------
  async function init() {
    let s;
    try {
      s = await api("/api/admin/session");
    } catch (e) {
      $("#view-loading").innerHTML =
        "The admin tools aren't available here. On your computer, start the site with <code>npm run dev</code> " +
        "(not a plain file server). On the live site, check the Vercel deployment.";
      return;
    }
    if (!s.passwordConfigured) {
      $("#view-loading").innerHTML =
        "The admin password hasn't been set. Add <code>ADMIN_PASSWORD</code> in Vercel → Settings → Environment Variables " +
        "(and in <code>.env.local</code> for local testing), then redeploy.";
      return;
    }
    if (!s.storageConfigured) {
      notice("Photo storage isn't connected yet. In Vercel, go to <strong>Storage → Create → Blob</strong> and connect it to this project, then redeploy.");
    }
    if (s.signedIn) loadList();
    else show("login");
  }

  // ---------- Log in / out ----------
  $("#view-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = $("#login-status");
    const button = e.target.querySelector("button");
    status.hidden = true;
    button.disabled = true;
    try {
      await api("/api/admin/login", { method: "POST", json: { password: $("#password").value } });
      $("#password").value = "";
      await loadList();
    } catch (err) {
      status.textContent = err.message;
      status.hidden = false;
    } finally {
      button.disabled = false;
    }
  });

  $("#logout").addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    items = [];
    show("login");
  });

  // ---------- List ----------
  async function loadList() {
    show("loading");
    try {
      const data = await api("/api/admin/gallery");
      items = data.items;
      etag = data.etag;
      renderList();
      show("list");
    } catch (e) {
      if (!$("#view-login").hidden) return; // sent back to login
      $("#view-loading").textContent = e.message;
    }
  }

  function priceLabel(it) {
    return it.price == null ? "Get a Quote" : (it.priceFrom ? "from " : "") + money(it.price);
  }

  function renderList() {
    const visible = items.filter((it) => !it.hidden).length;
    $("#list-summary").textContent = items.length
      ? `${items.length} item${items.length === 1 ? "" : "s"} · ${visible} showing on the site`
      : "";
    $("#item-list").innerHTML = items.length
      ? items.map((it, i) => `
        <li class="admin-item${it.hidden ? " is-hidden" : ""}" data-id="${esc(it.id)}">
          <img src="${esc(it.photos[0].thumb)}" alt="">
          <div class="admin-item-info">
            <strong>${esc(it.title)}</strong>
            <span>${esc(catName(it.category))} · ${esc(priceLabel(it))} · ${it.photos.length} photo${it.photos.length === 1 ? "" : "s"}</span>
            ${it.hidden ? `<span class="badge">Hidden</span>` : ""}
          </div>
          <div class="admin-item-actions">
            <button type="button" data-act="up" aria-label="Move up"${i === 0 ? " disabled" : ""}>↑</button>
            <button type="button" data-act="down" aria-label="Move down"${i === items.length - 1 ? " disabled" : ""}>↓</button>
            <button type="button" data-act="edit">Edit</button>
            <button type="button" data-act="toggle">${it.hidden ? "Show" : "Hide"}</button>
            <button type="button" data-act="delete" class="danger">Delete</button>
          </div>
        </li>`).join("")
      : `<li class="empty">No items yet. Tap <strong>+ Add Item</strong> to upload photos of a job.</li>`;
  }

  async function save(next, message) {
    document.body.classList.add("busy");
    try {
      const data = await api("/api/admin/gallery", { method: "PUT", json: { items: next, etag } });
      items = data.items;
      etag = data.etag;
      renderList();
      toast(message);
      return true;
    } catch (e) {
      toast(e.message, true);
      return false;
    } finally {
      document.body.classList.remove("busy");
    }
  }

  $("#item-list").addEventListener("click", (e) => {
    const button = e.target.closest("button[data-act]");
    if (!button || document.body.classList.contains("busy")) return;
    const id = button.closest("[data-id]").dataset.id;
    const i = items.findIndex((it) => it.id === id);
    const it = items[i];
    const next = items.slice();

    switch (button.dataset.act) {
      case "up":
      case "down": {
        const j = button.dataset.act === "up" ? i - 1 : i + 1;
        [next[i], next[j]] = [next[j], next[i]];
        return save(next, "Order saved");
      }
      case "edit":
        return openEditor(it);
      case "toggle":
        next[i] = { ...it, hidden: !it.hidden };
        return save(next, it.hidden ? "Now showing on the site" : "Hidden from the site");
      case "delete":
        // Tap twice to delete, so a stray tap can't remove an item.
        if (button.dataset.armed) {
          next.splice(i, 1);
          return save(next, `Deleted “${it.title}”`);
        }
        button.dataset.armed = "1";
        button.textContent = "Tap again to delete";
        setTimeout(() => {
          delete button.dataset.armed;
          button.textContent = "Delete";
        }, 4000);
    }
  });

  // ---------- Editor ----------
  $("#e-category").innerHTML =
    `<option value="">Choose one…</option>` + categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("");

  $("#add-item").addEventListener("click", () => openEditor(null));
  $("#e-cancel").addEventListener("click", () => show("list"));

  function openEditor(it) {
    draft = it
      ? JSON.parse(JSON.stringify(it))
      : { id: crypto.randomUUID(), photos: [], createdAt: new Date().toISOString() };
    $("#edit-heading").textContent = it ? "Edit Item" : "Add Item";
    $("#e-title").value = draft.title || "";
    $("#e-category").value = draft.category || "";
    $("#e-price").value = draft.price ?? "";
    $("#e-from").checked = !!draft.priceFrom;
    $("#e-desc").value = draft.description || "";
    $("#e-visible").checked = !draft.hidden;
    renderPhotos();
    show("edit");
  }

  function renderPhotos() {
    const uploading = draft.photos.some((p) => p.uploading);
    $("#e-save").disabled = uploading;
    $("#e-save").textContent = uploading ? "Uploading photos…" : "Save Item";
    $("#e-photos").innerHTML = draft.photos.length
      ? draft.photos.map((p, i) => p.uploading
        ? `<div class="admin-photo uploading"><span>Uploading…</span></div>`
        : `<div class="admin-photo">
            <img src="${esc(p.thumb)}" alt="">
            ${i === 0 ? `<span class="cover-badge">Cover</span>` : `<button type="button" data-cover="${i}">Make cover</button>`}
            <button type="button" class="remove" data-remove="${i}" aria-label="Remove photo">×</button>
          </div>`).join("")
      : `<p class="muted admin-no-photos">No photos yet.</p>`;
  }

  $("#e-photos").addEventListener("click", (e) => {
    const cover = e.target.closest("[data-cover]");
    const remove = e.target.closest("[data-remove]");
    if (cover) {
      const [p] = draft.photos.splice(Number(cover.dataset.cover), 1);
      draft.photos.unshift(p);
    } else if (remove) {
      draft.photos.splice(Number(remove.dataset.remove), 1);
    } else return;
    renderPhotos();
  });

  // Shrink a photo in the browser: phone photos are often 3–10 MB.
  function resize(file, maxSide, quality) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const g = canvas.getContext("2d");
        g.fillStyle = "#1c1d20"; // background for transparent PNGs
        g.fillRect(0, 0, canvas.width, canvas.height);
        g.imageSmoothingQuality = "high";
        g.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("couldn't process the photo"))), "image/jpeg", quality);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("this file can't be opened here. Try a JPEG or PNG photo"));
      };
      img.src = url;
    });
  }

  const upload = (blob) => api("/api/admin/upload", { method: "POST", body: blob, headers: { "Content-Type": "image/jpeg" } });

  $("#e-files").addEventListener("change", async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    const editing = draft;
    // One at a time keeps memory low on phones.
    for (const file of files) {
      const slot = { uploading: true };
      editing.photos.push(slot);
      if (draft === editing) renderPhotos();
      try {
        const full = await resize(file, 2000, 0.85);
        const thumb = await resize(file, 800, 0.8);
        const [a, b] = await Promise.all([upload(full), upload(thumb)]);
        Object.assign(slot, { src: a.url, thumb: b.url, uploading: false });
      } catch (err) {
        editing.photos.splice(editing.photos.indexOf(slot), 1);
        toast(`Couldn't add ${file.name}: ${err.message}`, true);
      }
      if (draft === editing) renderPhotos();
    }
  });

  $("#view-edit").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = $("#e-title").value.trim();
    const category = $("#e-category").value;
    const priceRaw = $("#e-price").value.trim();
    if (!title) return toast("Add a title.", true), $("#e-title").focus();
    if (!category) return toast("Pick a category.", true), $("#e-category").focus();
    if (!draft.photos.length) return toast("Add at least one photo.", true);
    if (priceRaw && !(Number(priceRaw) >= 0)) return toast("Enter the price as a number, like 250 or 249.99.", true);

    const item = {
      ...draft,
      title,
      category,
      price: priceRaw ? Number(priceRaw) : null,
      priceFrom: $("#e-from").checked,
      description: $("#e-desc").value.trim(),
      hidden: !$("#e-visible").checked,
      photos: draft.photos.map(({ src, thumb }) => ({ src, thumb })),
    };
    const exists = items.some((it) => it.id === item.id);
    // New items go to the top so the latest jobs show first.
    const next = exists ? items.map((it) => (it.id === item.id ? item : it)) : [item, ...items];
    if (await save(next, exists ? "Item updated" : "Item added")) show("list");
  });

  init();
})();
