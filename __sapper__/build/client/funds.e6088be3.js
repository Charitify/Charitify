import{S as t,i as e,s as a,B as s,aa as n,d as r,f as $,q as o,g as i,h as c,l as f,o as m,p as l,u as p,v as u,w as g,a2 as d,ab as h,a4 as w}from"./client.62f4a1b0.js";function b(t){let e;const a=new h({props:{items:t[0],basePath:"funds"}});return{c(){$(a.$$.fragment)},l(t){f(a.$$.fragment,t)},m(t,s){l(a,t,s),e=!0},p(t,e){const s={};1&e&&(s.items=t[0]),a.$set(s)},i(t){e||(p(a.$$.fragment,t),e=!0)},o(t){u(a.$$.fragment,t),e=!1},d(t){g(a,t)}}}function x(t){let e,a,d;const h=new s({props:{size:"50"}}),w=new n({props:{$$slots:{default:[b]},$$scope:{ctx:t}}});return{c(){e=r(),$(h.$$.fragment),a=r(),$(w.$$.fragment),this.h()},l(t){o('[data-svelte="svelte-6bbqlg"]',document.head).forEach(i),e=c(t),f(h.$$.fragment,t),a=c(t),f(w.$$.fragment,t),this.h()},h(){document.title="Charitify - is the application for helping those in need."},m(t,s){m(t,e,s),l(h,t,s),m(t,a,s),l(w,t,s),d=!0},p(t,[e]){const a={};3&e&&(a.$$scope={dirty:e,ctx:t}),w.$set(a)},i(t){d||(p(h.$$.fragment,t),p(w.$$.fragment,t),d=!0)},o(t){u(h.$$.fragment,t),u(w.$$.fragment,t),d=!1},d(t){t&&i(e),g(h,t),t&&i(a),g(w,t)}}}function y(t,e,a){let s=[];return d(async()=>{await new Promise(t=>setTimeout(t,1e3));const t=await w.getFunds();a(0,s=new Array(5).fill(t).reduce((t,e)=>t.concat(...e),[]))}),[s]}export default class extends t{constructor(t){super(),e(this,t,y,x,a,{})}}
