import{_ as n,a as t,i as a,s as r,b as e,S as o,ac as i,e as c,g as u,q as f,h as s,j as l,m as p,p as h,u as g,O as m,w as $,x as v,y as d,Q as y,z as x,A as w,ad as R,ab as b,a8 as z,a9 as k,$ as M,a0 as j,a1 as B,ae as D,af as O,ag as P,a6 as S}from"./client.9e63a216.js";function q(n,t,a){var r=n.slice();return r[3]=t[a],r}function A(n){var t,a=new D({props:{lat:n[3].location.lat,lng:n[3].location.lng}});return a.$on("click",(function(){O(N.bind(null,n[3]))&&N.bind(null,n[3]).apply(this,arguments)})),{c:function(){u(a.$$.fragment)},l:function(n){p(a.$$.fragment,n)},m:function(n,r){g(a,n,r),t=!0},p:function(t,r){n=t;var e={};1&r&&(e.lat=n[3].location.lat),1&r&&(e.lng=n[3].location.lng),a.$set(e)},i:function(n){t||($(a.$$.fragment,n),t=!0)},o:function(n){v(a.$$.fragment,n),t=!1},d:function(n){d(a,n)}}}function C(n){for(var t,a,r=n[0],e=[],o=0;o<r.length;o+=1)e[o]=A(q(n,r,o));var i=function(n){return v(e[n],1,1,(function(){e[n]=null}))};return{c:function(){for(var n=0;n<e.length;n+=1)e[n].c();t=R()},l:function(n){for(var a=0;a<e.length;a+=1)e[a].l(n);t=R()},m:function(n,r){for(var o=0;o<e.length;o+=1)e[o].m(n,r);h(n,t,r),a=!0},p:function(n,a){if(1&a){var o;for(r=n[0],o=0;o<r.length;o+=1){var c=q(n,r,o);e[o]?(e[o].p(c,a),$(e[o],1)):(e[o]=A(c),e[o].c(),$(e[o],1),e[o].m(t.parentNode,t))}for(b(),o=r.length;o<e.length;o+=1)i(o);z()}},i:function(n){if(!a){for(var t=0;t<r.length;t+=1)$(e[t]);a=!0}},o:function(n){e=e.filter(Boolean);for(var t=0;t<e.length;t+=1)v(e[t]);a=!1},d:function(n){k(e,n),n&&s(t)}}}function E(n){var t,a,r=new i({props:{$$slots:{default:[C]},$$scope:{ctx:n}}});return r.$on("ready",n[1]),{c:function(){t=c(),u(r.$$.fragment),this.h()},l:function(n){f('[data-svelte="svelte-1vy6te4"]',document.head).forEach(s),t=l(n),p(r.$$.fragment,n),this.h()},h:function(){document.title="Charitify - Map of organizations."},m:function(n,e){h(n,t,e),g(r,n,e),a=!0},p:function(n,t){var a=m(t,1)[0],e={};65&a&&(e.$$scope={dirty:a,ctx:n}),r.$set(e)},i:function(n){a||($(r.$$.fragment,n),a=!0)},o:function(n){v(r.$$.fragment,n),a=!1},d:function(n){n&&s(t),d(r,n)}}}function N(n){return Q.apply(this,arguments)}function Q(){return(Q=M(j.mark((function n(t){return j.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:P("organizations/".concat(t.id));case 1:case"end":return n.stop()}}),n)})))).apply(this,arguments)}function T(n,t,a){y().page;var r=[];function e(){return(e=M(j.mark((function n(t){var e,o,i;return j.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return e=t.detail,n.next=3,new Promise((function(n){return setTimeout(n,2e3)}));case 3:return n.t0=a,n.next=6,B.getOrganizations();case 6:n.t1=r=n.sent,(0,n.t0)(0,n.t1),console.log(r),-2,i=[[(o=function(n,t){return Math[n].apply(Math,S(r.map((function(n){return n.location[t]}))))})("min","lng")+-2,o("min","lat")+-2],[o("max","lng")- -2,o("max","lat")- -2]],e.fitBounds(i);case 13:case"end":return n.stop()}}),n)})))).apply(this,arguments)}return[r,function(n){return e.apply(this,arguments)}]}var _=function(i){n(u,o);var c=function(n){function t(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(n){return!1}}return function(){var a,r=x(n);if(t()){var e=x(this).constructor;a=Reflect.construct(r,arguments,e)}else a=r.apply(this,arguments);return w(this,a)}}(u);function u(n){var o;return t(this,u),o=c.call(this),a(e(o),n,T,E,r,{}),o}return u}();export default _;
