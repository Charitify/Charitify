import{_ as a,a as n,b as s,c as t,i as e,s as r,d as i,S as c,X as o,F as f,f as l,g as u,h as v,t as m,q as $,j as h,k as g,l as d,m as w,n as p,o as b,p as z,Y as E,r as j,v as x,u as B,w as I,y as R,Z as A,x as L,z as V,$ as y}from"./client.d3fb5d2d.js";import"./index.bf96116c.js";import D from"./index.ce391868.js";import k from"./index.3a876b6c.js";function q(a){var n,s=new D({});return{c:function(){v(s.$$.fragment)},l:function(a){p(s.$$.fragment,a)},m:function(a,t){B(s,a,t),n=!0},i:function(a){n||(L(s.$$.fragment,a),n=!0)},o:function(a){R(s.$$.fragment,a),n=!1},d:function(a){V(s,a)}}}function C(a){var n,s=new k({});return{c:function(){v(s.$$.fragment)},l:function(a){p(s.$$.fragment,a)},m:function(a,t){B(s,a,t),n=!0},i:function(a){n||(L(s.$$.fragment,a),n=!0)},o:function(a){R(s.$$.fragment,a),n=!1},d:function(a){V(s,a)}}}function F(a){var n,s,t,e,r,i,c,D,k,F,N,S,U,X,Y,Z,_,G,H,J,K,M,O,P,Q,T,W=new o({}),aa=[C,q],na=[];function sa(a,n){return"organizations"===a[0]?0:1}H=sa(a),J=na[H]=aa[H](a);var ta=new f({});return{c:function(){n=l(),s=u("div"),t=u("br"),e=l(),v(W.$$.fragment),r=l(),i=u("nav"),c=u("ul"),D=u("li"),k=u("a"),F=m("charities"),N=l(),S=u("li"),U=u("a"),X=m("organizations"),Y=l(),Z=u("div"),_=u("br"),G=l(),J.c(),K=l(),M=u("br"),O=l(),P=u("br"),Q=l(),v(ta.$$.fragment),this.h()},l:function(a){$('[data-svelte="svelte-1sjtmin"]',document.head).forEach(h),n=g(a),s=d(a,"DIV",{class:!0});var o=w(s);t=d(o,"BR",{}),e=g(o),p(W.$$.fragment,o),r=g(o),i=d(o,"NAV",{class:!0});var f=w(i);c=d(f,"UL",{class:!0});var l=w(c);D=d(l,"LI",{class:!0});var u=w(D);k=d(u,"A",{rel:!0,href:!0,class:!0});var v=w(k);F=b(v,"charities"),v.forEach(h),u.forEach(h),N=g(l),S=d(l,"LI",{class:!0});var m=w(S);U=d(m,"A",{rel:!0,href:!0,class:!0});var z=w(U);X=b(z,"organizations"),z.forEach(h),m.forEach(h),l.forEach(h),f.forEach(h),o.forEach(h),Y=g(a),Z=d(a,"DIV",{class:!0});var E=w(Z);_=d(E,"BR",{}),G=g(E),J.l(E),K=g(E),M=d(E,"BR",{}),O=g(E),P=d(E,"BR",{}),E.forEach(h),Q=g(a),p(ta.$$.fragment,a),this.h()},h:function(){document.title="Charitify - is the application for helping those in need.",z(k,"rel","prefetch"),z(k,"href","lists"),z(k,"class","svelte-1vo7cwi"),E(k,"selected","organizations"!==a[0]),z(D,"class","svelte-1vo7cwi"),z(U,"rel","prefetch"),z(U,"href","lists/organizations"),z(U,"class","svelte-1vo7cwi"),E(U,"selected","organizations"===a[0]),z(S,"class","svelte-1vo7cwi"),z(c,"class","svelte-1vo7cwi"),z(i,"class","svelte-1vo7cwi"),z(s,"class","search theme-bg container svelte-1vo7cwi"),z(Z,"class","list-wrap svelte-1vo7cwi")},m:function(a,o){j(a,n,o),j(a,s,o),x(s,t),x(s,e),B(W,s,null),x(s,r),x(s,i),x(i,c),x(c,D),x(D,k),x(k,F),x(c,N),x(c,S),x(S,U),x(U,X),j(a,Y,o),j(a,Z,o),x(Z,_),x(Z,G),na[H].m(Z,null),x(Z,K),x(Z,M),x(Z,O),x(Z,P),j(a,Q,o),B(ta,a,o),T=!0},p:function(a,n){var s=I(n,1)[0];1&s&&E(k,"selected","organizations"!==a[0]),1&s&&E(U,"selected","organizations"===a[0]);var t=H;(H=sa(a))!==t&&(y(),R(na[t],1,1,(function(){na[t]=null})),A(),(J=na[H])||(J=na[H]=aa[H](a)).c(),L(J,1),J.m(Z,K))},i:function(a){T||(L(W.$$.fragment,a),L(J),L(ta.$$.fragment,a),T=!0)},o:function(a){R(W.$$.fragment,a),R(J),R(ta.$$.fragment,a),T=!1},d:function(a){a&&h(n),a&&h(s),V(W),a&&h(Y),a&&h(Z),na[H].d(),a&&h(Q),V(ta,a)}}}function N(a,n,s){var t=n.segment;return a.$set=function(a){"segment"in a&&s(0,t=a.segment)},[t]}var S=function(o){function f(a){var c;return n(this,f),c=s(this,t(f).call(this)),e(i(c),a,N,F,r,{segment:0}),c}return a(f,c),f}();export default S;