import{S as t,i as s,s as e,B as a,ak as n,d as r,f as $,q as o,g as c,h as i,l as f,o as l,p as m,u as p,v as g,w as u,a6 as d,al as h,a9 as w}from"./client.27178b64.js";function b(t){let s;const e=new h({props:{items:t[0],basePath:"funds"}});return{c(){$(e.$$.fragment)},l(t){f(e.$$.fragment,t)},m(t,a){m(e,t,a),s=!0},p(t,s){const a={};1&s&&(a.items=t[0]),e.$set(a)},i(t){s||(p(e.$$.fragment,t),s=!0)},o(t){g(e.$$.fragment,t),s=!1},d(t){u(e,t)}}}function x(t){let s,e,d;const h=new a({props:{size:"50"}}),w=new n({props:{$$slots:{default:[b]},$$scope:{ctx:t}}});return{c(){s=r(),$(h.$$.fragment),e=r(),$(w.$$.fragment),this.h()},l(t){o('[data-svelte="svelte-6bbqlg"]',document.head).forEach(c),s=i(t),f(h.$$.fragment,t),e=i(t),f(w.$$.fragment,t),this.h()},h(){document.title="Charitify - is the application for helping those in need."},m(t,a){l(t,s,a),m(h,t,a),l(t,e,a),m(w,t,a),d=!0},p(t,[s]){const e={};3&s&&(e.$$scope={dirty:s,ctx:t}),w.$set(e)},i(t){d||(p(h.$$.fragment,t),p(w.$$.fragment,t),d=!0)},o(t){g(h.$$.fragment,t),g(w.$$.fragment,t),d=!1},d(t){t&&c(s),u(h,t),t&&c(e),u(w,t)}}}function y(t,s,e){let a=[];return d(async()=>{const t=await w.getFunds();e(0,a=new Array(5).fill(t).reduce((t,s)=>t.concat(...s),[]))}),[a]}export default class extends t{constructor(t){super(),s(this,t,y,x,e,{})}}
