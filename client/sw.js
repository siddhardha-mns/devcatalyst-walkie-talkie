// sw.js — Service Worker for background audio keep-alive
// Keeps audio context alive when tab is backgrounded

const CACHE_NAME = "walkie-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// Keep-alive ping from main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "KEEP_ALIVE") {
    event.ports[0]?.postMessage({ type: "ALIVE" });
  }

  if (event.data && event.data.type === "AUDIO_NOTIFY") {
    // Send notification if app is not focused
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      const anyFocused = clientList.some((c) => c.focused);
      if (!anyFocused && Notification.permission === "granted") {
        self.registration.showNotification("📻 Incoming transmission", {
          body: `${event.data.username} is speaking`,
          icon: "/icon.png",
          tag: "walkie-incoming",
          silent: true,
          renotify: false,
        });
      }
    });
  }
});
