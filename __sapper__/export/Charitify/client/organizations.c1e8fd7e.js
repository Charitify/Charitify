import{S as t,i as s,s as e,X as a,c as n,d as o,q as r,f as i,g as c,k as $,n as f,p as l,u as m,v as p,w as u,K as g,Y as d,U as h}from"./client.1241592c.js";function w(t){let s;const e=new d({props:{items:t[0],basePath:"organizations"}});return{c(){o(e.$$.fragment)},l(t){$(e.$$.fragment,t)},m(t,a){l(e,t,a),s=!0},p(t,s){const a={};1&s&&(a.items=t[0]),e.$set(a)},i(t){s||(m(e.$$.fragment,t),s=!0)},o(t){p(e.$$.fragment,t),s=!1},d(t){u(e,t)}}}function x(t){let s,e;const g=new a({props:{$$slots:{default:[w]},$$scope:{ctx:t}}});return{c(){s=n(),o(g.$$.fragment),this.h()},l(t){r('[data-svelte="svelte-6bbqlg"]',document.head).forEach(i),s=c(t),$(g.$$.fragment,t),this.h()},h(){document.title="Charitify - is the application for helping those in need."},m(t,a){f(t,s,a),l(g,t,a),e=!0},p(t,[s]){const e={};3&s&&(e.$$scope={dirty:s,ctx:t}),g.$set(e)},i(t){e||(m(g.$$.fragment,t),e=!0)},o(t){p(g.$$.fragment,t),e=!1},d(t){t&&i(s),u(g,t)}}}function y(t,s,e){let a=[];return g(async()=>{await new Promise(t=>setTimeout(t,1e3));const t=await h.getOrganizations();e(0,a=new Array(1).fill(t).reduce((t,s)=>t.concat(...s),[]))}),[a]}export default class extends t{constructor(t){super(),s(this,t,y,x,e,{})}}