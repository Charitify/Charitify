!function(){"use strict";const n=["client/index.664cb43e.js","client/organizations.6d6a9459.js","client/funds.a3e6d130.js","client/[id].b7fd4359.js","client/index.cf63d068.js","client/client.56b7e7ce.js","client/[id].f4b3e0b3.js","client/index.99d43ba2.js","client/me.3334f28d.js","client/[id].47b3d87c.js","client/[id].95b1531d.js","client/client.e99b7ef3.js"].concat(["service-worker-index.html","Robots.txt","android-icon-144x144.png","android-icon-192x192.png","android-icon-36x36.png","android-icon-48x48.png","android-icon-72x72.png","android-icon-96x96.png","apple-icon-114x114.png","apple-icon-120x120.png","apple-icon-144x144.png","apple-icon-152x152.png","apple-icon-180x180.png","apple-icon-57x57.png","apple-icon-60x60.png","apple-icon-72x72.png","apple-icon-76x76.png","apple-icon-precomposed.png","apple-icon.png","assets/dimsirka.jpg","browserconfig.xml","button_click.mp3","button_click_min.mp3","favicon-16x16.png","favicon-32x32.png","favicon-512x512.png","favicon-96x96.png","favicon.ico","global.css","manifest.json","mock/charities.json","mock/charity.json","mock/comments.json","mock/organization.json","mock/organizations.json","mock/progress.json","mock/recent_news.json","mock/user.json","mock/users.json","ms-icon-144x144.png","ms-icon-150x150.png","ms-icon-310x310.png","ms-icon-70x70.png","sitemap.xml"]),e=new Set(n);self.addEventListener("install",e=>{e.waitUntil(caches.open("cache1586018808097").then(e=>e.addAll(n)).then(()=>{self.skipWaiting()}))}),self.addEventListener("activate",n=>{n.waitUntil(caches.keys().then(async n=>{for(const e of n)"cache1586018808097"!==e&&await caches.delete(e);self.clients.claim()}))}),self.addEventListener("fetch",n=>{if("GET"!==n.request.method||n.request.headers.has("range"))return;const c=new URL(n.request.url);c.protocol.startsWith("http")&&(c.hostname===self.location.hostname&&c.port!==self.location.port||(c.host===self.location.host&&e.has(c.pathname)?n.respondWith(caches.match(n.request)):"only-if-cached"!==n.request.cache&&n.respondWith(caches.open("offline1586018808097").then(async e=>{try{const c=await fetch(n.request);return e.put(n.request,c.clone()),c}catch(c){const o=await e.match(n.request);if(o)return o;throw c}}))))})}();
