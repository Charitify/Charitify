import{_ as n,a as t,b as a,c as e,i as s,s as r,d as i,S as o,a3 as c,g as u,j as f,q as $,k as m,l,o as p,u as h,w as g,N as d,y as v,z as w,A as x,R as y,a4 as b,Z as z,$ as j,a5 as k,a0 as q}from"./client.c84209fa.js";function A(n){var t,a=new b({props:{items:n[0],basePath:"organizations"}});return{c:function(){f(a.$$.fragment)},l:function(n){p(a.$$.fragment,n)},m:function(n,e){g(a,n,e),t=!0},p:function(n,t){var e={};1&t&&(e.items=n[0]),a.$set(e)},i:function(n){t||(v(a.$$.fragment,n),t=!0)},o:function(n){w(a.$$.fragment,n),t=!1},d:function(n){x(a,n)}}}function P(n){var t,a,e=new c({props:{$$slots:{default:[A]},$$scope:{ctx:n}}});return{c:function(){t=u(),f(e.$$.fragment),this.h()},l:function(n){$('[data-svelte="svelte-6bbqlg"]',document.head).forEach(m),t=l(n),p(e.$$.fragment,n),this.h()},h:function(){document.title="Charitify - is the application for helping those in need."},m:function(n,s){h(n,t,s),g(e,n,s),a=!0},p:function(n,t){var a=d(t,1)[0],s={};3&a&&(s.$$scope={dirty:a,ctx:n}),e.$set(s)},i:function(n){a||(v(e.$$.fragment,n),a=!0)},o:function(n){w(e.$$.fragment,n),a=!1},d:function(n){n&&m(t),x(e,n)}}}function C(n,t,a){var e=[];return y(z(j.mark((function n(){var t;return j.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return n.next=2,new Promise((function(n){return setTimeout(n,1e3)}));case 2:return n.next=4,q.getOrganizations();case 4:t=n.sent,a(0,e=new Array(1).fill(t).reduce((function(n,t){return n.concat.apply(n,k(t))}),[]));case 6:case"end":return n.stop()}}),n)})))),[e]}var E=function(c){function u(n){var o;return t(this,u),o=a(this,e(u).call(this)),s(i(o),n,C,P,r,{}),o}return n(u,o),u}();export default E;
