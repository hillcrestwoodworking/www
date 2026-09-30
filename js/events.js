// ============================================================
//  EVENTS: craft shows, markets and appearances.
//  Each event disappears from the site automatically once it ends,
//  and the whole Events section hides when nothing is coming up.
//  Times are local Richmond time, written as "YYYY-MM-DDTHH:MM".
// ============================================================
window.EVENTS = [
  {
    title: "Drive Shack Market Day",
    start: "2026-11-15T09:00",
    end: "2026-11-15T18:00",
    venue: "Drive Shack",
    address: "1647 Four Rings Dr, Richmond, VA 23233",
    image: "images/events/drive-shack-market-day.jpg",
    imageAlt: "Drive Shack Market Day flyer: shop local, food trucks, music and fun. 9am to 6pm at Drive Shack, Richmond.",
    description:
      "Hillcrest Woodworking will be at Drive Shack Market Day. Stop by to see our work up close and talk with us about your project. " +
      "Local makers, food trucks and music, and all are welcome.",
  },
];

(function () {
  const section = document.getElementById("events");
  const list = document.getElementById("events-list");
  if (!section || !list) return;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  // Read "YYYY-MM-DDTHH:MM" as-is, so the displayed time never shifts with the visitor's time zone.
  const parts = (s) => {
    const [, y, mo, d, h, mi] = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/).map(Number);
    return { y, mo, d, h, mi };
  };
  const clock = ({ h, mi }) => `${h % 12 || 12}${mi ? ":" + String(mi).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`;
  const icsStamp = ({ y, mo, d, h, mi }) =>
    `${y}${String(mo).padStart(2, "0")}${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}${String(mi).padStart(2, "0")}00`;

  // An event stays up until the end of its end time (visitor's clock; close enough for a day event).
  const upcoming = window.EVENTS
    .filter((ev) => new Date(ev.end || ev.start) > new Date())
    .sort((a, b) => a.start.localeCompare(b.start));
  if (!upcoming.length) return;

  function calendarFile(ev, s, e) {
    const text = (v) => String(v).replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hillcrest Woodworking//Events//EN", "BEGIN:VEVENT",
      `UID:${icsStamp(s)}-${ev.title.replace(/\W+/g, "-").toLowerCase()}@hillcrestwoodworking`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "")}`,
      `DTSTART;TZID=America/New_York:${icsStamp(s)}`,
      `DTEND;TZID=America/New_York:${icsStamp(e)}`,
      `SUMMARY:${text(ev.title)}`,
      `LOCATION:${text([ev.venue, ev.address].filter(Boolean).join(", "))}`,
      `DESCRIPTION:${text(ev.description || "")}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    return URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  }

  list.innerHTML = upcoming.map((ev, i) => {
    const s = parts(ev.start);
    const e = parts(ev.end || ev.start);
    const when = `${MONTHS[s.mo - 1]} ${s.d}, ${s.y} · ${clock(s)}${ev.end ? " – " + clock(e) : ""}`;
    const maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([ev.venue, ev.address].join(", "));
    return `
      <article class="event">
        ${ev.image ? `<a class="event-image" href="${esc(ev.image)}" target="_blank" rel="noopener" aria-label="Open the full event flyer">
          <img src="${esc(ev.image)}" alt="${esc(ev.imageAlt || ev.title)}" loading="lazy">
        </a>` : ""}
        <div class="event-body">
          <div class="event-date" aria-hidden="true">
            <span>${MONTHS[s.mo - 1].slice(0, 3)}</span><strong>${s.d}</strong>
          </div>
          <div>
            <h3>${esc(ev.title)}</h3>
            <p class="event-when">${esc(when)}</p>
            <p class="event-where"><strong>${esc(ev.venue)}</strong><br>${esc(ev.address)}</p>
          </div>
          ${ev.description ? `<p class="event-desc">${esc(ev.description)}</p>` : ""}
          <div class="btn-row event-actions">
            <a class="btn btn-primary btn-sm" href="${maps}" target="_blank" rel="noopener">Get Directions</a>
            <a class="btn btn-outline btn-sm" data-ics="${i}" download="${esc(ev.title.replace(/[^\w ]+/g, ""))}.ics">Add to Calendar</a>
          </div>
        </div>
      </article>`;
  }).join("");

  list.querySelectorAll("[data-ics]").forEach((a) => {
    const ev = upcoming[Number(a.dataset.ics)];
    a.href = calendarFile(ev, parts(ev.start), parts(ev.end || ev.start));
  });
  section.hidden = false;
})();
