import{S as e,i as t,s as a,X as s,I as r,$ as n,e as l,d as $,c as o,h as c,j as f,k as g,g as i,f as m,m as u,n as p,p as h,o as d,a0 as v,a1 as w,r as x,u as b,v as B,t as E,l as I,Q as R,a2 as k,a3 as y,a4 as L,a5 as q,a6 as P}from"./client.f0443cde.js";function z(e,t,a){const s=e.slice();return s[1]=t[a],s}function S(e){let t;return{c(){t=E("success")},l(e){t=I(e,"success")},m(e,a){p(e,t,a)},d(e){e&&m(t)}}}function j(e){let t;return{c(){t=E("warning")},l(e){t=I(e,"warning")},m(e,a){p(e,t,a)},d(e){e&&m(t)}}}function A(e){let t;return{c(){t=E("danger")},l(e){t=I(e,"danger")},m(e,a){p(e,t,a)},d(e){e&&m(t)}}}function C(e){let t;return{c(){t=E("info")},l(e){t=I(e,"info")},m(e,a){p(e,t,a)},d(e){e&&m(t)}}}function N(e){let t,a,s;const r=[e[1]];let n={};for(let e=0;e<r.length;e+=1)n=L(n,r[e]);const E=new q({props:n});return{c(){t=l("li"),$(E.$$.fragment),a=o(),this.h()},l(e){t=c(e,"LI",{class:!0});var s=f(t);g(E.$$.fragment,s),a=i(s),s.forEach(m),this.h()},h(){u(t,"class","svelte-uq20p0")},m(e,r){p(e,t,r),h(E,t,null),d(t,a),s=!0},p(e,t){const a=1&t?v(r,[w(e[1])]):{};E.$set(a)},i(e){s||(x(E.$$.fragment,e),s=!0)},o(e){b(E.$$.fragment,e),s=!1},d(e){e&&m(t),B(E)}}}function O(e){let t,a,v,w,L,q,O,D,F,Q,U,V,X,G,H,J,K,M,W,Y,Z,_,ee,te,ae,se,re,ne,le,$e,oe,ce,fe,ge,ie,me,ue,pe,he;const de=new s({props:{src:"https://placeimg.com/100/100/people",alt:"user avatar"}}),ve=new r({props:{is:"success",auto:!0,$$slots:{default:[S]},$$scope:{ctx:e}}}),we=new n({props:{size:"2"}}),xe=new r({props:{is:"warning",auto:!0,$$slots:{default:[j]},$$scope:{ctx:e}}}),be=new n({props:{size:"2"}}),Be=new r({props:{is:"danger",auto:!0,$$slots:{default:[A]},$$scope:{ctx:e}}}),Ee=new n({props:{size:"2"}}),Ie=new r({props:{is:"info",auto:!0,$$slots:{default:[C]},$$scope:{ctx:e}}});let Re=e[0],ke=[];for(let t=0;t<Re.length;t+=1)ke[t]=N(z(e,Re,t));const ye=e=>b(ke[e],1,1,()=>{ke[e]=null});return{c(){t=l("section"),a=l("br"),v=o(),w=l("div"),$(de.$$.fragment),L=o(),q=l("br"),O=o(),D=l("br"),F=o(),Q=l("section"),$(ve.$$.fragment),U=o(),$(we.$$.fragment),V=o(),$(xe.$$.fragment),X=o(),$(be.$$.fragment),G=o(),$(Be.$$.fragment),H=o(),$(Ee.$$.fragment),J=o(),$(Ie.$$.fragment),K=o(),M=l("br"),W=o(),Y=l("br"),Z=o(),_=l("a"),ee=E("Link to Instagram Page"),ae=o(),se=l("br"),re=o(),ne=l("br"),le=o(),$e=l("a"),oe=E("Link to Instagram Profile"),fe=o(),ge=l("br"),ie=o(),me=l("br"),ue=o(),pe=l("ul");for(let e=0;e<ke.length;e+=1)ke[e].c();this.h()},l(e){t=c(e,"SECTION",{class:!0});var s=f(t);a=c(s,"BR",{}),v=i(s),w=c(s,"DIV",{class:!0});var r=f(w);g(de.$$.fragment,r),r.forEach(m),L=i(s),q=c(s,"BR",{}),O=i(s),D=c(s,"BR",{}),F=i(s),Q=c(s,"SECTION",{style:!0,class:!0});var n=f(Q);g(ve.$$.fragment,n),U=i(n),g(we.$$.fragment,n),V=i(n),g(xe.$$.fragment,n),X=i(n),g(be.$$.fragment,n),G=i(n),g(Be.$$.fragment,n),H=i(n),g(Ee.$$.fragment,n),J=i(n),g(Ie.$$.fragment,n),n.forEach(m),K=i(s),M=c(s,"BR",{}),W=i(s),Y=c(s,"BR",{}),Z=i(s),_=c(s,"A",{href:!0});var l=f(_);ee=I(l,"Link to Instagram Page"),l.forEach(m),ae=i(s),se=c(s,"BR",{}),re=i(s),ne=c(s,"BR",{}),le=i(s),$e=c(s,"A",{href:!0});var $=f($e);oe=I($,"Link to Instagram Profile"),$.forEach(m),fe=i(s),ge=c(s,"BR",{}),ie=i(s),me=c(s,"BR",{}),ue=i(s),pe=c(s,"UL",{class:!0});var o=f(pe);for(let e=0;e<ke.length;e+=1)ke[e].l(o);o.forEach(m),s.forEach(m),this.h()},h(){u(w,"class","user-avatar svelte-uq20p0"),R(Q,"display","flex"),R(Q,"flex-direction","row"),u(Q,"class","svelte-uq20p0"),u(_,"href",te=`https://instagram.com/${T}/`),u($e,"href",ce=`instagram://user?username=${T}`),u(pe,"class","svelte-uq20p0"),u(t,"class","container svelte-uq20p0")},m(e,s){p(e,t,s),d(t,a),d(t,v),d(t,w),h(de,w,null),d(t,L),d(t,q),d(t,O),d(t,D),d(t,F),d(t,Q),h(ve,Q,null),d(Q,U),h(we,Q,null),d(Q,V),h(xe,Q,null),d(Q,X),h(be,Q,null),d(Q,G),h(Be,Q,null),d(Q,H),h(Ee,Q,null),d(Q,J),h(Ie,Q,null),d(t,K),d(t,M),d(t,W),d(t,Y),d(t,Z),d(t,_),d(_,ee),d(t,ae),d(t,se),d(t,re),d(t,ne),d(t,le),d(t,$e),d($e,oe),d(t,fe),d(t,ge),d(t,ie),d(t,me),d(t,ue),d(t,pe);for(let e=0;e<ke.length;e+=1)ke[e].m(pe,null);he=!0},p(e,[t]){const a={};16&t&&(a.$$scope={dirty:t,ctx:e}),ve.$set(a);const s={};16&t&&(s.$$scope={dirty:t,ctx:e}),xe.$set(s);const r={};16&t&&(r.$$scope={dirty:t,ctx:e}),Be.$set(r);const n={};if(16&t&&(n.$$scope={dirty:t,ctx:e}),Ie.$set(n),1&t){let a;for(Re=e[0],a=0;a<Re.length;a+=1){const s=z(e,Re,a);ke[a]?(ke[a].p(s,t),x(ke[a],1)):(ke[a]=N(s),ke[a].c(),x(ke[a],1),ke[a].m(pe,null))}for(P(),a=Re.length;a<ke.length;a+=1)ye(a);k()}},i(e){if(!he){x(de.$$.fragment,e),x(ve.$$.fragment,e),x(we.$$.fragment,e),x(xe.$$.fragment,e),x(be.$$.fragment,e),x(Be.$$.fragment,e),x(Ee.$$.fragment,e),x(Ie.$$.fragment,e);for(let e=0;e<Re.length;e+=1)x(ke[e]);he=!0}},o(e){b(de.$$.fragment,e),b(ve.$$.fragment,e),b(we.$$.fragment,e),b(xe.$$.fragment,e),b(be.$$.fragment,e),b(Be.$$.fragment,e),b(Ee.$$.fragment,e),b(Ie.$$.fragment,e),ke=ke.filter(Boolean);for(let e=0;e<ke.length;e+=1)b(ke[e]);he=!1},d(e){e&&m(t),B(de),B(ve),B(we),B(xe),B(be),B(Be),B(Ee),B(Ie),y(ke,e)}}}const T="bublikus.script";function D(e){return[[{placeholder:"username"},{placeholder:"Full name"},{placeholder:"sex (checkboxes or dropdown)"},{placeholder:"birth"},{placeholder:"email"},{placeholder:"tel"},{placeholder:"location (autocomplete)"}]]}export default class extends e{constructor(e){super(),t(this,e,D,O,a,{})}}