import{S as t,i as e,s as n,l as s,m as l,c as o,b as a,d as r,e as $,f as i,o as f,T as c,y as g,A as h,g as m,q as p,r as x,t as u,u as E,I as d,L as A,U as v,V as b,w,M as B,z as y,N as R,O as I,B as k,C as S,h as T}from"./index.2a35c7da.js";import{B as L,I as P,P as O,A as _,R as N,D,F as j,a as V,b as H}from"./index.d8972e85.js";function z(t,e,n){const s=t.slice();return s[18]=e[n],s[32]=n,s}function C(t){let e,n=t[2],s=[];for(let e=0;e<n.length;e+=1)s[e]=F(z(t,n,e));return{c(){e=l("div");for(let t=0;t<s.length;t+=1)s[t].c();this.h()},l(t){e=o(t,"DIV",{class:!0});var n=a(e);for(let t=0;t<s.length;t+=1)s[t].l(n);n.forEach(r),this.h()},h(){$(e,"class","swipe-indicator swipe-indicator-inside svelte-tx0axj")},m(t,n){i(t,e,n);for(let t=0;t<s.length;t+=1)s[t].m(e,null)},p(t,l){if(70&l[0]){let o;for(n=t[2],o=0;o<n.length;o+=1){const a=z(t,n,o);s[o]?s[o].p(a,l):(s[o]=F(a),s[o].c(),s[o].m(e,null))}for(;o<s.length;o+=1)s[o].d(1);s.length=n.length}},d(t){t&&r(e),c(s,t)}}}function F(t){let e,n,s;function c(...e){return t[30](t[32],...e)}return{c(){e=l("span"),this.h()},l(t){e=o(t,"SPAN",{class:!0}),a(e).forEach(r),this.h()},h(){$(e,"class",n="dot "+(t[1]==t[32]?"is-active":"")+" svelte-tx0axj"),s=f(e,"click",c)},m(t,n){i(t,e,n)},p(s,l){t=s,2&l[0]&&n!==(n="dot "+(t[1]==t[32]?"is-active":"")+" svelte-tx0axj")&&$(e,"class",n)},d(t){t&&r(e),s()}}}function G(t){let e,n,c,A,v,b,w,B,y;const R=t[27].default,I=s(R,t,t[26],null);let k=t[0]&&C(t);return{c(){e=l("div"),n=l("div"),c=l("div"),A=l("div"),I&&I.c(),v=g(),b=l("div"),w=g(),k&&k.c(),this.h()},l(t){e=o(t,"DIV",{class:!0});var s=a(e);n=o(s,"DIV",{class:!0});var l=a(n);c=o(l,"DIV",{class:!0});var $=a(c);A=o($,"DIV",{class:!0});var i=a(A);I&&I.l(i),i.forEach(r),$.forEach(r),l.forEach(r),v=h(s),b=o(s,"DIV",{class:!0}),a(b).forEach(r),w=h(s),k&&k.l(s),s.forEach(r),this.h()},h(){$(A,"class","swipeable-slot-wrapper svelte-tx0axj"),$(c,"class","swipeable-items svelte-tx0axj"),$(n,"class","swipe-item-wrapper svelte-tx0axj"),$(b,"class","swipe-handler svelte-tx0axj"),$(e,"class","swipe-panel svelte-tx0axj"),y=[f(b,"touchstart",t[5]),f(b,"mousedown",t[5])]},m(s,l){i(s,e,l),m(e,n),m(n,c),m(c,A),I&&I.m(A,null),t[28](n),m(e,v),m(e,b),t[29](b),m(e,w),k&&k.m(e,null),B=!0},p(t,n){I&&I.p&&67108864&n[0]&&I.p(p(R,t,t[26],null),x(R,t[26],n,null)),t[0]?k?k.p(t,n):((k=C(t)).c(),k.m(e,null)):k&&(k.d(1),k=null)},i(t){B||(u(I,t),B=!0)},o(t){E(I,t),B=!1},d(n){n&&r(e),I&&I.d(n),t[28](null),t[29](null),k&&k.d(),d(y)}}}let M=0,U=0;function W(t,e,n){let s,l,o,a,r,{transitionDuration:$=200}=e,{showIndicators:i=!1}=e,{autoplay:f=!1}=e,{delay:c=1e3}=e,g=0,h=0,m=0,p=0,x="\n    -webkit-transition-duration: 0s;\n    transition-duration: 0s;\n    -webkit-transform: translate3d(-{{val}}px, 0, 0);\n    -ms-transform: translate3d(-{{val}}px, 0, 0);",u=`\n    -webkit-transition-duration: ${$}ms;\n    transition-duration: ${$}ms;\n    -webkit-transform: translate3d(-{{val}}px, 0, 0);\n    -ms-transform: translate3d(-{{val}}px, 0, 0);`,E=!1,d=0,w=0,B=!1;function y(){n(4,a.style.top=M+"px",a),m=o.querySelector(".swipeable-items").offsetWidth;for(let t=0;t<h;t++)l[t].style.transform="translate3d("+m*t+"px, 0, 0)";p=0}function R(){l=o.querySelectorAll(".swipeable-item"),n(10,h=l.length),y()}function I(t){if(E){t.stopImmediatePropagation(),t.stopPropagation();let e=m,n=t.touches?t.touches[0].pageX:t.pageX,s=r-n+d;if((n>r?0:1)||(s=d-(n-r)),s<=e*(h-1)&&s>=U){for(let t=0;t<h;t++){let n=t<0?"{{val}}":"-{{val}}",o=e*t-s;l[t].style.cssText=x.replace(n,o).replace(n,o)}p=s}}}function k(t){t&&t.stopImmediatePropagation(),t&&t.stopPropagation(),t&&t.preventDefault();let e=m;E=!1,r=null;let s=p/e,o=s-Math.floor(s),a=o>.05&&o<.5?Math.ceil(s):Math.floor(s);p=Math.abs(a-s)<.85?a*e:(a+1)*e,d=p,n(1,g=p/e);for(let t=0;t<h;t++){let n=t<0?"{{val}}":"-{{val}}",s=e*t-d;l[t].style.cssText=u.replace(n,s).replace(n,s)}window.removeEventListener("mousemove",I),window.removeEventListener("mouseup",k),window.removeEventListener("touchmove",I),window.removeEventListener("touchend",k)}function S(t){p=m*t,n(1,g=t),k()}function T(){S(w),w=w<h-1?++w:0}A(()=>{R(),window.addEventListener("resize",y)}),v(()=>{window.removeEventListener("resize",y)});let{$$slots:L={},$$scope:P}=e;return t.$set=(t=>{"transitionDuration"in t&&n(7,$=t.transitionDuration),"showIndicators"in t&&n(0,i=t.showIndicators),"autoplay"in t&&n(8,f=t.autoplay),"delay"in t&&n(9,c=t.delay),"$$scope"in t&&n(26,P=t.$$scope)}),t.$$.update=(()=>{1024&t.$$.dirty[0]&&n(2,s=Array(h)),131840&t.$$.dirty[0]&&(f&&!B&&n(17,B=setInterval(T,c)),!f&&B&&(clearInterval(B),n(17,B=!1)))}),[i,g,s,o,a,function(t){t.stopImmediatePropagation(),t.stopPropagation(),t.preventDefault(),E=!0,r=t.touches?t.touches[0].pageX:t.pageX,window.addEventListener("mousemove",I),window.addEventListener("mouseup",k),window.addEventListener("touchmove",I),window.addEventListener("touchend",k)},S,$,f,c,h,m,l,p,E,d,w,B,r,x,u,y,R,I,k,T,P,L,function(t){b[t?"unshift":"push"](()=>{n(3,o=t)})},function(t){b[t?"unshift":"push"](()=>{n(4,a=t)})},t=>{S(t)}]}class X extends t{constructor(t){super(),e(this,t,W,G,n,{transitionDuration:7,showIndicators:0,autoplay:8,delay:9},[-1,-1])}}function q(t){let e,n,f;const c=t[2].default,g=s(c,t,t[1],null);return{c(){e=l("div"),g&&g.c(),this.h()},l(t){e=o(t,"DIV",{class:!0});var n=a(e);g&&g.l(n),n.forEach(r),this.h()},h(){$(e,"class",n="swipeable-item "+t[0]+" svelte-1c0dn3k")},m(t,n){i(t,e,n),g&&g.m(e,null),f=!0},p(t,[s]){g&&g.p&&2&s&&g.p(p(c,t,t[1],null),x(c,t[1],s,null)),(!f||1&s&&n!==(n="swipeable-item "+t[0]+" svelte-1c0dn3k"))&&$(e,"class",n)},i(t){f||(u(g,t),f=!0)},o(t){E(g,t),f=!1},d(t){t&&r(e),g&&g.d(t)}}}function K(t,e,n){let{classes:s=""}=e,{$$slots:l={},$$scope:o}=e;return t.$set=(t=>{"classes"in t&&n(0,s=t.classes),"$$scope"in t&&n(1,o=t.$$scope)}),[s,o,l]}class J extends t{constructor(t){super(),e(this,t,K,q,n,{classes:0})}}function Q(t){let e;const n=new H({props:{src:"https://placeimg.com/300/300/people",alt:"sample"}});return{c(){w(n.$$.fragment)},l(t){y(n.$$.fragment,t)},m(t,s){k(n,t,s),e=!0},p:T,i(t){e||(u(n.$$.fragment,t),e=!0)},o(t){E(n.$$.fragment,t),e=!1},d(t){S(n,t)}}}function Y(t){let e;const n=new H({props:{src:"https://placeimg.com/300/300/any",alt:"sample"}});return{c(){w(n.$$.fragment)},l(t){y(n.$$.fragment,t)},m(t,s){k(n,t,s),e=!0},p:T,i(t){e||(u(n.$$.fragment,t),e=!0)},o(t){E(n.$$.fragment,t),e=!1},d(t){S(n,t)}}}function Z(t){let e;const n=new H({props:{src:"https://placeimg.com/300/300/arch",alt:"sample"}});return{c(){w(n.$$.fragment)},l(t){y(n.$$.fragment,t)},m(t,s){k(n,t,s),e=!0},p:T,i(t){e||(u(n.$$.fragment,t),e=!0)},o(t){E(n.$$.fragment,t),e=!1},d(t){S(n,t)}}}function tt(t){let e;const n=new H({props:{src:"https://placeimg.com/300/300/nature",alt:"sample"}});return{c(){w(n.$$.fragment)},l(t){y(n.$$.fragment,t)},m(t,s){k(n,t,s),e=!0},p:T,i(t){e||(u(n.$$.fragment,t),e=!0)},o(t){E(n.$$.fragment,t),e=!1},d(t){S(n,t)}}}function et(t){let e;const n=new H({props:{src:"https://placeimg.com/300/300/tech",alt:"sample"}});return{c(){w(n.$$.fragment)},l(t){y(n.$$.fragment,t)},m(t,s){k(n,t,s),e=!0},p:T,i(t){e||(u(n.$$.fragment,t),e=!0)},o(t){E(n.$$.fragment,t),e=!1},d(t){S(n,t)}}}function nt(t){let e,n,s,l,o;const a=new J({props:{$$slots:{default:[Q]},$$scope:{ctx:t}}}),$=new J({props:{$$slots:{default:[Y]},$$scope:{ctx:t}}}),f=new J({props:{$$slots:{default:[Z]},$$scope:{ctx:t}}}),c=new J({props:{$$slots:{default:[tt]},$$scope:{ctx:t}}}),m=new J({props:{$$slots:{default:[et]},$$scope:{ctx:t}}});return{c(){w(a.$$.fragment),e=g(),w($.$$.fragment),n=g(),w(f.$$.fragment),s=g(),w(c.$$.fragment),l=g(),w(m.$$.fragment)},l(t){y(a.$$.fragment,t),e=h(t),y($.$$.fragment,t),n=h(t),y(f.$$.fragment,t),s=h(t),y(c.$$.fragment,t),l=h(t),y(m.$$.fragment,t)},m(t,r){k(a,t,r),i(t,e,r),k($,t,r),i(t,n,r),k(f,t,r),i(t,s,r),k(c,t,r),i(t,l,r),k(m,t,r),o=!0},p(t,e){const n={};131072&e&&(n.$$scope={dirty:e,ctx:t}),a.$set(n);const s={};131072&e&&(s.$$scope={dirty:e,ctx:t}),$.$set(s);const l={};131072&e&&(l.$$scope={dirty:e,ctx:t}),f.$set(l);const o={};131072&e&&(o.$$scope={dirty:e,ctx:t}),c.$set(o);const r={};131072&e&&(r.$$scope={dirty:e,ctx:t}),m.$set(r)},i(t){o||(u(a.$$.fragment,t),u($.$$.fragment,t),u(f.$$.fragment,t),u(c.$$.fragment,t),u(m.$$.fragment,t),o=!0)},o(t){E(a.$$.fragment,t),E($.$$.fragment,t),E(f.$$.fragment,t),E(c.$$.fragment,t),E(m.$$.fragment,t),o=!1},d(t){S(a,t),t&&r(e),S($,t),t&&r(n),S(f,t),t&&r(s),S(c,t),t&&r(l),S(m,t)}}}function st(t){let e;return{c(){e=B("test1")},l(t){e=R(t,"test1")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function lt(t){let e;return{c(){e=B("test12")},l(t){e=R(t,"test12")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function ot(t){let e;return{c(){e=B("test123")},l(t){e=R(t,"test123")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function at(t){let e;return{c(){e=B("Submit")},l(t){e=R(t,"Submit")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function rt(t){let e;return{c(){e=B("Submit")},l(t){e=R(t,"Submit")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function $t(t){let e,n,s,a,$,f,c,m,p,x,d,A,v,b,B,R,I,T,O,_,N,D,j,V,H,z,C,F,G,M,U,W,X,q,K,J,Q,Y,Z,tt,et,nt,st,lt,ot;const at=new P({props:{name:"test1",type:"number",list:"sum-suggestions"}}),$t=new P({props:{name:"test2",type:"text",list:"sum-suggestions"}}),it=new P({props:{name:"test3",type:"email",list:"sum-suggestions"}}),ft=new P({props:{name:"test4",type:"url",list:"sum-suggestions"}}),ct=new P({props:{name:"test5",type:"search",list:"sum-suggestions"}}),gt=new P({props:{name:"test6",type:"date",list:"sum-suggestions"}}),ht=new P({props:{name:"test7",type:"password",list:"sum-suggestions"}}),mt=new P({props:{name:"test8",type:"tel",list:"sum-suggestions"}}),pt=new L({props:{is:"success",type:"submit",$$slots:{default:[rt]},$$scope:{ctx:t}}});return{c(){e=l("br"),n=g(),s=l("br"),a=g(),w(at.$$.fragment),$=g(),f=l("br"),c=g(),m=l("br"),p=g(),w($t.$$.fragment),x=g(),d=l("br"),A=g(),v=l("br"),b=g(),w(it.$$.fragment),B=g(),R=l("br"),I=g(),T=l("br"),O=g(),w(ft.$$.fragment),_=g(),N=l("br"),D=g(),j=l("br"),V=g(),w(ct.$$.fragment),H=g(),z=l("br"),C=g(),F=l("br"),G=g(),w(gt.$$.fragment),M=g(),U=l("br"),W=g(),X=l("br"),q=g(),w(ht.$$.fragment),K=g(),J=l("br"),Q=g(),Y=l("br"),Z=g(),w(mt.$$.fragment),tt=g(),et=l("br"),nt=g(),st=l("br"),lt=g(),w(pt.$$.fragment)},l(t){e=o(t,"BR",{}),n=h(t),s=o(t,"BR",{}),a=h(t),y(at.$$.fragment,t),$=h(t),f=o(t,"BR",{}),c=h(t),m=o(t,"BR",{}),p=h(t),y($t.$$.fragment,t),x=h(t),d=o(t,"BR",{}),A=h(t),v=o(t,"BR",{}),b=h(t),y(it.$$.fragment,t),B=h(t),R=o(t,"BR",{}),I=h(t),T=o(t,"BR",{}),O=h(t),y(ft.$$.fragment,t),_=h(t),N=o(t,"BR",{}),D=h(t),j=o(t,"BR",{}),V=h(t),y(ct.$$.fragment,t),H=h(t),z=o(t,"BR",{}),C=h(t),F=o(t,"BR",{}),G=h(t),y(gt.$$.fragment,t),M=h(t),U=o(t,"BR",{}),W=h(t),X=o(t,"BR",{}),q=h(t),y(ht.$$.fragment,t),K=h(t),J=o(t,"BR",{}),Q=h(t),Y=o(t,"BR",{}),Z=h(t),y(mt.$$.fragment,t),tt=h(t),et=o(t,"BR",{}),nt=h(t),st=o(t,"BR",{}),lt=h(t),y(pt.$$.fragment,t)},m(t,l){i(t,e,l),i(t,n,l),i(t,s,l),i(t,a,l),k(at,t,l),i(t,$,l),i(t,f,l),i(t,c,l),i(t,m,l),i(t,p,l),k($t,t,l),i(t,x,l),i(t,d,l),i(t,A,l),i(t,v,l),i(t,b,l),k(it,t,l),i(t,B,l),i(t,R,l),i(t,I,l),i(t,T,l),i(t,O,l),k(ft,t,l),i(t,_,l),i(t,N,l),i(t,D,l),i(t,j,l),i(t,V,l),k(ct,t,l),i(t,H,l),i(t,z,l),i(t,C,l),i(t,F,l),i(t,G,l),k(gt,t,l),i(t,M,l),i(t,U,l),i(t,W,l),i(t,X,l),i(t,q,l),k(ht,t,l),i(t,K,l),i(t,J,l),i(t,Q,l),i(t,Y,l),i(t,Z,l),k(mt,t,l),i(t,tt,l),i(t,et,l),i(t,nt,l),i(t,st,l),i(t,lt,l),k(pt,t,l),ot=!0},p(t,e){const n={};131072&e&&(n.$$scope={dirty:e,ctx:t}),pt.$set(n)},i(t){ot||(u(at.$$.fragment,t),u($t.$$.fragment,t),u(it.$$.fragment,t),u(ft.$$.fragment,t),u(ct.$$.fragment,t),u(gt.$$.fragment,t),u(ht.$$.fragment,t),u(mt.$$.fragment,t),u(pt.$$.fragment,t),ot=!0)},o(t){E(at.$$.fragment,t),E($t.$$.fragment,t),E(it.$$.fragment,t),E(ft.$$.fragment,t),E(ct.$$.fragment,t),E(gt.$$.fragment,t),E(ht.$$.fragment,t),E(mt.$$.fragment,t),E(pt.$$.fragment,t),ot=!1},d(t){t&&r(e),t&&r(n),t&&r(s),t&&r(a),S(at,t),t&&r($),t&&r(f),t&&r(c),t&&r(m),t&&r(p),S($t,t),t&&r(x),t&&r(d),t&&r(A),t&&r(v),t&&r(b),S(it,t),t&&r(B),t&&r(R),t&&r(I),t&&r(T),t&&r(O),S(ft,t),t&&r(_),t&&r(N),t&&r(D),t&&r(j),t&&r(V),S(ct,t),t&&r(H),t&&r(z),t&&r(C),t&&r(F),t&&r(G),S(gt,t),t&&r(M),t&&r(U),t&&r(W),t&&r(X),t&&r(q),S(ht,t),t&&r(K),t&&r(J),t&&r(Q),t&&r(Y),t&&r(Z),S(mt,t),t&&r(tt),t&&r(et),t&&r(nt),t&&r(st),t&&r(lt),S(pt,t)}}}function it(t){let e;return{c(){e=B("test")},l(t){e=R(t,"test")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function ft(t){let e;return{c(){e=B("test")},l(t){e=R(t,"test")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function ct(t){let e;return{c(){e=B("test")},l(t){e=R(t,"test")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function gt(t){let e;return{c(){e=B("test")},l(t){e=R(t,"test")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function ht(t){let e;return{c(){e=B("Some example of Button")},l(t){e=R(t,"Some example of Button")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function mt(t){let e;return{c(){e=B("Some example of Button")},l(t){e=R(t,"Some example of Button")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function pt(t){let e;return{c(){e=B("test")},l(t){e=R(t,"test")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function xt(t){let e;return{c(){e=B("test")},l(t){e=R(t,"test")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function ut(t){let e;return{c(){e=B("test")},l(t){e=R(t,"test")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function Et(t){let e;return{c(){e=B("test")},l(t){e=R(t,"test")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function dt(t){let e;return{c(){e=B("Some example of Button")},l(t){e=R(t,"Some example of Button")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function At(t){let e;return{c(){e=B("Some example of Button")},l(t){e=R(t,"Some example of Button")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function vt(t){let e;return{c(){e=B("HIGH FIVE!")},l(t){e=R(t,"HIGH FIVE!")},m(t,n){i(t,e,n)},d(t){t&&r(e)}}}function bt(t){let e,n,s,f,c,p,x,d,A,v,b,T,z,C,F,G,M,U,W,q,K,J,Q,Y,Z,tt,et,rt,bt,wt,Bt,yt,Rt,It,kt,St,Tt,Lt,Pt,Ot,_t,Nt,Dt,jt,Vt,Ht,zt,Ct,Ft,Gt,Mt,Ut,Wt,Xt,qt,Kt,Jt,Qt,Yt,Zt,te,ee,ne,se,le,oe,ae,re,$e,ie,fe,ce,ge,he,me,pe,xe,ue,Ee,de,Ae,ve,be,we,Be,ye,Re,Ie,ke,Se,Te,Le,Pe,Oe,_e,Ne,De,je,Ve,He,ze,Ce,Fe,Ge,Me,Ue,We,Xe,qe,Ke,Je,Qe,Ye,Ze,tn,en,nn,sn,ln,on,an,rn,$n,fn,cn,gn,hn,mn,pn,xn,un,En,dn,An,vn,bn,wn,Bn,yn,Rn,In,kn,Sn,Tn,Ln,Pn,On,_n,Nn,Dn,jn,Vn,Hn,zn,Cn,Fn,Gn,Mn,Un,Wn,Xn,qn,Kn,Jn,Qn,Yn,Zn,ts,es,ns,ss,ls,os,as,rs,$s,is,fs,cs,gs,hs,ms,ps,xs,us,Es,ds,As,vs,bs,ws,Bs,ys,Rs,Is,ks,Ss,Ts,Ls,Ps,Os,_s,Ns,Ds,js,Vs,Hs,zs,Cs,Fs,Gs,Ms,Us,Ws,Xs,qs,Ks,Js,Qs,Ys,Zs,tl,el,nl,sl,ll,ol,al,rl,$l,il,fl,cl,gl,hl,ml,pl,xl,ul,El,dl,Al,vl,bl,wl,Bl,yl,Rl,Il,kl;const Sl=new X({props:{$$slots:{default:[nt]},$$scope:{ctx:t}}}),Tl=new L({props:{is:"success",$$slots:{default:[st]},$$scope:{ctx:t}}});Tl.$on("click",t[0]);const Ll=new L({props:{is:"success",$$slots:{default:[lt]},$$scope:{ctx:t}}});Ll.$on("click",t[1]);const Pl=new L({props:{is:"success",$$slots:{default:[ot]},$$scope:{ctx:t}}});Pl.$on("click",t[2]);const Ol=new P({props:{type:"number",name:"num",list:"sum-suggestions",placeholder:"Num",autoselect:!0,align:"right"}}),_l=new L({props:{is:"warning",$$slots:{default:[at]},$$scope:{ctx:t}}});_l.$on("click",t[3]);const Nl=new O({props:{value:"65"}}),Dl=new _({props:{src:"https://placeimg.com/300/300/people",alt:"avatar"}}),jl=new N({}),Vl=new D({}),Hl=new j({props:{name:"main-form",$$slots:{default:[$t]},$$scope:{ctx:t}}});Hl.$on("submit",t[4]);const zl=new V({props:{size:"small",type:"heart-filled"}}),Cl=new V({props:{size:"small",type:"heart-filled",is:"warning"}}),Fl=new V({props:{size:"small",type:"heart-filled",is:"danger"}}),Gl=new V({props:{type:"heart-filled"}}),Ml=new V({props:{type:"heart-filled",is:"warning"}}),Ul=new V({props:{type:"heart-filled",is:"danger"}}),Wl=new V({props:{size:"big",type:"heart-filled"}}),Xl=new V({props:{size:"big",type:"heart-filled",is:"warning"}}),ql=new V({props:{size:"big",type:"heart-filled",is:"danger"}}),Kl=new L({props:{$$slots:{default:[it]},$$scope:{ctx:t}}});Kl.$on("click",t[5]);const Jl=new L({props:{is:"success",$$slots:{default:[ft]},$$scope:{ctx:t}}});Jl.$on("click",t[6]);const Ql=new L({props:{is:"success",ariaLabel:"text",$$slots:{default:[ct]},$$scope:{ctx:t}}});Ql.$on("click",t[7]);const Yl=new L({props:{is:"success",$$slots:{default:[gt]},$$scope:{ctx:t}}});Yl.$on("click",t[8]);const Zl=new L({props:{is:"warning",$$slots:{default:[ht]},$$scope:{ctx:t}}});Zl.$on("click",t[9]);const to=new L({props:{is:"danger",$$slots:{default:[mt]},$$scope:{ctx:t}}});to.$on("click",t[10]);const eo=new L({props:{href:"#",$$slots:{default:[pt]},$$scope:{ctx:t}}});eo.$on("click",t[11]);const no=new L({props:{is:"success",href:"#",$$slots:{default:[xt]},$$scope:{ctx:t}}});no.$on("click",t[12]);const so=new L({props:{is:"success",href:"#",$$slots:{default:[ut]},$$scope:{ctx:t}}});so.$on("click",t[13]);const lo=new L({props:{is:"success",href:"#",$$slots:{default:[Et]},$$scope:{ctx:t}}});lo.$on("click",t[14]);const oo=new L({props:{is:"warning",href:"#",$$slots:{default:[dt]},$$scope:{ctx:t}}});oo.$on("click",t[15]);const ao=new L({props:{is:"danger",href:"#",$$slots:{default:[At]},$$scope:{ctx:t}}});ao.$on("click",t[16]);const ro=new P({props:{rows:2,name:"tex",list:"lis"}}),$o=new P({props:{name:"tex1",list:"lis",placeholder:"Some placeholder text"}}),io=new P({props:{type:"number",name:"tex2",list:"lis"}}),fo=new H({props:{alt:"Borat",src:"great-success.png",class:"picture",$$slots:{default:[vt]},$$scope:{ctx:t}}}),co=new H({props:{src:"https://placeimg.com/1000/1000/any",alt:"sample"}});return{c(){e=g(),n=l("section"),s=l("section"),f=l("div"),w(Sl.$$.fragment),c=g(),p=l("ul"),x=l("li"),w(Tl.$$.fragment),d=g(),A=l("li"),w(Ll.$$.fragment),v=g(),b=l("li"),w(Pl.$$.fragment),T=g(),z=l("li"),C=l("br"),F=g(),w(Ol.$$.fragment),G=g(),M=l("datalist"),U=l("option"),W=l("option"),q=l("option"),K=g(),J=l("li"),w(_l.$$.fragment),Q=g(),w(Nl.$$.fragment),Y=g(),Z=l("section"),tt=l("div"),w(Dl.$$.fragment),et=g(),rt=l("span"),bt=l("h3"),wt=B("Tina Kandelaki"),Bt=g(),yt=l("p"),Rt=B("ORG charity charitify"),It=g(),w(jl.$$.fragment),kt=g(),St=l("br"),Tt=g(),Lt=l("h1"),Pt=B("The main title"),Ot=g(),_t=l("br"),Nt=g(),Dt=l("p"),jt=B("A small description that describes the title above and just makes text longer."),Vt=g(),Ht=l("br"),zt=g(),Ct=l("br"),Ft=g(),w(Vl.$$.fragment),Gt=g(),w(Hl.$$.fragment),Mt=g(),Ut=l("h1"),Wt=B("Charitify - is the application for helping those in need."),Xt=g(),qt=l("br"),Kt=g(),Jt=l("br"),Qt=g(),Yt=l("h2"),Zt=B("Typography"),te=g(),ee=l("br"),ne=g(),se=l("br"),le=g(),oe=l("p"),ae=B("Few paragraphs to text fonts"),re=g(),$e=l("p"),ie=B("Декілька параграфів для тесту тексту"),fe=g(),ce=l("p"),ge=B("Несколько параграфов для теста текста"),he=g(),me=l("br"),pe=g(),xe=l("br"),ue=g(),Ee=l("h2"),de=B("Interactive elements"),Ae=g(),ve=l("ul"),be=l("li"),we=l("span"),w(zl.$$.fragment),Be=g(),w(Cl.$$.fragment),ye=g(),w(Fl.$$.fragment),Re=g(),Ie=l("li"),ke=l("span"),w(Gl.$$.fragment),Se=g(),w(Ml.$$.fragment),Te=g(),w(Ul.$$.fragment),Le=g(),Pe=l("li"),Oe=l("span"),w(Wl.$$.fragment),_e=g(),w(Xl.$$.fragment),Ne=g(),w(ql.$$.fragment),De=g(),je=l("br"),Ve=g(),He=l("br"),ze=g(),Ce=l("section"),Fe=l("div"),Ge=l("br"),Me=B("\n        Buttons\n        "),Ue=l("br"),We=g(),Xe=l("br"),qe=g(),w(Kl.$$.fragment),Ke=g(),Je=l("br"),Qe=g(),Ye=l("br"),Ze=g(),w(Jl.$$.fragment),tn=g(),en=l("br"),nn=g(),sn=l("br"),ln=g(),w(Ql.$$.fragment),on=g(),an=l("br"),rn=g(),$n=l("br"),fn=B("\n        With text\n        "),w(Yl.$$.fragment),cn=B("\n        and behind.\n        "),gn=l("br"),hn=g(),mn=l("br"),pn=g(),w(Zl.$$.fragment),xn=g(),un=l("br"),En=g(),dn=l("br"),An=g(),w(to.$$.fragment),vn=g(),bn=l("br"),wn=g(),Bn=l("br"),yn=g(),Rn=l("div"),In=l("br"),kn=B("\n        Links as buttons\n        "),Sn=l("br"),Tn=g(),Ln=l("br"),Pn=g(),w(eo.$$.fragment),On=g(),_n=l("br"),Nn=g(),Dn=l("br"),jn=g(),w(no.$$.fragment),Vn=g(),Hn=l("br"),zn=g(),Cn=l("br"),Fn=g(),w(so.$$.fragment),Gn=g(),Mn=l("br"),Un=g(),Wn=l("br"),Xn=B("\n        With text\n        "),w(lo.$$.fragment),qn=B("\n        and behind.\n        "),Kn=l("br"),Jn=g(),Qn=l("br"),Yn=g(),w(oo.$$.fragment),Zn=g(),ts=l("br"),es=g(),ns=l("br"),ss=g(),w(ao.$$.fragment),ls=g(),os=l("br"),as=g(),rs=l("br"),$s=g(),is=l("br"),fs=g(),cs=l("br"),gs=g(),hs=l("h2"),ms=B("Input fields"),ps=g(),xs=l("br"),us=g(),Es=l("br"),ds=g(),As=l("section"),w(ro.$$.fragment),vs=g(),bs=l("br"),ws=g(),Bs=l("br"),ys=g(),w($o.$$.fragment),Rs=g(),Is=l("br"),ks=g(),Ss=l("br"),Ts=g(),w(io.$$.fragment),Ls=g(),Ps=l("datalist"),Os=l("option"),_s=l("option"),Ns=l("option"),Ds=g(),js=l("label"),Vs=B("label"),Hs=g(),zs=l("input"),Cs=g(),Fs=l("br"),Gs=g(),Ms=l("br"),Us=g(),Ws=l("a"),Xs=B("Some link"),qs=g(),Ks=l("br"),Js=g(),Qs=l("br"),Ys=g(),Zs=l("button"),tl=B("Button example"),el=g(),nl=l("br"),sl=g(),ll=l("br"),ol=g(),al=l("h2"),rl=B("Images"),$l=g(),w(fo.$$.fragment),il=g(),fl=l("br"),cl=g(),gl=l("br"),hl=g(),w(co.$$.fragment),ml=g(),pl=l("br"),xl=g(),ul=l("br"),El=g(),dl=l("h2"),Al=B("Other"),vl=g(),bl=l("p"),wl=l("strong"),Bl=B("Try editing this file (src/routes/index.svelte) to test live reloading."),yl=g(),Rl=l("p"),Il=B("A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text."),this.h()},l(t){e=h(t),n=o(t,"SECTION",{class:!0});var l=a(n);s=o(l,"SECTION",{class:!0});var $=a(s);f=o($,"DIV",{class:!0});var i=a(f);y(Sl.$$.fragment,i),i.forEach(r),c=h($),p=o($,"UL",{class:!0});var g=a(p);x=o(g,"LI",{class:!0});var m=a(x);y(Tl.$$.fragment,m),m.forEach(r),d=h(g),A=o(g,"LI",{class:!0});var u=a(A);y(Ll.$$.fragment,u),u.forEach(r),v=h(g),b=o(g,"LI",{class:!0});var E=a(b);y(Pl.$$.fragment,E),E.forEach(r),T=h(g),z=o(g,"LI",{class:!0});var w=a(z);C=o(w,"BR",{}),F=h(w),y(Ol.$$.fragment,w),G=h(w),M=o(w,"DATALIST",{id:!0});var B=a(M);U=o(B,"OPTION",{value:!0}),a(U).forEach(r),W=o(B,"OPTION",{value:!0}),a(W).forEach(r),q=o(B,"OPTION",{value:!0}),a(q).forEach(r),B.forEach(r),w.forEach(r),K=h(g),J=o(g,"LI",{class:!0});var I=a(J);y(_l.$$.fragment,I),I.forEach(r),g.forEach(r),$.forEach(r),Q=h(l),y(Nl.$$.fragment,l),Y=h(l),Z=o(l,"SECTION",{class:!0});var k=a(Z);tt=o(k,"DIV",{class:!0});var S=a(tt);y(Dl.$$.fragment,S),et=h(S),rt=o(S,"SPAN",{class:!0});var L=a(rt);bt=o(L,"H3",{class:!0});var P=a(bt);wt=R(P,"Tina Kandelaki"),P.forEach(r),Bt=h(L),yt=o(L,"P",{class:!0});var O=a(yt);Rt=R(O,"ORG charity charitify"),O.forEach(r),L.forEach(r),S.forEach(r),It=h(k),y(jl.$$.fragment,k),k.forEach(r),kt=h(l),St=o(l,"BR",{}),Tt=h(l),Lt=o(l,"H1",{class:!0});var _=a(Lt);Pt=R(_,"The main title"),_.forEach(r),Ot=h(l),_t=o(l,"BR",{}),Nt=h(l),Dt=o(l,"P",{class:!0,style:!0});var N=a(Dt);jt=R(N,"A small description that describes the title above and just makes text longer."),N.forEach(r),l.forEach(r),Vt=h(t),Ht=o(t,"BR",{}),zt=h(t),Ct=o(t,"BR",{}),Ft=h(t),y(Vl.$$.fragment,t),Gt=h(t),y(Hl.$$.fragment,t),Mt=h(t),Ut=o(t,"H1",{class:!0});var D=a(Ut);Wt=R(D,"Charitify - is the application for helping those in need."),D.forEach(r),Xt=h(t),qt=o(t,"BR",{}),Kt=h(t),Jt=o(t,"BR",{}),Qt=h(t),Yt=o(t,"H2",{class:!0});var j=a(Yt);Zt=R(j,"Typography"),j.forEach(r),te=h(t),ee=o(t,"BR",{}),ne=h(t),se=o(t,"BR",{}),le=h(t),oe=o(t,"P",{});var V=a(oe);ae=R(V,"Few paragraphs to text fonts"),V.forEach(r),re=h(t),$e=o(t,"P",{});var H=a($e);ie=R(H,"Декілька параграфів для тесту тексту"),H.forEach(r),fe=h(t),ce=o(t,"P",{});var X=a(ce);ge=R(X,"Несколько параграфов для теста текста"),X.forEach(r),he=h(t),me=o(t,"BR",{}),pe=h(t),xe=o(t,"BR",{}),ue=h(t),Ee=o(t,"H2",{class:!0});var nt=a(Ee);de=R(nt,"Interactive elements"),nt.forEach(r),Ae=h(t),ve=o(t,"UL",{});var st=a(ve);be=o(st,"LI",{});var lt=a(be);we=o(lt,"SPAN",{});var ot=a(we);y(zl.$$.fragment,ot),Be=h(ot),y(Cl.$$.fragment,ot),ye=h(ot),y(Fl.$$.fragment,ot),ot.forEach(r),lt.forEach(r),Re=h(st),Ie=o(st,"LI",{});var at=a(Ie);ke=o(at,"SPAN",{});var $t=a(ke);y(Gl.$$.fragment,$t),Se=h($t),y(Ml.$$.fragment,$t),Te=h($t),y(Ul.$$.fragment,$t),$t.forEach(r),at.forEach(r),Le=h(st),Pe=o(st,"LI",{});var it=a(Pe);Oe=o(it,"SPAN",{});var ft=a(Oe);y(Wl.$$.fragment,ft),_e=h(ft),y(Xl.$$.fragment,ft),Ne=h(ft),y(ql.$$.fragment,ft),ft.forEach(r),it.forEach(r),st.forEach(r),De=h(t),je=o(t,"BR",{}),Ve=h(t),He=o(t,"BR",{}),ze=h(t),Ce=o(t,"SECTION",{style:!0});var ct=a(Ce);Fe=o(ct,"DIV",{});var gt=a(Fe);Ge=o(gt,"BR",{}),Me=R(gt,"\n        Buttons\n        "),Ue=o(gt,"BR",{}),We=h(gt),Xe=o(gt,"BR",{}),qe=h(gt),y(Kl.$$.fragment,gt),Ke=h(gt),Je=o(gt,"BR",{}),Qe=h(gt),Ye=o(gt,"BR",{}),Ze=h(gt),y(Jl.$$.fragment,gt),tn=h(gt),en=o(gt,"BR",{}),nn=h(gt),sn=o(gt,"BR",{}),ln=h(gt),y(Ql.$$.fragment,gt),on=h(gt),an=o(gt,"BR",{}),rn=h(gt),$n=o(gt,"BR",{}),fn=R(gt,"\n        With text\n        "),y(Yl.$$.fragment,gt),cn=R(gt,"\n        and behind.\n        "),gn=o(gt,"BR",{}),hn=h(gt),mn=o(gt,"BR",{}),pn=h(gt),y(Zl.$$.fragment,gt),xn=h(gt),un=o(gt,"BR",{}),En=h(gt),dn=o(gt,"BR",{}),An=h(gt),y(to.$$.fragment,gt),vn=h(gt),bn=o(gt,"BR",{}),wn=h(gt),Bn=o(gt,"BR",{}),gt.forEach(r),yn=h(ct),Rn=o(ct,"DIV",{});var ht=a(Rn);In=o(ht,"BR",{}),kn=R(ht,"\n        Links as buttons\n        "),Sn=o(ht,"BR",{}),Tn=h(ht),Ln=o(ht,"BR",{}),Pn=h(ht),y(eo.$$.fragment,ht),On=h(ht),_n=o(ht,"BR",{}),Nn=h(ht),Dn=o(ht,"BR",{}),jn=h(ht),y(no.$$.fragment,ht),Vn=h(ht),Hn=o(ht,"BR",{}),zn=h(ht),Cn=o(ht,"BR",{}),Fn=h(ht),y(so.$$.fragment,ht),Gn=h(ht),Mn=o(ht,"BR",{}),Un=h(ht),Wn=o(ht,"BR",{}),Xn=R(ht,"\n        With text\n        "),y(lo.$$.fragment,ht),qn=R(ht,"\n        and behind.\n        "),Kn=o(ht,"BR",{}),Jn=h(ht),Qn=o(ht,"BR",{}),Yn=h(ht),y(oo.$$.fragment,ht),Zn=h(ht),ts=o(ht,"BR",{}),es=h(ht),ns=o(ht,"BR",{}),ss=h(ht),y(ao.$$.fragment,ht),ls=h(ht),os=o(ht,"BR",{}),as=h(ht),rs=o(ht,"BR",{}),ht.forEach(r),ct.forEach(r),$s=h(t),is=o(t,"BR",{}),fs=h(t),cs=o(t,"BR",{}),gs=h(t),hs=o(t,"H2",{class:!0});var mt=a(hs);ms=R(mt,"Input fields"),mt.forEach(r),ps=h(t),xs=o(t,"BR",{}),us=h(t),Es=o(t,"BR",{}),ds=h(t),As=o(t,"SECTION",{});var pt=a(As);y(ro.$$.fragment,pt),vs=h(pt),bs=o(pt,"BR",{}),ws=h(pt),Bs=o(pt,"BR",{}),ys=h(pt),y($o.$$.fragment,pt),Rs=h(pt),Is=o(pt,"BR",{}),ks=h(pt),Ss=o(pt,"BR",{}),Ts=h(pt),y(io.$$.fragment,pt),Ls=h(pt),Ps=o(pt,"DATALIST",{id:!0});var xt=a(Ps);Os=o(xt,"OPTION",{value:!0}),a(Os).forEach(r),_s=o(xt,"OPTION",{value:!0}),a(_s).forEach(r),Ns=o(xt,"OPTION",{value:!0}),a(Ns).forEach(r),xt.forEach(r),Ds=h(pt),js=o(pt,"LABEL",{for:!0,class:!0});var ut=a(js);Vs=R(ut,"label"),ut.forEach(r),Hs=h(pt),zs=o(pt,"INPUT",{id:!0,type:!0,value:!0}),Cs=h(pt),Fs=o(pt,"BR",{}),Gs=h(pt),Ms=o(pt,"BR",{}),Us=h(pt),Ws=o(pt,"A",{href:!0,class:!0});var Et=a(Ws);Xs=R(Et,"Some link"),Et.forEach(r),qs=h(pt),Ks=o(pt,"BR",{}),Js=h(pt),Qs=o(pt,"BR",{}),Ys=h(pt),Zs=o(pt,"BUTTON",{type:!0,class:!0});var dt=a(Zs);tl=R(dt,"Button example"),dt.forEach(r),pt.forEach(r),el=h(t),nl=o(t,"BR",{}),sl=h(t),ll=o(t,"BR",{}),ol=h(t),al=o(t,"H2",{class:!0});var At=a(al);rl=R(At,"Images"),At.forEach(r),$l=h(t),y(fo.$$.fragment,t),il=h(t),fl=o(t,"BR",{}),cl=h(t),gl=o(t,"BR",{}),hl=h(t),y(co.$$.fragment,t),ml=h(t),pl=o(t,"BR",{}),xl=h(t),ul=o(t,"BR",{}),El=h(t),dl=o(t,"H2",{class:!0});var vt=a(dl);Al=R(vt,"Other"),vt.forEach(r),vl=h(t),bl=o(t,"P",{});var kl=a(bl);wl=o(kl,"STRONG",{});var go=a(wl);Bl=R(go,"Try editing this file (src/routes/index.svelte) to test live reloading."),go.forEach(r),kl.forEach(r),yl=h(t),Rl=o(t,"P",{style:!0});var ho=a(Rl);Il=R(ho,"A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text."),ho.forEach(r),this.h()},h(){document.title="Charitify - is the application for helping those in need.",$(f,"class","top-pic svelte-1acbdpe"),$(x,"class","svelte-1acbdpe"),$(A,"class","svelte-1acbdpe"),$(b,"class","svelte-1acbdpe"),U.__value="20",U.value=U.__value,W.__value="500",W.value=W.__value,q.__value="1000",q.value=q.__value,$(M,"id","sum-suggestions"),$(z,"class","svelte-1acbdpe"),$(J,"class","svelte-1acbdpe"),$(p,"class","options svelte-1acbdpe"),$(s,"class","top svelte-1acbdpe"),$(bt,"class","svelte-1acbdpe"),$(yt,"class","svelte-1acbdpe"),$(rt,"class","svelte-1acbdpe"),$(tt,"class","ava-section svelte-1acbdpe"),$(Z,"class","rate-section svelte-1acbdpe"),$(Lt,"class","svelte-1acbdpe"),$(Dt,"class","text-center"),I(Dt,"padding","0 10vw"),$(n,"class","container"),$(Ut,"class","svelte-1acbdpe"),$(Yt,"class","text-success"),$(Ee,"class","text-warning"),I(Ce,"text-align","center"),I(Ce,"display","flex"),I(Ce,"justify-content","space-around"),$(hs,"class","text-danger"),Os.__value="1",Os.value=Os.__value,_s.__value="2",_s.value=_s.__value,Ns.__value="3",Ns.value=Ns.__value,$(Ps,"id","lis"),$(js,"for","input"),$(js,"class","text-success"),$(zs,"id","input"),$(zs,"type","text"),zs.value="text",$(Ws,"href","."),$(Ws,"class","text-warning"),$(Zs,"type","button"),$(Zs,"class","text-info"),$(al,"class","text-info"),$(dl,"class","text-success"),I(Rl,"text-align","justify")},m(t,l){i(t,e,l),i(t,n,l),m(n,s),m(s,f),k(Sl,f,null),m(s,c),m(s,p),m(p,x),k(Tl,x,null),m(p,d),m(p,A),k(Ll,A,null),m(p,v),m(p,b),k(Pl,b,null),m(p,T),m(p,z),m(z,C),m(z,F),k(Ol,z,null),m(z,G),m(z,M),m(M,U),m(M,W),m(M,q),m(p,K),m(p,J),k(_l,J,null),m(n,Q),k(Nl,n,null),m(n,Y),m(n,Z),m(Z,tt),k(Dl,tt,null),m(tt,et),m(tt,rt),m(rt,bt),m(bt,wt),m(rt,Bt),m(rt,yt),m(yt,Rt),m(Z,It),k(jl,Z,null),m(n,kt),m(n,St),m(n,Tt),m(n,Lt),m(Lt,Pt),m(n,Ot),m(n,_t),m(n,Nt),m(n,Dt),m(Dt,jt),i(t,Vt,l),i(t,Ht,l),i(t,zt,l),i(t,Ct,l),i(t,Ft,l),k(Vl,t,l),i(t,Gt,l),k(Hl,t,l),i(t,Mt,l),i(t,Ut,l),m(Ut,Wt),i(t,Xt,l),i(t,qt,l),i(t,Kt,l),i(t,Jt,l),i(t,Qt,l),i(t,Yt,l),m(Yt,Zt),i(t,te,l),i(t,ee,l),i(t,ne,l),i(t,se,l),i(t,le,l),i(t,oe,l),m(oe,ae),i(t,re,l),i(t,$e,l),m($e,ie),i(t,fe,l),i(t,ce,l),m(ce,ge),i(t,he,l),i(t,me,l),i(t,pe,l),i(t,xe,l),i(t,ue,l),i(t,Ee,l),m(Ee,de),i(t,Ae,l),i(t,ve,l),m(ve,be),m(be,we),k(zl,we,null),m(we,Be),k(Cl,we,null),m(we,ye),k(Fl,we,null),m(ve,Re),m(ve,Ie),m(Ie,ke),k(Gl,ke,null),m(ke,Se),k(Ml,ke,null),m(ke,Te),k(Ul,ke,null),m(ve,Le),m(ve,Pe),m(Pe,Oe),k(Wl,Oe,null),m(Oe,_e),k(Xl,Oe,null),m(Oe,Ne),k(ql,Oe,null),i(t,De,l),i(t,je,l),i(t,Ve,l),i(t,He,l),i(t,ze,l),i(t,Ce,l),m(Ce,Fe),m(Fe,Ge),m(Fe,Me),m(Fe,Ue),m(Fe,We),m(Fe,Xe),m(Fe,qe),k(Kl,Fe,null),m(Fe,Ke),m(Fe,Je),m(Fe,Qe),m(Fe,Ye),m(Fe,Ze),k(Jl,Fe,null),m(Fe,tn),m(Fe,en),m(Fe,nn),m(Fe,sn),m(Fe,ln),k(Ql,Fe,null),m(Fe,on),m(Fe,an),m(Fe,rn),m(Fe,$n),m(Fe,fn),k(Yl,Fe,null),m(Fe,cn),m(Fe,gn),m(Fe,hn),m(Fe,mn),m(Fe,pn),k(Zl,Fe,null),m(Fe,xn),m(Fe,un),m(Fe,En),m(Fe,dn),m(Fe,An),k(to,Fe,null),m(Fe,vn),m(Fe,bn),m(Fe,wn),m(Fe,Bn),m(Ce,yn),m(Ce,Rn),m(Rn,In),m(Rn,kn),m(Rn,Sn),m(Rn,Tn),m(Rn,Ln),m(Rn,Pn),k(eo,Rn,null),m(Rn,On),m(Rn,_n),m(Rn,Nn),m(Rn,Dn),m(Rn,jn),k(no,Rn,null),m(Rn,Vn),m(Rn,Hn),m(Rn,zn),m(Rn,Cn),m(Rn,Fn),k(so,Rn,null),m(Rn,Gn),m(Rn,Mn),m(Rn,Un),m(Rn,Wn),m(Rn,Xn),k(lo,Rn,null),m(Rn,qn),m(Rn,Kn),m(Rn,Jn),m(Rn,Qn),m(Rn,Yn),k(oo,Rn,null),m(Rn,Zn),m(Rn,ts),m(Rn,es),m(Rn,ns),m(Rn,ss),k(ao,Rn,null),m(Rn,ls),m(Rn,os),m(Rn,as),m(Rn,rs),i(t,$s,l),i(t,is,l),i(t,fs,l),i(t,cs,l),i(t,gs,l),i(t,hs,l),m(hs,ms),i(t,ps,l),i(t,xs,l),i(t,us,l),i(t,Es,l),i(t,ds,l),i(t,As,l),k(ro,As,null),m(As,vs),m(As,bs),m(As,ws),m(As,Bs),m(As,ys),k($o,As,null),m(As,Rs),m(As,Is),m(As,ks),m(As,Ss),m(As,Ts),k(io,As,null),m(As,Ls),m(As,Ps),m(Ps,Os),m(Ps,_s),m(Ps,Ns),m(As,Ds),m(As,js),m(js,Vs),m(As,Hs),m(As,zs),m(As,Cs),m(As,Fs),m(As,Gs),m(As,Ms),m(As,Us),m(As,Ws),m(Ws,Xs),m(As,qs),m(As,Ks),m(As,Js),m(As,Qs),m(As,Ys),m(As,Zs),m(Zs,tl),i(t,el,l),i(t,nl,l),i(t,sl,l),i(t,ll,l),i(t,ol,l),i(t,al,l),m(al,rl),i(t,$l,l),k(fo,t,l),i(t,il,l),i(t,fl,l),i(t,cl,l),i(t,gl,l),i(t,hl,l),k(co,t,l),i(t,ml,l),i(t,pl,l),i(t,xl,l),i(t,ul,l),i(t,El,l),i(t,dl,l),m(dl,Al),i(t,vl,l),i(t,bl,l),m(bl,wl),m(wl,Bl),i(t,yl,l),i(t,Rl,l),m(Rl,Il),kl=!0},p(t,[e]){const n={};131072&e&&(n.$$scope={dirty:e,ctx:t}),Sl.$set(n);const s={};131072&e&&(s.$$scope={dirty:e,ctx:t}),Tl.$set(s);const l={};131072&e&&(l.$$scope={dirty:e,ctx:t}),Ll.$set(l);const o={};131072&e&&(o.$$scope={dirty:e,ctx:t}),Pl.$set(o);const a={};131072&e&&(a.$$scope={dirty:e,ctx:t}),_l.$set(a);const r={};131072&e&&(r.$$scope={dirty:e,ctx:t}),Hl.$set(r);const $={};131072&e&&($.$$scope={dirty:e,ctx:t}),Kl.$set($);const i={};131072&e&&(i.$$scope={dirty:e,ctx:t}),Jl.$set(i);const f={};131072&e&&(f.$$scope={dirty:e,ctx:t}),Ql.$set(f);const c={};131072&e&&(c.$$scope={dirty:e,ctx:t}),Yl.$set(c);const g={};131072&e&&(g.$$scope={dirty:e,ctx:t}),Zl.$set(g);const h={};131072&e&&(h.$$scope={dirty:e,ctx:t}),to.$set(h);const m={};131072&e&&(m.$$scope={dirty:e,ctx:t}),eo.$set(m);const p={};131072&e&&(p.$$scope={dirty:e,ctx:t}),no.$set(p);const x={};131072&e&&(x.$$scope={dirty:e,ctx:t}),so.$set(x);const u={};131072&e&&(u.$$scope={dirty:e,ctx:t}),lo.$set(u);const E={};131072&e&&(E.$$scope={dirty:e,ctx:t}),oo.$set(E);const d={};131072&e&&(d.$$scope={dirty:e,ctx:t}),ao.$set(d);const A={};131072&e&&(A.$$scope={dirty:e,ctx:t}),fo.$set(A)},i(t){kl||(u(Sl.$$.fragment,t),u(Tl.$$.fragment,t),u(Ll.$$.fragment,t),u(Pl.$$.fragment,t),u(Ol.$$.fragment,t),u(_l.$$.fragment,t),u(Nl.$$.fragment,t),u(Dl.$$.fragment,t),u(jl.$$.fragment,t),u(Vl.$$.fragment,t),u(Hl.$$.fragment,t),u(zl.$$.fragment,t),u(Cl.$$.fragment,t),u(Fl.$$.fragment,t),u(Gl.$$.fragment,t),u(Ml.$$.fragment,t),u(Ul.$$.fragment,t),u(Wl.$$.fragment,t),u(Xl.$$.fragment,t),u(ql.$$.fragment,t),u(Kl.$$.fragment,t),u(Jl.$$.fragment,t),u(Ql.$$.fragment,t),u(Yl.$$.fragment,t),u(Zl.$$.fragment,t),u(to.$$.fragment,t),u(eo.$$.fragment,t),u(no.$$.fragment,t),u(so.$$.fragment,t),u(lo.$$.fragment,t),u(oo.$$.fragment,t),u(ao.$$.fragment,t),u(ro.$$.fragment,t),u($o.$$.fragment,t),u(io.$$.fragment,t),u(fo.$$.fragment,t),u(co.$$.fragment,t),kl=!0)},o(t){E(Sl.$$.fragment,t),E(Tl.$$.fragment,t),E(Ll.$$.fragment,t),E(Pl.$$.fragment,t),E(Ol.$$.fragment,t),E(_l.$$.fragment,t),E(Nl.$$.fragment,t),E(Dl.$$.fragment,t),E(jl.$$.fragment,t),E(Vl.$$.fragment,t),E(Hl.$$.fragment,t),E(zl.$$.fragment,t),E(Cl.$$.fragment,t),E(Fl.$$.fragment,t),E(Gl.$$.fragment,t),E(Ml.$$.fragment,t),E(Ul.$$.fragment,t),E(Wl.$$.fragment,t),E(Xl.$$.fragment,t),E(ql.$$.fragment,t),E(Kl.$$.fragment,t),E(Jl.$$.fragment,t),E(Ql.$$.fragment,t),E(Yl.$$.fragment,t),E(Zl.$$.fragment,t),E(to.$$.fragment,t),E(eo.$$.fragment,t),E(no.$$.fragment,t),E(so.$$.fragment,t),E(lo.$$.fragment,t),E(oo.$$.fragment,t),E(ao.$$.fragment,t),E(ro.$$.fragment,t),E($o.$$.fragment,t),E(io.$$.fragment,t),E(fo.$$.fragment,t),E(co.$$.fragment,t),kl=!1},d(t){t&&r(e),t&&r(n),S(Sl),S(Tl),S(Ll),S(Pl),S(Ol),S(_l),S(Nl),S(Dl),S(jl),t&&r(Vt),t&&r(Ht),t&&r(zt),t&&r(Ct),t&&r(Ft),S(Vl,t),t&&r(Gt),S(Hl,t),t&&r(Mt),t&&r(Ut),t&&r(Xt),t&&r(qt),t&&r(Kt),t&&r(Jt),t&&r(Qt),t&&r(Yt),t&&r(te),t&&r(ee),t&&r(ne),t&&r(se),t&&r(le),t&&r(oe),t&&r(re),t&&r($e),t&&r(fe),t&&r(ce),t&&r(he),t&&r(me),t&&r(pe),t&&r(xe),t&&r(ue),t&&r(Ee),t&&r(Ae),t&&r(ve),S(zl),S(Cl),S(Fl),S(Gl),S(Ml),S(Ul),S(Wl),S(Xl),S(ql),t&&r(De),t&&r(je),t&&r(Ve),t&&r(He),t&&r(ze),t&&r(Ce),S(Kl),S(Jl),S(Ql),S(Yl),S(Zl),S(to),S(eo),S(no),S(so),S(lo),S(oo),S(ao),t&&r($s),t&&r(is),t&&r(fs),t&&r(cs),t&&r(gs),t&&r(hs),t&&r(ps),t&&r(xs),t&&r(us),t&&r(Es),t&&r(ds),t&&r(As),S(ro),S($o),S(io),t&&r(el),t&&r(nl),t&&r(sl),t&&r(ll),t&&r(ol),t&&r(al),t&&r($l),S(fo,t),t&&r(il),t&&r(fl),t&&r(cl),t&&r(gl),t&&r(hl),S(co,t),t&&r(ml),t&&r(pl),t&&r(xl),t&&r(ul),t&&r(El),t&&r(dl),t&&r(vl),t&&r(bl),t&&r(yl),t&&r(Rl)}}}function wt(t){return[t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t)]}export default class extends t{constructor(t){super(),e(this,t,wt,bt,n,{})}}
