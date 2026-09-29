// ============================================================
//  GALLERY CATEGORIES
//  Photos, prices and descriptions are managed on the Admin page
//  (footer → Admin). Only edit this file to rename or add categories.
//
//  `orderAs` is the matching choice in the Order / Quote forms.
// ============================================================
window.GALLERY = {
  categories: [
    { id: "crawl-space-doors", name: "Crawl Space Doors", orderAs: "Crawl Space Door" },
    { id: "shed-doors",        name: "Shed Doors",        orderAs: "Shed Door" },
    { id: "barn-doors",        name: "Barn Doors",        orderAs: "Barn Door" },
    { id: "mailboxes",         name: "Mailboxes",         orderAs: "Mailbox" },
    { id: "framing",           name: "Framing",           orderAs: "Framing" },
  ],

  // Fallback items shown only if the admin storage can't be reached
  // (e.g. previewing the site with a plain static server). Same format
  // the Admin page saves:
  // { id: "cedar-mailbox", title: "Cedar Mailbox", category: "mailboxes",
  //   price: 185, priceFrom: true, description: "…",
  //   photos: [{ src: "images/gallery/mailboxes/cedar.jpg", thumb: "images/gallery/mailboxes/cedar.jpg" }] }
  items: [],
};
