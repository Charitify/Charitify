import{b as t,c as s,d as n,e as a,i as e,s as r,f as o,S as i,v as c,t as u,R as f,y as l,h as p,j as h,T as m,k as d,l as v,m as x,o as j,a as b,U as y,p as g}from"./index.8d6ed1b1.js";import"./_commonjsHelpers.24e35f0d.js";import{_ as H,a as T}from"./asyncToGenerator.418dd97c.js";function k(t){var s,n,a,e,r,o,i=t[0].title+"",H=t[0].html+"";return document.title=s=t[0].title,{c:function(){n=c(),a=u("h1"),e=f(i),r=c(),o=u("div"),this.h()},l:function(t){n=l(t),a=p(t,"H1",{});var s=h(a);e=m(s,i),s.forEach(d),r=l(t),o=p(t,"DIV",{class:!0}),h(o).forEach(d),this.h()},h:function(){v(o,"class","content svelte-gnxal1")},m:function(t,s){x(t,n,s),x(t,a,s),j(a,e),x(t,r,s),x(t,o,s),o.innerHTML=H},p:function(t,n){var a=b(n,1)[0];1&a&&s!==(s=t[0].title)&&(document.title=s),1&a&&i!==(i=t[0].title+"")&&y(e,i),1&a&&H!==(H=t[0].html+"")&&(o.innerHTML=H)},i:g,o:g,d:function(t){t&&d(n),t&&d(a),t&&d(r),t&&d(o)}}}function w(t){return E.apply(this,arguments)}function E(){return(E=H(T.mark(function t(s){var n,a,e;return T.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return n=s.params,s.query,t.next=3,this.fetch("blog/".concat(n.slug,".json"));case 3:return a=t.sent,t.next=6,a.json();case 6:if(e=t.sent,200!==a.status){t.next=11;break}return t.abrupt("return",{post:e});case 11:this.error(a.status,e.message);case 12:case"end":return t.stop()}},t,this)}))).apply(this,arguments)}function L(t,s,n){var a=s.post;return t.$set=function(t){"post"in t&&n(0,a=t.post)},[a]}export default(function(c){function u(t){var i;return s(this,u),i=n(this,a(u).call(this)),e(o(i),t,L,k,r,{post:0}),i}return t(u,i),u}());export{w as preload};
