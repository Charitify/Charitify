import{_ as n,a as t,b as a,c as e,i as s,s as r,d as i,S as o,X as c,f,h as u,q as $,j as m,k as p,n as l,r as d,u as h,w as g,x as v,y as x,z as w,W as y,Y as b,M as j,N as k,O as q}from"./client.65144cae.js";import{a as z}from"./index.d0f06daf.js";function O(n){var t,a=new b({props:{items:n[0]}});return{c:function(){u(a.$$.fragment)},l:function(n){l(a.$$.fragment,n)},m:function(n,e){h(a,n,e),t=!0},p:function(n,t){var e={};1&t&&(e.items=n[0]),a.$set(e)},i:function(n){t||(v(a.$$.fragment,n),t=!0)},o:function(n){x(a.$$.fragment,n),t=!1},d:function(n){w(a,n)}}}function A(n){var t,a,e=new c({props:{$$slots:{default:[O]},$$scope:{ctx:n}}});return{c:function(){t=f(),u(e.$$.fragment),this.h()},l:function(n){$('[data-svelte="svelte-6bbqlg"]',document.head).forEach(m),t=p(n),l(e.$$.fragment,n),this.h()},h:function(){document.title="Charitify - is the application for helping those in need."},m:function(n,s){d(n,t,s),h(e,n,s),a=!0},p:function(n,t){var a=g(t,1)[0],s={};3&a&&(s.$$scope={dirty:a,ctx:n}),e.$set(s)},i:function(n){a||(v(e.$$.fragment,n),a=!0)},o:function(n){x(e.$$.fragment,n),a=!1},d:function(n){n&&m(t),w(e,n)}}}function C(n,t,a){var e=[];return y(j(k.mark((function n(){var t;return k.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,new Promise((function(n){return setTimeout(n,1e3)}));case 2:return n.next=4,z.getOrganizations();case 4:t=n.sent,a(0,e=new Array(1).fill(t).reduce((function(n,t){return n.concat.apply(n,q(t))}),[]));case 6:case"end":return n.stop()}}),n)})))),[e]}var E=function(c){function f(n){var o;return t(this,f),o=a(this,e(f).call(this)),s(i(o),n,C,A,r,{}),o}return n(f,o),f}();export default E;