import{S as t,i as e,s as a,B as s,a0 as n,d as r,f as o,q as i,g as $,h as c,l as f,o as m,p as l,u as g,v as p,w as u,Q as h,a1 as d,U as w}from"./client.fe9090e2.js";function x(t){let e;const a=new d({props:{items:t[0],basePath:"organizations"}});return{c(){o(a.$$.fragment)},l(t){f(a.$$.fragment,t)},m(t,s){l(a,t,s),e=!0},p(t,e){const s={};1&e&&(s.items=t[0]),a.$set(s)},i(t){e||(g(a.$$.fragment,t),e=!0)},o(t){p(a.$$.fragment,t),e=!1},d(t){u(a,t)}}}function y(t){let e,a,h;const d=new s({props:{size:"50"}}),w=new n({props:{$$slots:{default:[x]},$$scope:{ctx:t}}});return{c(){e=r(),o(d.$$.fragment),a=r(),o(w.$$.fragment),this.h()},l(t){i('[data-svelte="svelte-6bbqlg"]',document.head).forEach($),e=c(t),f(d.$$.fragment,t),a=c(t),f(w.$$.fragment,t),this.h()},h(){document.title="Charitify - is the application for helping those in need."},m(t,s){m(t,e,s),l(d,t,s),m(t,a,s),l(w,t,s),h=!0},p(t,[e]){const a={};3&e&&(a.$$scope={dirty:e,ctx:t}),w.$set(a)},i(t){h||(g(d.$$.fragment,t),g(w.$$.fragment,t),h=!0)},o(t){p(d.$$.fragment,t),p(w.$$.fragment,t),h=!1},d(t){t&&$(e),u(d,t),t&&$(a),u(w,t)}}}function b(t,e,a){let s=[];return h(async()=>{await new Promise(t=>setTimeout(t,1e3));const t=await w.getOrganizations();a(0,s=new Array(1).fill(t).reduce((t,e)=>t.concat(...e),[]))}),[s]}export default class extends t{constructor(t){super(),e(this,t,b,y,a,{})}}
