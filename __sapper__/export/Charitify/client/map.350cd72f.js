import{S as t,i as n,s as a,$ as e,m as o,l,p as s,o as r,h as i,q as c,u as f,v as g,d as m,w as $,A as u,F as h,G as p,a0 as d,a1 as x}from"./index.699ce7da.js";import{a as w}from"./index.ff961fc6.js";function y(t,n,a){const e=t.slice();return e[2]=n[a],e}function j(t){let n;const a=new x({props:{lat:t[2].location.lat,lng:t[2].location.lng}});return{c(){l(a.$$.fragment)},l(t){r(a.$$.fragment,t)},m(t,e){c(a,t,e),n=!0},p(t,n){const e={};1&n&&(e.lat=t[2].location.lat),1&n&&(e.lng=t[2].location.lng),a.$set(e)},i(t){n||(f(a.$$.fragment,t),n=!0)},o(t){g(a.$$.fragment,t),n=!1},d(t){$(a,t)}}}function z(t){let n,a,e=t[0],o=[];for(let n=0;n<e.length;n+=1)o[n]=j(y(t,e,n));const l=t=>g(o[t],1,1,()=>{o[t]=null});return{c(){for(let t=0;t<o.length;t+=1)o[t].c();n=u()},l(t){for(let n=0;n<o.length;n+=1)o[n].l(t);n=u()},m(t,e){for(let n=0;n<o.length;n+=1)o[n].m(t,e);i(t,n,e),a=!0},p(t,a){if(1&a){let s;for(e=t[0],s=0;s<e.length;s+=1){const l=y(t,e,s);o[s]?(o[s].p(l,a),f(o[s],1)):(o[s]=j(l),o[s].c(),f(o[s],1),o[s].m(n.parentNode,n))}for(h(),s=e.length;s<o.length;s+=1)l(s);p()}},i(t){if(!a){for(let t=0;t<e.length;t+=1)f(o[t]);a=!0}},o(t){o=o.filter(Boolean);for(let t=0;t<o.length;t+=1)g(o[t]);a=!1},d(t){d(o,t),t&&m(n)}}}function B(t){let n,a;const u=new e({props:{$$slots:{default:[z]},$$scope:{ctx:t}}});return u.$on("ready",t[1]),{c(){n=o(),l(u.$$.fragment),this.h()},l(t){n=s(t),r(u.$$.fragment,t),this.h()},h(){document.title="Charitify - Map of organizations."},m(t,e){i(t,n,e),c(u,t,e),a=!0},p(t,[n]){const a={};33&n&&(a.$$scope={dirty:n,ctx:t}),u.$set(a)},i(t){a||(f(u.$$.fragment,t),a=!0)},o(t){g(u.$$.fragment,t),a=!1},d(t){t&&m(n),$(u,t)}}}function M(t,n,a){let e=[];return[e,async function({detail:t}){await new Promise(t=>setTimeout(t,2e3)),a(0,e=await w.getOrganizations()),console.log(e);const n=(t,n)=>Math[t](...e.map(t=>t.location[n])),o=[[n("min","lng")+-2,n("min","lat")+-2],[n("max","lng")- -2,n("max","lat")- -2]];t.fitBounds(o)}]}export default class extends t{constructor(t){super(),n(this,t,M,B,a,{})}}
