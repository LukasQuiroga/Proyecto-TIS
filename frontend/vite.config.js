import { defineConfig } from "vite";
import { createHash } from "node:crypto";

import react from "@vitejs/plugin-react";

const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8080";

function offlineServiceWorker() {
  return {
    name: "exampass-offline-service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
      const assets = Object.keys(bundle)
        .filter((fileName) => fileName !== "sw.js")
        .map((fileName) => `/${fileName}`);
      const staticUrls = [
        "/manifest.webmanifest",
        "/icons/exampass-192.png",
        "/icons/exampass-512.png",
        "/icons/exampass.svg",
      ];
      const cacheVersion = createHash("sha256")
        .update(assets.join("|"))
        .digest("hex")
        .slice(0, 12);
      const precacheUrls = JSON.stringify(["/", ...assets, ...staticUrls]);

      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const CACHE_NAME = "exampass-shell-${cacheVersion}";
const PRECACHE_URLS = ${precacheUrls};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("exampass-shell-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) return response;
          return (await caches.match("/index.html")) || response;
        })
        .catch(async () => {
          return (await caches.match("/index.html")) || (await caches.match("/"));
        }),
    );
    return;
  }

  const isAppAsset =
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest";

  if (!isAppAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }

        return response;
      });
    }),
  );
});
`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), offlineServiceWorker()],

  server: {
    proxy: {
      "/api": {
        target: proxyTarget,

        changeOrigin: true,
      },
    },
  },
});
