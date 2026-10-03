import * as T from './vendor/three.module.min.js';
import {ATLAS,uvRect,lathe,torus,gridSurface,card,sphereUV} from './tiki-mesh-v77.js';
import {iceCubes} from './tiki-props-v77.js';
import {TIKI_DETAILS} from './tiki-plan-v77.js';
function shell(k,q){
 const width=t=>Math.pow(Math.max(.001,Math.sin(t*Math.PI)),.48)*q.w*.50;
 // Continuous outer and inner planking surfaces form an actual open dugout.
 // Both ends rise; the deck is recessed, with a solid closed keel below it.
 const ring=(u,v,inside=false)=>{const t=.002+u*.996,z=(t-.5)*q.d,w=width(t)-(inside?.060:0),a=v*Math.PI,x=Math.cos(a)*Math.max(.01,w),edge=q.top+.12*Math.pow(Math.abs(t-.5)*2,5),depth=inside?.235:.48,y=edge-Math.sin(a)*depth*Math.pow(Math.sin(t*Math.PI),.55);return[x,y,z];};
 for(const inside of[false,true]){const g=gridSurface((u,v)=>ring(u,v,inside),60,20);if(inside)g.scale(1,1,1);k.add(g,'canoe',q.x,0,q.z);}
 for(const side of[-1,1]){const points=[];for(let i=0;i<=36;i++){const t=.003+i/36*.994;points.push([q.x+side*(width(t)-.026),q.top+.12*Math.pow(Math.abs(t-.5)*2,5),q.z+(t-.5)*q.d]);}k.tube('canoe',points,.047,60);}
 k.box('canoe',q.x,.64,q.z,.74,.15,2.8,.07);for(const zz of[q.z-.98,q.z+.98]){k.box('wood',q.x,.24,zz,.64,.45,.30,.075);k.box('wood',q.x,.055,zz,.94,.10,.41,.035);k.box('canoe',q.x,.49,zz,.91,.09,.34,.03);}
}
function tray(k,x,y,z,index){const w=.73,d=.64,h=.105;
 // Bottom and four bevelled, sloping ceramic walls: no solid box over the ice.
 k.box('porcelain',x,y-.08,z,w-.02,.05,d-.02,.017);for(const side of[-1,1]){k.box('porcelain',x+side*(w/2-.022),y-.025,z,.048,h,d,.014);k.box('porcelain',x,y-.025,z+side*(d/2-.022),w-.04,h,.048,.014);}
 k.box('liquid',x,y-.028,z,w-.095,.027,d-.095,.014);
 // Crystal facets are real low-cost geometry in the shared refraction pass.
 for(let i=0;i<42;i++){const xx=x+(i%7-3)*.089+Math.sin(i*8.6)*.012,zz=z+(Math.floor(i/7)-2.5)*.084+Math.cos(i*3.2)*.012;const g=new T.IcosahedronGeometry(.042+(i%3)*.007,0);g.scale(1,.65+(i%2)*.15,.88);k.add(g,'ice',xx,y-.007+(i%3)*.009,zz,[i*.5,i*.8,i*.3]);}
 for(let i=0;i<5;i++){const a=i*2.4+index,xx=x+Math.sin(a)*.24,zz=z+Math.cos(a)*.21;k.plane('iceOrchids',xx,y+.052+(i%2)*.008,zz,.104,.104,[-Math.PI/2,0,a],ATLAS[i%2===0?2:3]);}
 // A half coconut bowl, thick brown shell and a distinct ivory inner wall.
 const lx=x+(index%2?.15:-.14),lz=z-.05;
 const outer=new T.SphereGeometry(.107,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2);uvRect(outer,ATLAS[0]);k.add(outer,'coconut',lx,y+.08,lz,[.11,0,.20]);
 const inner=new T.SphereGeometry(.095,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2);uvRect(inner,ATLAS[1]);k.add(inner,'coconut',lx,y+.082,lz,[.11,0,.20]);torus(k,'canoe',lx,y+.083,lz,.101,.006);
 const points=[[lx+.06,y+.10,lz],[lx+.17,y+.07,lz+.08],[lx+.33,y+.045,lz+.17],[lx+.49,y-.075,lz+.24]];const tube=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),18,.014,7,false);uvRect(tube,ATLAS[2]);k.add(tube,'coconut');sphereUV(k,'canoe',lx+.49,y-.075,lz+.24,.023,.023,.038);
}
function doll(k,key,x,y,z,scale=1,yaw=0){
 // Deliberately ceramic souvenirs, not duplicated live NPC heads. Each uses
 // its own generated face/torso UV with a rounded cheek and a separate hair cap.
 const temp={groups:new Map(),m:k.m,add(g,key,a=0,b=0,c=0,rot=null,scl=null){const matrix=new T.Matrix4().compose(new T.Vector3(a,b,c),new T.Quaternion().setFromEuler(new T.Euler(...(rot||[0,0,0]))),new T.Vector3(...(scl||[1,1,1])));g.applyMatrix4(matrix);g.scale(scale,scale,scale);g.rotateY(yaw);g.translate(x,y,z);return k.add(g,key);}};
 sphereUV(temp,'clay',0,.16,0,.10,.12,.075);sphereUV(temp,'clay',0,.323,0,.095,.100,.078);
 const patch=(cy,rx,ry,rz,rect,nose)=>{const g=gridSurface((u,v)=>{const xx=(u-.5)*2,yy=(v-.5)*2;const nz=Math.sqrt(Math.max(.025,1-xx*xx*.62-yy*yy*.55))*rz+nose*Math.exp(-(xx*xx*28+yy*yy*16));return[xx*rx,cy+yy*ry,nz];},22,22);uvRect(g,rect,.035);temp.add(g,key);};
 patch(.323,.081,.089,.078,[0,0,.5,1],.009);patch(.16,.093,.11,.074,[.5,0,.5,1],.005);
 const hair=new T.SphereGeometry(.097,20,9,0,Math.PI*2,0,1.13);hair.scale(1,1,.85);temp.add(hair,'coffee',0,.330,0);
 for(const side of[-1,1]){sphereUV(temp,'clay',side*.080,.055,.047,.062,.056,.092);sphereUV(temp,'clay',side*.092,.21,.009,.032,.065,.032);sphereUV(temp,'clay',side*.109,.143,.061,.028,.052,.033);sphereUV(temp,'clay',side*.085,.104,.10,.028,.025,.027);sphereUV(temp,'clay',side*.079,.025,.105,.041,.021,.053);}
 // Three-dimensional flower crown picks up pendant highlights at its silhouette.
 for(let i=0;i<7;i++){const a=(i/6-.5)*Math.PI;const xx=Math.sin(a)*.087,zz=Math.cos(a)*.068,yy=.399+Math.cos(a)*.016;const g=new T.PlaneGeometry(.060,.060);uvRect(g,ATLAS[key==='dollWhite'?2:3]);temp.add(g,'iceOrchids',xx,yy,zz,[0,a,0]);}
}
export function canoeBuffet(k){const q=TIKI_DETAILS.canoe;
 k.box('rug',q.x,.009,q.z,2.70,.018,4.7,.008);shell(k,q);
 for(const [i,z]of[-4.65,-3.82,-2.99].entries())tray(k,q.x,.995,z,i);
 // A fruit-filled raised bow follows the taper of the hull, with stems and
 // crowns separated from the photographed rind maps.
 const py=1.00;sphereUV(k,'pineapple',-.52,py+.24,-2.10,.165,.245,.16,{segments:32,rings:24,deform:(a,b,c)=>1+.018*Math.sin(Math.atan2(a,c)*14)*Math.sin(b*21)});
 card(k,'crown',-.52,py+.63,-2.10,.49,.49,.25);card(k,'crown',-.52,py+.63,-2.10,.49,.49,Math.PI/2+.25);
 sphereUV(k,'melon',.07,py+.17,-2.21,.178,.171,.173,{segments:28,rings:18,deform:(a,b,c)=>1-.024*Math.cos(Math.atan2(a,c)*10)});k.beam('canoe',[.07,py+.31,-2.21],[.092,py+.345,-2.21],.010,8);
 const papaya=(key,x,z,rot)=>{const g=new T.SphereGeometry(1,28,18),p=g.attributes.position;for(let i=0;i<p.count;i++){const yy=p.getY(i),f=.80+.18*Math.sin((yy+1)*1.6);p.setX(i,p.getX(i)*f);p.setZ(i,p.getZ(i)*f);}g.computeVertexNormals();k.add(g,key,x,py+.109,z,[.1,rot,1.30],[.105,.24,.10]);k.beam('canoe',[x+.17,py+.13,z],[x+.21,py+.13,z+.018],.009,7);};
 papaya('papayaGreen',-.28,-2.39,.30);papaya('papayaYellow',-.15,-1.91,-.65);
 doll(k,'dollWhite',-.63,1.02,-2.47,.88,.20);doll(k,'dollPink',.10,1.02,-2.55,.89,-.20);
}
