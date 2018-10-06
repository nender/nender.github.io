!function(e){var t={};function n(i){if(t[i])return t[i].exports;var s=t[i]={i:i,l:!1,exports:{}};return e[i].call(s.exports,s,s.exports,n),s.l=!0,s.exports}n.m=e,n.c=t,n.d=function(e,t,i){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)n.d(i,s,function(t){return e[t]}.bind(null,s));return i},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=1)}([function(e,t,n){e.exports=function(){return new Worker(n.p+"d9221b33131a74572243.worker.js")}},function(e,t,n){"use strict";n.r(t);var i=n(0),s=n.n(i);function o(e){0}n.d(t,"Hub",function(){return v});let r={trafficWeight:"linear",distanceWeight:"square",nodeCount:80,packetSpawnChance:1/60,addRemoveNodes:!0,addRemoveChance:45,packetOfDeath:!0},a=new Map,l=0,h=null,d=0,f=new Set,c=new class{constructor(e){e&&(this.state=e)}random(){return this.state?(this.state=(9301*this.state+49297)%233280,0+this.state/233281*1):Math.random()}},u=function(){let e=0;return function(){return e+=1}}();function g(e){let t=null,n=0;for(let i of e)c.random()<1/++n&&(t=i);return t}function p(e){let t;do{t=g(e.values())}while(t.isDead||!a.has(t.id));return t}let w=[];class m{static makePacket(e,t=!1){if(0!=w.length){let t=w.pop();return t.target=e,t.speed=this.newSpeed(),t.TAToB=null,t.TProgress=null,t}return new m(e,t)}constructor(e,t=!1){this.id=u(),this.target=e,this.isPOD=t,this.speed=m.newSpeed(),this.TAToB=null,this.TProgress=null}static newSpeed(){return 1.5*c.random()+.5}}class M{constructor(e,t){this.ends=[e,t],this._weight=1,this.inflight=new Set;let n=Math.abs(e.position[0]-t.position[0]),i=Math.abs(e.position[1]-t.position[1]);this._length=this.weightLength(Math.pow(n,2)+Math.pow(i,2),r.distanceWeight)}weightLength(e,t){switch(t){case"linear":return Math.sqrt(e);case"sqrt":return 5*Math.pow(e,.25);case"square":return e/25;case"exp":return Math.min(1e6,Math.exp(Math.sqrt(e)/10)/3);case"log":return Math.max(1,25*(Math.log(e)/2+1));default:throw Error("Invalid mode")}}incrementWeight(){this.ends[0].isDead||this.ends[1].isDead||(this._weight+=1)}decrementWeight(){this._weight=.99*(this._weight-1)+1}traffic(){return function(e,t){switch(t){case"none":return 1;case"linear":return e;case"sqrt":return Math.sqrt(e);case"square":return Math.pow(e,2);case"exp":return Math.min(1e6,Math.exp(e/3));case"log":return Math.log(e)+1;case"bell":let n=e/3-2;return Math.max(.01,25*Math.exp(n-Math.pow(n,2)/2));default:throw Error("Invalid mode")}}(this._weight,r.trafficWeight)}distance(){return this._length}cost(){return this.ends[0].isDead||this.ends[1].isDead?Number.MAX_VALUE:this.distance()/this.traffic()}receive(e,t){if(t!==this.ends[0]&&t!==this.ends[1])throw"Requested destination not available";e.TAToB=t===this.ends[1],e.TProgress=0,this.inflight.add(e),this.incrementWeight()}step(){const e=new Set;for(let t of this.inflight){const n=t.TProgress+t.speed*this.traffic()/this.distance();n<1?t.TProgress=n:e.add(t)}for(let t of e)this.inflight.delete(t),t.TAToB?this.ends[1].receive(t):this.ends[0].receive(t);this.decrementWeight()}}class v{constructor(e,t){this.position=[e,t],this.id=u(),this.neighbors=new Map,this.isDead=!1}receive(e){if(e.isPOD){if(!this.isDead){this.isDead=!0,o(this.id);let e=p(h[0]);for(let t of f)t.target==this&&(t.target=e)}e.target===this&&(e.target=p(h[0]),o((this.id,e.target.id)))}else if(e.target===this)return o((this.id,e.id)),f.delete(e),void w.push(e);if(0===this.neighbors.size)throw"No links";const t=a.get(e.target.id).get(this.id),n=h[0].get(t);this.neighbors.get(n).receive(e,n),o((this.id,e.id,n.id))}}function b(e,t,n,i){function s(e,n){if(e.neighbors.has(n))return;const i=new M(e,n);t.push(i),e.neighbors.set(n,i),n.neighbors.set(e,i)}let r=Math.floor(c.random()*n),a=Math.floor(c.random()*i),l=new v(r,a);for(let t of e.values())s(t,l),s(l,t);e.set(l.id,l),o(l.id)}let S=function(){const e=new Map;return function(t){if(e.has(t))return e.get(t);{const n=`hsl(${function(e,t){return Math.ceil(e),Math.floor(t),Math.floor(c.random()*(t-e))+e}(0,360)},100%,50%)`;return e.set(t,n),n}}}();function T(e,t,n,i){e.fillStyle="black",e.fillRect(0,0,i,n);const[s,o]=t;for(let t of o){let n=Math.min(6,(t.traffic()-1)/24),i=t.ends[0].position,s=t.ends[1].position;if(n>=1/255){t.ends[0].isDead||t.ends[1].isDead?e.strokeStyle="red":e.strokeStyle="white",e.lineWidth=n;let[o,r]=i,[a,l]=s;e.beginPath(),e.moveTo(o,r),e.lineTo(a,l),e.stroke()}for(let n of t.inflight.keys()){function r(t,i){let[s,o]=t,r=(i[0]-t[0])*n.TProgress,a=(i[1]-t[1])*n.TProgress;if(n.isPOD){const t=12/2;e.fillStyle="red",e.beginPath(),e.moveTo(s+r,o+a-t),e.lineTo(s+r+t,o+a+t),e.lineTo(s+r-t,o+a+t),e.fill()}else{const t=4,i=t/2;e.fillStyle=S(n.target.id),e.fillRect(s+r-i,o+a-i,t,t)}}const t=n.TAToB;n.TProgress;t?r(i,s):r(s,i)}}for(let t of s.values()){t.isDead?e.fillStyle="red":e.fillStyle="white";let[n,i]=t.position;e.fillRect(n-3.5,i-3.5,7,7)}e.fillStyle="white",e.fillText(Math.round(1e3/d).toString(),0,8)}!function(){let e=new URLSearchParams(document.location.search);for(let t in r)if(e.has(t))try{r[t]=JSON.parse(e.get(t))}catch(n){r[t]=e.get(t)}else-1!==["nodeCount","addRemoveNodes","packetOfDeath"].indexOf(t)&&e.set(t,r[t].toString());history.replaceState(0,document.title,"?"+e.toString());const t=window.innerHeight,n=window.innerWidth,i=document.getElementById("canvas");i.height=t,i.width=n;const u=i.getContext("2d");u.font="8px monospace",h=function(e,t,n){const i=new Map,s=[];for(let o=0;o<e;o++)b(i,s,t,n);return[i,s]}(r.nodeCount,n,t);const[w,M]=h;let v=null,S=new Set,y=new Map,P=!1,k=!1,x=performance.now();function D(){0==l&&r.packetOfDeath&&(v=m.makePacket(g(w.values()),!0),f.add(v),g(w.values()).receive(v));let e=[];for(let[t,n]of y){k&&(n>0?y.set(t,n-1):S.add(t));let i=!0;for(let[,e]of t.neighbors)if(e.inflight.size>0){i=!1;break}if(i&&S.has(t)){let n=w.get(t.id);e.push(t);for(let[e,t]of n.neighbors){n.neighbors.delete(e),e.neighbors.delete(n);let i=M.indexOf(t);M.splice(i,1)}}}for(let t of e)o(t.id),y.delete(t),w.delete(t.id),S.delete(t);for(let e of M)e.step();for(let e of w.values())if(e.isDead)y.has(e)||y.set(e,2);else if(a.has(e.id)&&c.random()<r.packetSpawnChance){let t=p(w),n=m.makePacket(t);f.add(n),e.receive(n)}if(r.addRemoveNodes){if(v)v.speed=Math.pow((w.size-y.size)/r.nodeCount,2);else{let e=w.size-r.nodeCount+y.size,t=0;if(t=e<=0?1:(r.nodeCount-e)/r.nodeCount,t=Math.max(t,0),0==Math.floor(c.random()*t*r.addRemoveChance)&&w.size>3){p(w).isDead=!0;let e=p(h[0]);for(let t of f)t.target==this&&(t.target=e)}}let e=r.nodeCount-w.size-y.size,i=0;i=e<=0?1:r.nodeCount-e/r.nodeCount,i=Math.max(i,0),0==Math.floor(c.random()*i*r.addRemoveChance)&&b(w,M,n,t)}k&&(C.postMessage([w,null]),k=!1),T(u,h,t,n),window.requestAnimationFrame(D),l+=1;let i=performance.now();d=(19*d+(i-x))/20,x=i}T(u,h,t,n);let C=new s.a;C.onmessage=function(e){a=e.data,k=!0,o(),P||(P=!0,D())},C.postMessage([w,r])}()}]);