import{S as t,i as e,s,B as a,am as n,d as r,f as $,q as o,g as c,h as f,l as i,o as m,p as l,u as p,v as d,w as g,a8 as u,an as h,ab as w}from"./client.1d03ec2f.js";function b(t){let e;const s=new h({props:{items:t[0],basePath:"funds"}});return{c(){$(s.$$.fragment)},l(t){i(s.$$.fragment,t)},m(t,a){l(s,t,a),e=!0},p(t,e){const a={};1&e&&(a.items=t[0]),s.$set(a)},i(t){e||(p(s.$$.fragment,t),e=!0)},o(t){d(s.$$.fragment,t),e=!1},d(t){g(s,t)}}}function x(t){let e,s,u;const h=new a({props:{size:"50"}}),w=new n({props:{$$slots:{default:[b]},$$scope:{ctx:t}}});return{c(){e=r(),$(h.$$.fragment),s=r(),$(w.$$.fragment),this.h()},l(t){o('[data-svelte="svelte-6bbqlg"]',document.head).forEach(c),e=f(t),i(h.$$.fragment,t),s=f(t),i(w.$$.fragment,t),this.h()},h(){document.title="Charitify - is the application for helping those in need."},m(t,a){m(t,e,a),l(h,t,a),m(t,s,a),l(w,t,a),u=!0},p(t,[e]){const s={};3&e&&(s.$$scope={dirty:e,ctx:t}),w.$set(s)},i(t){u||(p(h.$$.fragment,t),p(w.$$.fragment,t),u=!0)},o(t){d(h.$$.fragment,t),d(w.$$.fragment,t),u=!1},d(t){t&&c(e),g(h,t),t&&c(s),g(w,t)}}}function y(t,e,s){let a=[];return u(async()=>{const t=await w.getFunds();s(0,a=new Array(5).fill(t).reduce((t,e)=>t.concat(...e),[]))}),[a]}export default class extends t{constructor(t){super(),e(this,t,y,x,s,{})}}
