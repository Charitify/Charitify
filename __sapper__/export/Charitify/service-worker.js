!function(){"use strict";const n=["client/index.4c187db8.js","client/funds.0130d7bf.js","client/organizations.86b16dc5.js","client/[id].8dfb0a34.js","client/index.b44a4f56.js","client/index.1b2219c6.js","client/client.35f178ff.js","client/[id].c2756662.js","client/me.f5f52c31.js","client/[id].2808bc13.js","client/[id].e796945b.js","client/client.9b194906.js"].concat(["service-worker-index.html","Robots.txt","android-icon-144x144.png","android-icon-192x192.png","android-icon-36x36.png","android-icon-48x48.png","android-icon-72x72.png","android-icon-96x96.png","apple-icon-114x114.png","apple-icon-120x120.png","apple-icon-144x144.png","apple-icon-152x152.png","apple-icon-180x180.png","apple-icon-57x57.png","apple-icon-60x60.png","apple-icon-72x72.png","apple-icon-76x76.png","apple-icon-precomposed.png","apple-icon.png","assets/dimsirka.jpg","browserconfig.xml","button_click.mp3","button_click_min.mp3","favicon-16x16.png","favicon-32x32.png","favicon-512x512.png","favicon-96x96.png","favicon.ico","global.css","manifest.json","mock/comments.json","mock/fund.json","mock/funds.json","mock/organization.json","mock/organizations.json","mock/progress.json","mock/recent_news.json","mock/user.json","mock/users.json","ms-icon-144x144.png","ms-icon-150x150.png","ms-icon-310x310.png","ms-icon-70x70.png","sitemap.xml"]),e=new Set(n);self.addEventListener("install",e=>{e.waitUntil(caches.open("cache1589226078856").then(e=>e.addAll(n)).then(()=>{self.skipWaiting()}))}),self.addEventListener("activate",n=>{n.waitUntil(caches.keys().then(async n=>{for(const e of n)"cache1589226078856"!==e&&await caches.delete(e);self.clients.claim()}))}),self.addEventListener("fetch",n=>{if("GET"!==n.request.method||n.request.headers.has("range"))return;const c=new URL(n.request.url);c.protocol.startsWith("http")&&(c.hostname===self.location.hostname&&c.port!==self.location.port||(c.host===self.location.host&&e.has(c.pathname)?n.respondWith(caches.match(n.request)):"only-if-cached"!==n.request.cache&&n.respondWith(caches.open("offline1589226078856").then(async e=>{try{const c=await fetch(n.request);return e.put(n.request,c.clone()),c}catch(c){if("Failed to fetch"===c.message)try{let n=null;const e=document.querySelector("#offline-message");n||(e.classList.add("active"),n=setTimeout(()=>{e.classList.remove("active"),clearTimeout(n)},5e3))}catch(n){console.warn(n)}const t=await e.match(n.request);if(t)return t;throw c}}))))})}();
