import{a as t,b as n,c as s,d as r,i as o,s as a,e,S as f,j as c,X as i,k as u,l,Y as h,m as p,n as v,o as g,E as m,Z as d,J as E,L as b,p as j,F as x,W as L}from"./index.1c77a40f.js";function R(t,n,s){var r=t.slice();return r[1]=n[s],r}function k(t){var n,s,r,o,a=t[1].title+"";return{c:function(){n=c("li"),s=c("a"),r=i(a),this.h()},l:function(t){n=u(t,"LI",{});var o=l(n);s=u(o,"A",{rel:!0,href:!0});var e=l(s);r=h(e,a),e.forEach(p),o.forEach(p),this.h()},h:function(){v(s,"rel","prefetch"),v(s,"href",o="blog/"+t[1].slug)},m:function(t,o){g(t,n,o),m(n,s),m(s,r)},p:function(t,n){1&n&&a!==(a=t[1].title+"")&&d(r,a),1&n&&o!==(o="blog/"+t[1].slug)&&v(s,"href",o)},d:function(t){t&&p(n)}}}function q(t){for(var n,s,r,o,a,e=t[0],f=[],d=0;d<e.length;d+=1)f[d]=k(R(t,e,d));return{c:function(){n=E(),s=c("h1"),r=i("Recent posts"),o=E(),a=c("ul");for(var t=0;t<f.length;t+=1)f[t].c();this.h()},l:function(t){n=b(t),s=u(t,"H1",{});var e=l(s);r=h(e,"Recent posts"),e.forEach(p),o=b(t),a=u(t,"UL",{class:!0});for(var c=l(a),i=0;i<f.length;i+=1)f[i].l(c);c.forEach(p),this.h()},h:function(){document.title="Blog",v(a,"class","svelte-1frg2tf")},m:function(t,e){g(t,n,e),g(t,s,e),m(s,r),g(t,o,e),g(t,a,e);for(var c=0;c<f.length;c+=1)f[c].m(a,null)},p:function(t,n){var s=j(n,1)[0];if(1&s){var r;for(e=t[0],r=0;r<e.length;r+=1){var o=R(t,e,r);f[r]?f[r].p(o,s):(f[r]=k(o),f[r].c(),f[r].m(a,null))}for(;r<f.length;r+=1)f[r].d(1);f.length=e.length}},i:x,o:x,d:function(t){t&&p(n),t&&p(s),t&&p(o),t&&p(a),L(f,t)}}}function y(t){t.params,t.query;return this.fetch("blog.json").then((function(t){return t.json()})).then((function(t){return{posts:t}}))}function A(t,n,s){var r=n.posts;return t.$set=function(t){"posts"in t&&s(0,r=t.posts)},[r]}var B=function(c){function i(t){var f;return n(this,i),f=s(this,r(i).call(this)),o(e(f),t,A,q,a,{posts:0}),f}return t(i,f),i}();export default B;export{y as preload};
