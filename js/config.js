// ============================================================
//  SITE SETTINGS — edit this file to update business details.
//  Leave a value as "" to hide it on the site.
// ============================================================
window.SITE = {
  name: "Hillcrest Woodworking",
  tagline: "Custom crawl space doors, shed doors, barn doors, mailboxes & framing — built by hand to fit your place.",

  phone: "",        // e.g. "(555) 123-4567"
  email: "",        // e.g. "hillcrestwoodworking@gmail.com"
  serviceArea: "",  // e.g. "Serving Greenville County and surrounding areas"

  // Form delivery: get a free access key at https://web3forms.com using the
  // email address that should RECEIVE quote/order/schedule requests.
  web3formsKey: "",

  // Scheduling: days of the week customers can't pick (0 = Sunday … 6 = Saturday).
  closedDays: [0],

  // Payments. Fill in clientId to show PayPal checkout buttons
  // (developer.paypal.com → Apps & Credentials → Live → Client ID).
  // meHandle is the fallback PayPal.me name (paypal.me/<meHandle>).
  paypal: {
    clientId: "",
    meHandle: "",
    currency: "USD",
  },
};
