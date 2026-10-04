import * as T from './vendor/three.module.min.js';
import {TikiKit,tikiIdol} from './tiki-geometry-v76.js';
import {gridSurface,card} from './tiki-mesh-v77.js';
// All positions are metres in the garden; plants are rooted in these actual beds.
export const GARDEN_DECOR85={table:{x:6.45,z:4.35},machine:{x:7.48,z:-7.20,ry:-Math.PI/2},footbath:{x:-4.85,z:.73,ry:Math.PI/2},botanist:{x:6.75,z:-2.80,ry:Math.PI/2}};
const plants=['banana','croton','philodendron','cordyline','pineapple','fern'];
function plant(k,key,x,z,w,h,base=0,yaw=0){for(let j=0;j<3;j++)card(k,key,x,base+h*.48,z,w,h,yaw+j*Math.PI/3,[0,0,1,1],w*.028);}
function framePanel(k,key,x,z,w,h,ry){const p=new T.Group(),local=new TikiKit(k.m);local.box('dark',0,h*.5+.40,-.07,w+.17,h+.16,.20,.028);local.plane(key,0,h*.5+.40,.038,w,h);for(const s of[-1,1]){local.cyl('wood',s*(w*.5+.04),h*.5+.40,0,.040,.046,h+.18,10);local.beam('wood',[-w*.5,s<0?.34:h+.45,.055],[w*.5,s<0?.34:h+.45,.055],.047,10);}p.add(local.finish('Bamboo framed complete rainforest panel'));p.position.set(x,0,z);p.rotation.y=ry;p.updateMatrixWorld(true);p.traverse(o=>{if(o.isMesh){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);k.add(g,Object.entries(k.m).find(([,m])=>m===o.material)[0]);o.geometry.dispose();}});}
function decorativeDoor(k,x,z,w,ry,double){const q=new TikiKit(k.m),h=2.46;q.box('dark',0,h*.5,-.02,w+.22,h+.16,.12,.025);q.box('door',0,h*.5,.042,w,h,.09,.022);for(const s of[-1,1])q.box('wood',s*(w/2+.052),h/2,.074,.085,h+.15,.15,.018);q.box('wood',0,h+.048,.074,w+.20,.095,.15,.018);
 const leaves=double?2:1,lw=w/leaves;for(let l=0;l<leaves;l++){const cx=-w/2+lw*(l+.5);q.box('frosted',cx,1.56,.104,lw-.18,1.51,.018,.005);for(let i=1;i<4;i++)q.box('wood',cx,.815+i*.377,.125,lw-.15,.025,.028,.004);for(let i=1;i<3;i++)q.box('wood',cx-lw*.5+.09+i*(lw-.18)/3,1.56,.125,.023,1.53,.028,.004);q.box('wood',cx,.43,.115,lw-.15,.48,.04,.010);q.tube('brass',[[cx+(double?(l===0?.27:-.27):.27),.96,.15],[cx+(double?(l===0?.27:-.27):.27),1.00,.20],[cx+(double?(l===0?.27:-.27):.27),1.19,.20]],.012,12);}
 const o=q.finish(double?'Decorative frosted double door':'Decorative single service door');o.position.set(x,0,z);o.rotation.y=ry;o.updateMatrixWorld(true);o.traverse(p=>{if(p.isMesh){k.add(p.geometry.clone().applyMatrix4(p.matrixWorld),Object.entries(k.m).find(([,m])=>m===p.material)[0]);p.geometry.dispose();}});}
export function gardenDressing85(k){
 framePanel(k,'rainforest1',-8.09,-4.50,8.85,2.95,Math.PI/2);framePanel(k,'rainforest2',8.09,-1.25,8.70,2.90,-Math.PI/2);
 framePanel(k,'rainforest3',-3.93,-9.72,7.65,2.55,0);framePanel(k,'rainforest4',4.09,-9.72,7.45,2.48,0);
 // Recessed masonry remains behind the projected scenic lightboxes. Pilasters,
 // low mineral coping and concrete cornice give the tall shell a credible scale.
 for(const x of[-8.30,8.30]){for(const z of[-9.25,-.10,7.25])k.box('rim',x,3.45,z,.18,6.90,.40,.045);k.box('rim',x,3.83,-.9,.12,.14,18.1,.024);k.box('rim',x,6.78,-.9,.20,.18,18.1,.035);}
 for(const z of[-9.91,8.11])k.box('rim',0,6.78,z,16.8,.18,.20,.035);
 for(const side of[-1,1]){
  const x=side*7.65;k.box('wall',x,.14,-1.8,.95,.28,11.0,.10);k.box('dark',x,.279,-1.8,.82,.022,10.85,.035);
  for(let i=0;i<8;i++){const z=-6.55+i*1.37;if(side>0&&z< -5.75)continue;const key=plants[(i+(side>0?2:0))%plants.length],h=[2.28,1.15,1.68,1.42,1.0,1.28][(i+(side>0?2:0))%6];plant(k,key,x+(i%2?-.12:.08),z,h*.88,h,.28,i*.61);}
 }
 for(let i=0;i<9;i++){const x=-7.0+i*1.69,z=-9.12;plant(k,plants[(i+3)%6],x,z,1.45,1.10+(i%3)*.46,.06,i*.48);}
 // Organic stone seat under the resting visitor; top is physically horizontal.
 k.box('boulder',-4.93,.035,.73,.71,.31,.82,.13);k.box('boulder',-4.97,.19,.73,.64,.10,.67,.065);
 // Porch roof: five staggered thatch layers, actual frayed edge, bamboo supports.
 for(const s of[-1,1]){k.cyl('wood',s*.91,1.38,7.88,.055,.070,2.76,12);for(let j=0;j<11;j++)k.cyl('wood',s*(1.64+j*.045),1.33,8.03,.024,.028,2.65,8);k.beam('wood',[s*.89,2.74,7.88],[s*1.72,2.90,6.79],.075,10);}
 k.beam('wood',[-1.94,2.96,6.75],[1.94,2.96,6.75],.08,12);
 for(let layer=0;layer<5;layer++){const g=gridSurface((u,v)=>[(u-.5)*4.08,3.66-v*.61-layer*.033+Math.sin(u*24)*.012,8.15-v*1.53],48,12);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*3.8,1-uv.getY(i)*.95);k.add(g,'thatch');}
 k.plane('thatch',0,2.86,6.58,4.13,.42,[0,Math.PI,0],[0,0,3.8,1],40);
 for(const s of[-1,1]){const sculpture=new TikiKit(k.m);tikiIdol(sculpture,0,0,.93);const o=sculpture.finish('Porch carved guardian');o.position.set(s*1.29,0,7.38);o.rotation.y=Math.PI;o.updateMatrixWorld(true);o.traverse(p=>{if(p.isMesh){k.add(p.geometry.clone().applyMatrix4(p.matrixWorld),Object.entries(k.m).find(([,m])=>m===p.material)[0]);p.geometry.dispose();}});
  k.cyl('wall',s*2.60,.23,6.96,.42,.31,.46,16);k.cyl('dark',s*2.6,.46,6.96,.37,.37,.025,16);plant(k,s<0?'banana':'cordyline',s*2.60,6.96,1.69,s<0?2.1:1.65,.46,.3);plant(k,s<0?'croton':'philodendron',s*3.9,7.44,1.6,1.35,0,1.2);plant(k,'pineapple',s*2.94,5.99,1.20,1.02,0,.6);}
 decorativeDoor(k,-6.91,8.09,1.83,Math.PI,true);decorativeDoor(k,5.75,8.09,.95,Math.PI,false);
}
