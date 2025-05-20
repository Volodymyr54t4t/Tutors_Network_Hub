// Service Worker to clear caches and prevent caching
const CACHE_VERSION = "v" + Date.now();

// On install - clear all existing caches
self.addEventListener("install", (event) => {
  console.log("Cache clearer service worker installing");

  // Skip waiting to activate immediately
  self.skipWaiting();

  // Clear all caches
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          console.log("Deleting cache:", cacheName);
          return caches.delete(cacheName);
        })
      )
    )
  );
});

// On activate - claim clients and clear caches again
self.addEventListener("activate", (event) => {
  console.log("Cache clearer service worker activating");

  // Claim clients to control all open pages
  event.waitUntil(clients.claim());

  // Clear all caches again
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      )
  );
});

// Intercept all fetch requests
self.addEventListener("fetch", (event) => {
  // Add cache busting parameter to all requests
  const url = new URL(event.request.url);

  // Skip for same-origin navigations (main HTML pages)
  if (
    event.request.mode === "navigate" &&
    url.origin === self.location.origin
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For all other requests, add a timestamp to bust cache
  url.searchParams.set("_sw_cache_buster", Date.now());

  const bustedRequest = new Request(url.toString(), {
    method: event.request.method,
    headers: event.request.headers,
    mode: event.request.mode,
    credentials: event.request.credentials,
    redirect: event.request.redirect,
    referrer: event.request.referrer,
    integrity: event.request.integrity,
  });

  // Always go to network, never use cache
  event.respondWith(
    fetch(bustedRequest, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }).catch((error) => {
      console.error("Fetch failed:", error);
      return new Response("Network error occurred", {
        status: 503,
        statusText: "Service Unavailable",
        headers: new Headers({
          "Content-Type": "text/plain",
        }),
      });
    })
  );
});

// Periodically clear caches (every 5 minutes)
setInterval(() => {
  caches.keys().then((cacheNames) =>
    Promise.all(
      cacheNames.map((cacheName) => {
        console.log("Periodic cache deletion:", cacheName);
        return caches.delete(cacheName);
      })
    )
  );
}, 5 * 60 * 1000);
