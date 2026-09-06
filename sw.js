const CACHE_NAME = "pulse-rc-github-pages-v56";
const HUB_VERSION = "hub-v4";
const PULSE_VERSION = "pulse-v1";
const PROP_FIRM_VERSION = "pf-v1";
const OPTION_TRAINER_VERSION = "ost-v54";
const APP_SHELL = [
  "./",
  "./index.html",
  `./styles.css?v=${HUB_VERSION}`,
  "./app-icon.svg",
  "./pulse-rc-tracker/",
  "./pulse-rc-tracker/index.html",
  "./pulse-rc-tracker/manifest.webmanifest",
  "./pulse-rc-tracker/app-icon.svg",
  `./pulse-rc-tracker/styles.css?v=${PULSE_VERSION}`,
  `./pulse-rc-tracker/app.js?v=${PULSE_VERSION}`,
  "./prop-firm/",
  "./prop-firm/index.html",
  `./prop-firm/styles.css?v=${PROP_FIRM_VERSION}`,
  `./prop-firm/app.js?v=${PROP_FIRM_VERSION}`,
  "./options-strategy-trainer/",
  "./options-strategy-trainer/index.html",
  `./options-strategy-trainer/styles.css?v=${OPTION_TRAINER_VERSION}`,
  `./options-strategy-trainer/app.js?v=${OPTION_TRAINER_VERSION}`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const wantsFreshCopy =
    request.mode === "navigate" ||
    ["document", "script", "style", "worker"].includes(request.destination);

  if (wantsFreshCopy) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
