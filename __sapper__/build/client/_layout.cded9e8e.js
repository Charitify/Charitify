import{S as e,i as t,s,e as l,a,I as n,f as r,d as i,t as c,j as o,k as f,l as g,g as p,h as m,m as $,n as v,ao as h,o as d,p as u,H as x,u as w,v as b,w as y,K as k,M as E,ac as q,B as z,ap as I,aq as B,F as C,ar as N}from"./client.eff62fdd.js";function S(e){let t,s,k,E,q,z,I,B;return E=new n({props:{type:"check-flag",is:"primary"}}),{c(){t=l("section"),s=l("div"),k=l("span"),r(E.$$.fragment),q=i(),z=l("h3"),I=c(e[0]),this.h()},l(l){t=o(l,"SECTION",{class:!0});var a=f(t);s=o(a,"DIV",{class:!0});var n=f(s);k=o(n,"SPAN",{class:!0});var r=f(k);g(E.$$.fragment,r),r.forEach(p),n.forEach(p),q=m(a),z=o(a,"H3",{class:!0});var i=f(z);I=$(i,e[0]),i.forEach(p),a.forEach(p),this.h()},h(){v(k,"class","svelte-i8p8ps"),v(s,"class","svelte-i8p8ps"),v(z,"class","svelte-i8p8ps"),v(t,"class","radius-big svelte-i8p8ps"),h(t,"active",e[1])},m(e,l){d(e,t,l),a(t,s),a(s,k),u(E,k,null),a(t,q),a(t,z),a(z,I),B=!0},p(e,[s]){(!B||1&s)&&x(I,e[0]),2&s&&h(t,"active",e[1])},i(e){B||(w(E.$$.fragment,e),B=!0)},o(e){b(E.$$.fragment,e),B=!1},d(e){e&&p(t),y(E)}}}function j(e,t,s){let{value:l=""}=t,{active:a=!1}=t;return e.$set=e=>{"value"in e&&s(0,l=e.value),"active"in e&&s(1,a=e.active)},[l,a]}class A extends e{constructor(e){var n;super(),document.getElementById("svelte-i8p8ps-style")||((n=l("style")).id="svelte-i8p8ps-style",n.textContent="section.svelte-i8p8ps.svelte-i8p8ps{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-ms-flex-direction:column;flex-direction:column;width:100%;overflow:hidden;border:3px solid transparent;background-color:rgba(var(--theme-input-bg-color))}section.active.svelte-i8p8ps.svelte-i8p8ps{border-color:rgba(var(--color-white))}section.active.svelte-i8p8ps>div.svelte-i8p8ps{visibility:visible}div.svelte-i8p8ps.svelte-i8p8ps{visibility:hidden;display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-flex:1;-ms-flex:1 1 auto;flex:1 1 auto;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center}div.svelte-i8p8ps span.svelte-i8p8ps{display:-webkit-box;display:-ms-flexbox;display:flex;width:50px;height:50px}h3.svelte-i8p8ps.svelte-i8p8ps{-webkit-box-flex:0;-ms-flex:none;flex:none;width:100%;padding:8px 5px 16px;text-align:center;font-weight:normal;color:rgba(var(--color-white));background-color:rgba(var(--color-black), .5)}",a(document.head,n)),t(this,e,j,S,s,{value:0,active:1})}}function O(e,t,s){const l=e.slice();return l[2]=t[s],l}function T(e){let t,s,n,c,$,h;return n=new A({props:{active:e[0]===e[2].segment,value:e[2].label}}),{c(){t=l("li"),s=l("a"),r(n.$$.fragment),$=i(),this.h()},l(e){t=o(e,"LI",{class:!0});var l=f(t);s=o(l,"A",{rel:!0,href:!0,class:!0});var a=f(s);g(n.$$.fragment,a),a.forEach(p),$=m(l),l.forEach(p),this.h()},h(){v(s,"rel","prefetch"),v(s,"href",c=e[2].href),v(s,"class","svelte-wcqcr1"),v(t,"class","radius-big overflow-hidden svelte-wcqcr1")},m(e,l){d(e,t,l),a(t,s),u(n,s,null),a(t,$),h=!0},p(e,t){const s={};1&t&&(s.active=e[0]===e[2].segment),n.$set(s)},i(e){h||(w(n.$$.fragment,e),h=!0)},o(e){b(n.$$.fragment,e),h=!1},d(e){e&&p(t),y(n)}}}function H(e){let t,s,n,r=e[1],i=[];for(let t=0;t<r.length;t+=1)i[t]=T(O(e,r,t));const c=e=>b(i[e],1,1,()=>{i[e]=null});return{c(){t=l("nav"),s=l("ul");for(let e=0;e<i.length;e+=1)i[e].c();this.h()},l(e){t=o(e,"NAV",{class:!0});var l=f(t);s=o(l,"UL",{class:!0});var a=f(s);for(let e=0;e<i.length;e+=1)i[e].l(a);a.forEach(p),l.forEach(p),this.h()},h(){v(s,"class","svelte-wcqcr1"),v(t,"class","svelte-wcqcr1")},m(e,l){d(e,t,l),a(t,s);for(let e=0;e<i.length;e+=1)i[e].m(s,null);n=!0},p(e,[t]){if(3&t){let l;for(r=e[1],l=0;l<r.length;l+=1){const a=O(e,r,l);i[l]?(i[l].p(a,t),w(i[l],1)):(i[l]=T(a),i[l].c(),w(i[l],1),i[l].m(s,null))}for(k(),l=r.length;l<i.length;l+=1)c(l);E()}},i(e){if(!n){for(let e=0;e<r.length;e+=1)w(i[e]);n=!0}},o(e){i=i.filter(Boolean);for(let e=0;e<i.length;e+=1)b(i[e]);n=!1},d(e){e&&p(t),q(i,e)}}}function R(e,t,s){let{segment:l}=t;return e.$set=e=>{"segment"in e&&s(0,l=e.segment)},[l,[{segment:"funds",href:"lists/funds",label:"Фонди"},{segment:"organizations",href:"lists/organizations",label:"Оргранізації"}]]}class V extends e{constructor(e){var n;super(),document.getElementById("svelte-wcqcr1-style")||((n=l("style")).id="svelte-wcqcr1-style",n.textContent="nav.svelte-wcqcr1 ul.svelte-wcqcr1{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;grid-template-rows:155px;grid-gap:10px;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch}nav.svelte-wcqcr1 li.svelte-wcqcr1,nav.svelte-wcqcr1 li a.svelte-wcqcr1{-webkit-box-flex:1;-ms-flex-positive:1;flex-grow:1;display:-webkit-box;display:-ms-flexbox;display:flex;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-align:stretch;-ms-flex-align:stretch;align-items:stretch;-webkit-box-pack:stretch;-ms-flex-pack:stretch;justify-content:stretch;overflow:hidden}li.svelte-wcqcr1 a.svelte-wcqcr1:hover{background-color:rgba(var(--color-black), .1)}",a(document.head,n)),t(this,e,R,H,s,{segment:0})}}function D(e){let t,s,n,h,x,k,E,q,S,j,A,O,T,H,R,D,L,M,F,K,P,U,G,J,Q,W,X,Y,Z,_,ee,te,se;n=new z({props:{size:"var(--header-height)"}}),x=new z({props:{size:"20"}}),E=new I({}),S=new z({props:{size:"20"}}),O=new z({props:{size:"30"}}),H=new V({props:{segment:e[0]}}),L=new z({props:{size:"30"}}),F=new z({props:{size:"60"}});const le=e[2].default,ae=B(le,e,e[1],null);return te=new C({}),{c(){t=l("main"),s=l("section"),r(n.$$.fragment),h=i(),r(x.$$.fragment),k=i(),r(E.$$.fragment),q=i(),r(S.$$.fragment),j=i(),A=l("section"),r(O.$$.fragment),T=i(),r(H.$$.fragment),R=i(),D=l("section"),r(L.$$.fragment),M=i(),r(F.$$.fragment),K=i(),P=l("h2"),U=c("Мої фонди"),G=i(),J=l("div"),Q=l("br"),W=i(),ae&&ae.c(),X=i(),Y=l("br"),Z=i(),_=l("br"),ee=i(),r(te.$$.fragment),this.h()},l(e){t=o(e,"MAIN",{class:!0});var l=f(t);s=o(l,"SECTION",{class:!0});var a=f(s);g(n.$$.fragment,a),h=m(a),g(x.$$.fragment,a),k=m(a),g(E.$$.fragment,a),q=m(a),g(S.$$.fragment,a),a.forEach(p),j=m(l),A=o(l,"SECTION",{class:!0});var r=f(A);g(O.$$.fragment,r),T=m(r),g(H.$$.fragment,r),R=m(r),D=o(r,"SECTION",{});var i=f(D);g(L.$$.fragment,i),i.forEach(p),r.forEach(p),M=m(l),g(F.$$.fragment,l),K=m(l),P=o(l,"H2",{});var c=f(P);U=$(c,"Мої фонди"),c.forEach(p),G=m(l),J=o(l,"DIV",{class:!0});var v=f(J);Q=o(v,"BR",{}),W=m(v),ae&&ae.l(v),X=m(v),Y=o(v,"BR",{}),Z=m(v),_=o(v,"BR",{}),v.forEach(p),ee=m(l),g(te.$$.fragment,l),l.forEach(p),this.h()},h(){v(s,"class","theme-bg container shadow-secondary"),v(A,"class","container"),v(J,"class","list-wrap svelte-oqg9wz"),v(t,"class","layout list-layout theme-bg-color-secondary")},m(e,l){d(e,t,l),a(t,s),u(n,s,null),a(s,h),u(x,s,null),a(s,k),u(E,s,null),a(s,q),u(S,s,null),a(t,j),a(t,A),u(O,A,null),a(A,T),u(H,A,null),a(A,R),a(A,D),u(L,D,null),a(t,M),u(F,t,null),a(t,K),a(t,P),a(P,U),a(t,G),a(t,J),a(J,Q),a(J,W),ae&&ae.m(J,null),a(J,X),a(J,Y),a(J,Z),a(J,_),a(t,ee),u(te,t,null),se=!0},p(e,[t]){const s={};1&t&&(s.segment=e[0]),H.$set(s),ae&&ae.p&&2&t&&N(ae,le,e,e[1],t,null,null)},i(e){se||(w(n.$$.fragment,e),w(x.$$.fragment,e),w(E.$$.fragment,e),w(S.$$.fragment,e),w(O.$$.fragment,e),w(H.$$.fragment,e),w(L.$$.fragment,e),w(F.$$.fragment,e),w(ae,e),w(te.$$.fragment,e),se=!0)},o(e){b(n.$$.fragment,e),b(x.$$.fragment,e),b(E.$$.fragment,e),b(S.$$.fragment,e),b(O.$$.fragment,e),b(H.$$.fragment,e),b(L.$$.fragment,e),b(F.$$.fragment,e),b(ae,e),b(te.$$.fragment,e),se=!1},d(e){e&&p(t),y(n),y(x),y(E),y(S),y(O),y(H),y(L),y(F),ae&&ae.d(e),y(te)}}}function L(e,t,s){let{segment:l}=t,{$$slots:a={},$$scope:n}=t;return e.$set=e=>{"segment"in e&&s(0,l=e.segment),"$$scope"in e&&s(1,n=e.$$scope)},[l,n,a]}export default class extends e{constructor(e){var n;super(),document.getElementById("svelte-oqg9wz-style")||((n=l("style")).id="svelte-oqg9wz-style",n.textContent=".list-wrap.svelte-oqg9wz{-webkit-box-flex:1;-ms-flex:1 1 0px;flex:1 1 0;overflow-x:hidden;overflow-y:auto;padding:0 var(--screen-padding)}",a(document.head,n)),t(this,e,L,D,s,{segment:0})}}