import{S as t,i as e,s,a3 as a,c as n,d as r,q as o,f as i,g as c,k as $,n as f,p as l,r as m,u as p,v as u,G as g,a4 as d,H as h}from"./client.38ae6e1f.js";function w(t){let e;const s=new d({props:{items:t[0],basePath:"organizations"}});return{c(){r(s.$$.fragment)},l(t){$(s.$$.fragment,t)},m(t,a){l(s,t,a),e=!0},p(t,e){const a={};1&e&&(a.items=t[0]),s.$set(a)},i(t){e||(m(s.$$.fragment,t),e=!0)},o(t){p(s.$$.fragment,t),e=!1},d(t){u(s,t)}}}function x(t){let e,s;const g=new a({props:{$$slots:{default:[w]},$$scope:{ctx:t}}});return{c(){e=n(),r(g.$$.fragment),this.h()},l(t){o('[data-svelte="svelte-6bbqlg"]',document.head).forEach(i),e=c(t),$(g.$$.fragment,t),this.h()},h(){document.title="Charitify - is the application for helping those in need."},m(t,a){f(t,e,a),l(g,t,a),s=!0},p(t,[e]){const s={};3&e&&(s.$$scope={dirty:e,ctx:t}),g.$set(s)},i(t){s||(m(g.$$.fragment,t),s=!0)},o(t){p(g.$$.fragment,t),s=!1},d(t){t&&i(e),u(g,t)}}}function y(t,e,s){let a=[];return g(async()=>{await new Promise(t=>setTimeout(t,1e3));const t=await h.getOrganizations();s(0,a=new Array(1).fill(t).reduce((t,e)=>t.concat(...e),[]))}),[a]}export default class extends t{constructor(t){super(),e(this,t,y,x,s,{})}}
