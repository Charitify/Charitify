import{V as t,l as n}from"./index.63075246.js";function e(t){const n=t-1;return n*n*n+1}function r(t){return--t*t*t*t*t+1}const[o,a]=function(r){var{fallback:o}=r,a=function(t,n){var e={};for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&n.indexOf(r)<0&&(e[r]=t[r]);if(null!=t&&"function"==typeof Object.getOwnPropertySymbols){var o=0;for(r=Object.getOwnPropertySymbols(t);o<r.length;o++)n.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(t,r[o])&&(e[r[o]]=t[r[o]])}return e}(r,["fallback"]);const s=new Map,i=new Map;function c(r,s,i){return(c,l)=>(r.set(l.key,{rect:c.getBoundingClientRect()}),()=>{if(s.has(l.key)){const{rect:r}=s.get(l.key);return s.delete(l.key),function(r,o,s){const{delay:i=0,duration:c=(t=>30*Math.sqrt(t)),easing:l=e}=n(n({},a),s),f=o.getBoundingClientRect(),u=r.left-f.left,p=r.top-f.top,y=r.width/f.width,d=r.height/f.height,g=Math.sqrt(u*u+p*p),m=getComputedStyle(o),h="none"===m.transform?"":m.transform,b=+m.opacity;return{delay:i,duration:t(c)?c(g):c,easing:l,css:(t,n)=>`\n\t\t\t\topacity: ${t*b};\n\t\t\t\ttransform-origin: top left;\n\t\t\t\ttransform: ${h} translate(${n*u}px,${n*p}px) scale(${t+(1-t)*y}, ${t+(1-t)*d});\n\t\t\t`}}(r,c,l)}return r.delete(l.key),o&&o(c,l,i)})}return[c(i,s,!1),c(s,i,!0)]}({duration:t=>Math.sqrt(300*t),fallback(t,n){const e=getComputedStyle(t),o="none"===e.transform?"":e.transform;return{duration:600,easing:r,css:t=>`\n                transform: ${o} scale(${t});\n                opacity: ${t}\n            `}}});export{a as r,o as s};
