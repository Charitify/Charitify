import{a as n,b as a,c as t,d as o,i as s,s as e,e as c,S as i,y as r,z as u,A as l,B as p,t as f,f as m,v as d,h,j as v,k as x,l as b,o as j,x as g,M as w,X as $,$ as y,a0 as M,q as k,L as C,a1 as N}from"./index.83e6dc7c.js";import"./_commonjsHelpers.24e35f0d.js";import{_ as T,a as z}from"./asyncToGenerator.a45dcf86.js";var I=M.document;function A(n){var a,t=n[5].default,o=k(t,n,n[4],null);return{c:function(){o&&o.c()},l:function(n){o&&o.l(n)},m:function(n,t){o&&o.m(n,t),a=!0},p:function(n,a){o&&o.p&&16&a&&o.p(r(t,n,n[4],null),u(t,n[4],a,null))},i:function(n){a||(l(o,n),a=!0)},o:function(n){p(o,n),a=!1},d:function(n){o&&o.d(n)}}}function E(n){var a,t,o,s=n[0]&&A(n);return{c:function(){a=f(),t=m("section"),s&&s.c(),this.h()},l:function(n){a=d(n),t=h(n,"SECTION",{class:!0});var o=v(t);s&&s.l(o),o.forEach(x),this.h()},h:function(){I.title="Charitify - Map of organizations.",b(t,"class","svelte-1tw6as9")},m:function(e,c){j(e,a,c),j(e,t,c),s&&s.m(t,null),n[6](t),o=!0},p:function(n,a){var o=g(a,1)[0];n[0]?s?(s.p(n,o),l(s,1)):((s=A(n)).c(),l(s,1),s.m(t,null)):s&&(C(),p(s,1,1,function(){s=null}),w())},i:function(n){o||(l(s),o=!0)},o:function(n){p(s),o=!1},d:function(o){o&&x(a),o&&x(t),s&&s.d(),n[6](null)}}}function G(n,a,t){var o,s,e,c;$(T(z.mark(function n(){return z.wrap(function(n){for(;;)switch(n.prev=n.next){case 0:(e=document.createElement("script")).type="text/javascript",e.src="https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.js",(c=document.createElement("link")).rel="stylesheet",c.href="https://api.mapbox.com/mapbox-gl-js/v1.7.0/mapbox-gl.css",e.onload=function(){mapboxgl.accessToken="pk.eyJ1IjoiYnVibGlrIiwiYSI6ImNrNXpxdzgxbTAwNnczbGxweG0wcTV3cjAifQ.rt1peLjCQHZUkrM4AWz5Mw",c.onload=function(){t(0,o=new mapboxgl.Map({container:s,style:"mapbox://styles/mapbox/streets-v11"}));for(var n=0;n<100;n+=1){var a=360*Math.random()-180,e=180*Math.random()-90;(new mapboxgl.Marker).setLngLat([a,e]).addTo(o)}},document.head.appendChild(c)},document.body.appendChild(e);case 8:case"end":return n.stop()}},n)}))),y(function(){o.remove(),c.parentNode.removeChild(c),e.parentNode.removeChild(e)});var i=a.$$slots,r=void 0===i?{}:i,u=a.$$scope;return n.$set=function(n){"$$scope"in n&&t(4,u=n.$$scope)},[o,s,e,c,u,r,function(n){N[n?"unshift":"push"](function(){t(1,s=n)})}]}export default(function(r){function u(n){var i;return a(this,u),i=t(this,o(u).call(this)),s(c(i),n,G,E,e,{}),i}return n(u,i),u}());
