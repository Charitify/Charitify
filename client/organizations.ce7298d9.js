import{S as t,i as a,s as e,B as s,aa as n,d as r,f as o,q as i,g as $,h as c,l as f,o as m,p as l,u as g,v as p,w as u,a2 as h,ab as d,a4 as w}from"./client.f64fc256.js";function b(t){let a;const e=new d({props:{items:t[0],basePath:"organizations"}});return{c(){o(e.$$.fragment)},l(t){f(e.$$.fragment,t)},m(t,s){l(e,t,s),a=!0},p(t,a){const s={};1&a&&(s.items=t[0]),e.$set(s)},i(t){a||(g(e.$$.fragment,t),a=!0)},o(t){p(e.$$.fragment,t),a=!1},d(t){u(e,t)}}}function x(t){let a,e,h;const d=new s({props:{size:"50"}}),w=new n({props:{$$slots:{default:[b]},$$scope:{ctx:t}}});return{c(){a=r(),o(d.$$.fragment),e=r(),o(w.$$.fragment),this.h()},l(t){i('[data-svelte="svelte-6bbqlg"]',document.head).forEach($),a=c(t),f(d.$$.fragment,t),e=c(t),f(w.$$.fragment,t),this.h()},h(){document.title="Charitify - is the application for helping those in need."},m(t,s){m(t,a,s),l(d,t,s),m(t,e,s),l(w,t,s),h=!0},p(t,[a]){const e={};3&a&&(e.$$scope={dirty:a,ctx:t}),w.$set(e)},i(t){h||(g(d.$$.fragment,t),g(w.$$.fragment,t),h=!0)},o(t){p(d.$$.fragment,t),p(w.$$.fragment,t),h=!1},d(t){t&&$(a),u(d,t),t&&$(e),u(w,t)}}}function y(t,a,e){let s=[];return h(async()=>{await new Promise(t=>setTimeout(t,1e3));const t=await w.getOrganizations();e(0,s=new Array(1).fill(t).reduce((t,a)=>t.concat(...a),[]))}),[s]}export default class extends t{constructor(t){super(),a(this,t,y,x,e,{})}}
