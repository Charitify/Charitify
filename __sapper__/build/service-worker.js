!function(){"use strict";const e=["client/about.8af983db.js","client/[slug].043f3995.js","client/index.5a7f8540.js","client/index.827b383e.js","client/client.adac6645.js","client/index.c7bcf8e3.js","client/index.2dd7c57b.js"].concat(["service-worker-index.html","Robots.txt","browserconfig.xml","favicon.png","global.css","great-success.png","logo-192.png","logo-512.png","manifest.json","sitemap.xml"]),t=new Set(e);self.addEventListener("install",t=>{t.waitUntil(caches.open("cache1578664466575").then(t=>t.addAll(e)).then(()=>{self.skipWaiting()}))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(async e=>{for(const t of e)"cache1578664466575"!==t&&await caches.delete(t);self.clients.claim()}))}),self.addEventListener("fetch",e=>{if("GET"!==e.request.method||e.request.headers.has("range"))return;const s=new URL(e.request.url);s.protocol.startsWith("http")&&(s.hostname===self.location.hostname&&s.port!==self.location.port||(s.host===self.location.host&&t.has(s.pathname)?e.respondWith(caches.match(e.request)):"only-if-cached"!==e.request.cache&&e.respondWith(caches.open("offline1578664466575").then(async t=>{try{const s=await fetch(e.request);return t.put(e.request,s.clone()),s}catch(s){const n=await t.match(e.request);if(n)return n;throw s}}))))})}();
