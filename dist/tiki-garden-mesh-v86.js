import * as T from './vendor/three.module.min.js';
import {gardenDressing85} from './tiki-garden-dressing-v86.js';
import {TikiKit} from './tiki-geometry-v76.js';
import {bevelBox,worldUV} from './bath-v61-materials.js';
import {gridSurface,card} from './tiki-mesh-v77.js';
import {GARDEN81,POOL_POLYGON81,poolEdge81,poolDistance81} from './tiki-garden-plan-v86.js';
const TAU=Math.PI*2;
const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
export const GARDEN_FIXTURES81=[[-6.20,4.62,0],[-1.96,6.45,1],[5.36,5.23,0],[4.13,-3.41,1],[-6.19,-6.98,1],[.48,-8.20,0],[7.18,-7.60,1]];
function polygonGeometry(points,y){const shape=new T.Shape(points.map(([x,z])=>new T.Vector2(x,-z))),g=new T.ShapeGeometry(shape,8);g.rotateX(-Math.PI/2);g.translate(0,y,0);return worldUV(g,1);}
function rockGeometry(w,h,d,seed,small=false){const g=new T.SphereGeometry(1,small?8:26,small?5:16),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const broad=.065*Math.sin(x*5.1+y*3.7+seed)+.054*Math.cos(z*5.7-y*4.8+seed*.8),grain=.014*Math.sin(x*24+y*17+z*27+seed*3);
  const f=1+broad+grain;
  // Broad fracture planes form asymmetric granite blocks, with softened
  // transitions and small-scale relief retained by the scanned-looking maps.
  const cut=Math.min(1.,(.75+.08*rand(seed))/(Math.abs(x*.71+z*.59-y*.35)+.10),(.81+.06*rand(seed+8))/(Math.abs(-x*.27+z*.47+y*.83)+.06));
  const bx=Math.sign(x)*Math.pow(Math.abs(x),small?1:.79),by=Math.sign(y)*Math.pow(Math.abs(y),small?1:.86),bz=Math.sign(z)*Math.pow(Math.abs(z),small?1:.81);
  p.setXYZ(i,bx*w*.5*f*cut,Math.max(-h*.48,by*h*.5*f*cut),bz*d*.5*f*cut);
 }g.computeVertexNormals();return g;
}
function rock(k,x,y,z,w,h,d,seed,key='boulder',yaw=0){k.add(rockGeometry(w,h,d,seed,key==='pebble'),key,x,y,z,[0,yaw,0]);}
function subdivideGround(input,maxEdge){const g=input.index?input.toNonIndexed():input,p=g.attributes.position,vertices=[],stack=[];for(let i=0;i<p.count;i+=3)stack.push([[p.getX(i),p.getY(i),p.getZ(i)],[p.getX(i+1),p.getY(i+1),p.getZ(i+1)],[p.getX(i+2),p.getY(i+2),p.getZ(i+2)]]);const limit=maxEdge*maxEdge;
 while(stack.length){const t=stack.pop(),d=[0,1,2].map(i=>t[i].reduce((sum,v,j)=>sum+(v-t[(i+1)%3][j])**2,0)),edge=d.indexOf(Math.max(...d));if(d[edge]<=limit){vertices.push(...t.flat());continue;}const a=t[edge],b=t[(edge+1)%3],c=t[(edge+2)%3],m=a.map((v,j)=>(v+b[j])*.5);stack.push([a,m,c],[m,b,c]);}
 g.dispose();if(g!==input)input.dispose();const out=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3));out.computeVertexNormals();return out;
}
function architecture(k){const b=GARDEN81.bounds,W=b.maxX-b.minX,D=b.maxZ-b.minZ,H=GARDEN81.ceiling;
 // One perforated ground owns gravel, while the welcome path owns the
 // complementary notch and vestibule. No overlapping floor decals or voids.
 const contour=[[-8.4,-10],[8.4,-10],[8.4,8.2],[1.35,8.2],[2.11,7.13],[2.38,5.98],[-2.17,5.80],[-1.97,7.22],[-1.35,8.2],[-8.4,8.2]];
 const surface=new T.Shape(contour.map(([x,z])=>new T.Vector2(x,-z)));
 surface.holes.push(new T.Path(POOL_POLYGON81.map(([x,z])=>new T.Vector2(x,-z))));
 surface.holes.push(new T.Path(Array.from({length:80},(_,i)=>{const a=i/80*TAU;return new T.Vector2(GARDEN81.fountain.x+Math.cos(a)*GARDEN81.fountain.r,-GARDEN81.fountain.z-Math.sin(a)*GARDEN81.fountain.r);}))); 
 const ground=new T.ShapeGeometry(surface,8);ground.rotateX(-Math.PI/2);k.add(worldUV(subdivideGround(ground,.37),1.28),'gravel');
 const path=new T.Shape([[-2.17,5.80],[-1.97,7.22],[-1.35,8.20],[-1.35,11.48],[1.35,11.48],[1.35,8.20],[2.11,7.13],[2.38,5.98]].map(([x,z])=>new T.Vector2(x,-z)));
 const pg=new T.ShapeGeometry(path,8);pg.rotateX(-Math.PI/2);k.add(worldUV(subdivideGround(pg,.19),2.4),'stonePath');
 // Staggered mineral-fiber panels: actual recessed seams, thin T-grid flanges,
 // aligned diffuser slots and small cut openings around the artificial trunks.
 const px=1.22,pz=.61,startX=-8.54,startZ=-10.37;
 const lightCells=new Set();for(const f of GARDEN_FIXTURES81){const i=Math.round((f[0]-startX)/px-.5),j=Math.round((f[1]-startZ)/pz-.5);lightCells.add(`${i},${j}`);f[0]=startX+(i+.5)*px;f[1]=startZ+(j+.5)*pz;}
 // Cream T rails share the tile value; black gaps never outline the whole room.
 const backing=new T.PlaneGeometry(W+.35,D+.35);backing.rotateX(Math.PI/2);backing.translate(0,H+.019,-.9);k.add(backing,'ceilingTrim');
 for(let j=0;j<31;j++)for(let i=0;i<14;i++){const x=startX+(i+.5)*px,z=startZ+(j+.5)*pz;
  if(lightCells.has(`${i},${j}`))continue;
  const tile=new T.PlaneGeometry(px-.013,pz-.013,2,2);tile.rotateX(Math.PI/2);tile.translate(x,H+(rand(i+j*14)-.5)*.003,z);k.add(tile,'ceiling');
 }
 for(let i=0;i<=14;i++)k.box('ceilingTrim',startX+i*px,H-.003,startZ+31*pz*.5,.012,.008,31*pz,.002);
 for(let j=0;j<=31;j++)k.box('ceilingTrim',startX+14*px*.5,H-.003,startZ+j*pz,14*px,.008,.012,.002);
 for(const [x,z]of GARDEN_FIXTURES81){k.box('ceilingTrim',x,H+.030,z,1.204,.060,.594,.008);k.box('fluorescent',x,H-.009,z,1.153,.011,.548,.010);for(const side of[-1,1])k.box('ceilingTrim',x,H-.012,z+side*.287,1.202,.024,.021,.003);}
 // Vent slats are small geometric strips over a recessed dark duct.
 for(const [x,z]of[[-1.21,-8.54],[6.63,3.29]]){k.box('dark',x,H-.019,z,.56,.016,.56,.007);for(let i=0;i<11;i++)k.box('ceilingTrim',x-.245+i*.049,H-.031,z,.032,.022,.54,.003);}
}
function poolBasin(k){const {pool,fountain}=GARDEN81;
 k.add(polygonGeometry(POOL_POLYGON81.map(([x,z])=>[pool.x+(x-pool.x)*.91,pool.z+(z-pool.z)*.94]),pool.bed),'bed');
 const ring=gridSurface((u,v)=>{const[x,z]=poolEdge81(u*TAU);const f=.91+.09*v;return[pool.x+(x-pool.x)*f,pool.bed+(0.05-pool.bed)*v,pool.z+(z-pool.z)*f];},96,10);k.add(worldUV(ring,1.1),'bed');
 const count=43;for(let i=0;i<count;i++){const a=i/count*TAU,[x,z]=poolEdge81(a),front=Math.max(0,Math.sin(a)),h=(.51+rand(i+17)*.40)*(1-front*.43),w=.72+rand(i+79)*.40,d=.69+rand(i+141)*.35;
  if(Math.hypot(x+4.85,z-.73)<.86)continue;
  rock(k,x,.47*h-.10,z,w,h,d,i+9,'boulder',a+.4);
  if(i%3===0){const[xx,zz]=poolEdge81(a+.026,1.035);rock(k,xx,.105,zz,.41,.31,.38,i+120,'boulder',a);}
 }
 // The separate fountain has a complete retaining wall and a concrete basin.
 const shape=new T.CircleGeometry(fountain.r,80);shape.rotateX(-Math.PI/2);shape.translate(fountain.x,fountain.bed,fountain.z);k.add(worldUV(shape,1.5),'bed');
 const wall=new T.CylinderGeometry(fountain.r,fountain.r,.63,80,1,true);wall.scale(-1,1,1);wall.computeVertexNormals();wall.translate(fountain.x,-.055,fountain.z);k.add(worldUV(wall,1.2),'bed');
 for(let i=0;i<20;i++){const a=i/20*TAU;rock(k,fountain.x+Math.cos(a)*(fountain.r+.055),.19,fountain.z+Math.sin(a)*(fountain.r+.055),.73,.62,.60,i+270,'boulder',-a);}
 // Discrete gravel at rock contacts makes the displacement ground read as a
 // bed of individual stones without a per-frame instance update.
 for(let i=0;i<340;i++){const x=-7.9+rand(i+882)*15.8,z=-9.4+rand(i+1290)*16.8;if((z>5.60&&Math.abs(x)<2.65)||poolDistance81(x,z)<.64||Math.hypot(x-fountain.x,z-fountain.z)<fountain.r+.38)continue;
  const s=.04+rand(i+301)*.065;rock(k,x,s*.16,z,s,s*.47,s*.72,i,'pebble',rand(i+981)*TAU);}
}
function plant(k,key,x,z,w,h,y=.03,yaw=0){y=-h*.045;for(let j=0;j<3;j++)card(k,key,x,y+h*.5,z,w,h,yaw+j*Math.PI/3,[0,0,1,1],w*.065);}
function parasol(k,p,index){const y=p.h-.79;
 k.cyl('wood',p.x,p.h*.5,p.z,.024,.034,p.h,12);k.cyl('wood',p.x,.085,p.z,.11,.15,.17,12);
 for(let layer=0;layer<4;layer++){
  const g=gridSurface((u,v)=>{const a=u*TAU,r=(.075+(p.r-.075)*v)*(1+layer*.012),yy=p.h-.69*v-.095*v*v-layer*.018;return[Math.sin(a)*r,yy+Math.sin(a*16)*.010*v,Math.cos(a)*r];},80,9);
  const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*5.5+(index+layer*.17),1-uv.getY(i)*.86);
  k.add(g,'thatch',p.x,0,p.z,[0,layer*.011,0]);
 }
 const fringe=gridSurface((u,v)=>{const a=u*TAU,r=p.r*(1+.018*Math.sin(a*12))+.040*v;return[Math.sin(a)*r,y-v*.22,Math.cos(a)*r];},80,5);
 const fu=fringe.attributes.uv;for(let i=0;i<fu.count;i++)fu.setXY(i,fu.getX(i)*6,1-fu.getY(i));k.add(fringe,'thatch',p.x,0,p.z);
 for(let i=0;i<14;i++){const a=i/14*TAU;k.beam('wood',[p.x,p.h-.2,p.z],[p.x+Math.sin(a)*p.r*.99,y-.015,p.z+Math.cos(a)*p.r*.99],.011,6);}
 k.sphere('wood',p.x,p.h+.018,p.z,.068,.04,.068);
 k.cyl('dark',p.x,p.h-.235,p.z,.038,.032,.10,10);k.sphere('tube',p.x,p.h-.32,p.z,.046,.064,.046);
}
function palms(k){for(const [index,p]of GARDEN81.palms.entries()){
 const H=GARDEN81.ceiling+.105,n=24,g=new T.CylinderGeometry(p.r*.72,p.r,H,n,24);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*1.35+index*.37,uv.getY(i)*(H/.86)+index*.213);k.add(g,'trunk',p.x,H*.5-.015,p.z);
 // A stiff plastic crown sits immediately below a squared cut in the tiles.
 for(let j=0;j<7;j++){const a=j/7*TAU+index*.73,frond=gridSurface((u,v)=>{const width=Math.sin(v*Math.PI*.96)*.57,along=v*1.72;return[(u-.5)*width,GARDEN81.ceiling-.18-.90*v*v,along];},5,14);
  const uv=frond.attributes.uv;for(let v=0;v<uv.count;v++)uv.setY(v,1-uv.getY(v));k.add(frond,'palm-frond',p.x,0,p.z,[0,a,0]);}
 for(let j=0;j<3;j++)card(k,'palm-crown',p.x,GARDEN81.ceiling-.53,p.z,1.76,1.02,j*Math.PI/3+index*.5,[0,0,1,1],.2);
 rock(k,p.x,.065,p.z,.67,.21,.71,730+index);
 }}
