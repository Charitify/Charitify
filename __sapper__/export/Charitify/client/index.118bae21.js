import{S as t,i as n,s as a,W as e,c as o,d as s,q as l,f as i,g as c,k as r,n as f,p as g,r as $,u,v as m,B as h,X as p,V as d,N as y,O as x,H as w,Y as v,Z as z,_ as B}from"./client.79a08914.js";function b(t,n,a){const e=t.slice();return e[3]=n[a],e}function k(t){let n;const a=new v({props:{lat:t[3].location.lat,lng:t[3].location.lng}});return a.$on("click",(function(){z(O.bind(null,t[3]))&&O.bind(null,t[3]).apply(this,arguments)})),{c(){s(a.$$.fragment)},l(t){r(a.$$.fragment,t)},m(t,e){g(a,t,e),n=!0},p(n,e){t=n;const o={};1&e&&(o.lat=t[3].location.lat),1&e&&(o.lng=t[3].location.lng),a.$set(o)},i(t){n||($(a.$$.fragment,t),n=!0)},o(t){u(a.$$.fragment,t),n=!1},d(t){m(a,t)}}}function M(t){let n,a,e=t[0],o=[];for(let n=0;n<e.length;n+=1)o[n]=k(b(t,e,n));const s=t=>u(o[t],1,1,()=>{o[t]=null});return{c(){for(let t=0;t<o.length;t+=1)o[t].c();n=p()},l(t){for(let n=0;n<o.length;n+=1)o[n].l(t);n=p()},m(t,e){for(let n=0;n<o.length;n+=1)o[n].m(t,e);f(t,n,e),a=!0},p(t,a){if(1&a){let l;for(e=t[0],l=0;l<e.length;l+=1){const s=b(t,e,l);o[l]?(o[l].p(s,a),$(o[l],1)):(o[l]=k(s),o[l].c(),$(o[l],1),o[l].m(n.parentNode,n))}for(d(),l=e.length;l<o.length;l+=1)s(l);y()}},i(t){if(!a){for(let t=0;t<e.length;t+=1)$(o[t]);a=!0}},o(t){o=o.filter(Boolean);for(let t=0;t<o.length;t+=1)u(o[t]);a=!1},d(t){x(o,t),t&&i(n)}}}function N(t){let n,a;const h=new e({props:{$$slots:{default:[M]},$$scope:{ctx:t}}});return h.$on("ready",t[1]),{c(){n=o(),s(h.$$.fragment),this.h()},l(t){l('[data-svelte="svelte-1vy6te4"]',document.head).forEach(i),n=c(t),r(h.$$.fragment,t),this.h()},h(){document.title="Charitify - Map of organizations."},m(t,e){f(t,n,e),g(h,t,e),a=!0},p(t,[n]){const a={};65&n&&(a.$$scope={dirty:n,ctx:t}),h.$set(a)},i(t){a||($(h.$$.fragment,t),a=!0)},o(t){u(h.$$.fragment,t),a=!1},d(t){t&&i(n),m(h,t)}}}async function O(t){B(`organizations/${t.id}`)}function j(t,n,a){const{page:e}=h();let o=[];return[o,async function({detail:t}){await new Promise(t=>setTimeout(t,2e3)),a(0,o=await w.getOrganizations()),console.log(o);const n=(t,n)=>Math[t](...o.map(t=>t.location[n])),e=[[n("min","lng")+-2,n("min","lat")+-2],[n("max","lng")- -2,n("max","lat")- -2]];t.fitBounds(e)}]}export default class extends t{constructor(t){super(),n(this,t,j,N,a,{})}}
