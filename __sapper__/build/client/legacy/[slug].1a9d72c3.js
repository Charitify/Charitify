import{a as t,b as s,c as n,d as a,i as e,s as r,e as o,S as i,t as c,f as u,D as f,v as l,h as p,j as h,E as m,k as d,l as v,o as x,p as j,x as b,F as g,n as y}from"./index.83e6dc7c.js";import"./_commonjsHelpers.24e35f0d.js";import{_ as H,a as k}from"./asyncToGenerator.a45dcf86.js";function E(t){var s,n,a,e,r,o,i=t[0].title+"",H=t[0].html+"";return document.title=s=t[0].title,{c:function(){n=c(),a=u("h1"),e=f(i),r=c(),o=u("div"),this.h()},l:function(t){n=l(t),a=p(t,"H1",{});var s=h(a);e=m(s,i),s.forEach(d),r=l(t),o=p(t,"DIV",{class:!0}),h(o).forEach(d),this.h()},h:function(){v(o,"class","content svelte-gnxal1")},m:function(t,s){x(t,n,s),x(t,a,s),j(a,e),x(t,r,s),x(t,o,s),o.innerHTML=H},p:function(t,n){var a=b(n,1)[0];1&a&&s!==(s=t[0].title)&&(document.title=s),1&a&&i!==(i=t[0].title+"")&&g(e,i),1&a&&H!==(H=t[0].html+"")&&(o.innerHTML=H)},i:y,o:y,d:function(t){t&&d(n),t&&d(a),t&&d(r),t&&d(o)}}}function T(t){return w.apply(this,arguments)}function w(){return(w=H(k.mark(function t(s){var n,a,e;return k.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return n=s.params,s.query,t.next=3,this.fetch("blog/".concat(n.slug,".json"));case 3:return a=t.sent,t.next=6,a.json();case 6:if(e=t.sent,200!==a.status){t.next=11;break}return t.abrupt("return",{post:e});case 11:this.error(a.status,e.message);case 12:case"end":return t.stop()}},t,this)}))).apply(this,arguments)}function D(t,s,n){var a=s.post;return t.$set=function(t){"post"in t&&n(0,a=t.post)},[a]}export default(function(c){function u(t){var i;return s(this,u),i=n(this,a(u).call(this)),e(o(i),t,D,E,r,{post:0}),i}return t(u,i),u}());export{T as preload};