function lightsAndPlants(k){
 const plants=[['fern',-5.75,2.12,2.24,1.72,.11,.3],['fern',-5.58,-2.91,1.76,1.14,.12,.5],['fern',.99,-1.32,1.15,.77,.1,.8],['fern',.7,-4.48,1.5,.96,.12,.3],['fern',-3.43,-6.10,1.35,.85,.07,1.],['fern',6.66,.37,1.32,1.04,.05,.3],['fern',6.02,-6.35,1.80,1.27,.05,.4],['flowers',-5.20,3.64,1.27,1.13,.13,1.2],['flowers',.12,3.65,1.37,1.16,.16,.1],['flowers',-4.46,-4.71,1.32,1.14,.10,.6],['flowers',.26,-5.94,1.08,.9,.13,.8],['flowers',6.13,2.54,.85,.72,.07,.2],['fern',-6.84,-8.55,1.85,1.32,.07,.6],['flowers',3.66,-6.36,1.21,.92,.06,.3]];
 for(const args of plants)plant(k,...args);
 GARDEN81.globes.forEach((p,i)=>{const key='globe'+i;makesphereMaterial(k,key,p.color);const support=p.y-p.r-.07;k.cyl('dark',p.x,support*.5,p.z,.041,.052,support,10);k.cyl('dark',p.x,p.y-p.r-.046,p.z,p.r*.55,p.r*.69,.095,16);k.sphere(key,p.x,p.y,p.z,p.r);});
 const colors=[0xea4638,0x4476ed,0xffd263,0x69dda2];
 for(let i=0;i<18;i++){const x=-7.0+i*.82,z=-8.23+.34*Math.sin(i*.57),key='pathLamp'+i%4;if(!k.m[key])makesphereMaterial(k,key,colors[i%4]);
  k.cyl('grid',x,.265,z,.016,.021,.53,10);k.cyl('dark',x,.018,z,.065,.082,.036,12);
  k.add(new T.SphereGeometry(.122,16,9,0,TAU,0,Math.PI/2),key,x,.43,z);k.cyl('grid',x,.431,z,.129,.123,.027,16);
 }
 const cable=Array.from({length:72},(_,i)=>[-7.05+i*(14.05/71),.017,-8.24+.34*Math.sin(i/71*17*.57)]);k.tube('dark',cable,.006,140);
 GARDEN81.parasols.forEach((p,i)=>parasol(k,p,i));palms(k);
}
function makesphereMaterial(k,key,color){k.m[key]=new T.MeshStandardMaterial({name:'Frosted opal '+key,color,emissive:color,emissiveIntensity:1.05,roughness:.48,metalness:0});k.m[key].onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=.55+.45*pow(max(dot(normal,normalize(vViewPosition)),0.),.65);');};k.m[key].customProgramCacheKey=()=> 'garden-frosted-opal';}
export function createGardenArchitecture81(m){const k=new TikiKit(m);architecture(k);poolBasin(k);lightsAndPlants(k);gardenDressing85(k);const object=k.finish('Garden81 / high atrium and artificial tropics');object.traverse(o=>{if(!o.isMesh)return;o.matrixAutoUpdate=false;o.updateMatrix();o.castShadow=!/globe|Lamp|fluorescent|tube/.test(o.material.name);o.receiveShadow=true;});return object;}

// Real footbed silhouette, a separate sole and V-shaped woven straps. It has
// thickness below the waterline, with a slow buoyant pose rather than a card.
export function createSandal81(m){const group=new T.Group(),shape=new T.Shape();
 const outline=[[-.061,-.142],[-.079,-.105],[-.084,-.022],[-.083,.071],[-.065,.143],[-.025,.169],[.021,.166],[.063,.142],[.081,.077],[.078,.001],[.067,-.087],[.045,-.139],[0,-.153]];
 shape.moveTo(...outline[0]);for(const p of outline.slice(1))shape.lineTo(...p);shape.closePath();
 const g=new T.ExtrudeGeometry(shape,{depth:.024,bevelEnabled:true,bevelThickness:.005,bevelSize:.004,bevelSegments:2,steps:1,curveSegments:6});g.rotateX(-Math.PI/2);const body=new T.Mesh(g,m.rubber);group.add(body);
 const top=new T.ShapeGeometry(shape);top.rotateX(-Math.PI/2);const uv=top.attributes.uv,p=top.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+.09)/.18,(.17-p.getZ(i))/.34);top.computeVertexNormals();const footbed=new T.Mesh(top,m.sandal);footbed.position.y=.031;group.add(footbed);
 for(const side of[-1,1]){const strap=gridSurface((u,v)=>{const x=(side*.065)*(1-v),z=-.024+.122*v,y=.031+.047*Math.sin(v*Math.PI*.75);return[x+side*(u-.5)*.033,y+(u-.5)*.006,z];},4,14);const s=new T.Mesh(strap,m.strap);s.material=m.strap.clone();s.material.side=T.DoubleSide;group.add(s);}
 group.scale.setScalar(1.30);group.rotation.y=-.55;group.position.set(-1.93,GARDEN81.pool.water+.006,2.22);group.name='Single floating burgundy flip-flop';group.userData.base=group.position.clone();return group;
}
