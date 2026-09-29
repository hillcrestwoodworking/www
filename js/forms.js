// Sends quote / schedule / order forms to the business email via Web3Forms.
(function () {
  const S = window.SITE;
  const pad = (n) => String(n).padStart(2, "0");
  const localISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Date pickers: no past dates, no same-day, and no closed days.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.min = localISO(tomorrow);
    input.addEventListener("input", () => {
      if (!input.value) return input.setCustomValidity("");
      const day = new Date(input.value + "T12:00").getDay();
      input.setCustomValidity(
        (S.closedDays || []).includes(day) ? `Sorry, we're not available on ${dayNames[day]}s. Please pick another day.` : ""
      );
    });
  });
  const closedNote = document.querySelector("[data-closed-days]");
  if (closedNote && (S.closedDays || []).length) {
    closedNote.textContent = `Not available on ${S.closedDays.map((d) => dayNames[d] + "s").join(", ")}.`;
  }

  document.querySelectorAll("form[data-inquiry]").forEach((form) => {
    const status = form.querySelector(".form-status");
    const button = form.querySelector('button[type="submit"]');

    function show(kind, html) {
      status.className = `form-status ${kind}`;
      status.innerHTML = html;
      status.hidden = false;
      status.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    const fallback = () =>
      [S.phone && `call <a href="tel:${S.phone.replace(/[^\d+]/g, "")}">${S.phone}</a>`,
       S.email && `email <a href="mailto:${S.email}">${S.email}</a>`]
        .filter(Boolean).join(" or ") || "contact us directly";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (!S.web3formsKey) {
        show("error", `Online requests aren't switched on yet. Please ${fallback()}.`);
        return;
      }

      // Collect fields; multiple checkboxes with the same name are joined.
      const data = {};
      for (const [k, v] of new FormData(form)) data[k] = data[k] ? `${data[k]}, ${v}` : v;
      data.access_key = S.web3formsKey;
      data.subject = `${S.name} website: ${form.dataset.inquiry}${data.name ? " from " + data.name : ""}`;
      data.from_name = `${S.name} Website`;

      button.disabled = true;
      const label = button.textContent;
      button.textContent = "Sending…";
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        form.reset();
        show("success", form.dataset.success || "Thanks! We got your request and will be in touch soon.");
      } catch (err) {
        show("error", `Sorry, something went wrong sending your request. Please try again, or ${fallback()}.`);
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    });
  });
})();
