import{S as t,i as s,s as e,m as l,H as r,c as n,b as o,I as h,d as a,e as c,f,g as i,O as u,E as g,F as p,h as d,R as m}from"./index.375c7ddf.js";function v(t,s,e){const l=t.slice();return l[1]=s[e],l}function E(t){let s,e,g,p,d=t[1].title+"";return{c(){s=l("li"),e=l("a"),g=r(d),this.h()},l(t){s=n(t,"LI",{});var l=o(s);e=n(l,"A",{rel:!0,href:!0});var r=o(e);g=h(r,d),r.forEach(a),l.forEach(a),this.h()},h(){c(e,"rel","prefetch"),c(e,"href",p="blog/"+t[1].slug)},m(t,l){f(t,s,l),i(s,e),i(e,g)},p(t,s){1&s&&d!==(d=t[1].title+"")&&u(g,d),1&s&&p!==(p="blog/"+t[1].slug)&&c(e,"href",p)},d(t){t&&a(s)}}}function b(t){let s,e,u,b,x,j=t[0],R=[];for(let s=0;s<j.length;s+=1)R[s]=E(v(t,j,s));return{c(){s=g(),e=l("h1"),u=r("Recent posts"),b=g(),x=l("ul");for(let t=0;t<R.length;t+=1)R[t].c();this.h()},l(t){s=p(t),e=n(t,"H1",{});var l=o(e);u=h(l,"Recent posts"),l.forEach(a),b=p(t),x=n(t,"UL",{class:!0});var r=o(x);for(let t=0;t<R.length;t+=1)R[t].l(r);r.forEach(a),this.h()},h(){document.title="Blog",c(x,"class","svelte-1frg2tf")},m(t,l){f(t,s,l),f(t,e,l),i(e,u),f(t,b,l),f(t,x,l);for(let t=0;t<R.length;t+=1)R[t].m(x,null)},p(t,[s]){if(1&s){let e;for(j=t[0],e=0;e<j.length;e+=1){const l=v(t,j,e);R[e]?R[e].p(l,s):(R[e]=E(l),R[e].c(),R[e].m(x,null))}for(;e<R.length;e+=1)R[e].d(1);R.length=j.length}},i:d,o:d,d(t){t&&a(s),t&&a(e),t&&a(b),t&&a(x),m(R,t)}}}function x({params:t,query:s}){return this.fetch("blog.json").then(t=>t.json()).then(t=>({posts:t}))}function j(t,s,e){let{posts:l}=s;return t.$set=(t=>{"posts"in t&&e(0,l=t.posts)}),[l]}export default class extends t{constructor(t){super(),s(this,t,j,b,e,{posts:0})}}export{x as preload};
