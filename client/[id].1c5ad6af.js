import{S as t,i as n,s as a,a6 as o,c as e,d as l,q as s,f as i,g as c,k as r,n as f,p as g,r as $,u as m,v as u,B as d,E as p,a7 as h,a5 as y,a1 as x,a2 as v,H as z,a8 as w,a9 as B,aa as b}from"./client.4d37363e.js";function k(t,n,a){const o=t.slice();return o[6]=n[a],o}function E(t){let n;const a=new w({props:{lat:t[6].location.lat,lng:t[6].location.lng}});return a.$on("click",(function(){B(q.bind(null,t[6]))&&q.bind(null,t[6]).apply(this,arguments)})),{c(){l(a.$$.fragment)},l(t){r(a.$$.fragment,t)},m(t,o){g(a,t,o),n=!0},p(n,o){t=n;const e={};1&o&&(e.lat=t[6].location.lat),1&o&&(e.lng=t[6].location.lng),a.$set(e)},i(t){n||($(a.$$.fragment,t),n=!0)},o(t){m(a.$$.fragment,t),n=!1},d(t){u(a,t)}}}function M(t){let n,a,o=t[0],e=[];for(let n=0;n<o.length;n+=1)e[n]=E(k(t,o,n));const l=t=>m(e[t],1,1,()=>{e[t]=null});return{c(){for(let t=0;t<e.length;t+=1)e[t].c();n=h()},l(t){for(let n=0;n<e.length;n+=1)e[n].l(t);n=h()},m(t,o){for(let n=0;n<e.length;n+=1)e[n].m(t,o);f(t,n,o),a=!0},p(t,a){if(1&a){let s;for(o=t[0],s=0;s<o.length;s+=1){const l=k(t,o,s);e[s]?(e[s].p(l,a),$(e[s],1)):(e[s]=E(l),e[s].c(),$(e[s],1),e[s].m(n.parentNode,n))}for(y(),s=o.length;s<e.length;s+=1)l(s);x()}},i(t){if(!a){for(let t=0;t<o.length;t+=1)$(e[t]);a=!0}},o(t){e=e.filter(Boolean);for(let t=0;t<e.length;t+=1)m(e[t]);a=!1},d(t){v(e,t),t&&i(n)}}}function j(t){let n,a;const d=new o({props:{center:t[2],$$slots:{default:[M]},$$scope:{ctx:t}}});return d.$on("ready",t[3]),{c(){n=e(),l(d.$$.fragment),this.h()},l(t){s('[data-svelte="svelte-1vy6te4"]',document.head).forEach(i),n=c(t),r(d.$$.fragment,t),this.h()},h(){document.title="Charitify - Map of organizations."},m(t,o){f(t,n,o),g(d,t,o),a=!0},p(t,[n]){const a={};513&n&&(a.$$scope={dirty:n,ctx:t}),d.$set(a)},i(t){a||($(d.$$.fragment,t),a=!0)},o(t){m(d.$$.fragment,t),a=!1},d(t){t&&i(n),u(d,t)}}}async function q(t){b(`organizations/${t.id}`)}function C(t,n,a){let o;const{page:e}=d();p(t,e,t=>a(4,o=t));let l=o.params.id,s=[];return[s,e,void 0,async function({detail:t}){a(0,s=await z.getOrganizations()),console.log(s);const n=(t,n)=>Math[t](...s.map(t=>t.location[n])),o=[[n("min","lng")+-2,n("min","lat")+-2],[n("max","lng")- -2,n("max","lat")- -2]],e=s.filter(t=>t.id===l)[0];e?t.flyTo({center:[e.location.lng,e.location.lat],zoom:10}):t.fitBounds(o)}]}export default class extends t{constructor(t){super(),n(this,t,C,j,a,{})}}
