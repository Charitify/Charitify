import{S as t,i as e,s as n,l as s,m as l,c as o,b as a,d as r,e as $,f,o as i,M as c,y as g,A as h,g as m,q as p,r as x,t as u,u as E,I as d,L as A,U as v,V as b,w as y,N as w,z as B,O as R,P as I,B as k,C as S,h as T}from"./index.398c59fa.js";import{B as L,I as P,P as O,a as _,A as N,R as D,D as j,F as V,b as z,c as C}from"./index.f3a2db37.js";function H(t,e,n){const s=t.slice();return s[18]=e[n],s[32]=n,s}function M(t){let e,n=t[2],s=[];for(let e=0;e<n.length;e+=1)s[e]=U(H(t,n,e));return{c(){e=l("div");for(let t=0;t<s.length;t+=1)s[t].c();this.h()},l(t){e=o(t,"DIV",{class:!0});var n=a(e);for(let t=0;t<s.length;t+=1)s[t].l(n);n.forEach(r),this.h()},h(){$(e,"class","swipe-indicator swipe-indicator-inside svelte-tx0axj")},m(t,n){f(t,e,n);for(let t=0;t<s.length;t+=1)s[t].m(e,null)},p(t,l){if(70&l[0]){let o;for(n=t[2],o=0;o<n.length;o+=1){const a=H(t,n,o);s[o]?s[o].p(a,l):(s[o]=U(a),s[o].c(),s[o].m(e,null))}for(;o<s.length;o+=1)s[o].d(1);s.length=n.length}},d(t){t&&r(e),c(s,t)}}}function U(t){let e,n,s;function c(...e){return t[30](t[32],...e)}return{c(){e=l("span"),this.h()},l(t){e=o(t,"SPAN",{class:!0}),a(e).forEach(r),this.h()},h(){$(e,"class",n="dot "+(t[1]==t[32]?"is-active":"")+" svelte-tx0axj"),s=i(e,"click",c)},m(t,n){f(t,e,n)},p(s,l){t=s,2&l[0]&&n!==(n="dot "+(t[1]==t[32]?"is-active":"")+" svelte-tx0axj")&&$(e,"class",n)},d(t){t&&r(e),s()}}}function W(t){let e,n,c,A,v,b,y,w,B;const R=t[27].default,I=s(R,t,t[26],null);let k=t[0]&&M(t);return{c(){e=l("div"),n=l("div"),c=l("div"),A=l("div"),I&&I.c(),v=g(),b=l("div"),y=g(),k&&k.c(),this.h()},l(t){e=o(t,"DIV",{class:!0});var s=a(e);n=o(s,"DIV",{class:!0});var l=a(n);c=o(l,"DIV",{class:!0});var $=a(c);A=o($,"DIV",{class:!0});var f=a(A);I&&I.l(f),f.forEach(r),$.forEach(r),l.forEach(r),v=h(s),b=o(s,"DIV",{class:!0}),a(b).forEach(r),y=h(s),k&&k.l(s),s.forEach(r),this.h()},h(){$(A,"class","swipeable-slot-wrapper svelte-tx0axj"),$(c,"class","swipeable-items svelte-tx0axj"),$(n,"class","swipe-item-wrapper svelte-tx0axj"),$(b,"class","swipe-handler svelte-tx0axj"),$(e,"class","swipe-panel svelte-tx0axj"),B=[i(b,"touchstart",t[5]),i(b,"mousedown",t[5])]},m(s,l){f(s,e,l),m(e,n),m(n,c),m(c,A),I&&I.m(A,null),t[28](n),m(e,v),m(e,b),t[29](b),m(e,y),k&&k.m(e,null),w=!0},p(t,n){I&&I.p&&67108864&n[0]&&I.p(p(R,t,t[26],null),x(R,t[26],n,null)),t[0]?k?k.p(t,n):((k=M(t)).c(),k.m(e,null)):k&&(k.d(1),k=null)},i(t){w||(u(I,t),w=!0)},o(t){E(I,t),w=!1},d(n){n&&r(e),I&&I.d(n),t[28](null),t[29](null),k&&k.d(),d(B)}}}let X=0,q=0;function F(t,e,n){let s,l,o,a,r,{transitionDuration:$=200}=e,{showIndicators:f=!1}=e,{autoplay:i=!1}=e,{delay:c=1e3}=e,g=0,h=0,m=0,p=0,x="\n    -webkit-transition-duration: 0s;\n    transition-duration: 0s;\n    -webkit-transform: translate3d(-{{val}}px, 0, 0);\n    -ms-transform: translate3d(-{{val}}px, 0, 0);",u=`\n    -webkit-transition-duration: ${$}ms;\n    transition-duration: ${$}ms;\n    -webkit-transform: translate3d(-{{val}}px, 0, 0);\n    -ms-transform: translate3d(-{{val}}px, 0, 0);`,E=!1,d=0,y=0,w=!1;function B(){n(4,a.style.top=X+"px",a),m=o.querySelector(".swipeable-items").offsetWidth;for(let t=0;t<h;t++)l[t].style.transform="translate3d("+m*t+"px, 0, 0)";p=0}function R(){l=o.querySelectorAll(".swipeable-item"),n(10,h=l.length),B()}function I(t){if(E){t.stopImmediatePropagation(),t.stopPropagation();let e=m,n=t.touches?t.touches[0].pageX:t.pageX,s=r-n+d;if((n>r?0:1)||(s=d-(n-r)),s<=e*(h-1)&&s>=q){for(let t=0;t<h;t++){let n=t<0?"{{val}}":"-{{val}}",o=e*t-s;l[t].style.cssText=x.replace(n,o).replace(n,o)}p=s}}}function k(t){t&&t.stopImmediatePropagation(),t&&t.stopPropagation(),t&&t.preventDefault();let e=m;E=!1,r=null;let s=p/e,o=s-Math.floor(s),a=o>.05&&o<.5?Math.ceil(s):Math.floor(s);p=Math.abs(a-s)<.85?a*e:(a+1)*e,d=p,n(1,g=p/e);for(let t=0;t<h;t++){let n=t<0?"{{val}}":"-{{val}}",s=e*t-d;l[t].style.cssText=u.replace(n,s).replace(n,s)}window.removeEventListener("mousemove",I),window.removeEventListener("mouseup",k),window.removeEventListener("touchmove",I),window.removeEventListener("touchend",k)}function S(t){p=m*t,n(1,g=t),k()}function T(){S(y),y=y<h-1?++y:0}A(()=>{R(),window.addEventListener("resize",B)}),v(()=>{window.removeEventListener("resize",B)});let{$$slots:L={},$$scope:P}=e;return t.$set=(t=>{"transitionDuration"in t&&n(7,$=t.transitionDuration),"showIndicators"in t&&n(0,f=t.showIndicators),"autoplay"in t&&n(8,i=t.autoplay),"delay"in t&&n(9,c=t.delay),"$$scope"in t&&n(26,P=t.$$scope)}),t.$$.update=(()=>{1024&t.$$.dirty[0]&&n(2,s=Array(h)),131840&t.$$.dirty[0]&&(i&&!w&&n(17,w=setInterval(T,c)),!i&&w&&(clearInterval(w),n(17,w=!1)))}),[f,g,s,o,a,function(t){t.stopImmediatePropagation(),t.stopPropagation(),t.preventDefault(),E=!0,r=t.touches?t.touches[0].pageX:t.pageX,window.addEventListener("mousemove",I),window.addEventListener("mouseup",k),window.addEventListener("touchmove",I),window.addEventListener("touchend",k)},S,$,i,c,h,m,l,p,E,d,y,w,r,x,u,B,R,I,k,T,P,L,function(t){b[t?"unshift":"push"](()=>{n(3,o=t)})},function(t){b[t?"unshift":"push"](()=>{n(4,a=t)})},t=>{S(t)}]}class G extends t{constructor(t){super(),e(this,t,F,W,n,{transitionDuration:7,showIndicators:0,autoplay:8,delay:9},[-1,-1])}}function K(t){let e,n,i;const c=t[2].default,g=s(c,t,t[1],null);return{c(){e=l("div"),g&&g.c(),this.h()},l(t){e=o(t,"DIV",{class:!0});var n=a(e);g&&g.l(n),n.forEach(r),this.h()},h(){$(e,"class",n="swipeable-item "+t[0]+" svelte-1c0dn3k")},m(t,n){f(t,e,n),g&&g.m(e,null),i=!0},p(t,[s]){g&&g.p&&2&s&&g.p(p(c,t,t[1],null),x(c,t[1],s,null)),(!i||1&s&&n!==(n="swipeable-item "+t[0]+" svelte-1c0dn3k"))&&$(e,"class",n)},i(t){i||(u(g,t),i=!0)},o(t){E(g,t),i=!1},d(t){t&&r(e),g&&g.d(t)}}}function J(t,e,n){let{classes:s=""}=e,{$$slots:l={},$$scope:o}=e;return t.$set=(t=>{"classes"in t&&n(0,s=t.classes),"$$scope"in t&&n(1,o=t.$$scope)}),[s,o,l]}class Q extends t{constructor(t){super(),e(this,t,J,K,n,{classes:0})}}function Y(t){let e;const n=new C({props:{src:"https://placeimg.com/300/300/people",alt:"sample"}});return{c(){y(n.$$.fragment)},l(t){B(n.$$.fragment,t)},m(t,s){k(n,t,s),e=!0},p:T,i(t){e||(u(n.$$.fragment,t),e=!0)},o(t){E(n.$$.fragment,t),e=!1},d(t){S(n,t)}}}function Z(t){let e;const n=new C({props:{src:"https://placeimg.com/300/300/any",alt:"sample"}});return{c(){y(n.$$.fragment)},l(t){B(n.$$.fragment,t)},m(t,s){k(n,t,s),e=!0},p:T,i(t){e||(u(n.$$.fragment,t),e=!0)},o(t){E(n.$$.fragment,t),e=!1},d(t){S(n,t)}}}function tt(t){let e;const n=new C({props:{src:"https://placeimg.com/300/300/arch",alt:"sample"}});return{c(){y(n.$$.fragment)},l(t){B(n.$$.fragment,t)},m(t,s){k(n,t,s),e=!0},p:T,i(t){e||(u(n.$$.fragment,t),e=!0)},o(t){E(n.$$.fragment,t),e=!1},d(t){S(n,t)}}}function et(t){let e;const n=new C({props:{src:"https://placeimg.com/300/300/nature",alt:"sample"}});return{c(){y(n.$$.fragment)},l(t){B(n.$$.fragment,t)},m(t,s){k(n,t,s),e=!0},p:T,i(t){e||(u(n.$$.fragment,t),e=!0)},o(t){E(n.$$.fragment,t),e=!1},d(t){S(n,t)}}}function nt(t){let e;const n=new C({props:{src:"https://placeimg.com/300/300/tech",alt:"sample"}});return{c(){y(n.$$.fragment)},l(t){B(n.$$.fragment,t)},m(t,s){k(n,t,s),e=!0},p:T,i(t){e||(u(n.$$.fragment,t),e=!0)},o(t){E(n.$$.fragment,t),e=!1},d(t){S(n,t)}}}function st(t){let e,n,s,l,o;const a=new Q({props:{$$slots:{default:[Y]},$$scope:{ctx:t}}}),$=new Q({props:{$$slots:{default:[Z]},$$scope:{ctx:t}}}),i=new Q({props:{$$slots:{default:[tt]},$$scope:{ctx:t}}}),c=new Q({props:{$$slots:{default:[et]},$$scope:{ctx:t}}}),m=new Q({props:{$$slots:{default:[nt]},$$scope:{ctx:t}}});return{c(){y(a.$$.fragment),e=g(),y($.$$.fragment),n=g(),y(i.$$.fragment),s=g(),y(c.$$.fragment),l=g(),y(m.$$.fragment)},l(t){B(a.$$.fragment,t),e=h(t),B($.$$.fragment,t),n=h(t),B(i.$$.fragment,t),s=h(t),B(c.$$.fragment,t),l=h(t),B(m.$$.fragment,t)},m(t,r){k(a,t,r),f(t,e,r),k($,t,r),f(t,n,r),k(i,t,r),f(t,s,r),k(c,t,r),f(t,l,r),k(m,t,r),o=!0},p(t,e){const n={};131072&e&&(n.$$scope={dirty:e,ctx:t}),a.$set(n);const s={};131072&e&&(s.$$scope={dirty:e,ctx:t}),$.$set(s);const l={};131072&e&&(l.$$scope={dirty:e,ctx:t}),i.$set(l);const o={};131072&e&&(o.$$scope={dirty:e,ctx:t}),c.$set(o);const r={};131072&e&&(r.$$scope={dirty:e,ctx:t}),m.$set(r)},i(t){o||(u(a.$$.fragment,t),u($.$$.fragment,t),u(i.$$.fragment,t),u(c.$$.fragment,t),u(m.$$.fragment,t),o=!0)},o(t){E(a.$$.fragment,t),E($.$$.fragment,t),E(i.$$.fragment,t),E(c.$$.fragment,t),E(m.$$.fragment,t),o=!1},d(t){S(a,t),t&&r(e),S($,t),t&&r(n),S(i,t),t&&r(s),S(c,t),t&&r(l),S(m,t)}}}function lt(t){let e;return{c(){e=w("test1")},l(t){e=R(t,"test1")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function ot(t){let e;return{c(){e=w("test12")},l(t){e=R(t,"test12")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function at(t){let e;return{c(){e=w("test123")},l(t){e=R(t,"test123")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function rt(t){let e;return{c(){e=w("Submit")},l(t){e=R(t,"Submit")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function $t(t){let e;return{c(){e=w("Submit")},l(t){e=R(t,"Submit")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function ft(t){let e,n,s,a,$,i,c,m,p,x,d,A,v,b,w,R,I,T,O,_,N,D,j,V,z,C,H,M,U,W,X,q,F,G,K,J,Q,Y,Z,tt,et,nt,st,lt,ot;const at=new P({props:{name:"test1",type:"number",list:"sum-suggestions"}}),rt=new P({props:{name:"test2",type:"text",list:"sum-suggestions"}}),ft=new P({props:{name:"test3",type:"email",list:"sum-suggestions"}}),it=new P({props:{name:"test4",type:"url",list:"sum-suggestions"}}),ct=new P({props:{name:"test5",type:"search",list:"sum-suggestions"}}),gt=new P({props:{name:"test6",type:"date",list:"sum-suggestions"}}),ht=new P({props:{name:"test7",type:"password",list:"sum-suggestions"}}),mt=new P({props:{name:"test8",type:"tel",list:"sum-suggestions"}}),pt=new L({props:{is:"success",type:"submit",$$slots:{default:[$t]},$$scope:{ctx:t}}});return{c(){e=l("br"),n=g(),s=l("br"),a=g(),y(at.$$.fragment),$=g(),i=l("br"),c=g(),m=l("br"),p=g(),y(rt.$$.fragment),x=g(),d=l("br"),A=g(),v=l("br"),b=g(),y(ft.$$.fragment),w=g(),R=l("br"),I=g(),T=l("br"),O=g(),y(it.$$.fragment),_=g(),N=l("br"),D=g(),j=l("br"),V=g(),y(ct.$$.fragment),z=g(),C=l("br"),H=g(),M=l("br"),U=g(),y(gt.$$.fragment),W=g(),X=l("br"),q=g(),F=l("br"),G=g(),y(ht.$$.fragment),K=g(),J=l("br"),Q=g(),Y=l("br"),Z=g(),y(mt.$$.fragment),tt=g(),et=l("br"),nt=g(),st=l("br"),lt=g(),y(pt.$$.fragment)},l(t){e=o(t,"BR",{}),n=h(t),s=o(t,"BR",{}),a=h(t),B(at.$$.fragment,t),$=h(t),i=o(t,"BR",{}),c=h(t),m=o(t,"BR",{}),p=h(t),B(rt.$$.fragment,t),x=h(t),d=o(t,"BR",{}),A=h(t),v=o(t,"BR",{}),b=h(t),B(ft.$$.fragment,t),w=h(t),R=o(t,"BR",{}),I=h(t),T=o(t,"BR",{}),O=h(t),B(it.$$.fragment,t),_=h(t),N=o(t,"BR",{}),D=h(t),j=o(t,"BR",{}),V=h(t),B(ct.$$.fragment,t),z=h(t),C=o(t,"BR",{}),H=h(t),M=o(t,"BR",{}),U=h(t),B(gt.$$.fragment,t),W=h(t),X=o(t,"BR",{}),q=h(t),F=o(t,"BR",{}),G=h(t),B(ht.$$.fragment,t),K=h(t),J=o(t,"BR",{}),Q=h(t),Y=o(t,"BR",{}),Z=h(t),B(mt.$$.fragment,t),tt=h(t),et=o(t,"BR",{}),nt=h(t),st=o(t,"BR",{}),lt=h(t),B(pt.$$.fragment,t)},m(t,l){f(t,e,l),f(t,n,l),f(t,s,l),f(t,a,l),k(at,t,l),f(t,$,l),f(t,i,l),f(t,c,l),f(t,m,l),f(t,p,l),k(rt,t,l),f(t,x,l),f(t,d,l),f(t,A,l),f(t,v,l),f(t,b,l),k(ft,t,l),f(t,w,l),f(t,R,l),f(t,I,l),f(t,T,l),f(t,O,l),k(it,t,l),f(t,_,l),f(t,N,l),f(t,D,l),f(t,j,l),f(t,V,l),k(ct,t,l),f(t,z,l),f(t,C,l),f(t,H,l),f(t,M,l),f(t,U,l),k(gt,t,l),f(t,W,l),f(t,X,l),f(t,q,l),f(t,F,l),f(t,G,l),k(ht,t,l),f(t,K,l),f(t,J,l),f(t,Q,l),f(t,Y,l),f(t,Z,l),k(mt,t,l),f(t,tt,l),f(t,et,l),f(t,nt,l),f(t,st,l),f(t,lt,l),k(pt,t,l),ot=!0},p(t,e){const n={};131072&e&&(n.$$scope={dirty:e,ctx:t}),pt.$set(n)},i(t){ot||(u(at.$$.fragment,t),u(rt.$$.fragment,t),u(ft.$$.fragment,t),u(it.$$.fragment,t),u(ct.$$.fragment,t),u(gt.$$.fragment,t),u(ht.$$.fragment,t),u(mt.$$.fragment,t),u(pt.$$.fragment,t),ot=!0)},o(t){E(at.$$.fragment,t),E(rt.$$.fragment,t),E(ft.$$.fragment,t),E(it.$$.fragment,t),E(ct.$$.fragment,t),E(gt.$$.fragment,t),E(ht.$$.fragment,t),E(mt.$$.fragment,t),E(pt.$$.fragment,t),ot=!1},d(t){t&&r(e),t&&r(n),t&&r(s),t&&r(a),S(at,t),t&&r($),t&&r(i),t&&r(c),t&&r(m),t&&r(p),S(rt,t),t&&r(x),t&&r(d),t&&r(A),t&&r(v),t&&r(b),S(ft,t),t&&r(w),t&&r(R),t&&r(I),t&&r(T),t&&r(O),S(it,t),t&&r(_),t&&r(N),t&&r(D),t&&r(j),t&&r(V),S(ct,t),t&&r(z),t&&r(C),t&&r(H),t&&r(M),t&&r(U),S(gt,t),t&&r(W),t&&r(X),t&&r(q),t&&r(F),t&&r(G),S(ht,t),t&&r(K),t&&r(J),t&&r(Q),t&&r(Y),t&&r(Z),S(mt,t),t&&r(tt),t&&r(et),t&&r(nt),t&&r(st),t&&r(lt),S(pt,t)}}}function it(t){let e;return{c(){e=w("test")},l(t){e=R(t,"test")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function ct(t){let e;return{c(){e=w("test")},l(t){e=R(t,"test")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function gt(t){let e;return{c(){e=w("test")},l(t){e=R(t,"test")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function ht(t){let e;return{c(){e=w("test")},l(t){e=R(t,"test")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function mt(t){let e;return{c(){e=w("Some example of Button")},l(t){e=R(t,"Some example of Button")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function pt(t){let e;return{c(){e=w("Some example of Button")},l(t){e=R(t,"Some example of Button")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function xt(t){let e;return{c(){e=w("test")},l(t){e=R(t,"test")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function ut(t){let e;return{c(){e=w("test")},l(t){e=R(t,"test")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function Et(t){let e;return{c(){e=w("test")},l(t){e=R(t,"test")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function dt(t){let e;return{c(){e=w("test")},l(t){e=R(t,"test")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function At(t){let e;return{c(){e=w("Some example of Button")},l(t){e=R(t,"Some example of Button")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function vt(t){let e;return{c(){e=w("Some example of Button")},l(t){e=R(t,"Some example of Button")},m(t,n){f(t,e,n)},d(t){t&&r(e)}}}function bt(t){let e,n,s,i,c,p,x,d,A,v,b,T,H,M,U,W,X,q,F,K,J,Q,Y,Z,tt,et,nt,$t,bt,yt,wt,Bt,Rt,It,kt,St,Tt,Lt,Pt,Ot,_t,Nt,Dt,jt,Vt,zt,Ct,Ht,Mt,Ut,Wt,Xt,qt,Ft,Gt,Kt,Jt,Qt,Yt,Zt,te,ee,ne,se,le,oe,ae,re,$e,fe,ie,ce,ge,he,me,pe,xe,ue,Ee,de,Ae,ve,be,ye,we,Be,Re,Ie,ke,Se,Te,Le,Pe,Oe,_e,Ne,De,je,Ve,ze,Ce,He,Me,Ue,We,Xe,qe,Fe,Ge,Ke,Je,Qe,Ye,Ze,tn,en,nn,sn,ln,on,an,rn,$n,fn,cn,gn,hn,mn,pn,xn,un,En,dn,An,vn,bn,yn,wn,Bn,Rn,In,kn,Sn,Tn,Ln,Pn,On,_n,Nn,Dn,jn,Vn,zn,Cn,Hn,Mn,Un,Wn,Xn,qn,Fn,Gn,Kn,Jn,Qn,Yn,Zn,ts,es,ns,ss,ls,os,as,rs,$s,fs,is,cs,gs,hs,ms,ps,xs,us,Es,ds,As,vs,bs,ys,ws,Bs,Rs,Is,ks,Ss,Ts,Ls,Ps,Os,_s,Ns,Ds,js,Vs,zs,Cs,Hs,Ms,Us,Ws,Xs,qs,Fs,Gs,Ks,Js,Qs,Ys,Zs,tl,el,nl,sl,ll,ol,al,rl,$l,fl,il,cl,gl,hl,ml,pl,xl,ul,El,dl,Al,vl,bl,yl,wl,Bl,Rl,Il,kl,Sl,Tl;const Ll=new G({props:{$$slots:{default:[st]},$$scope:{ctx:t}}}),Pl=new L({props:{is:"success",$$slots:{default:[lt]},$$scope:{ctx:t}}});Pl.$on("click",t[0]);const Ol=new L({props:{is:"success",$$slots:{default:[ot]},$$scope:{ctx:t}}});Ol.$on("click",t[1]);const _l=new L({props:{is:"success",$$slots:{default:[at]},$$scope:{ctx:t}}});_l.$on("click",t[2]);const Nl=new P({props:{type:"number",name:"num",list:"sum-suggestions",placeholder:"Num",autoselect:!0,align:"right"}}),Dl=new L({props:{is:"warning",$$slots:{default:[rt]},$$scope:{ctx:t}}});Dl.$on("click",t[3]);const jl=new O({props:{value:"65"}}),Vl=new _({props:{value:"75"}}),zl=new N({props:{src:"https://placeimg.com/300/300/people",alt:"avatar"}}),Cl=new D({}),Hl=new j({}),Ml=new V({props:{name:"main-form",$$slots:{default:[ft]},$$scope:{ctx:t}}});Ml.$on("submit",t[4]);const Ul=new z({props:{size:"small",type:"heart-filled"}}),Wl=new z({props:{size:"small",type:"heart-filled",is:"warning"}}),Xl=new z({props:{size:"small",type:"heart-filled",is:"danger"}}),ql=new z({props:{type:"heart-filled"}}),Fl=new z({props:{type:"heart-filled",is:"warning"}}),Gl=new z({props:{type:"heart-filled",is:"danger"}}),Kl=new z({props:{size:"big",type:"heart-filled"}}),Jl=new z({props:{size:"big",type:"heart-filled",is:"warning"}}),Ql=new z({props:{size:"big",type:"heart-filled",is:"danger"}}),Yl=new L({props:{$$slots:{default:[it]},$$scope:{ctx:t}}});Yl.$on("click",t[5]);const Zl=new L({props:{is:"success",$$slots:{default:[ct]},$$scope:{ctx:t}}});Zl.$on("click",t[6]);const to=new L({props:{is:"success",ariaLabel:"text",$$slots:{default:[gt]},$$scope:{ctx:t}}});to.$on("click",t[7]);const eo=new L({props:{is:"success",$$slots:{default:[ht]},$$scope:{ctx:t}}});eo.$on("click",t[8]);const no=new L({props:{is:"warning",$$slots:{default:[mt]},$$scope:{ctx:t}}});no.$on("click",t[9]);const so=new L({props:{is:"danger",$$slots:{default:[pt]},$$scope:{ctx:t}}});so.$on("click",t[10]);const lo=new L({props:{href:"#",$$slots:{default:[xt]},$$scope:{ctx:t}}});lo.$on("click",t[11]);const oo=new L({props:{is:"success",href:"#",$$slots:{default:[ut]},$$scope:{ctx:t}}});oo.$on("click",t[12]);const ao=new L({props:{is:"success",href:"#",$$slots:{default:[Et]},$$scope:{ctx:t}}});ao.$on("click",t[13]);const ro=new L({props:{is:"success",href:"#",$$slots:{default:[dt]},$$scope:{ctx:t}}});ro.$on("click",t[14]);const $o=new L({props:{is:"warning",href:"#",$$slots:{default:[At]},$$scope:{ctx:t}}});$o.$on("click",t[15]);const fo=new L({props:{is:"danger",href:"#",$$slots:{default:[vt]},$$scope:{ctx:t}}});fo.$on("click",t[16]);const io=new P({props:{rows:2,name:"tex",list:"lis"}}),co=new P({props:{name:"tex1",list:"lis",placeholder:"Some placeholder text"}}),go=new P({props:{type:"number",name:"tex2",list:"lis"}}),ho=new C({props:{src:"https://placeimg.com/1000/1000/any",alt:"sample"}});return{c(){e=g(),n=l("section"),s=l("section"),i=l("div"),y(Ll.$$.fragment),c=g(),p=l("ul"),x=l("li"),y(Pl.$$.fragment),d=g(),A=l("li"),y(Ol.$$.fragment),v=g(),b=l("li"),y(_l.$$.fragment),T=g(),H=l("li"),M=l("br"),U=g(),y(Nl.$$.fragment),W=g(),X=l("datalist"),q=l("option"),F=l("option"),K=l("option"),J=g(),Q=l("li"),y(Dl.$$.fragment),Y=g(),y(jl.$$.fragment),Z=g(),tt=l("br"),et=g(),y(Vl.$$.fragment),nt=g(),$t=l("section"),bt=l("div"),y(zl.$$.fragment),yt=g(),wt=l("span"),Bt=l("h3"),Rt=w("Tina Kandelaki"),It=g(),kt=l("p"),St=w("ORG charity charitify"),Tt=g(),y(Cl.$$.fragment),Lt=g(),Pt=l("br"),Ot=g(),_t=l("h1"),Nt=w("The main title"),Dt=g(),jt=l("br"),Vt=g(),zt=l("p"),Ct=w("A small description that describes the title above and just makes text longer."),Ht=g(),Mt=l("br"),Ut=g(),Wt=l("br"),Xt=g(),y(Hl.$$.fragment),qt=g(),y(Ml.$$.fragment),Ft=g(),Gt=l("h1"),Kt=w("Charitify - is the application for helping those in need."),Jt=g(),Qt=l("br"),Yt=g(),Zt=l("br"),te=g(),ee=l("h2"),ne=w("Typography"),se=g(),le=l("br"),oe=g(),ae=l("br"),re=g(),$e=l("p"),fe=w("Few paragraphs to text fonts"),ie=g(),ce=l("p"),ge=w("Декілька параграфів для тесту тексту"),he=g(),me=l("p"),pe=w("Несколько параграфов для теста текста"),xe=g(),ue=l("br"),Ee=g(),de=l("br"),Ae=g(),ve=l("h2"),be=w("Interactive elements"),ye=g(),we=l("ul"),Be=l("li"),Re=l("span"),y(Ul.$$.fragment),Ie=g(),y(Wl.$$.fragment),ke=g(),y(Xl.$$.fragment),Se=g(),Te=l("li"),Le=l("span"),y(ql.$$.fragment),Pe=g(),y(Fl.$$.fragment),Oe=g(),y(Gl.$$.fragment),_e=g(),Ne=l("li"),De=l("span"),y(Kl.$$.fragment),je=g(),y(Jl.$$.fragment),Ve=g(),y(Ql.$$.fragment),ze=g(),Ce=l("br"),He=g(),Me=l("br"),Ue=g(),We=l("section"),Xe=l("div"),qe=l("br"),Fe=w("\n        Buttons\n        "),Ge=l("br"),Ke=g(),Je=l("br"),Qe=g(),y(Yl.$$.fragment),Ye=g(),Ze=l("br"),tn=g(),en=l("br"),nn=g(),y(Zl.$$.fragment),sn=g(),ln=l("br"),on=g(),an=l("br"),rn=g(),y(to.$$.fragment),$n=g(),fn=l("br"),cn=g(),gn=l("br"),hn=w("\n        With text\n        "),y(eo.$$.fragment),mn=w("\n        and behind.\n        "),pn=l("br"),xn=g(),un=l("br"),En=g(),y(no.$$.fragment),dn=g(),An=l("br"),vn=g(),bn=l("br"),yn=g(),y(so.$$.fragment),wn=g(),Bn=l("br"),Rn=g(),In=l("br"),kn=g(),Sn=l("div"),Tn=l("br"),Ln=w("\n        Links as buttons\n        "),Pn=l("br"),On=g(),_n=l("br"),Nn=g(),y(lo.$$.fragment),Dn=g(),jn=l("br"),Vn=g(),zn=l("br"),Cn=g(),y(oo.$$.fragment),Hn=g(),Mn=l("br"),Un=g(),Wn=l("br"),Xn=g(),y(ao.$$.fragment),qn=g(),Fn=l("br"),Gn=g(),Kn=l("br"),Jn=w("\n        With text\n        "),y(ro.$$.fragment),Qn=w("\n        and behind.\n        "),Yn=l("br"),Zn=g(),ts=l("br"),es=g(),y($o.$$.fragment),ns=g(),ss=l("br"),ls=g(),os=l("br"),as=g(),y(fo.$$.fragment),rs=g(),$s=l("br"),fs=g(),is=l("br"),cs=g(),gs=l("br"),hs=g(),ms=l("br"),ps=g(),xs=l("h2"),us=w("Input fields"),Es=g(),ds=l("br"),As=g(),vs=l("br"),bs=g(),ys=l("section"),y(io.$$.fragment),ws=g(),Bs=l("br"),Rs=g(),Is=l("br"),ks=g(),y(co.$$.fragment),Ss=g(),Ts=l("br"),Ls=g(),Ps=l("br"),Os=g(),y(go.$$.fragment),_s=g(),Ns=l("datalist"),Ds=l("option"),js=l("option"),Vs=l("option"),zs=g(),Cs=l("label"),Hs=w("label"),Ms=g(),Us=l("input"),Ws=g(),Xs=l("br"),qs=g(),Fs=l("br"),Gs=g(),Ks=l("a"),Js=w("Some link"),Qs=g(),Ys=l("br"),Zs=g(),tl=l("br"),el=g(),nl=l("button"),sl=w("Button example"),ll=g(),ol=l("br"),al=g(),rl=l("br"),$l=g(),fl=l("h2"),il=w("Images"),cl=g(),gl=l("br"),hl=g(),ml=l("br"),pl=g(),y(ho.$$.fragment),xl=g(),ul=l("br"),El=g(),dl=l("br"),Al=g(),vl=l("h2"),bl=w("Other"),yl=g(),wl=l("p"),Bl=l("strong"),Rl=w("Try editing this file (src/routes/index.svelte) to test live reloading."),Il=g(),kl=l("p"),Sl=w("A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text."),this.h()},l(t){e=h(t),n=o(t,"SECTION",{class:!0});var l=a(n);s=o(l,"SECTION",{class:!0});var $=a(s);i=o($,"DIV",{class:!0});var f=a(i);B(Ll.$$.fragment,f),f.forEach(r),c=h($),p=o($,"UL",{class:!0});var g=a(p);x=o(g,"LI",{class:!0});var m=a(x);B(Pl.$$.fragment,m),m.forEach(r),d=h(g),A=o(g,"LI",{class:!0});var u=a(A);B(Ol.$$.fragment,u),u.forEach(r),v=h(g),b=o(g,"LI",{class:!0});var E=a(b);B(_l.$$.fragment,E),E.forEach(r),T=h(g),H=o(g,"LI",{class:!0});var y=a(H);M=o(y,"BR",{}),U=h(y),B(Nl.$$.fragment,y),W=h(y),X=o(y,"DATALIST",{id:!0});var w=a(X);q=o(w,"OPTION",{value:!0}),a(q).forEach(r),F=o(w,"OPTION",{value:!0}),a(F).forEach(r),K=o(w,"OPTION",{value:!0}),a(K).forEach(r),w.forEach(r),y.forEach(r),J=h(g),Q=o(g,"LI",{class:!0});var I=a(Q);B(Dl.$$.fragment,I),I.forEach(r),g.forEach(r),$.forEach(r),Y=h(l),B(jl.$$.fragment,l),Z=h(l),tt=o(l,"BR",{}),et=h(l),B(Vl.$$.fragment,l),nt=h(l),$t=o(l,"SECTION",{class:!0});var k=a($t);bt=o(k,"DIV",{class:!0});var S=a(bt);B(zl.$$.fragment,S),yt=h(S),wt=o(S,"SPAN",{class:!0});var L=a(wt);Bt=o(L,"H3",{class:!0});var P=a(Bt);Rt=R(P,"Tina Kandelaki"),P.forEach(r),It=h(L),kt=o(L,"P",{class:!0});var O=a(kt);St=R(O,"ORG charity charitify"),O.forEach(r),L.forEach(r),S.forEach(r),Tt=h(k),B(Cl.$$.fragment,k),k.forEach(r),Lt=h(l),Pt=o(l,"BR",{}),Ot=h(l),_t=o(l,"H1",{class:!0});var _=a(_t);Nt=R(_,"The main title"),_.forEach(r),Dt=h(l),jt=o(l,"BR",{}),Vt=h(l),zt=o(l,"P",{class:!0,style:!0});var N=a(zt);Ct=R(N,"A small description that describes the title above and just makes text longer."),N.forEach(r),l.forEach(r),Ht=h(t),Mt=o(t,"BR",{}),Ut=h(t),Wt=o(t,"BR",{}),Xt=h(t),B(Hl.$$.fragment,t),qt=h(t),B(Ml.$$.fragment,t),Ft=h(t),Gt=o(t,"H1",{class:!0});var D=a(Gt);Kt=R(D,"Charitify - is the application for helping those in need."),D.forEach(r),Jt=h(t),Qt=o(t,"BR",{}),Yt=h(t),Zt=o(t,"BR",{}),te=h(t),ee=o(t,"H2",{class:!0});var j=a(ee);ne=R(j,"Typography"),j.forEach(r),se=h(t),le=o(t,"BR",{}),oe=h(t),ae=o(t,"BR",{}),re=h(t),$e=o(t,"P",{});var V=a($e);fe=R(V,"Few paragraphs to text fonts"),V.forEach(r),ie=h(t),ce=o(t,"P",{});var z=a(ce);ge=R(z,"Декілька параграфів для тесту тексту"),z.forEach(r),he=h(t),me=o(t,"P",{});var C=a(me);pe=R(C,"Несколько параграфов для теста текста"),C.forEach(r),xe=h(t),ue=o(t,"BR",{}),Ee=h(t),de=o(t,"BR",{}),Ae=h(t),ve=o(t,"H2",{class:!0});var G=a(ve);be=R(G,"Interactive elements"),G.forEach(r),ye=h(t),we=o(t,"UL",{});var st=a(we);Be=o(st,"LI",{});var lt=a(Be);Re=o(lt,"SPAN",{});var ot=a(Re);B(Ul.$$.fragment,ot),Ie=h(ot),B(Wl.$$.fragment,ot),ke=h(ot),B(Xl.$$.fragment,ot),ot.forEach(r),lt.forEach(r),Se=h(st),Te=o(st,"LI",{});var at=a(Te);Le=o(at,"SPAN",{});var rt=a(Le);B(ql.$$.fragment,rt),Pe=h(rt),B(Fl.$$.fragment,rt),Oe=h(rt),B(Gl.$$.fragment,rt),rt.forEach(r),at.forEach(r),_e=h(st),Ne=o(st,"LI",{});var ft=a(Ne);De=o(ft,"SPAN",{});var it=a(De);B(Kl.$$.fragment,it),je=h(it),B(Jl.$$.fragment,it),Ve=h(it),B(Ql.$$.fragment,it),it.forEach(r),ft.forEach(r),st.forEach(r),ze=h(t),Ce=o(t,"BR",{}),He=h(t),Me=o(t,"BR",{}),Ue=h(t),We=o(t,"SECTION",{style:!0});var ct=a(We);Xe=o(ct,"DIV",{});var gt=a(Xe);qe=o(gt,"BR",{}),Fe=R(gt,"\n        Buttons\n        "),Ge=o(gt,"BR",{}),Ke=h(gt),Je=o(gt,"BR",{}),Qe=h(gt),B(Yl.$$.fragment,gt),Ye=h(gt),Ze=o(gt,"BR",{}),tn=h(gt),en=o(gt,"BR",{}),nn=h(gt),B(Zl.$$.fragment,gt),sn=h(gt),ln=o(gt,"BR",{}),on=h(gt),an=o(gt,"BR",{}),rn=h(gt),B(to.$$.fragment,gt),$n=h(gt),fn=o(gt,"BR",{}),cn=h(gt),gn=o(gt,"BR",{}),hn=R(gt,"\n        With text\n        "),B(eo.$$.fragment,gt),mn=R(gt,"\n        and behind.\n        "),pn=o(gt,"BR",{}),xn=h(gt),un=o(gt,"BR",{}),En=h(gt),B(no.$$.fragment,gt),dn=h(gt),An=o(gt,"BR",{}),vn=h(gt),bn=o(gt,"BR",{}),yn=h(gt),B(so.$$.fragment,gt),wn=h(gt),Bn=o(gt,"BR",{}),Rn=h(gt),In=o(gt,"BR",{}),gt.forEach(r),kn=h(ct),Sn=o(ct,"DIV",{});var ht=a(Sn);Tn=o(ht,"BR",{}),Ln=R(ht,"\n        Links as buttons\n        "),Pn=o(ht,"BR",{}),On=h(ht),_n=o(ht,"BR",{}),Nn=h(ht),B(lo.$$.fragment,ht),Dn=h(ht),jn=o(ht,"BR",{}),Vn=h(ht),zn=o(ht,"BR",{}),Cn=h(ht),B(oo.$$.fragment,ht),Hn=h(ht),Mn=o(ht,"BR",{}),Un=h(ht),Wn=o(ht,"BR",{}),Xn=h(ht),B(ao.$$.fragment,ht),qn=h(ht),Fn=o(ht,"BR",{}),Gn=h(ht),Kn=o(ht,"BR",{}),Jn=R(ht,"\n        With text\n        "),B(ro.$$.fragment,ht),Qn=R(ht,"\n        and behind.\n        "),Yn=o(ht,"BR",{}),Zn=h(ht),ts=o(ht,"BR",{}),es=h(ht),B($o.$$.fragment,ht),ns=h(ht),ss=o(ht,"BR",{}),ls=h(ht),os=o(ht,"BR",{}),as=h(ht),B(fo.$$.fragment,ht),rs=h(ht),$s=o(ht,"BR",{}),fs=h(ht),is=o(ht,"BR",{}),ht.forEach(r),ct.forEach(r),cs=h(t),gs=o(t,"BR",{}),hs=h(t),ms=o(t,"BR",{}),ps=h(t),xs=o(t,"H2",{class:!0});var mt=a(xs);us=R(mt,"Input fields"),mt.forEach(r),Es=h(t),ds=o(t,"BR",{}),As=h(t),vs=o(t,"BR",{}),bs=h(t),ys=o(t,"SECTION",{});var pt=a(ys);B(io.$$.fragment,pt),ws=h(pt),Bs=o(pt,"BR",{}),Rs=h(pt),Is=o(pt,"BR",{}),ks=h(pt),B(co.$$.fragment,pt),Ss=h(pt),Ts=o(pt,"BR",{}),Ls=h(pt),Ps=o(pt,"BR",{}),Os=h(pt),B(go.$$.fragment,pt),_s=h(pt),Ns=o(pt,"DATALIST",{id:!0});var xt=a(Ns);Ds=o(xt,"OPTION",{value:!0}),a(Ds).forEach(r),js=o(xt,"OPTION",{value:!0}),a(js).forEach(r),Vs=o(xt,"OPTION",{value:!0}),a(Vs).forEach(r),xt.forEach(r),zs=h(pt),Cs=o(pt,"LABEL",{for:!0,class:!0});var ut=a(Cs);Hs=R(ut,"label"),ut.forEach(r),Ms=h(pt),Us=o(pt,"INPUT",{id:!0,type:!0,value:!0}),Ws=h(pt),Xs=o(pt,"BR",{}),qs=h(pt),Fs=o(pt,"BR",{}),Gs=h(pt),Ks=o(pt,"A",{href:!0,class:!0});var Et=a(Ks);Js=R(Et,"Some link"),Et.forEach(r),Qs=h(pt),Ys=o(pt,"BR",{}),Zs=h(pt),tl=o(pt,"BR",{}),el=h(pt),nl=o(pt,"BUTTON",{type:!0,class:!0});var dt=a(nl);sl=R(dt,"Button example"),dt.forEach(r),pt.forEach(r),ll=h(t),ol=o(t,"BR",{}),al=h(t),rl=o(t,"BR",{}),$l=h(t),fl=o(t,"H2",{class:!0});var At=a(fl);il=R(At,"Images"),At.forEach(r),cl=h(t),gl=o(t,"BR",{}),hl=h(t),ml=o(t,"BR",{}),pl=h(t),B(ho.$$.fragment,t),xl=h(t),ul=o(t,"BR",{}),El=h(t),dl=o(t,"BR",{}),Al=h(t),vl=o(t,"H2",{class:!0});var vt=a(vl);bl=R(vt,"Other"),vt.forEach(r),yl=h(t),wl=o(t,"P",{});var Tl=a(wl);Bl=o(Tl,"STRONG",{});var mo=a(Bl);Rl=R(mo,"Try editing this file (src/routes/index.svelte) to test live reloading."),mo.forEach(r),Tl.forEach(r),Il=h(t),kl=o(t,"P",{style:!0});var po=a(kl);Sl=R(po,"A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text.\n    A lot of English text. A lot of English text. A lot of English text. A lot of English text."),po.forEach(r),this.h()},h(){document.title="Charitify - is the application for helping those in need.",$(i,"class","top-pic svelte-1fydlyp"),$(x,"class","svelte-1fydlyp"),$(A,"class","svelte-1fydlyp"),$(b,"class","svelte-1fydlyp"),q.__value="20",q.value=q.__value,F.__value="500",F.value=F.__value,K.__value="1000",K.value=K.__value,$(X,"id","sum-suggestions"),$(H,"class","svelte-1fydlyp"),$(Q,"class","svelte-1fydlyp"),$(p,"class","options svelte-1fydlyp"),$(s,"class","top svelte-1fydlyp"),$(Bt,"class","svelte-1fydlyp"),$(kt,"class","svelte-1fydlyp"),$(wt,"class","svelte-1fydlyp"),$(bt,"class","ava-section svelte-1fydlyp"),$($t,"class","rate-section svelte-1fydlyp"),$(_t,"class","svelte-1fydlyp"),$(zt,"class","text-center"),I(zt,"padding","0 10vw"),$(n,"class","container"),$(Gt,"class","svelte-1fydlyp"),$(ee,"class","text-success"),$(ve,"class","text-warning"),I(We,"text-align","center"),I(We,"display","flex"),I(We,"justify-content","space-around"),$(xs,"class","text-danger"),Ds.__value="1",Ds.value=Ds.__value,js.__value="2",js.value=js.__value,Vs.__value="3",Vs.value=Vs.__value,$(Ns,"id","lis"),$(Cs,"for","input"),$(Cs,"class","text-success"),$(Us,"id","input"),$(Us,"type","text"),Us.value="text",$(Ks,"href","."),$(Ks,"class","text-warning"),$(nl,"type","button"),$(nl,"class","text-info"),$(fl,"class","text-info"),$(vl,"class","text-success"),I(kl,"text-align","justify")},m(t,l){f(t,e,l),f(t,n,l),m(n,s),m(s,i),k(Ll,i,null),m(s,c),m(s,p),m(p,x),k(Pl,x,null),m(p,d),m(p,A),k(Ol,A,null),m(p,v),m(p,b),k(_l,b,null),m(p,T),m(p,H),m(H,M),m(H,U),k(Nl,H,null),m(H,W),m(H,X),m(X,q),m(X,F),m(X,K),m(p,J),m(p,Q),k(Dl,Q,null),m(n,Y),k(jl,n,null),m(n,Z),m(n,tt),m(n,et),k(Vl,n,null),m(n,nt),m(n,$t),m($t,bt),k(zl,bt,null),m(bt,yt),m(bt,wt),m(wt,Bt),m(Bt,Rt),m(wt,It),m(wt,kt),m(kt,St),m($t,Tt),k(Cl,$t,null),m(n,Lt),m(n,Pt),m(n,Ot),m(n,_t),m(_t,Nt),m(n,Dt),m(n,jt),m(n,Vt),m(n,zt),m(zt,Ct),f(t,Ht,l),f(t,Mt,l),f(t,Ut,l),f(t,Wt,l),f(t,Xt,l),k(Hl,t,l),f(t,qt,l),k(Ml,t,l),f(t,Ft,l),f(t,Gt,l),m(Gt,Kt),f(t,Jt,l),f(t,Qt,l),f(t,Yt,l),f(t,Zt,l),f(t,te,l),f(t,ee,l),m(ee,ne),f(t,se,l),f(t,le,l),f(t,oe,l),f(t,ae,l),f(t,re,l),f(t,$e,l),m($e,fe),f(t,ie,l),f(t,ce,l),m(ce,ge),f(t,he,l),f(t,me,l),m(me,pe),f(t,xe,l),f(t,ue,l),f(t,Ee,l),f(t,de,l),f(t,Ae,l),f(t,ve,l),m(ve,be),f(t,ye,l),f(t,we,l),m(we,Be),m(Be,Re),k(Ul,Re,null),m(Re,Ie),k(Wl,Re,null),m(Re,ke),k(Xl,Re,null),m(we,Se),m(we,Te),m(Te,Le),k(ql,Le,null),m(Le,Pe),k(Fl,Le,null),m(Le,Oe),k(Gl,Le,null),m(we,_e),m(we,Ne),m(Ne,De),k(Kl,De,null),m(De,je),k(Jl,De,null),m(De,Ve),k(Ql,De,null),f(t,ze,l),f(t,Ce,l),f(t,He,l),f(t,Me,l),f(t,Ue,l),f(t,We,l),m(We,Xe),m(Xe,qe),m(Xe,Fe),m(Xe,Ge),m(Xe,Ke),m(Xe,Je),m(Xe,Qe),k(Yl,Xe,null),m(Xe,Ye),m(Xe,Ze),m(Xe,tn),m(Xe,en),m(Xe,nn),k(Zl,Xe,null),m(Xe,sn),m(Xe,ln),m(Xe,on),m(Xe,an),m(Xe,rn),k(to,Xe,null),m(Xe,$n),m(Xe,fn),m(Xe,cn),m(Xe,gn),m(Xe,hn),k(eo,Xe,null),m(Xe,mn),m(Xe,pn),m(Xe,xn),m(Xe,un),m(Xe,En),k(no,Xe,null),m(Xe,dn),m(Xe,An),m(Xe,vn),m(Xe,bn),m(Xe,yn),k(so,Xe,null),m(Xe,wn),m(Xe,Bn),m(Xe,Rn),m(Xe,In),m(We,kn),m(We,Sn),m(Sn,Tn),m(Sn,Ln),m(Sn,Pn),m(Sn,On),m(Sn,_n),m(Sn,Nn),k(lo,Sn,null),m(Sn,Dn),m(Sn,jn),m(Sn,Vn),m(Sn,zn),m(Sn,Cn),k(oo,Sn,null),m(Sn,Hn),m(Sn,Mn),m(Sn,Un),m(Sn,Wn),m(Sn,Xn),k(ao,Sn,null),m(Sn,qn),m(Sn,Fn),m(Sn,Gn),m(Sn,Kn),m(Sn,Jn),k(ro,Sn,null),m(Sn,Qn),m(Sn,Yn),m(Sn,Zn),m(Sn,ts),m(Sn,es),k($o,Sn,null),m(Sn,ns),m(Sn,ss),m(Sn,ls),m(Sn,os),m(Sn,as),k(fo,Sn,null),m(Sn,rs),m(Sn,$s),m(Sn,fs),m(Sn,is),f(t,cs,l),f(t,gs,l),f(t,hs,l),f(t,ms,l),f(t,ps,l),f(t,xs,l),m(xs,us),f(t,Es,l),f(t,ds,l),f(t,As,l),f(t,vs,l),f(t,bs,l),f(t,ys,l),k(io,ys,null),m(ys,ws),m(ys,Bs),m(ys,Rs),m(ys,Is),m(ys,ks),k(co,ys,null),m(ys,Ss),m(ys,Ts),m(ys,Ls),m(ys,Ps),m(ys,Os),k(go,ys,null),m(ys,_s),m(ys,Ns),m(Ns,Ds),m(Ns,js),m(Ns,Vs),m(ys,zs),m(ys,Cs),m(Cs,Hs),m(ys,Ms),m(ys,Us),m(ys,Ws),m(ys,Xs),m(ys,qs),m(ys,Fs),m(ys,Gs),m(ys,Ks),m(Ks,Js),m(ys,Qs),m(ys,Ys),m(ys,Zs),m(ys,tl),m(ys,el),m(ys,nl),m(nl,sl),f(t,ll,l),f(t,ol,l),f(t,al,l),f(t,rl,l),f(t,$l,l),f(t,fl,l),m(fl,il),f(t,cl,l),f(t,gl,l),f(t,hl,l),f(t,ml,l),f(t,pl,l),k(ho,t,l),f(t,xl,l),f(t,ul,l),f(t,El,l),f(t,dl,l),f(t,Al,l),f(t,vl,l),m(vl,bl),f(t,yl,l),f(t,wl,l),m(wl,Bl),m(Bl,Rl),f(t,Il,l),f(t,kl,l),m(kl,Sl),Tl=!0},p(t,[e]){const n={};131072&e&&(n.$$scope={dirty:e,ctx:t}),Ll.$set(n);const s={};131072&e&&(s.$$scope={dirty:e,ctx:t}),Pl.$set(s);const l={};131072&e&&(l.$$scope={dirty:e,ctx:t}),Ol.$set(l);const o={};131072&e&&(o.$$scope={dirty:e,ctx:t}),_l.$set(o);const a={};131072&e&&(a.$$scope={dirty:e,ctx:t}),Dl.$set(a);const r={};131072&e&&(r.$$scope={dirty:e,ctx:t}),Ml.$set(r);const $={};131072&e&&($.$$scope={dirty:e,ctx:t}),Yl.$set($);const f={};131072&e&&(f.$$scope={dirty:e,ctx:t}),Zl.$set(f);const i={};131072&e&&(i.$$scope={dirty:e,ctx:t}),to.$set(i);const c={};131072&e&&(c.$$scope={dirty:e,ctx:t}),eo.$set(c);const g={};131072&e&&(g.$$scope={dirty:e,ctx:t}),no.$set(g);const h={};131072&e&&(h.$$scope={dirty:e,ctx:t}),so.$set(h);const m={};131072&e&&(m.$$scope={dirty:e,ctx:t}),lo.$set(m);const p={};131072&e&&(p.$$scope={dirty:e,ctx:t}),oo.$set(p);const x={};131072&e&&(x.$$scope={dirty:e,ctx:t}),ao.$set(x);const u={};131072&e&&(u.$$scope={dirty:e,ctx:t}),ro.$set(u);const E={};131072&e&&(E.$$scope={dirty:e,ctx:t}),$o.$set(E);const d={};131072&e&&(d.$$scope={dirty:e,ctx:t}),fo.$set(d)},i(t){Tl||(u(Ll.$$.fragment,t),u(Pl.$$.fragment,t),u(Ol.$$.fragment,t),u(_l.$$.fragment,t),u(Nl.$$.fragment,t),u(Dl.$$.fragment,t),u(jl.$$.fragment,t),u(Vl.$$.fragment,t),u(zl.$$.fragment,t),u(Cl.$$.fragment,t),u(Hl.$$.fragment,t),u(Ml.$$.fragment,t),u(Ul.$$.fragment,t),u(Wl.$$.fragment,t),u(Xl.$$.fragment,t),u(ql.$$.fragment,t),u(Fl.$$.fragment,t),u(Gl.$$.fragment,t),u(Kl.$$.fragment,t),u(Jl.$$.fragment,t),u(Ql.$$.fragment,t),u(Yl.$$.fragment,t),u(Zl.$$.fragment,t),u(to.$$.fragment,t),u(eo.$$.fragment,t),u(no.$$.fragment,t),u(so.$$.fragment,t),u(lo.$$.fragment,t),u(oo.$$.fragment,t),u(ao.$$.fragment,t),u(ro.$$.fragment,t),u($o.$$.fragment,t),u(fo.$$.fragment,t),u(io.$$.fragment,t),u(co.$$.fragment,t),u(go.$$.fragment,t),u(ho.$$.fragment,t),Tl=!0)},o(t){E(Ll.$$.fragment,t),E(Pl.$$.fragment,t),E(Ol.$$.fragment,t),E(_l.$$.fragment,t),E(Nl.$$.fragment,t),E(Dl.$$.fragment,t),E(jl.$$.fragment,t),E(Vl.$$.fragment,t),E(zl.$$.fragment,t),E(Cl.$$.fragment,t),E(Hl.$$.fragment,t),E(Ml.$$.fragment,t),E(Ul.$$.fragment,t),E(Wl.$$.fragment,t),E(Xl.$$.fragment,t),E(ql.$$.fragment,t),E(Fl.$$.fragment,t),E(Gl.$$.fragment,t),E(Kl.$$.fragment,t),E(Jl.$$.fragment,t),E(Ql.$$.fragment,t),E(Yl.$$.fragment,t),E(Zl.$$.fragment,t),E(to.$$.fragment,t),E(eo.$$.fragment,t),E(no.$$.fragment,t),E(so.$$.fragment,t),E(lo.$$.fragment,t),E(oo.$$.fragment,t),E(ao.$$.fragment,t),E(ro.$$.fragment,t),E($o.$$.fragment,t),E(fo.$$.fragment,t),E(io.$$.fragment,t),E(co.$$.fragment,t),E(go.$$.fragment,t),E(ho.$$.fragment,t),Tl=!1},d(t){t&&r(e),t&&r(n),S(Ll),S(Pl),S(Ol),S(_l),S(Nl),S(Dl),S(jl),S(Vl),S(zl),S(Cl),t&&r(Ht),t&&r(Mt),t&&r(Ut),t&&r(Wt),t&&r(Xt),S(Hl,t),t&&r(qt),S(Ml,t),t&&r(Ft),t&&r(Gt),t&&r(Jt),t&&r(Qt),t&&r(Yt),t&&r(Zt),t&&r(te),t&&r(ee),t&&r(se),t&&r(le),t&&r(oe),t&&r(ae),t&&r(re),t&&r($e),t&&r(ie),t&&r(ce),t&&r(he),t&&r(me),t&&r(xe),t&&r(ue),t&&r(Ee),t&&r(de),t&&r(Ae),t&&r(ve),t&&r(ye),t&&r(we),S(Ul),S(Wl),S(Xl),S(ql),S(Fl),S(Gl),S(Kl),S(Jl),S(Ql),t&&r(ze),t&&r(Ce),t&&r(He),t&&r(Me),t&&r(Ue),t&&r(We),S(Yl),S(Zl),S(to),S(eo),S(no),S(so),S(lo),S(oo),S(ao),S(ro),S($o),S(fo),t&&r(cs),t&&r(gs),t&&r(hs),t&&r(ms),t&&r(ps),t&&r(xs),t&&r(Es),t&&r(ds),t&&r(As),t&&r(vs),t&&r(bs),t&&r(ys),S(io),S(co),S(go),t&&r(ll),t&&r(ol),t&&r(al),t&&r(rl),t&&r($l),t&&r(fl),t&&r(cl),t&&r(gl),t&&r(hl),t&&r(ml),t&&r(pl),S(ho,t),t&&r(xl),t&&r(ul),t&&r(El),t&&r(dl),t&&r(Al),t&&r(vl),t&&r(yl),t&&r(wl),t&&r(Il),t&&r(kl)}}}function yt(t){return[t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t),t=>console.log(t)]}export default class extends t{constructor(t){super(),e(this,t,yt,bt,n,{})}}
