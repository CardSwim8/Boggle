/* Offline cache for the Boggle board.
   First visit (online): saves the page and dictionary on the device.
   Later visits: opens instantly from the saved copy, even offline, and quietly checks
   the website for updates in the background (picked up on the next launch).
   If you change the list of files below, also change CACHE so devices refresh it. */
const CACHE = "boggle-v1";
const FILES = ["./", "./index.html", "./dict-words.bin", "./dict-defs.bin",
               "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((hit) => {
        const update = fetch(req)
          .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
          .catch(() => hit);
        if (hit) { e.waitUntil(update); return hit; }   // saved copy now, refresh in background
        return update;                                    // not saved yet: go to the network
      })
    )
  );
});
