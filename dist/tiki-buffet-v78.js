import * as T from './vendor/three.module.min.js';
import {ATLAS,uvRect,lathe,torus,gridSurface,card,sphereUV} from './tiki-mesh-v77.js';
import {iceCubes} from './tiki-props-v78.js';
import {TIKI_DETAILS} from './tiki-plan-v78.js';
function shell(k,q){
 const width=t=>Math.pow(Math.max(0,Math.sin(t*Math.PI)),.34)*q.w*.50;
 // Continuous outer and inner planking surfaces form an actual open dugout.
 // Both ends rise; the deck is recessed, with a solid closed keel below it.
 const ring=(u,v,inside=false)=>{const t=u,z=(t-.5)*q.d,w=width(t)*(inside?.89:1),a=v*Math.PI,x=Math.cos(a)*w,edge=q.top+.12*Math.pow(Math.abs(t-.5)*2,5),depth=inside?.34:.48,y=edge-Math.pow(Math.sin(a),inside?.28:1)*depth*Math.pow(Math.sin(t*Math.PI),.42);return[x,y,z];};
 for(const inside of[false,true]){const g=gridSurface((u,v)=>ring(u,v,inside),60,20);if(inside)g.scale(1,1,1);k.add(g,'canoe',q.x,0,q.z);}
 for(const side of[-1,1]){const points=[];for(let i=0;i<=36;i++){const t=i/36;points.push([q.x+side*width(t)*.958,q.top+.12*Math.pow(Math.abs(t-.5)*2,5),q.z+(t-.5)*q.d]);}k.tube('canoe',points,.047,60);}
 k.box('canoe',q.x,.53,q.z,.68,.10,2.8,.045);for(const zz of[q.z-.98,q.z+.98]){k.box('wood',q.x,.24,zz,.64,.45,.30,.075);k.box('wood',q.x,.055,zz,.94,.10,.41,.035);k.box('canoe',q.x,.49,zz,.91,.09,.34,.03);}
}
function tray(k,x,y,z,index){const w=.83,d=.73,h=.115;
 // Bottom and four bevelled, sloping ceramic walls: no solid box over the ice.
 k.box('porcelain',x,y-.08,z,w-.02,.035,d-.02,.017);for(const side of[-1,1]){k.box('porcelain',x+side*(w/2-.022),y-.025,z,.048,h,d,.014);k.box('porcelain',x,y-.025,z+side*(d/2-.022),w-.04,h,.048,.014);}
 k.plane(['trayFar','trayMiddle','trayNear'][index],x,y-.043,z,w-.11,d-.11,[-Math.PI/2,0,0]);k.box('liquid',x,y-.028,z,w-.095,.027,d-.095,.014);
 // Crystal facets are real low-cost geometry in the shared refraction pass.
 for(let i=0;i<42;i++){const xx=x+(i%7-3)*.103+Math.sin(i*8.6)*.012,zz=z+(Math.floor(i/7)-2.5)*.101+Math.cos(i*3.2)*.012;const g=new T.IcosahedronGeometry(.042+(i%3)*.007,0);g.scale(1,.65+(i%2)*.15,.88);k.add(g,'ice',xx,y-.007+(i%3)*.009,zz,[i*.5,i*.8,i*.3]);}
 for(let i=0;i<5;i++){const a=i*2.4+index,xx=x+Math.sin(a)*.28,zz=z+Math.cos(a)*.25;k.plane('iceOrchids',xx,y+.052+(i%2)*.008,zz,.104,.104,[-Math.PI/2,0,a],ATLAS[i%2===0?2:3]);}
 // A half coconut bowl, thick brown shell and a distinct ivory inner wall.
 const lx=x+(index%2?.15:-.14),lz=z-.05;
 const outer=new T.SphereGeometry(.107,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2);uvRect(outer,ATLAS[0]);k.add(outer,'coconut',lx,y+.08,lz,[.62,0,.22]);
 const inner=new T.SphereGeometry(.095,24,12,0,Math.PI*2,Math.PI/2,Math.PI/2);uvRect(inner,ATLAS[1]);k.add(inner,'coconut',lx,y+.082,lz,[.62,0,.22]);torus(k,'canoe',lx,y+.083,lz,.101,.006,[Math.PI/2+.62,0,.22]);
 const points=[[lx+.06,y+.10,lz],[lx+.17,y+.07,lz+.08],[lx+.33,y+.045,lz+.17],[lx+.49,y-.075,lz+.24]];const tube=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),18,.014,7,false);uvRect(tube,ATLAS[2]);k.add(tube,'coconut');sphereUV(k,'canoe',lx+.49,y-.075,lz+.24,.023,.023,.038);
}
function doll(k,key,x,y,z,scale=1,yaw=0){
 // Deliberately ceramic souvenirs, not duplicated live NPC heads. Each uses
 // its own generated face/torso UV with a rounded cheek and a separate hair cap.
 const temp={groups:new Map(),m:k.m,add(g,key,a=0,b=0,c=0,rot=null,scl=null){const matrix=new T.Matrix4().compose(new T.Vector3(a,b,c),new T.Quaternion().setFromEuler(new T.Euler(...(rot||[0,0,0]))),new T.Vector3(...(scl||[1,1,1])));g.applyMatrix4(matrix);g.scale(scale,scale,scale);g.rotateY(yaw);g.translate(x,y,z);return k.add(g,key);}};
 sphereUV(temp,'clay',0,.16,0,.10,.12,.075);sphereUV(temp,'clay',0,.323,0,.095,.100,.078);
 const patch=(cy,rx,ry,rz,rect,nose)=>{const g=gridSurface((u,v)=>{const xx=(u-.5)*2,yy=(v-.5)*2;const nz=Math.sqrt(Math.max(.025,1-xx*xx*.62-yy*yy*.55))*rz+nose*Math.exp(-(xx*xx*28+yy*yy*16));return[xx*rx,cy+yy*ry,nz];},22,22);uvRect(g,rect,.035);temp.add(g,cy>.3?(key==='dollWhite'?'dollFaceWhite':'dollFacePink'):(key==='dollWhite'?'dollTorsoWhite':'dollTorsoPink'));};
 patch(.323,.081,.089,.078,[0,0,1,1],.009);patch(.16,.093,.11,.074,[.16,.08,.68,.82],.005);
 const hair=new T.SphereGeometry(.097,20,9,0,Math.PI*2,0,1.13);hair.scale(1,1,.85);temp.add(hair,'coffee',0,.330,0);
 for(const side of[-1,1]){sphereUV(temp,'clay',side*.080,.055,.047,.062,.056,.092);sphereUV(temp,'clay',side*.092,.21,.009,.032,.065,.032);sphereUV(temp,'clay',side*.109,.143,.061,.028,.052,.033);sphereUV(temp,'clay',side*.085,.104,.10,.028,.025,.027);sphereUV(temp,'clay',side*.079,.025,.105,.041,.021,.053);}
 // Three-dimensional flower crown picks up pendant highlights at its silhouette.
 for(let i=0;i<7;i++){const a=(i/6-.5)*Math.PI;const xx=Math.sin(a)*.087,zz=Math.cos(a)*.068,yy=.399+Math.cos(a)*.016;const g=new T.PlaneGeometry(.060,.060);uvRect(g,ATLAS[key==='dollWhite'?2:3]);temp.add(g,'iceOrchids',xx,yy,zz,[0,a,0]);}
}
export function canoeBuffet(k){const q=TIKI_DETAILS.canoe;
 k.box('rug',q.x,.009,q.z,2.70,.018,4.7,.008);shell(k,q);
 for(const [i,z]of[-4.70,-3.83,-2.96].entries())tray(k,q.x,q.trayY,z,i);
 // The near bow is an excavated fruit well. Fruits overlap by depth while their
 // support contacts remain on its floor; the two tiny souvenirs peek from behind.
 const py=.79;
 sphereUV(k,'pineapple',.10,py+.22,-2.30,.145,.215,.145,{segments:32,rings:24,deform:(a,b,c)=>1+.012*Math.sin(Math.atan2(a,c)*14)*Math.sin(b*21)});
 card(k,'crown',.10,py+.55,-2.33,.51,.47,.25);card(k,'crown',.10,py+.55,-2.33,.51,.47,Math.PI/2+.25);
 sphereUV(k,'melon',-.20,py+.157,-2.00,.196,.168,.187,{segments:32,rings:22,deform:(a,b,c)=>1-.014*Math.cos(Math.atan2(a,c)*10)});k.beam('canoe',[-.20,py+.313,-2.00],[-.188,py+.334,-2.00],.008,8);
 const papaya=(key,x,yy,z,scale,rot)=>{const g=new T.SphereGeometry(1,30,20),p=g.attributes.position;for(let i=0;i<p.count;i++){const v=p.getY(i),f=.86+.14*Math.sin((v+1)*1.6);p.setX(i,p.getX(i)*f);p.setZ(i,p.getZ(i)*f);}g.computeVertexNormals();k.add(g,key,x,yy,z,rot,scale);};
 papaya('papayaYellow',-.50,py+.095,-2.24,[.106,.221,.098],[.06,-.40,1.24]);
 papaya('papayaGreen',-.41,py+.350,-2.26,[.130,.205,.125],[.20,.15,.42]);
 doll(k,'dollWhite',-.63,py+.070,-2.42,.47,.12);doll(k,'dollPink',.25,py+.095,-2.56,.50,-.23);
 // Far-end pineapple already present in the reference is much smaller in perspective.
 sphereUV(k,'pineapple',-.25,.92,-5.04,.085,.13,.08,{segments:24,rings:16});card(k,'crown',-.25,1.20,-5.07,.28,.28,.20);card(k,'crown',-.25,1.20,-5.07,.28,.28,1.77);
}
