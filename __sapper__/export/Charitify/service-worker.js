!function(){"use strict";const n=["client/index.416af70b.js","client/organizations.92d27b06.js","client/charities.8013640d.js","client/_layout.79585687.js","client/client.4a715bcb.js","client/map.a1be2385.js","client/organization.1569bd7f.js","client/charity.dfc9fdea.js","client/index.04b2dce8.js","client/index.8d23e8c0.js","client/client.c3b873a4.js"].concat(["service-worker-index.html",".nojekyll","Robots.txt","android-icon-144x144.png","android-icon-192x192.png","android-icon-36x36.png","android-icon-48x48.png","android-icon-72x72.png","android-icon-96x96.png","apple-icon-114x114.png","apple-icon-120x120.png","apple-icon-144x144.png","apple-icon-152x152.png","apple-icon-180x180.png","apple-icon-57x57.png","apple-icon-60x60.png","apple-icon-72x72.png","apple-icon-76x76.png","apple-icon-precomposed.png","apple-icon.png","browserconfig.xml","button_click.mp3","button_click_min.mp3","favicon-16x16.png","favicon-32x32.png","favicon-512x512.png","favicon-96x96.png","favicon.ico","global.css","manifest.json","mock/charities.json","mock/charity.json","mock/charity_comments.json","mock/organization.json","mock/organization_comments.json","mock/organizations.json","mock/recent_news.json","ms-icon-144x144.png","ms-icon-150x150.png","ms-icon-310x310.png","ms-icon-70x70.png","sitemap.xml"]),e=new Set(n);self.addEventListener("install",e=>{e.waitUntil(caches.open("cache1581176386211").then(e=>e.addAll(n)).then(()=>{self.skipWaiting()}))}),self.addEventListener("activate",n=>{n.waitUntil(caches.keys().then(async n=>{for(const e of n)"cache1581176386211"!==e&&await caches.delete(e);self.clients.claim()}))}),self.addEventListener("fetch",n=>{if("GET"!==n.request.method||n.request.headers.has("range"))return;const c=new URL(n.request.url);c.protocol.startsWith("http")&&(c.hostname===self.location.hostname&&c.port!==self.location.port||(c.host===self.location.host&&e.has(c.pathname)?n.respondWith(caches.match(n.request)):"only-if-cached"!==n.request.cache&&n.respondWith(caches.open("offline1581176386211").then(async e=>{try{const c=await fetch(n.request);return e.put(n.request,c.clone()),c}catch(c){const t=await e.match(n.request);if(t)return t;throw c}}))))})}();
