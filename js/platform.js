// Tags <html> with the visitor's platform so CSS can apply iOS / Android tweaks:
//   .ios | .android | .desktop, plus .touch and .standalone (opened from the home screen).
// Layout itself is responsive (media queries); these classes only handle platform quirks.
(function () {
  const root = document.documentElement;
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so also check for a touch screen.
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  root.classList.add(isIOS ? "ios" : isAndroid ? "android" : "desktop");
  if (navigator.maxTouchPoints > 0 || "ontouchstart" in window) root.classList.add("touch");
  if (navigator.standalone || window.matchMedia("(display-mode: standalone)").matches) {
    root.classList.add("standalone");
  }

  window.PLATFORM = { ios: isIOS, android: isAndroid };
})();
