!function(){"use strict";const n=["client/index.f27b1985.js","client/organizations.c7e6d712.js","client/funds.4211164b.js","client/[id].db3940db.js","client/index.aa6d705c.js","client/client.4a4848ff.js","client/index.8878a394.js","client/[id].711c1f3c.js","client/me.1f0ba5be.js","client/[id].4c6a77bf.js","client/[id].05b7a867.js","client/client.043af0b8.js"].concat(["service-worker-index.html","Robots.txt","android-icon-144x144.png","android-icon-192x192.png","android-icon-36x36.png","android-icon-48x48.png","android-icon-72x72.png","android-icon-96x96.png","apple-icon-114x114.png","apple-icon-120x120.png","apple-icon-144x144.png","apple-icon-152x152.png","apple-icon-180x180.png","apple-icon-57x57.png","apple-icon-60x60.png","apple-icon-72x72.png","apple-icon-76x76.png","apple-icon-precomposed.png","apple-icon.png","assets/dimsirka.jpg","browserconfig.xml","button_click.mp3","button_click_min.mp3","favicon-16x16.png","favicon-32x32.png","favicon-512x512.png","favicon-96x96.png","favicon.ico","global.css","manifest.json","mock/charities.json","mock/charity.json","mock/comments.json","mock/organization.json","mock/organizations.json","mock/progress.json","mock/recent_news.json","mock/user.json","mock/users.json","ms-icon-144x144.png","ms-icon-150x150.png","ms-icon-310x310.png","ms-icon-70x70.png","sitemap.xml"]),e=new Set(n);self.addEventListener("install",e=>{e.waitUntil(caches.open("cache1585427443681").then(e=>e.addAll(n)).then(()=>{self.skipWaiting()}))}),self.addEventListener("activate",n=>{n.waitUntil(caches.keys().then(async n=>{for(const e of n)"cache1585427443681"!==e&&await caches.delete(e);self.clients.claim()}))}),self.addEventListener("fetch",n=>{if("GET"!==n.request.method||n.request.headers.has("range"))return;const c=new URL(n.request.url);c.protocol.startsWith("http")&&(c.hostname===self.location.hostname&&c.port!==self.location.port||(c.host===self.location.host&&e.has(c.pathname)?n.respondWith(caches.match(n.request)):"only-if-cached"!==n.request.cache&&n.respondWith(caches.open("offline1585427443681").then(async e=>{try{const c=await fetch(n.request);return e.put(n.request,c.clone()),c}catch(c){const o=await e.match(n.request);if(o)return o;throw c}}))))})}();
