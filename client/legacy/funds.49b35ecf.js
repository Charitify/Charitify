import{_ as t,a as n,i as e,s as r,b as a,S as s,B as c,al as f,g as i,h as o,q as u,j as $,k as l,n as p,r as m,u as h,G as g,w as d,x as v,y,af as w,z as x,A as b,am as R,ag as P,ah as j,an as k,ai as q}from"./client.571bfe26.js";function z(t){var n,e=new R({props:{items:t[0],basePath:"funds"}});return{c:function(){o(e.$$.fragment)},l:function(t){p(e.$$.fragment,t)},m:function(t,r){h(e,t,r),n=!0},p:function(t,n){var r={};1&n&&(r.items=t[0]),e.$set(r)},i:function(t){n||(d(e.$$.fragment,t),n=!0)},o:function(t){v(e.$$.fragment,t),n=!1},d:function(t){y(e,t)}}}function A(t){var n,e,r,a=new c({props:{size:"50"}}),s=new f({props:{$$slots:{default:[z]},$$scope:{ctx:t}}});return{c:function(){n=i(),o(a.$$.fragment),e=i(),o(s.$$.fragment),this.h()},l:function(t){u('[data-svelte="svelte-6bbqlg"]',document.head).forEach($),n=l(t),p(a.$$.fragment,t),e=l(t),p(s.$$.fragment,t),this.h()},h:function(){document.title="Charitify - is the application for helping those in need."},m:function(t,c){m(t,n,c),h(a,t,c),m(t,e,c),h(s,t,c),r=!0},p:function(t,n){var e=g(n,1)[0],r={};3&e&&(r.$$scope={dirty:e,ctx:t}),s.$set(r)},i:function(t){r||(d(a.$$.fragment,t),d(s.$$.fragment,t),r=!0)},o:function(t){v(a.$$.fragment,t),v(s.$$.fragment,t),r=!1},d:function(t){t&&$(n),y(a,t),t&&$(e),y(s,t)}}}function D(t,n,e){var r=[];return w(P(j.mark((function t(){var n;return j.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,new Promise((function(t){return setTimeout(t,1e3)}));case 2:return t.next=4,q.getFunds();case 4:n=t.sent,e(0,r=new Array(5).fill(n).reduce((function(t,n){return t.concat.apply(t,k(n))}),[]));case 6:case"end":return t.stop()}}),t)})))),[r]}var S=function(c){t(i,s);var f=function(t){function n(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}return function(){var e,r=x(t);if(n()){var a=x(this).constructor;e=Reflect.construct(r,arguments,a)}else e=r.apply(this,arguments);return b(this,e)}}(i);function i(t){var s;return n(this,i),s=f.call(this),e(a(s),t,D,A,r,{}),s}return i}();export default S;