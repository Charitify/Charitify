import{S as a,i as t,s,B as e,at as n,d as r,f as i,q as o,g as f,h as c,l as $,o as l,p as m,u as h,v as d,w as u,a8 as g,ab as p}from"./client.90626ed7.js";function w(a){let t,s,g,p,w;return s=new e({props:{size:"50"}}),p=new n({props:{items:a[0],basePath:"funds"}}),{c(){t=r(),i(s.$$.fragment),g=r(),i(p.$$.fragment),this.h()},l(a){o('[data-svelte="svelte-6bbqlg"]',document.head).forEach(f),t=c(a),$(s.$$.fragment,a),g=c(a),$(p.$$.fragment,a),this.h()},h(){document.title="Charitify - is the application for helping those in need."},m(a,e){l(a,t,e),m(s,a,e),l(a,g,e),m(p,a,e),w=!0},p(a,[t]){const s={};1&t&&(s.items=a[0]),p.$set(s)},i(a){w||(h(s.$$.fragment,a),h(p.$$.fragment,a),w=!0)},o(a){d(s.$$.fragment,a),d(p.$$.fragment,a),w=!1},d(a){a&&f(t),u(s,a),a&&f(g),u(p,a)}}}function b(a,t,s){let e=[];return g(async()=>{const a=await p.getFunds();s(0,e=new Array(5).fill(a).reduce((a,t)=>a.concat(...t),[]))}),[e]}export default class extends a{constructor(a){super(),t(this,a,b,w,s,{})}}
