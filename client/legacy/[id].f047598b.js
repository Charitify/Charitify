import{_ as n,a as t,i as a,s as r,b as o,S as e,B as i,ao as c,g as f,h as u,q as s,j as l,k as p,n as h,r as g,u as $,G as m,w as v,x as d,y,a7 as x,a8 as w,z,A as R,O as b,J as k,K as B,ah as M,aa as j,ab as q,ac as D,ap as O,aq as S,ar as A,al as C}from"./client.fdad7730.js";function E(n,t,a){var r=n.slice();return r[6]=t[a],r}function G(n){var t,a=new O({props:{lat:n[6].location.lat,lng:n[6].location.lng}});return a.$on("click",(function(){S(N.bind(null,n[6]))&&N.bind(null,n[6]).apply(this,arguments)})),{c:function(){u(a.$$.fragment)},l:function(n){h(a.$$.fragment,n)},m:function(n,r){$(a,n,r),t=!0},p:function(t,r){n=t;var o={};1&r&&(o.lat=n[6].location.lat),1&r&&(o.lng=n[6].location.lng),a.$set(o)},i:function(n){t||(v(a.$$.fragment,n),t=!0)},o:function(n){d(a.$$.fragment,n),t=!1},d:function(n){y(a,n)}}}function J(n){for(var t,a,r=n[0],o=[],e=0;e<r.length;e+=1)o[e]=G(E(n,r,e));var i=function(n){return d(o[n],1,1,(function(){o[n]=null}))};return{c:function(){for(var n=0;n<o.length;n+=1)o[n].c();t=b()},l:function(n){for(var a=0;a<o.length;a+=1)o[a].l(n);t=b()},m:function(n,r){for(var e=0;e<o.length;e+=1)o[e].m(n,r);g(n,t,r),a=!0},p:function(n,a){if(1&a){var e;for(r=n[0],e=0;e<r.length;e+=1){var c=E(n,r,e);o[e]?(o[e].p(c,a),v(o[e],1)):(o[e]=G(c),o[e].c(),v(o[e],1),o[e].m(t.parentNode,t))}for(k(),e=r.length;e<o.length;e+=1)i(e);B()}},i:function(n){if(!a){for(var t=0;t<r.length;t+=1)v(o[t]);a=!0}},o:function(n){o=o.filter(Boolean);for(var t=0;t<o.length;t+=1)d(o[t]);a=!1},d:function(n){M(o,n),n&&l(t)}}}function K(n){var t,a,r,o=new i({props:{size:"var(--header-height)"}}),e=new c({props:{center:n[2],$$slots:{default:[J]},$$scope:{ctx:n}}});return e.$on("ready",n[3]),{c:function(){t=f(),u(o.$$.fragment),a=f(),u(e.$$.fragment),this.h()},l:function(n){s('[data-svelte="svelte-1vy6te4"]',document.head).forEach(l),t=p(n),h(o.$$.fragment,n),a=p(n),h(e.$$.fragment,n),this.h()},h:function(){document.title="Charitify - Map of organizations."},m:function(n,i){g(n,t,i),$(o,n,i),g(n,a,i),$(e,n,i),r=!0},p:function(n,t){var a=m(t,1)[0],r={};513&a&&(r.$$scope={dirty:a,ctx:n}),e.$set(r)},i:function(n){r||(v(o.$$.fragment,n),v(e.$$.fragment,n),r=!0)},o:function(n){d(o.$$.fragment,n),d(e.$$.fragment,n),r=!1},d:function(n){n&&l(t),y(o,n),n&&l(a),y(e,n)}}}function N(n){return P.apply(this,arguments)}function P(){return(P=j(q.mark((function n(t){return q.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:A("organizations/".concat(t.id));case 1:case"end":return n.stop()}}),n)})))).apply(this,arguments)}function T(n,t,a){var r,o=x().page;w(n,o,(function(n){return a(4,r=n)}));var e=r.params.id,i=[];function c(){return(c=j(q.mark((function n(t){var r,o,c,f;return q.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return r=t.detail,n.t0=a,n.next=4,D.getOrganizations();case 4:n.t1=i=n.sent,(0,n.t0)(0,n.t1),console.log(i),-2,c=[[(o=function(n,t){return Math[n].apply(Math,C(i.map((function(n){return n.location[t]}))))})("min","lng")+-2,o("min","lat")+-2],[o("max","lng")- -2,o("max","lat")- -2]],(f=i.filter((function(n){return n.id===e}))[0])?r.flyTo({center:[f.location.lng,f.location.lat],zoom:10}):r.fitBounds(c);case 12:case"end":return n.stop()}}),n)})))).apply(this,arguments)}return[i,o,void 0,function(n){return c.apply(this,arguments)}]}var _=function(i){n(f,e);var c=function(n){function t(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(n){return!1}}return function(){var a,r=z(n);if(t()){var o=z(this).constructor;a=Reflect.construct(r,arguments,o)}else a=r.apply(this,arguments);return R(this,a)}}(f);function f(n){var e;return t(this,f),e=c.call(this),a(o(e),n,T,K,r,{}),e}return f}();export default _;
