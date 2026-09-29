// PayPal payments: Smart Buttons when a client ID is set, otherwise a PayPal.me link.
(function () {
  const P = window.SITE.paypal || {};
  const form = document.getElementById("pay-form");
  const amountInput = document.getElementById("pay-amount");
  const refInput = document.getElementById("pay-ref");
  const nameInput = document.getElementById("pay-name");
  const buttons = document.getElementById("paypal-buttons");
  const status = document.getElementById("pay-status");

  function show(kind, html) {
    status.className = `form-status ${kind}`;
    status.innerHTML = html;
    status.hidden = false;
  }

  const amount = () => {
    const n = Number(amountInput.value);
    return Number.isFinite(n) && n >= 1 ? n.toFixed(2) : null;
  };

  // Prefill from links like pay.html?amount=250&ref=Q-1042
  const q = new URLSearchParams(location.search);
  if (q.get("amount")) amountInput.value = q.get("amount");
  if (q.get("ref")) refInput.value = q.get("ref");

  if (P.clientId) {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(P.clientId)}&currency=${P.currency || "USD"}&intent=capture`;
    s.onload = () => {
      window.paypal.Buttons({
        style: { color: "black", shape: "rect", label: "pay" },
        onClick: (data, actions) => (form.reportValidity() && amount() ? actions.resolve() : actions.reject()),
        createOrder: (data, actions) =>
          actions.order.create({
            purchase_units: [{
              amount: { currency_code: P.currency || "USD", value: amount() },
              description: `${window.SITE.name}${refInput.value ? " — " + refInput.value : ""}`.slice(0, 127),
              custom_id: [refInput.value, nameInput.value].filter(Boolean).join(" | ").slice(0, 127),
            }],
          }),
        onApprove: (data, actions) =>
          actions.order.capture().then((order) => {
            form.hidden = true;
            buttons.hidden = true;
            show("success", `Payment received — thank you! Your PayPal transaction ID is <strong>${order.id}</strong>. A receipt is on its way to your PayPal email.`);
          }),
        onError: () => show("error", "PayPal couldn't complete the payment. Please try again."),
      }).render(buttons);
    };
    s.onerror = () => show("error", "PayPal checkout couldn't load. Please refresh the page and try again.");
    document.head.appendChild(s);
  } else if (P.meHandle) {
    buttons.innerHTML = `<button type="button" class="btn btn-primary btn-block">Continue to PayPal</button>`;
    buttons.querySelector("button").addEventListener("click", () => {
      if (!form.reportValidity() || !amount()) return;
      window.open(`https://www.paypal.com/paypalme/${encodeURIComponent(P.meHandle)}/${amount()}${P.currency || "USD"}`, "_blank", "noopener");
      show("info", "PayPal opened in a new tab. Please include your name and quote/order number in the PayPal note so we can match your payment.");
    });
  } else {
    show("error", "Online payments aren't switched on yet. Please contact us to pay.");
  }
})();
