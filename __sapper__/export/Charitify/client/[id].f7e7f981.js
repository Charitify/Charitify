import{S as t,i as n,s as a,B as e,a3 as o,c as l,d as s,q as i,f as r,g as c,k as f,n as g,o as $,u as m,v as u,w as d,J as h,K as p,a4 as y,a2 as v,$ as x,a0 as w,V as z,a5 as B,a6 as b,a7 as k}from"./client.61366f48.js";function M(t,n,a){const e=t.slice();return e[6]=n[a],e}function j(t){let n;const a=new B({props:{lat:t[6].location.lat,lng:t[6].location.lng}});return a.$on("click",(function(){b(E.bind(null,t[6]))&&E.bind(null,t[6]).apply(this,arguments)})),{c(){s(a.$$.fragment)},l(t){f(a.$$.fragment,t)},m(t,e){$(a,t,e),n=!0},p(n,e){t=n;const o={};1&e&&(o.lat=t[6].location.lat),1&e&&(o.lng=t[6].location.lng),a.$set(o)},i(t){n||(m(a.$$.fragment,t),n=!0)},o(t){u(a.$$.fragment,t),n=!1},d(t){d(a,t)}}}function q(t){let n,a,e=t[0],o=[];for(let n=0;n<e.length;n+=1)o[n]=j(M(t,e,n));const l=t=>u(o[t],1,1,()=>{o[t]=null});return{c(){for(let t=0;t<o.length;t+=1)o[t].c();n=y()},l(t){for(let n=0;n<o.length;n+=1)o[n].l(t);n=y()},m(t,e){for(let n=0;n<o.length;n+=1)o[n].m(t,e);g(t,n,e),a=!0},p(t,a){if(1&a){let s;for(e=t[0],s=0;s<e.length;s+=1){const l=M(t,e,s);o[s]?(o[s].p(l,a),m(o[s],1)):(o[s]=j(l),o[s].c(),m(o[s],1),o[s].m(n.parentNode,n))}for(v(),s=e.length;s<o.length;s+=1)l(s);x()}},i(t){if(!a){for(let t=0;t<e.length;t+=1)m(o[t]);a=!0}},o(t){o=o.filter(Boolean);for(let t=0;t<o.length;t+=1)u(o[t]);a=!1},d(t){w(o,t),t&&r(n)}}}function C(t){let n,a,h;const p=new e({props:{size:"var(--header-height)"}}),y=new o({props:{center:t[2],$$slots:{default:[q]},$$scope:{ctx:t}}});return y.$on("ready",t[3]),{c(){n=l(),s(p.$$.fragment),a=l(),s(y.$$.fragment),this.h()},l(t){i('[data-svelte="svelte-1vy6te4"]',document.head).forEach(r),n=c(t),f(p.$$.fragment,t),a=c(t),f(y.$$.fragment,t),this.h()},h(){document.title="Charitify - Map of organizations."},m(t,e){g(t,n,e),$(p,t,e),g(t,a,e),$(y,t,e),h=!0},p(t,[n]){const a={};513&n&&(a.$$scope={dirty:n,ctx:t}),y.$set(a)},i(t){h||(m(p.$$.fragment,t),m(y.$$.fragment,t),h=!0)},o(t){u(p.$$.fragment,t),u(y.$$.fragment,t),h=!1},d(t){t&&r(n),d(p,t),t&&r(a),d(y,t)}}}async function E(t){k(`organizations/${t.id}`)}function J(t,n,a){let e;const{page:o}=h();p(t,o,t=>a(4,e=t));let l=e.params.id,s=[];return[s,o,void 0,async function({detail:t}){a(0,s=await z.getOrganizations()),console.log(s);const n=(t,n)=>Math[t](...s.map(t=>t.location[n])),e=[[n("min","lng")+-2,n("min","lat")+-2],[n("max","lng")- -2,n("max","lat")- -2]],o=s.filter(t=>t.id===l)[0];o?t.flyTo({center:[o.location.lng,o.location.lat],zoom:10}):t.fitBounds(e)}]}export default class extends t{constructor(t){super(),n(this,t,J,C,a,{})}}