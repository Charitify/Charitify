import{S as t,i as e,s as r,x as n,f as s,l as a,p as $,u as l,v as i,w as f,y as c,e as o,d as m,t as g,j as h,k as p,g as u,h as d,m as v,n as w,z as x,o as y,a as E,A as z,E as b,G as S,C as k,H as I,I as B,B as N,J as D,r as _,K as C,M as H,N as A,O as P,Q as V,R as q,U as O,V as j,W as T,X as F,Y as R,c as L,F as M,q as U,Z as G,_ as J,$ as K,a0 as Q,a1 as W,a2 as X}from"./client.b59b241c.js";function Y(t){let e,r,n,b,S,k,I,B,N,D,_,C,H,A,P,V=t[0].name+"";const q=new c({props:{src:t[0].avatar,size:"contain",alt:"фото організації"}});return{c(){e=o("div"),r=o("div"),n=o("s"),b=m(),S=o("div"),s(q.$$.fragment),k=m(),I=o("s"),B=m(),N=o("s"),D=m(),_=o("s"),C=m(),H=o("h3"),A=g(V),this.h()},l(t){e=h(t,"DIV",{class:!0});var s=p(e);r=h(s,"DIV",{class:!0});var $=p(r);n=h($,"S",{}),p(n).forEach(u),b=d($),S=h($,"DIV",{class:!0,style:!0});var l=p(S);a(q.$$.fragment,l),l.forEach(u),k=d($),I=h($,"S",{}),p(I).forEach(u),B=d($),N=h($,"S",{}),p(N).forEach(u),D=d($),_=h($,"S",{}),p(_).forEach(u),C=d($),H=h($,"H3",{});var i=p(H);A=v(i,V),i.forEach(u),$.forEach(u),s.forEach(u),this.h()},h(){w(S,"class","flex"),x(S,"max-width","45px"),x(S,"height","40px"),x(S,"overflow","hidden"),w(r,"class","flex flex-align-center"),w(e,"class","flex flex-align-center flex-justify-between full-width")},m(t,s){y(t,e,s),E(e,r),E(r,n),E(r,b),E(r,S),$(q,S,null),E(r,k),E(r,I),E(r,B),E(r,N),E(r,D),E(r,_),E(r,C),E(r,H),E(H,A),P=!0},p(t,e){const r={};1&e&&(r.src=t[0].avatar),q.$set(r),(!P||1&e)&&V!==(V=t[0].name+"")&&z(A,V)},i(t){P||(l(q.$$.fragment,t),P=!0)},o(t){i(q.$$.fragment,t),P=!1},d(t){t&&u(e),f(q)}}}function Z(t){let e;const r=new n({props:{rel:"prefetch",href:t[0].id,class:"white",$$slots:{default:[Y]},$$scope:{ctx:t}}});return{c(){s(r.$$.fragment)},l(t){a(r.$$.fragment,t)},m(t,n){$(r,t,n),e=!0},p(t,[e]){const n={};1&e&&(n.href=t[0].id),3&e&&(n.$$scope={dirty:e,ctx:t}),r.$set(n)},i(t){e||(l(r.$$.fragment,t),e=!0)},o(t){i(r.$$.fragment,t),e=!1},d(t){f(r,t)}}}function tt(t,e,r){let{organization:n={}}=e;return t.$set=t=>{"organization"in t&&r(0,n=t.organization)},[n]}class et extends t{constructor(t){super(),e(this,t,tt,Z,r,{organization:0})}}function rt(t){let e,r;const n=[{items:t[0]},t[1]];let c={};for(let t=0;t<n.length;t+=1)c=S(c,n[t]);const m=new k({props:c});return{c(){e=o("section"),s(m.$$.fragment),this.h()},l(t){e=h(t,"SECTION",{slot:!0,class:!0});var r=p(e);a(m.$$.fragment,r),r.forEach(u),this.h()},h(){w(e,"slot","box"),w(e,"class","flex full-width")},m(t,n){y(t,e,n),$(m,e,null),r=!0},p(t,e){const r=3&e?I(n,[1&e&&{items:t[0]},2&e&&B(t[1])]):{};m.$set(r)},i(t){r||(l(m.$$.fragment,t),r=!0)},o(t){i(m.$$.fragment,t),r=!1},d(t){t&&u(e),f(m)}}}function nt(t){let e,r;const n=new k({props:{items:t[0],dotsBelow:!1}});return n.$on("click",t[2]),{c(){s(n.$$.fragment),e=m()},l(t){a(n.$$.fragment,t),e=d(t)},m(t,s){$(n,t,s),y(t,e,s),r=!0},p(t,e){const r={};1&e&&(r.items=t[0]),n.$set(r)},i(t){r||(l(n.$$.fragment,t),r=!0)},o(t){i(n.$$.fragment,t),r=!1},d(t){f(n,t),t&&u(e)}}}function st(t){let e,r;const n=new b({props:{$$slots:{default:[nt],box:[rt]},$$scope:{ctx:t}}});return{c(){e=o("section"),s(n.$$.fragment),this.h()},l(t){e=h(t,"SECTION",{class:!0,style:!0});var r=p(e);a(n.$$.fragment,r),r.forEach(u),this.h()},h(){w(e,"class","flex"),x(e,"height","240px")},m(t,s){y(t,e,s),$(n,e,null),r=!0},p(t,[e]){const r={};11&e&&(r.$$scope={dirty:e,ctx:t}),n.$set(r)},i(t){r||(l(n.$$.fragment,t),r=!0)},o(t){i(n.$$.fragment,t),r=!1},d(t){t&&u(e),f(n)}}}function at(t,e,r){let{items:n=[]}=e,s={};return t.$set=t=>{"items"in t&&r(0,n=t.items)},[n,s,function({detail:t}){r(1,s={initIndex:t.index})}]}class $t extends t{constructor(t){super(),e(this,t,at,st,r,{items:0})}}function lt(t){let e,r,n,c,x,b,S;const k=new N({props:{size:"10"}});return{c(){e=o("h2"),r=g(t[0]),n=m(),s(k.$$.fragment),c=m(),x=o("pre"),b=g(t[1]),this.h()},l(s){e=h(s,"H2",{});var $=p(e);r=v($,t[0]),$.forEach(u),n=d(s),a(k.$$.fragment,s),c=d(s),x=h(s,"PRE",{class:!0});var l=p(x);b=v(l,t[1]),l.forEach(u),this.h()},h(){w(x,"class","font-w-300")},m(t,s){y(t,e,s),E(e,r),y(t,n,s),$(k,t,s),y(t,c,s),y(t,x,s),E(x,b),S=!0},p(t,[e]){(!S||1&e)&&z(r,t[0]),(!S||2&e)&&z(b,t[1])},i(t){S||(l(k.$$.fragment,t),S=!0)},o(t){i(k.$$.fragment,t),S=!1},d(t){t&&u(e),t&&u(n),f(k,t),t&&u(c),t&&u(x)}}}function it(t,e,r){let{title:n}=e,{text:s}=e;return t.$set=t=>{"title"in t&&r(0,n=t.title),"text"in t&&r(1,s=t.text)},[n,s]}class ft extends t{constructor(t){super(),e(this,t,it,lt,r,{title:0,text:1})}}function ct(t){let e,r,n,c,x,z,b,S;const k=new D({props:{type:"share",size:"medium",class:"theme-svg-fill"}});return{c(){s(k.$$.fragment),e=m(),r=o("s"),n=m(),c=o("s"),x=m(),z=o("h3"),b=g("Поділитись"),this.h()},l(t){a(k.$$.fragment,t),e=d(t),r=h(t,"S",{}),p(r).forEach(u),n=d(t),c=h(t,"S",{}),p(c).forEach(u),x=d(t),z=h(t,"H3",{class:!0});var s=p(z);b=v(s,"Поділитись"),s.forEach(u),this.h()},h(){w(z,"class","font-w-600")},m(t,s){$(k,t,s),y(t,e,s),y(t,r,s),y(t,n,s),y(t,c,s),y(t,x,s),y(t,z,s),E(z,b),S=!0},p:_,i(t){S||(l(k.$$.fragment,t),S=!0)},o(t){i(k.$$.fragment,t),S=!1},d(t){f(k,t),t&&u(e),t&&u(r),t&&u(n),t&&u(c),t&&u(x),t&&u(z)}}}function ot(t){let e,r,c,x,b,S,k,I,B,N,_,C,H,A,P,V,q,O,j,T,F;const R=new D({props:{is:"danger",type:"heart-filled",size:"medium"}}),L=new n({props:{class:"flex flex-align-center",auto:!0,size:"small",$$slots:{default:[ct]},$$scope:{ctx:t}}}),M=new D({props:{type:"eye",size:"medium",class:"theme-svg-fill"}});return{c(){e=o("p"),r=o("span"),s(R.$$.fragment),c=m(),x=o("s"),b=m(),S=o("s"),k=m(),I=o("span"),B=g(t[0]),N=m(),_=o("span"),s(L.$$.fragment),C=m(),H=o("span"),s(M.$$.fragment),A=m(),P=o("s"),V=m(),q=o("s"),O=m(),j=o("span"),T=g(t[1]),this.h()},l(n){e=h(n,"P",{class:!0});var s=p(e);r=h(s,"SPAN",{class:!0});var $=p(r);a(R.$$.fragment,$),c=d($),x=h($,"S",{}),p(x).forEach(u),b=d($),S=h($,"S",{}),p(S).forEach(u),k=d($),I=h($,"SPAN",{class:!0});var l=p(I);B=v(l,t[0]),l.forEach(u),$.forEach(u),N=d(s),_=h(s,"SPAN",{class:!0});var i=p(_);a(L.$$.fragment,i),i.forEach(u),C=d(s),H=h(s,"SPAN",{class:!0});var f=p(H);a(M.$$.fragment,f),A=d(f),P=h(f,"S",{}),p(P).forEach(u),V=d(f),q=h(f,"S",{}),p(q).forEach(u),O=d(f),j=h(f,"SPAN",{class:!0});var o=p(j);T=v(o,t[1]),o.forEach(u),f.forEach(u),s.forEach(u),this.h()},h(){w(I,"class","font-secondary font-w-600 h3"),w(r,"class","flex flex-align-center"),w(_,"class","flex"),w(j,"class","font-secondary font-w-600 h3"),w(H,"class","flex flex-align-center"),w(e,"class","container flex flex-justify-between flex-align-center")},m(t,n){y(t,e,n),E(e,r),$(R,r,null),E(r,c),E(r,x),E(r,b),E(r,S),E(r,k),E(r,I),E(I,B),E(e,N),E(e,_),$(L,_,null),E(e,C),E(e,H),$(M,H,null),E(H,A),E(H,P),E(H,V),E(H,q),E(H,O),E(H,j),E(j,T),F=!0},p(t,[e]){(!F||1&e)&&z(B,t[0]);const r={};4&e&&(r.$$scope={dirty:e,ctx:t}),L.$set(r),(!F||2&e)&&z(T,t[1])},i(t){F||(l(R.$$.fragment,t),l(L.$$.fragment,t),l(M.$$.fragment,t),F=!0)},o(t){i(R.$$.fragment,t),i(L.$$.fragment,t),i(M.$$.fragment,t),F=!1},d(t){t&&u(e),f(R),f(L),f(M)}}}function mt(t,e,r){let{likes:n=0}=e,{views:s=0}=e;return t.$set=t=>{"likes"in t&&r(0,n=t.likes),"views"in t&&r(1,s=t.views)},[n,s]}class gt extends t{constructor(t){super(),e(this,t,mt,ot,r,{likes:0,views:1})}}function ht(t){let e,r,n,c,x,b;const S=new N({props:{size:"5"}}),k=new C({props:{items:t[1]}});return{c(){e=o("h1"),r=g(t[0]),n=m(),s(S.$$.fragment),c=m(),x=o("div"),s(k.$$.fragment),this.h()},l(s){e=h(s,"H1",{});var $=p(e);r=v($,t[0]),$.forEach(u),n=d(s),a(S.$$.fragment,s),c=d(s),x=h(s,"DIV",{class:!0});var l=p(x);a(k.$$.fragment,l),l.forEach(u),this.h()},h(){w(x,"class","full-container")},m(t,s){y(t,e,s),E(e,r),y(t,n,s),$(S,t,s),y(t,c,s),y(t,x,s),$(k,x,null),b=!0},p(t,[e]){(!b||1&e)&&z(r,t[0]);const n={};2&e&&(n.items=t[1]),k.$set(n)},i(t){b||(l(S.$$.fragment,t),l(k.$$.fragment,t),b=!0)},o(t){i(S.$$.fragment,t),i(k.$$.fragment,t),b=!1},d(t){t&&u(e),t&&u(n),f(S,t),t&&u(c),t&&u(x),f(k)}}}function pt(t,e,r){let{title:n}=e,{items:s=[]}=e;return t.$set=t=>{"title"in t&&r(0,n=t.title),"items"in t&&r(1,s=t.items)},[n,s]}class ut extends t{constructor(t){super(),e(this,t,pt,ht,r,{title:0,items:1})}}function dt(t){let e,r,n,c,x,b,S;const k=new N({props:{size:"10"}});return{c(){e=o("h1"),r=g(t[0]),n=m(),s(k.$$.fragment),c=m(),x=o("pre"),b=g(t[1]),this.h()},l(s){e=h(s,"H1",{});var $=p(e);r=v($,t[0]),$.forEach(u),n=d(s),a(k.$$.fragment,s),c=d(s),x=h(s,"PRE",{class:!0});var l=p(x);b=v(l,t[1]),l.forEach(u),this.h()},h(){w(x,"class","font-w-300")},m(t,s){y(t,e,s),E(e,r),y(t,n,s),$(k,t,s),y(t,c,s),y(t,x,s),E(x,b),S=!0},p(t,[e]){(!S||1&e)&&z(r,t[0]),(!S||2&e)&&z(b,t[1])},i(t){S||(l(k.$$.fragment,t),S=!0)},o(t){i(k.$$.fragment,t),S=!1},d(t){t&&u(e),t&&u(n),f(k,t),t&&u(c),t&&u(x)}}}function vt(t,e,r){let{title:n}=e,{text:s}=e;return t.$set=t=>{"title"in t&&r(0,n=t.title),"text"in t&&r(1,s=t.text)},[n,s]}class wt extends t{constructor(t){super(),e(this,t,vt,dt,r,{title:0,text:1})}}function xt(t){let e,r,n,c,x,z,b,S;const k=new D({props:{type:"share",size:"medium",class:"theme-svg-fill"}});return{c(){s(k.$$.fragment),e=m(),r=o("s"),n=m(),c=o("s"),x=m(),z=o("p"),b=g("Поділитись"),this.h()},l(t){a(k.$$.fragment,t),e=d(t),r=h(t,"S",{}),p(r).forEach(u),n=d(t),c=h(t,"S",{}),p(c).forEach(u),x=d(t),z=h(t,"P",{class:!0});var s=p(z);b=v(s,"Поділитись"),s.forEach(u),this.h()},h(){w(z,"class","font-w-500")},m(t,s){$(k,t,s),y(t,e,s),y(t,r,s),y(t,n,s),y(t,c,s),y(t,x,s),y(t,z,s),E(z,b),S=!0},p:_,i(t){S||(l(k.$$.fragment,t),S=!0)},o(t){i(k.$$.fragment,t),S=!1},d(t){f(k,t),t&&u(e),t&&u(r),t&&u(n),t&&u(c),t&&u(x),t&&u(z)}}}function yt(t){let e,r,n,c,x,z,b,S;const k=new D({props:{type:"link",size:"medium",class:"theme-svg-fill"}});return{c(){s(k.$$.fragment),e=m(),r=o("s"),n=m(),c=o("s"),x=m(),z=o("p"),b=g("Скопіювати"),this.h()},l(t){a(k.$$.fragment,t),e=d(t),r=h(t,"S",{}),p(r).forEach(u),n=d(t),c=h(t,"S",{}),p(c).forEach(u),x=d(t),z=h(t,"P",{class:!0});var s=p(z);b=v(s,"Скопіювати"),s.forEach(u),this.h()},h(){w(z,"class","font-w-500")},m(t,s){$(k,t,s),y(t,e,s),y(t,r,s),y(t,n,s),y(t,c,s),y(t,x,s),y(t,z,s),E(z,b),S=!0},p:_,i(t){S||(l(k.$$.fragment,t),S=!0)},o(t){i(k.$$.fragment,t),S=!1},d(t){f(k,t),t&&u(e),t&&u(r),t&&u(n),t&&u(c),t&&u(x),t&&u(z)}}}function Et(t){let e,r,c,g,v,x,z,b,S,k,I,B,N;const D=new n({props:{class:"flex flex-align-center",auto:!0,size:"small",$$slots:{default:[xt]},$$scope:{ctx:t}}}),_=new n({props:{class:"flex flex-align-center",auto:!0,size:"small",$$slots:{default:[yt]},$$scope:{ctx:t}}});return{c(){e=o("p"),s(D.$$.fragment),r=m(),c=o("s"),g=m(),v=o("s"),x=m(),z=o("s"),b=m(),S=o("s"),k=m(),I=o("s"),B=m(),s(_.$$.fragment),this.h()},l(t){e=h(t,"P",{class:!0});var n=p(e);a(D.$$.fragment,n),r=d(n),c=h(n,"S",{}),p(c).forEach(u),g=d(n),v=h(n,"S",{}),p(v).forEach(u),x=d(n),z=h(n,"S",{}),p(z).forEach(u),b=d(n),S=h(n,"S",{}),p(S).forEach(u),k=d(n),I=h(n,"S",{}),p(I).forEach(u),B=d(n),a(_.$$.fragment,n),n.forEach(u),this.h()},h(){w(e,"class","flex")},m(t,n){y(t,e,n),$(D,e,null),E(e,r),E(e,c),E(e,g),E(e,v),E(e,x),E(e,z),E(e,b),E(e,S),E(e,k),E(e,I),E(e,B),$(_,e,null),N=!0},p(t,[e]){const r={};1&e&&(r.$$scope={dirty:e,ctx:t}),D.$set(r);const n={};1&e&&(n.$$scope={dirty:e,ctx:t}),_.$set(n)},i(t){N||(l(D.$$.fragment,t),l(_.$$.fragment,t),N=!0)},o(t){i(D.$$.fragment,t),i(_.$$.fragment,t),N=!1},d(t){t&&u(e),f(D),f(_)}}}class zt extends t{constructor(t){super(),e(this,t,null,Et,r,{})}}function bt(t){let e,r,n,c,z,b,S;const k=new H({props:{isActive:t[0]}});k.$on("click",t[1]);const I=new N({props:{size:"10"}});return{c(){e=o("section"),r=o("div"),s(k.$$.fragment),n=m(),s(I.$$.fragment),c=m(),z=o("h2"),b=g("Я довіряю"),this.h()},l(t){e=h(t,"SECTION",{class:!0});var s=p(e);r=h(s,"DIV",{style:!0});var $=p(r);a(k.$$.fragment,$),$.forEach(u),n=d(s),a(I.$$.fragment,s),c=d(s),z=h(s,"H2",{});var l=p(z);b=v(l,"Я довіряю"),l.forEach(u),s.forEach(u),this.h()},h(){x(r,"width","100px"),x(r,"max-width","100%"),w(e,"class","flex flex-column flex-align-center flex-justify-center")},m(t,s){y(t,e,s),E(e,r),$(k,r,null),E(e,n),$(I,e,null),E(e,c),E(e,z),E(z,b),S=!0},p(t,[e]){const r={};1&e&&(r.isActive=t[0]),k.$set(r)},i(t){S||(l(k.$$.fragment,t),l(I.$$.fragment,t),S=!0)},o(t){i(k.$$.fragment,t),i(I.$$.fragment,t),S=!1},d(t){t&&u(e),f(k),f(I)}}}function St(t,e,r){let n=!1;return[n,async function(){r(0,n=!n)}]}class kt extends t{constructor(t){super(),e(this,t,St,bt,r,{})}}function It(t){let e,r,n,c,x,z;const b=new N({props:{size:"20"}}),S=new A({props:{items:t[0]}});return{c(){e=o("h1"),r=g("Наші піклувальники"),n=m(),s(b.$$.fragment),c=m(),x=o("div"),s(S.$$.fragment),this.h()},l(t){e=h(t,"H1",{});var s=p(e);r=v(s,"Наші піклувальники"),s.forEach(u),n=d(t),a(b.$$.fragment,t),c=d(t),x=h(t,"DIV",{class:!0});var $=p(x);a(S.$$.fragment,$),$.forEach(u),this.h()},h(){w(x,"class","full-container")},m(t,s){y(t,e,s),E(e,r),y(t,n,s),$(b,t,s),y(t,c,s),y(t,x,s),$(S,x,null),z=!0},p(t,[e]){const r={};1&e&&(r.items=t[0]),S.$set(r)},i(t){z||(l(b.$$.fragment,t),l(S.$$.fragment,t),z=!0)},o(t){i(b.$$.fragment,t),i(S.$$.fragment,t),z=!1},d(t){t&&u(e),t&&u(n),f(b,t),t&&u(c),t&&u(x),f(S)}}}function Bt(t,e,r){let{items:n}=e;return t.$set=t=>{"items"in t&&r(0,n=t.items)},[n]}class Nt extends t{constructor(t){super(),e(this,t,Bt,It,r,{items:0})}}function Dt(t){let e,r,n,c,w;const x=new N({props:{size:"20"}}),z=new P({props:{items:t[0]}});return z.$on("click",t[1]),{c(){e=o("h1"),r=g("Останні новини"),n=m(),s(x.$$.fragment),c=m(),s(z.$$.fragment)},l(t){e=h(t,"H1",{});var s=p(e);r=v(s,"Останні новини"),s.forEach(u),n=d(t),a(x.$$.fragment,t),c=d(t),a(z.$$.fragment,t)},m(t,s){y(t,e,s),E(e,r),y(t,n,s),$(x,t,s),y(t,c,s),$(z,t,s),w=!0},p(t,[e]){const r={};1&e&&(r.items=t[0]),z.$set(r)},i(t){w||(l(x.$$.fragment,t),l(z.$$.fragment,t),w=!0)},o(t){i(x.$$.fragment,t),i(z.$$.fragment,t),w=!1},d(t){t&&u(e),t&&u(n),f(x,t),t&&u(c),f(z,t)}}}function _t(t,e,r){let{items:n=[]}=e;return t.$set=t=>{"items"in t&&r(0,n=t.items)},[n,t=>console.log(t.detail)]}class Ct extends t{constructor(t){super(),e(this,t,_t,Dt,r,{items:0})}}function Ht(t){let e,r,n,c,x,z;const b=new N({props:{size:"5"}}),S=new V({props:{items:t[0]}});return{c(){e=o("h1"),r=g("Сертифікати"),n=m(),s(b.$$.fragment),c=m(),x=o("div"),s(S.$$.fragment),this.h()},l(t){e=h(t,"H1",{});var s=p(e);r=v(s,"Сертифікати"),s.forEach(u),n=d(t),a(b.$$.fragment,t),c=d(t),x=h(t,"DIV",{class:!0});var $=p(x);a(S.$$.fragment,$),$.forEach(u),this.h()},h(){w(x,"class","full-container")},m(t,s){y(t,e,s),E(e,r),y(t,n,s),$(b,t,s),y(t,c,s),y(t,x,s),$(S,x,null),z=!0},p(t,[e]){const r={};1&e&&(r.items=t[0]),S.$set(r)},i(t){z||(l(b.$$.fragment,t),l(S.$$.fragment,t),z=!0)},o(t){i(b.$$.fragment,t),i(S.$$.fragment,t),z=!1},d(t){t&&u(e),t&&u(n),f(b,t),t&&u(c),t&&u(x),f(S)}}}function At(t,e,r){let{items:n}=e;return t.$set=t=>{"items"in t&&r(0,n=t.items)},[n]}class Pt extends t{constructor(t){super(),e(this,t,At,Ht,r,{items:0})}}function Vt(t){let e;const r=new k({props:{items:t[0]}});return{c(){s(r.$$.fragment)},l(t){a(r.$$.fragment,t)},m(t,n){$(r,t,n),e=!0},p(t,e){const n={};1&e&&(n.items=t[0]),r.$set(n)},i(t){e||(l(r.$$.fragment,t),e=!0)},o(t){i(r.$$.fragment,t),e=!1},d(t){f(r,t)}}}function qt(t){let e,r,n,c,z,S;const k=new N({props:{size:"20"}}),I=new b({props:{$$slots:{default:[Vt]},$$scope:{ctx:t}}});return{c(){e=o("h1"),r=g("Відео про нас"),n=m(),s(k.$$.fragment),c=m(),z=o("section"),s(I.$$.fragment),this.h()},l(t){e=h(t,"H1",{});var s=p(e);r=v(s,"Відео про нас"),s.forEach(u),n=d(t),a(k.$$.fragment,t),c=d(t),z=h(t,"SECTION",{class:!0,style:!0});var $=p(z);a(I.$$.fragment,$),$.forEach(u),this.h()},h(){w(z,"class","flex"),x(z,"height","240px")},m(t,s){y(t,e,s),E(e,r),y(t,n,s),$(k,t,s),y(t,c,s),y(t,z,s),$(I,z,null),S=!0},p(t,[e]){const r={};3&e&&(r.$$scope={dirty:e,ctx:t}),I.$set(r)},i(t){S||(l(k.$$.fragment,t),l(I.$$.fragment,t),S=!0)},o(t){i(k.$$.fragment,t),i(I.$$.fragment,t),S=!1},d(t){t&&u(e),t&&u(n),f(k,t),t&&u(c),t&&u(z),f(I)}}}function Ot(t,e,r){let{items:n}=e;return t.$set=t=>{"items"in t&&r(0,n=t.items)},[n]}class jt extends t{constructor(t){super(),e(this,t,Ot,qt,r,{items:0})}}function Tt(t,e,r){const n=t.slice();return n[8]=e[r],n}function Ft(t,e,r){const n=t.slice();return n[8]=e[r],n}function Rt(t){let e,r,n;const c=new R({props:{src:t[1],srcBig:t[2],alt:"ava"}});return{c(){e=o("section"),r=o("div"),s(c.$$.fragment),this.h()},l(t){e=h(t,"SECTION",{slot:!0,class:!0,style:!0});var n=p(e);r=h(n,"DIV",{class:!0,style:!0});var s=p(r);a(c.$$.fragment,s),s.forEach(u),n.forEach(u),this.h()},h(){w(r,"class","flex flex-self-stretch flex-1 overflow-hidden flex-justify-stretch"),x(r,"padding","var(--screen-padding) 0"),w(e,"slot","box"),w(e,"class","flex full-width full-height"),x(e,"height","100vw")},m(t,s){y(t,e,s),E(e,r),$(c,r,null),n=!0},p(t,e){const r={};2&e&&(r.src=t[1]),4&e&&(r.srcBig=t[2]),c.$set(r)},i(t){n||(l(c.$$.fragment,t),n=!0)},o(t){i(c.$$.fragment,t),n=!1},d(t){t&&u(e),f(c)}}}function Lt(t){let e,r;const n=new R({props:{size:"big",src:t[1],alt:"Організація"}});return{c(){s(n.$$.fragment),e=m()},l(t){a(n.$$.fragment,t),e=d(t)},m(t,s){$(n,t,s),y(t,e,s),r=!0},p(t,e){const r={};2&e&&(r.src=t[1]),n.$set(r)},i(t){r||(l(n.$$.fragment,t),r=!0)},o(t){i(n.$$.fragment,t),r=!1},d(t){f(n,t),t&&u(e)}}}function Mt(t){let e,r,n,c,b,S,k,I,B,N,_,C,H,A,P,V=t[8].title+"";const q=new D({props:{type:t[5][t[8].type],size:"medium"}});return{c(){e=o("li"),r=o("a"),s(q.$$.fragment),n=m(),c=o("s"),b=m(),S=o("s"),k=m(),I=o("s"),B=m(),N=o("p"),_=g(V),A=m(),this.h()},l(t){e=h(t,"LI",{});var s=p(e);r=h(s,"A",{href:!0,class:!0,style:!0,title:!0});var $=p(r);a(q.$$.fragment,$),n=d($),c=h($,"S",{}),p(c).forEach(u),b=d($),S=h($,"S",{}),p(S).forEach(u),k=d($),I=h($,"S",{}),p(I).forEach(u),B=d($),N=h($,"P",{class:!0});var l=p(N);_=v(l,V),l.forEach(u),$.forEach(u),A=d(s),s.forEach(u),this.h()},h(){w(N,"class","h3"),w(r,"href",C=t[8].href),w(r,"class","flex flex-align-center"),x(r,"padding","7px 0"),w(r,"title",H=t[8].title)},m(t,s){y(t,e,s),E(e,r),$(q,r,null),E(r,n),E(r,c),E(r,b),E(r,S),E(r,k),E(r,I),E(r,B),E(r,N),E(N,_),E(e,A),P=!0},p(t,e){const n={};8&e&&(n.type=t[5][t[8].type]),q.$set(n),(!P||8&e)&&V!==(V=t[8].title+"")&&z(_,V),(!P||8&e&&C!==(C=t[8].href))&&w(r,"href",C),(!P||8&e&&H!==(H=t[8].title))&&w(r,"title",H)},i(t){P||(l(q.$$.fragment,t),P=!0)},o(t){i(q.$$.fragment,t),P=!1},d(t){t&&u(e),f(q)}}}function Ut(t){let e,r,n,c,g,v,z;const b=new D({props:{type:t[8].type,size:"large",class:"custom"}});return{c(){e=o("li"),r=o("a"),s(b.$$.fragment),g=m(),this.h()},l(t){e=h(t,"LI",{style:!0,class:!0});var n=p(e);r=h(n,"A",{href:!0,target:!0,title:!0,class:!0});var s=p(r);a(b.$$.fragment,s),s.forEach(u),g=d(n),n.forEach(u),this.h()},h(){w(r,"href",n=t[8].value),w(r,"target","_blank"),w(r,"title",c=t[8].title),w(r,"class","svelte-eudyoq"),x(e,"padding","0 10px"),w(e,"class",v=O(t[8].type)+" svelte-eudyoq")},m(t,n){y(t,e,n),E(e,r),$(b,r,null),E(e,g),z=!0},p(t,s){const a={};16&s&&(a.type=t[8].type),b.$set(a),(!z||16&s&&n!==(n=t[8].value))&&w(r,"href",n),(!z||16&s&&c!==(c=t[8].title))&&w(r,"title",c),(!z||16&s&&v!==(v=O(t[8].type)+" svelte-eudyoq"))&&w(e,"class",v)},i(t){z||(l(b.$$.fragment,t),z=!0)},o(t){i(b.$$.fragment,t),z=!1},d(t){t&&u(e),f(b)}}}function Gt(t){let e,r,n,c,S,k,I,B,D,_,C,H,A,P,V,q,O,R,L,M;const U=new N({props:{size:"30"}}),G=new b({props:{class:"flex-justify-center",$$slots:{default:[Lt],box:[Rt]},$$scope:{ctx:t}}}),J=new N({props:{size:"20"}}),K=new N({props:{size:"5"}}),Q=new N({props:{size:"30"}});let W=t[3],X=[];for(let e=0;e<W.length;e+=1)X[e]=Mt(Ft(t,W,e));const Y=t=>i(X[t],1,1,()=>{X[t]=null}),Z=new N({props:{size:"30"}});let tt=t[4],et=[];for(let e=0;e<tt.length;e+=1)et[e]=Ut(Tt(t,tt,e));const rt=t=>i(et[t],1,1,()=>{et[t]=null}),nt=new N({props:{size:"30"}});return{c(){e=o("section"),s(U.$$.fragment),r=m(),n=o("div"),c=o("span"),s(G.$$.fragment),S=m(),s(J.$$.fragment),k=m(),I=o("h2"),B=g("Наші контакти"),D=m(),s(K.$$.fragment),_=m(),C=o("p"),H=g(t[0]),A=m(),s(Q.$$.fragment),P=m(),V=o("ul");for(let t=0;t<X.length;t+=1)X[t].c();q=m(),s(Z.$$.fragment),O=m(),R=o("ul");for(let t=0;t<et.length;t+=1)et[t].c();L=m(),s(nt.$$.fragment),this.h()},l(s){e=h(s,"SECTION",{style:!0});var $=p(e);a(U.$$.fragment,$),r=d($),n=h($,"DIV",{class:!0});var l=p(n);c=h(l,"SPAN",{});var i=p(c);a(G.$$.fragment,i),i.forEach(u),S=d(l),a(J.$$.fragment,l),k=d(l),I=h(l,"H2",{});var f=p(I);B=v(f,"Наші контакти"),f.forEach(u),D=d(l),a(K.$$.fragment,l),_=d(l),C=h(l,"P",{class:!0,style:!0});var o=p(C);H=v(o,t[0]),o.forEach(u),l.forEach(u),A=d($),a(Q.$$.fragment,$),P=d($),V=h($,"UL",{});var m=p(V);for(let t=0;t<X.length;t+=1)X[t].l(m);m.forEach(u),q=d($),a(Z.$$.fragment,$),O=d($),R=h($,"UL",{class:!0});var g=p(R);for(let t=0;t<et.length;t+=1)et[t].l(g);g.forEach(u),L=d($),a(nt.$$.fragment,$),$.forEach(u),this.h()},h(){w(C,"class","h3 font-secondary font-w-500"),x(C,"opacity",".7"),w(n,"class","flex flex-column flex-align-center"),w(R,"class","flex flex-justify-center social-icons svelte-eudyoq"),x(e,"padding","0 20px")},m(t,s){y(t,e,s),$(U,e,null),E(e,r),E(e,n),E(n,c),$(G,c,null),E(n,S),$(J,n,null),E(n,k),E(n,I),E(I,B),E(n,D),$(K,n,null),E(n,_),E(n,C),E(C,H),E(e,A),$(Q,e,null),E(e,P),E(e,V);for(let t=0;t<X.length;t+=1)X[t].m(V,null);E(e,q),$(Z,e,null),E(e,O),E(e,R);for(let t=0;t<et.length;t+=1)et[t].m(R,null);E(e,L),$(nt,e,null),M=!0},p(t,e){const r={};if(8198&e&&(r.$$scope={dirty:e,ctx:t}),G.$set(r),(!M||1&e)&&z(H,t[0]),40&e){let r;for(W=t[3],r=0;r<W.length;r+=1){const n=Ft(t,W,r);X[r]?(X[r].p(n,e),l(X[r],1)):(X[r]=Mt(n),X[r].c(),l(X[r],1),X[r].m(V,null))}for(j(),r=W.length;r<X.length;r+=1)Y(r);T()}if(16&e){let r;for(tt=t[4],r=0;r<tt.length;r+=1){const n=Tt(t,tt,r);et[r]?(et[r].p(n,e),l(et[r],1)):(et[r]=Ut(n),et[r].c(),l(et[r],1),et[r].m(R,null))}for(j(),r=tt.length;r<et.length;r+=1)rt(r);T()}},i(t){if(!M){l(U.$$.fragment,t),l(G.$$.fragment,t),l(J.$$.fragment,t),l(K.$$.fragment,t),l(Q.$$.fragment,t);for(let t=0;t<W.length;t+=1)l(X[t]);l(Z.$$.fragment,t);for(let t=0;t<tt.length;t+=1)l(et[t]);l(nt.$$.fragment,t),M=!0}},o(t){i(U.$$.fragment,t),i(G.$$.fragment,t),i(J.$$.fragment,t),i(K.$$.fragment,t),i(Q.$$.fragment,t),X=X.filter(Boolean);for(let t=0;t<X.length;t+=1)i(X[t]);i(Z.$$.fragment,t),et=et.filter(Boolean);for(let t=0;t<et.length;t+=1)i(et[t]);i(nt.$$.fragment,t),M=!1},d(t){t&&u(e),f(U),f(G),f(J),f(K),f(Q),F(X,t),f(Z),F(et,t),f(nt)}}}function Jt(t){let e;const r=new q({props:{$$slots:{default:[Gt]},$$scope:{ctx:t}}});return{c(){s(r.$$.fragment)},l(t){a(r.$$.fragment,t)},m(t,n){$(r,t,n),e=!0},p(t,[e]){const n={};8223&e&&(n.$$scope={dirty:e,ctx:t}),r.$set(n)},i(t){e||(l(r.$$.fragment,t),e=!0)},o(t){i(r.$$.fragment,t),e=!1},d(t){f(r,t)}}}function Kt(t,e,r){let{items:n=[]}=e,{orgName:s=null}=e,{avatar:a=null}=e,{avatarBig:$=null}=e;const l=["telegram","facebook","viber"];let i,f;return t.$set=t=>{"items"in t&&r(6,n=t.items),"orgName"in t&&r(0,s=t.orgName),"avatar"in t&&r(1,a=t.avatar),"avatarBig"in t&&r(2,$=t.avatarBig)},t.$$.update=()=>{64&t.$$.dirty&&r(3,i=n.filter(t=>!l.includes(t.type))),64&t.$$.dirty&&r(4,f=n.filter(t=>l.includes(t.type)))},[s,a,$,i,f,{phone:"phone-filled",email:"email",location:"location-mark-filled",telegram:"telegram",facebook:"facebook",viber:"viber"},n]}class Qt extends t{constructor(t){var n;super(),document.getElementById("svelte-eudyoq-style")||((n=o("style")).id="svelte-eudyoq-style",n.textContent=".social-icons.svelte-eudyoq .telegram .svelte-eudyoq{fill:#2197D2}.social-icons.svelte-eudyoq .facebook .svelte-eudyoq{fill:#4267B2}.social-icons.svelte-eudyoq .viber .svelte-eudyoq{fill:#665CAC}",E(document.head,n)),e(this,t,Kt,Jt,r,{items:6,orgName:0,avatar:1,avatarBig:2})}}function Wt(t){let e,r,n,c,z,b,S,k;const I=new N({props:{size:"20"}});return{c(){e=o("h1"),r=g("3D - Тур 360°"),n=m(),s(I.$$.fragment),c=m(),z=o("div"),b=o("iframe"),this.h()},l(t){e=h(t,"H1",{});var s=p(e);r=v(s,"3D - Тур 360°"),s.forEach(u),n=d(t),a(I.$$.fragment,t),c=d(t),z=h(t,"DIV",{class:!0});var $=p(z);b=h($,"IFRAME",{src:!0,title:!0,width:!0,height:!0,frameborder:!0,style:!0,allowfullscreen:!0,"aria-hidden":!0,tabindex:!0}),p(b).forEach(u),$.forEach(u),this.h()},h(){b.src!==(S=t[0])&&w(b,"src",S),w(b,"title","360 тур"),w(b,"width","100%"),w(b,"height","450"),w(b,"frameborder","0"),x(b,"border","0"),b.allowFullscreen="",w(b,"aria-hidden","false"),w(b,"tabindex","0"),w(z,"class","full-container svelte-1p8x11f")},m(t,s){y(t,e,s),E(e,r),y(t,n,s),$(I,t,s),y(t,c,s),y(t,z,s),E(z,b),k=!0},p(t,[e]){(!k||1&e&&b.src!==(S=t[0]))&&w(b,"src",S)},i(t){k||(l(I.$$.fragment,t),k=!0)},o(t){i(I.$$.fragment,t),k=!1},d(t){t&&u(e),t&&u(n),f(I,t),t&&u(c),t&&u(z)}}}function Xt(t,e,r){let{src:n}=e;return t.$set=t=>{"src"in t&&r(0,n=t.src)},[n]}class Yt extends t{constructor(t){var n;super(),document.getElementById("svelte-1p8x11f-style")||((n=o("style")).id="svelte-1p8x11f-style",n.textContent="div.svelte-1p8x11f{background-color:rgba(var(--color-black), .04)\n    }",E(document.head,n)),e(this,t,Xt,Wt,r,{src:0})}}function Zt(t){let e,r,n,c,z,b,S,k;const I=new N({props:{size:"20"}});return{c(){e=o("h1"),r=g("Ми на карті"),n=m(),s(I.$$.fragment),c=m(),z=o("div"),b=o("iframe"),this.h()},l(t){e=h(t,"H1",{});var s=p(e);r=v(s,"Ми на карті"),s.forEach(u),n=d(t),a(I.$$.fragment,t),c=d(t),z=h(t,"DIV",{class:!0});var $=p(z);b=h($,"IFRAME",{src:!0,title:!0,width:!0,height:!0,frameborder:!0,style:!0,allowfullscreen:!0,"aria-hidden":!0,tabindex:!0}),p(b).forEach(u),$.forEach(u),this.h()},h(){b.src!==(S=t[0])&&w(b,"src",S),w(b,"title","Карта"),w(b,"width","100%"),w(b,"height","450"),w(b,"frameborder","0"),x(b,"border","0"),b.allowFullscreen="",w(b,"aria-hidden","false"),w(b,"tabindex","0"),w(z,"class","full-container svelte-1951pla")},m(t,s){y(t,e,s),E(e,r),y(t,n,s),$(I,t,s),y(t,c,s),y(t,z,s),E(z,b),k=!0},p(t,[e]){(!k||1&e&&b.src!==(S=t[0]))&&w(b,"src",S)},i(t){k||(l(I.$$.fragment,t),k=!0)},o(t){i(I.$$.fragment,t),k=!1},d(t){t&&u(e),t&&u(n),f(I,t),t&&u(c),t&&u(z)}}}function te(t,e,r){let{src:n}=e;return t.$set=t=>{"src"in t&&r(0,n=t.src)},[n]}class ee extends t{constructor(t){var n;super(),document.getElementById("svelte-1951pla-style")||((n=o("style")).id="svelte-1951pla-style",n.textContent="div.svelte-1951pla{background-color:rgba(var(--color-black), .04)\n    }",E(document.head,n)),e(this,t,te,Zt,r,{src:0})}}function re(t){let e,r,n,c,x,z;const b=new N({props:{size:"5"}}),S=new L({props:{items:t[0]}});return{c(){e=o("h1"),r=g("Коментарі"),n=m(),s(b.$$.fragment),c=m(),x=o("div"),s(S.$$.fragment),this.h()},l(t){e=h(t,"H1",{});var s=p(e);r=v(s,"Коментарі"),s.forEach(u),n=d(t),a(b.$$.fragment,t),c=d(t),x=h(t,"DIV",{class:!0});var $=p(x);a(S.$$.fragment,$),$.forEach(u),this.h()},h(){w(x,"class","full-container")},m(t,s){y(t,e,s),E(e,r),y(t,n,s),$(b,t,s),y(t,c,s),y(t,x,s),$(S,x,null),z=!0},p(t,[e]){const r={};1&e&&(r.items=t[0]),S.$set(r)},i(t){z||(l(b.$$.fragment,t),l(S.$$.fragment,t),z=!0)},o(t){i(b.$$.fragment,t),i(S.$$.fragment,t),z=!1},d(t){t&&u(e),t&&u(n),f(b,t),t&&u(c),t&&u(x),f(S)}}}function ne(t,e,r){let{items:n=[]}=e;return t.$set=t=>{"items"in t&&r(0,n=t.items)},[n]}class se extends t{constructor(t){super(),e(this,t,ne,re,r,{items:0})}}function ae(t){let e,r,n,c,g,v,x,z,b,S,k,I,B,D,_,C,H,A,P,V,q,O,j,T,F,R,L,G,J,K,Q,W,X,Y,Z,tt,rt,nt,st,at;const lt=new N({props:{size:"var(--header-height)"}}),it=new N({props:{size:"30"}}),ct=new et({props:{organization:t[1]}}),ot=new N({props:{size:"20"}}),mt=new $t({props:{items:t[2]}}),ht=new N({props:{size:"60"}}),pt=new ft({props:{title:t[3].title,text:t[3].text}}),dt=new N({props:{size:"10"}}),vt=new gt({props:{likes:t[5].likes,views:t[5].views}}),xt=new N({props:{size:"50"}}),yt=new ut({props:{title:"Фонди тварин",items:t[4]}}),Et=new N({props:{size:"45"}}),bt=new ut({props:{title:"Інші фонди",items:t[4]}}),St=new N({props:{size:"45"}}),It=new wt({props:{title:t[6].title,text:t[6].text}}),Bt=new N({props:{size:"10"}}),Dt=new zt({}),_t=new N({props:{size:"50"}}),Ht=new kt({}),At=new N({props:{size:"50"}}),Vt=new Nt({props:{items:t[8]}}),qt=new N({props:{size:"60"}}),Ot=new Ct({props:{items:t[9]}}),Tt=new N({props:{size:"60"}}),Ft=new Pt({props:{items:t[10]}}),Rt=new N({props:{size:"45"}}),Lt=new jt({props:{items:t[11]}}),Mt=new N({props:{size:"70"}}),Ut=new Qt({props:{items:t[7],orgName:t[0].title,avatar:t[0].avatar,avatarBig:t[0].avatarBig}}),Gt=new N({props:{size:"60"}}),Jt=new Yt({props:{src:t[12].virtual_tour}}),Kt=new N({props:{size:"60"}}),Wt=new ee({props:{src:t[12].map}}),Xt=new N({props:{size:"60"}}),Zt=new se({props:{items:t[13].comments}}),te=new N({props:{size:"40"}}),re=new M({});return{c(){e=m(),r=o("section"),s(lt.$$.fragment),n=m(),s(it.$$.fragment),c=m(),s(ct.$$.fragment),g=m(),s(ot.$$.fragment),v=m(),s(mt.$$.fragment),x=m(),s(ht.$$.fragment),z=m(),s(pt.$$.fragment),b=m(),s(dt.$$.fragment),S=m(),s(vt.$$.fragment),k=m(),s(xt.$$.fragment),I=m(),s(yt.$$.fragment),B=m(),s(Et.$$.fragment),D=m(),s(bt.$$.fragment),_=m(),s(St.$$.fragment),C=m(),s(It.$$.fragment),H=m(),s(Bt.$$.fragment),A=m(),s(Dt.$$.fragment),P=m(),s(_t.$$.fragment),V=m(),s(Ht.$$.fragment),q=m(),s(At.$$.fragment),O=m(),s(Vt.$$.fragment),j=m(),s(qt.$$.fragment),T=m(),s(Ot.$$.fragment),F=m(),s(Tt.$$.fragment),R=m(),s(Ft.$$.fragment),L=m(),s(Rt.$$.fragment),G=m(),s(Lt.$$.fragment),J=m(),s(Mt.$$.fragment),K=m(),s(Ut.$$.fragment),Q=m(),s(Gt.$$.fragment),W=m(),s(Jt.$$.fragment),X=m(),s(Kt.$$.fragment),Y=m(),s(Wt.$$.fragment),Z=m(),s(Xt.$$.fragment),tt=m(),s(Zt.$$.fragment),rt=m(),s(te.$$.fragment),nt=m(),st=o("div"),s(re.$$.fragment),this.h()},l(t){U('[data-svelte="svelte-1oiy4zf"]',document.head).forEach(u),e=d(t),r=h(t,"SECTION",{class:!0});var s=p(r);a(lt.$$.fragment,s),n=d(s),a(it.$$.fragment,s),c=d(s),a(ct.$$.fragment,s),g=d(s),a(ot.$$.fragment,s),v=d(s),a(mt.$$.fragment,s),x=d(s),a(ht.$$.fragment,s),z=d(s),a(pt.$$.fragment,s),b=d(s),a(dt.$$.fragment,s),S=d(s),a(vt.$$.fragment,s),k=d(s),a(xt.$$.fragment,s),I=d(s),a(yt.$$.fragment,s),B=d(s),a(Et.$$.fragment,s),D=d(s),a(bt.$$.fragment,s),_=d(s),a(St.$$.fragment,s),C=d(s),a(It.$$.fragment,s),H=d(s),a(Bt.$$.fragment,s),A=d(s),a(Dt.$$.fragment,s),P=d(s),a(_t.$$.fragment,s),V=d(s),a(Ht.$$.fragment,s),q=d(s),a(At.$$.fragment,s),O=d(s),a(Vt.$$.fragment,s),j=d(s),a(qt.$$.fragment,s),T=d(s),a(Ot.$$.fragment,s),F=d(s),a(Tt.$$.fragment,s),R=d(s),a(Ft.$$.fragment,s),L=d(s),a(Rt.$$.fragment,s),G=d(s),a(Lt.$$.fragment,s),J=d(s),a(Mt.$$.fragment,s),K=d(s),a(Ut.$$.fragment,s),Q=d(s),a(Gt.$$.fragment,s),W=d(s),a(Jt.$$.fragment,s),X=d(s),a(Kt.$$.fragment,s),Y=d(s),a(Wt.$$.fragment,s),Z=d(s),a(Xt.$$.fragment,s),tt=d(s),a(Zt.$$.fragment,s),rt=d(s),a(te.$$.fragment,s),nt=d(s),st=h(s,"DIV",{class:!0});var $=p(st);a(re.$$.fragment,$),$.forEach(u),s.forEach(u),this.h()},h(){document.title="Charitify - Organization page.",w(st,"class","full-container"),w(r,"class","container theme-bg-color-secondary")},m(t,s){y(t,e,s),y(t,r,s),$(lt,r,null),E(r,n),$(it,r,null),E(r,c),$(ct,r,null),E(r,g),$(ot,r,null),E(r,v),$(mt,r,null),E(r,x),$(ht,r,null),E(r,z),$(pt,r,null),E(r,b),$(dt,r,null),E(r,S),$(vt,r,null),E(r,k),$(xt,r,null),E(r,I),$(yt,r,null),E(r,B),$(Et,r,null),E(r,D),$(bt,r,null),E(r,_),$(St,r,null),E(r,C),$(It,r,null),E(r,H),$(Bt,r,null),E(r,A),$(Dt,r,null),E(r,P),$(_t,r,null),E(r,V),$(Ht,r,null),E(r,q),$(At,r,null),E(r,O),$(Vt,r,null),E(r,j),$(qt,r,null),E(r,T),$(Ot,r,null),E(r,F),$(Tt,r,null),E(r,R),$(Ft,r,null),E(r,L),$(Rt,r,null),E(r,G),$(Lt,r,null),E(r,J),$(Mt,r,null),E(r,K),$(Ut,r,null),E(r,Q),$(Gt,r,null),E(r,W),$(Jt,r,null),E(r,X),$(Kt,r,null),E(r,Y),$(Wt,r,null),E(r,Z),$(Xt,r,null),E(r,tt),$(Zt,r,null),E(r,rt),$(te,r,null),E(r,nt),E(r,st),$(re,st,null),at=!0},p(t,[e]){const r={};2&e&&(r.organization=t[1]),ct.$set(r);const n={};4&e&&(n.items=t[2]),mt.$set(n);const s={};8&e&&(s.title=t[3].title),8&e&&(s.text=t[3].text),pt.$set(s);const a={};32&e&&(a.likes=t[5].likes),32&e&&(a.views=t[5].views),vt.$set(a);const $={};16&e&&($.items=t[4]),yt.$set($);const l={};16&e&&(l.items=t[4]),bt.$set(l);const i={};64&e&&(i.title=t[6].title),64&e&&(i.text=t[6].text),It.$set(i);const f={};256&e&&(f.items=t[8]),Vt.$set(f);const c={};512&e&&(c.items=t[9]),Ot.$set(c);const o={};1024&e&&(o.items=t[10]),Ft.$set(o);const m={};2048&e&&(m.items=t[11]),Lt.$set(m);const g={};128&e&&(g.items=t[7]),1&e&&(g.orgName=t[0].title),1&e&&(g.avatar=t[0].avatar),1&e&&(g.avatarBig=t[0].avatarBig),Ut.$set(g);const h={};4096&e&&(h.src=t[12].virtual_tour),Jt.$set(h);const p={};4096&e&&(p.src=t[12].map),Wt.$set(p);const u={};8192&e&&(u.items=t[13].comments),Zt.$set(u)},i(t){at||(l(lt.$$.fragment,t),l(it.$$.fragment,t),l(ct.$$.fragment,t),l(ot.$$.fragment,t),l(mt.$$.fragment,t),l(ht.$$.fragment,t),l(pt.$$.fragment,t),l(dt.$$.fragment,t),l(vt.$$.fragment,t),l(xt.$$.fragment,t),l(yt.$$.fragment,t),l(Et.$$.fragment,t),l(bt.$$.fragment,t),l(St.$$.fragment,t),l(It.$$.fragment,t),l(Bt.$$.fragment,t),l(Dt.$$.fragment,t),l(_t.$$.fragment,t),l(Ht.$$.fragment,t),l(At.$$.fragment,t),l(Vt.$$.fragment,t),l(qt.$$.fragment,t),l(Ot.$$.fragment,t),l(Tt.$$.fragment,t),l(Ft.$$.fragment,t),l(Rt.$$.fragment,t),l(Lt.$$.fragment,t),l(Mt.$$.fragment,t),l(Ut.$$.fragment,t),l(Gt.$$.fragment,t),l(Jt.$$.fragment,t),l(Kt.$$.fragment,t),l(Wt.$$.fragment,t),l(Xt.$$.fragment,t),l(Zt.$$.fragment,t),l(te.$$.fragment,t),l(re.$$.fragment,t),at=!0)},o(t){i(lt.$$.fragment,t),i(it.$$.fragment,t),i(ct.$$.fragment,t),i(ot.$$.fragment,t),i(mt.$$.fragment,t),i(ht.$$.fragment,t),i(pt.$$.fragment,t),i(dt.$$.fragment,t),i(vt.$$.fragment,t),i(xt.$$.fragment,t),i(yt.$$.fragment,t),i(Et.$$.fragment,t),i(bt.$$.fragment,t),i(St.$$.fragment,t),i(It.$$.fragment,t),i(Bt.$$.fragment,t),i(Dt.$$.fragment,t),i(_t.$$.fragment,t),i(Ht.$$.fragment,t),i(At.$$.fragment,t),i(Vt.$$.fragment,t),i(qt.$$.fragment,t),i(Ot.$$.fragment,t),i(Tt.$$.fragment,t),i(Ft.$$.fragment,t),i(Rt.$$.fragment,t),i(Lt.$$.fragment,t),i(Mt.$$.fragment,t),i(Ut.$$.fragment,t),i(Gt.$$.fragment,t),i(Jt.$$.fragment,t),i(Kt.$$.fragment,t),i(Wt.$$.fragment,t),i(Xt.$$.fragment,t),i(Zt.$$.fragment,t),i(te.$$.fragment,t),i(re.$$.fragment,t),at=!1},d(t){t&&u(e),t&&u(r),f(lt),f(it),f(ct),f(ot),f(mt),f(ht),f(pt),f(dt),f(vt),f(xt),f(yt),f(Et),f(bt),f(St),f(It),f(Bt),f(Dt),f(_t),f(Ht),f(At),f(Vt),f(qt),f(Ot),f(Tt),f(Ft),f(Rt),f(Lt),f(Mt),f(Ut),f(Gt),f(Jt),f(Kt),f(Wt),f(Xt),f(Zt),f(te),f(re)}}}function $e(t,e,r){let n;const{page:s}=G();J(t,s,t=>r(17,n=t));n.params.id;let a,$,l,i,f,c,o,m,g,h,p,u,d,v,w={},x=[],y=[];return K(async()=>{await W(2e3),r(0,w=await X.getOrganization(1)),r(15,x=await X.getComments()),r(16,y=await X.getFunds())}),t.$$.update=()=>{1&t.$$.dirty&&r(1,a={id:w.id,name:w.title,avatar:w.avatar}),1&t.$$.dirty&&r(2,$=(w.avatars||[]).map((t,e)=>({src:t.src,srcBig:t.src2x,alt:t.title}))),1&t.$$.dirty&&r(3,l={title:w.title,text:w.subtitle}),65536&t.$$.dirty&&r(4,i=Q(()=>y.filter(t=>"animal"===t.type).reduce((t,e)=>t.concat(e,e,e),[]).map(t=>({id:t.id,src:t.avatars[0].src,type:t.type,title:t.title,total:t.need_sum,current:t.curremt_sum,currency:t.currency,city:t.location.city})))),65536&t.$$.dirty&&(f=Q(()=>y.filter(t=>"animal"===t.type).reduce((t,e)=>t.concat(e,e,e),[]).map(t=>({id:t.id,src:t.avatars[0].src,type:t.type,title:t.title,total:t.need_sum,current:t.curremt_sum,currency:t.currency,city:t.location.city})))),1&t.$$.dirty&&r(5,c={likes:w.likes,views:w.views}),1&t.$$.dirty&&r(6,o={title:w.title,text:w.description}),1&t.$$.dirty&&r(7,m=Q(()=>w.contacts.map(t=>({title:t.title,href:t.value,type:t.type})),[].true)),1&t.$$.dirty&&r(8,g=Q(()=>w.donators.map(t=>({id:t.id,src:t.avatar,title:`${t.currency} ${t.amount}`,subtitle:t.name,checked:t.checked})),[],!0)),1&t.$$.dirty&&r(9,h=Q(()=>w.news.map(t=>({id:t.id,src:t.src,likes:t.likes,title:t.title,subtitle:t.subtitle,created_at:t.created_at})),[],!0).slice(0,3)),1&t.$$.dirty&&r(10,p=Q(()=>w.documents.map(t=>({id:t.id,title:t.title,src:t.src,src2x:t.src2x})),[],!0)),1&t.$$.dirty&&r(11,u=Q(()=>w.media.map(t=>({id:t.id,alt:t.title,src:t.src,srcBig:t.src2x,description:t.description})),[],!0)),1&t.$$.dirty&&r(12,d={map:Q(()=>w.location.map),virtual_tour:Q(()=>w.location.virtual_tour)}),32768&t.$$.dirty&&r(13,v={comments:Q(()=>x.map(t=>({likes:t.likes,avatar:t["author.avatar"],author:t["author.name"],comment:t.comment,checked:t.checked,reply_to:t.reply_to,created_at:t.created_at})))})},[w,a,$,l,i,c,o,m,g,h,p,u,d,v,s]}export default class extends t{constructor(t){super(),e(this,t,$e,ae,r,{})}}
