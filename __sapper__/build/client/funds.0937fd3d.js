import{S as t,i as e,s as a,B as s,ac as n,d as r,f as $,q as o,g as i,h as c,l as f,o as m,p as l,u as d,v as p,w as u,a8 as g,ad as h,aa as w}from"./client.d111fa9f.js";function x(t){let e;const a=new h({props:{items:t[0],basePath:"funds"}});return{c(){$(a.$$.fragment)},l(t){f(a.$$.fragment,t)},m(t,s){l(a,t,s),e=!0},p(t,e){const s={};1&e&&(s.items=t[0]),a.$set(s)},i(t){e||(d(a.$$.fragment,t),e=!0)},o(t){p(a.$$.fragment,t),e=!1},d(t){u(a,t)}}}function y(t){let e,a,g;const h=new s({props:{size:"50"}}),w=new n({props:{$$slots:{default:[x]},$$scope:{ctx:t}}});return{c(){e=r(),$(h.$$.fragment),a=r(),$(w.$$.fragment),this.h()},l(t){o('[data-svelte="svelte-6bbqlg"]',document.head).forEach(i),e=c(t),f(h.$$.fragment,t),a=c(t),f(w.$$.fragment,t),this.h()},h(){document.title="Charitify - is the application for helping those in need."},m(t,s){m(t,e,s),l(h,t,s),m(t,a,s),l(w,t,s),g=!0},p(t,[e]){const a={};3&e&&(a.$$scope={dirty:e,ctx:t}),w.$set(a)},i(t){g||(d(h.$$.fragment,t),d(w.$$.fragment,t),g=!0)},o(t){p(h.$$.fragment,t),p(w.$$.fragment,t),g=!1},d(t){t&&i(e),u(h,t),t&&i(a),u(w,t)}}}function b(t,e,a){let s=[];return g(async()=>{await new Promise(t=>setTimeout(t,1e3));const t=await w.getFunds();a(0,s=new Array(5).fill(t).reduce((t,e)=>t.concat(...e),[]))}),[s]}export default class extends t{constructor(t){super(),e(this,t,b,y,a,{})}}
