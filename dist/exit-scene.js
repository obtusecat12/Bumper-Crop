import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {exitPoint,exitSample,exitSurface,ease,EXIT_CITY_Y} from './exit-route.js?v=48';
import {height,random,resolveSolid} from './world.js?v=48';
import {exitTextures} from './exit-textures.js?v=48';
// Fixed, modest entry district, NOT an additional infinite city generator.
// All static pieces are merged by material. No per-frame object creation.
const UP=new T.Vector3(0,1,0),pose=new T.Object3D();
const material=(map,color=0xffffff,roughness=.94)=>new T.MeshStandardMaterial({map:map?exitTextures[map]:null,color,roughness,vertexColors:true});
function ground(x,z){const q=exitSample(x,z,{});return exitSurface(q,height(x,z));}
function at(s,d=0){const p=exitPoint(s);p.x+=p.nx*d;p.z+=p.nz*d;return p;}
class Batch{
 constructor(mats){this.mats=mats;this.parts=new Map();this.colliders=[];}
 add(g,key,x,y,z,sx=1,sy=1,sz=1,ry=0,rx=0,rz=0,tint=1){
  if(g.index){const n=g.toNonIndexed();g.dispose();g=n;}
  pose.position.set(x,y,z);pose.rotation.set(rx,ry,rz);pose.scale.set(sx,sy,sz);pose.updateMatrix();g.applyMatrix4(pose.matrix);
  const c=new Float32Array(g.attributes.position.count*3);c.fill(tint);g.setAttribute('color',new T.BufferAttribute(c,3));
  if(!this.parts.has(key))this.parts.set(key,[]);this.parts.get(key).push(g);
 }
 box(key,x,y,z,w,h,d,ry=0,tone=1){const g=new T.BoxGeometry(w,h,d),uv=g.attributes.uv;
  if(this.mats[key].map&&['wall','slab','asphalt'].includes(key))for(let i=0;i<uv.count;i++){const face=Math.floor(i/4),uw=face<2?d:w,vh=face===2||face===3?d:h;uv.setXY(i,uv.getX(i)*uw/3,uv.getY(i)*vh/3);}
  this.add(g,key,x,y,z,1,1,1,ry,0,0,tone);
 }
 rod(key,a,b,r=.045){const mid=new T.Vector3().addVectors(a,b).multiplyScalar(.5),dir=new T.Vector3().subVectors(b,a),q=new T.Quaternion().setFromUnitVectors(UP,dir.clone().normalize()),g=new T.CylinderGeometry(r*.85,r,dir.length(),6,1);g.applyQuaternion(q);this.add(g,key,mid.x,mid.y,mid.z);}
 solid(x,z,w,d){this.colliders.push({kind:'box',x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2});}
 finish(name){const root=new T.Group();root.name=name;for(const [key,list]of this.parts){const g=mergeGeometries(list,false);for(const p of list)p.dispose();g.computeBoundingBox();g.computeBoundingSphere();const m=new T.Mesh(g,this.mats[key]);m.name=name+' / '+key;m.castShadow=key==='wall';m.receiveShadow=true;m.userData.exitStatic=true;m.updateMatrix();m.matrixAutoUpdate=false;root.add(m);}root.updateMatrix();root.matrixAutoUpdate=false;return root;}
}
function windowAt(b,x,y,z,w,h,key,side){
 b.add(new T.PlaneGeometry(w,h),key,x,y,z,1,1,1,side*Math.PI/2);
 b.box('wall',x+side*.09,y-h/2-.05,z,.30,.11,w+.24,0,.85);
 b.box('metal',x+side*.028,y,z-w/2,.10,h+.1,.035);
 b.box('metal',x+side*.028,y,z+w/2,.10,h+.1,.035);
}
function building(b,s,side,{w=12,d=19,h=11,offset=17,kind=0,blank=false}={}){
 const p=at(s,side*(offset+w/2)),y=b.cityOnly?EXIT_CITY_Y:ground(p.x,p.z),tone=[.92,.83,1,.88][kind%4];
 b.box('wall',p.x,y+h/2,p.z,w,h,d,0,tone);b.solid(p.x,p.z,w,d);
 b.box('wall',p.x,y+.18,p.z,w+.35,.36,d+.35,0,.58);
 // Flat roof with three dimensional parapet, drip edge and offset stair tower.
 b.box('metal',p.x,y+h+.08,p.z,w+.22,.12,d+.22,0,.74);
 for(const k of [-1,1]){b.box('wall',p.x+k*(w/2-.13),y+h+.29,p.z,.26,.48,d,0,tone);b.box('wall',p.x,y+h+.29,p.z+k*(d/2-.13),w,.48,.26,0,tone);}
 if(kind%3===1){b.box('wall',p.x+side*(w*.24),y+h*.60,p.z+d*.36,w*.46,h*1.2,d*.25,0,.91);}
 const face=p.x-side*(w/2+.018),toward=-side;
 if(!blank){
  for(let floor=0;floor<Math.floor(h/3.2);floor++){
   if(floor===0&&kind%2===0){for(let i=-1;i<=1;i++)windowAt(b,face,y+1.93,p.z+i*3.1,2.25,3.375,'shop',toward);b.box('metal',face+side*.15,y+3.95,p.z,1.1,.16,d*.85,0,.70);}
   else if(kind%3===1){const ribbonW=Math.min(d*.81,8.1);windowAt(b,face,y+2.0+floor*3.15,p.z,ribbonW,ribbonW/3,'ribbon',toward);}
   else for(let i=-1;i<=1;i++)windowAt(b,face,y+2.0+floor*3.15,p.z+i*4.2,1.75,1.75,'broken',toward);
  }
  // Recessed door reads separately from the UV windows and has depth/jambs.
  b.box('dark',face+toward*.03,y+1.26,p.z-d*.33,.07,2.50,1.20);
  b.box('wall',face+toward*.17,y+2.59,p.z-d*.33,.38,.16,1.50);
  for(const k of [-1,1])b.box('wall',face+toward*.15,y+1.28,p.z-d*.33+k*.72,.32,2.58,.13);
 }
 const dx=p.x-side*(w/2+.12),dz=p.z+d/2-.5;
 b.rod('metal',new T.Vector3(dx,y+.2,dz),new T.Vector3(dx,y+h+.12,dz),.065);
 // Utility cabinets and wall vents are geometric rather than pasted clutter.
 if(blank){b.box('metal',face+toward*.14,y+1.25,p.z+3,.4,2.35,1.4);for(let k=0;k<8;k++)b.box('dark',face+toward*.355,y+2.6+k*.08,p.z-3,.035,.035,1.2);}
}
function lamp(b,s,side,concrete=false){
 const p=at(s,side*6.25),y=b.cityOnly?EXIT_CITY_Y:ground(p.x,p.z),a=new T.Vector3(p.x,y,p.z),h=concrete?9:7.5;
 b.rod(concrete?'wall':'metal',a,new T.Vector3(p.x+.10,y+h,p.z+.08),concrete?.17:.083);
 b.box('wall',p.x,y+.23,p.z,.46,.46,.46,0,.74);
 if(concrete){b.box('metal',p.x,y+h-.4,p.z,1.5,.11,.14);for(let i=-1;i<=1;i++)b.add(new T.CylinderGeometry(.07,.09,.22,6),'dark',p.x+i*.52,y+h-.23,p.z);}
 else {let previous=new T.Vector3(p.x,y+h-.7,p.z);for(let i=1;i<=7;i++){const t=i/7,pt=new T.Vector3(p.x-side*1.8*t,y+h-.7+Math.sin(t*Math.PI*.70)*.72,p.z);b.rod('metal',previous,pt,.055);previous=pt;}b.box('metal',previous.x-side*.2,previous.y-.07,previous.z,.69,.16,.25);b.box('dark',previous.x-side*.2,previous.y-.16,previous.z,.48,.04,.19);}
 b.colliders.push({kind:'circle',x:p.x,z:p.z,r:.24});
}
function sign(b,s,side,key,w,h){const p=at(s,side*3.6),y=ground(p.x,p.z);b.rod('metal',new T.Vector3(p.x,y,p.z),new T.Vector3(p.x+.05,y+2.7,p.z),.04);b.add(new T.PlaneGeometry(w,h),key,p.x,y+2.35,p.z,1,1,1,Math.PI+.09,0,-.04);}
function fence(b,s0,s1,side){
 const distance=9.8,step=4;for(let s=s0;s<s1;s+=step){const a=at(s,distance*side),c=at(Math.min(s+step,s1),distance*side),ya=ground(a.x,a.z),yc=ground(c.x,c.z);
 b.rod('metal',new T.Vector3(a.x,ya,a.z),new T.Vector3(a.x,ya+1.95,a.z),.045);
 b.rod('metal',new T.Vector3(a.x,ya+1.85,a.z),new T.Vector3(c.x,yc+1.85,c.z),.025);
 // 3D crossed wire, no alpha sheet and no fence crossing the walkable road.
 for(let i=0;i<12;i++){let u=i/12,uu=Math.min(1,u+.22);for(const flip of [-1,1])b.rod('metal',new T.Vector3(a.x+(c.x-a.x)*u,ya+(flip>0?.10:1.75),a.z+(c.z-a.z)*u),new T.Vector3(a.x+(c.x-a.x)*uu,yc+(flip>0?1.75:.10),a.z+(c.z-a.z)*uu),.006);}
 b.solid((a.x+c.x)/2,(a.z+c.z)/2,.18,Math.abs(c.z-a.z)+.05);
 }
}
function routeGround(mats){
 const pos=[],uv=[],index=[];const start=-170,end=650,rows=205;
 for(let i=0;i<=rows;i++){const s=start+(end-start)*i/rows,p=exitPoint(s);for(const k of [-1,1]){pos.push(p.x+p.nx*k*100,EXIT_CITY_Y,p.z+p.nz*k*100);uv.push((k+1)*50,s/3);}}
 for(let i=0;i<rows;i++){const n=i*2;index.push(n,n+2,n+1,n+1,n+2,n+3);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
 const mat=material('sidewalk-concrete'),map=exitTextures['road-asphalt'];mat.vertexColors=false;
 mat.onBeforeCompile=sh=>{sh.uniforms.uCityAsphalt={value:map};sh.vertexShader='varying vec3 vCityP;\n'+sh.vertexShader;sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCityP=position;');sh.fragmentShader='uniform sampler2D uCityAsphalt;varying vec3 vCityP;\n'+sh.fragmentShader;sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float t=clamp((vCityP.z-173.8)/357.,0.,1.),cx=488.+34.*(t*t*(3.-2.*t))+9.*sin(3.14159265*t);
 // The post-exit street extends using the same final tangent.
 if(vCityP.z>530.8)cx=522.-.0789*(vCityP.z-530.8);if(vCityP.z<173.8)cx=488.+.0792*(vCityP.z-173.8);
 float road=1.-smoothstep(4.06,4.14,abs(vCityP.x-cx));
 diffuseColor.rgb=mix(texture2D(map,vCityP.xz/3.).rgb,texture2D(uCityAsphalt,vCityP.xz/3.).rgb,road);`);};
 mat.customProgramCacheKey=()=> 'city-entry-ground-v48';const mesh=new T.Mesh(g,mat);mesh.name='Level 11 municipal ground';mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;return mesh;
}
export function createExitScene(){
 const mats={wall:material('wall-plaster'),slab:material('sidewalk-concrete'),asphalt:material('road-asphalt'),metal:material(null,0x484b48,.78),dark:material(null,0x1c2425),brick:material(null,0x665349),gravel:material(null,0x6f7066),paint:material(null,0xa69a66),white:material(null,0xafa99a),broken:material('window-broken'),ribbon:material('window-ribbon'),shop:material('window-shop'),notice:material('notice'),street:material('street-sign')};
 mats.notice.side=mats.street.side=T.DoubleSide;
 const early=new Batch(mats),common=new Batch(mats),back=new Batch(mats),r=random(0x110048);back.cityOnly=true;
 // The first 80 m contain only sparse, easy-to-miss industrial hints.
 for(let i=0;i<75;i++){const s=18+r()*145,d=(r()-.5)*4,p=at(s,d);early.box('gravel',p.x,ground(p.x,p.z)+.016,p.z,.026+r()*.10,.018+r()*.023,.04+r()*.09,r()*3,.7+r()*.4);}
 const angle=at(38,2.7),ay=ground(angle.x,angle.z);early.box('metal',angle.x,ay+.025,angle.z,.10,.034,1.10,.43);early.box('metal',angle.x+.045,ay+.070,angle.z,.024,.10,1.10,.43);
 const stud=at(61,-1.8);early.box('metal',stud.x,ground(stud.x,stud.z)+.017,stud.z,.13,.035,.18,.24);early.box('white',stud.x,ground(stud.x,stud.z)+.037,stud.z-.07,.085,.022,.025,.24);
 sign(early,82,-1,'notice',.48,.72);
 // Exposed curbs emerge from soil rather than starting at a perpendicular seam.
 for(let s=112;s<640;s+=2.4)for(const side of [-1,1]){
  const t=Math.min(1,s/360),p=at(s,side*(2.05+ease(.22,.86,t)*2.05+.15)),y=s>=316?EXIT_CITY_Y:ground(p.x,p.z),rise=.15*ease(105,222,s);
  if(s<205&&r()>.52)continue;
  common.box('slab',p.x,y+rise-.09,p.z,.25,.18,2.35,Math.atan2(p.tx,p.tz),.77+r()*.17);
  if(s>238){const q=at(s,side*5.85);common.box('slab',q.x,(s>=316?EXIT_CITY_Y:ground(q.x,q.z))+.07,q.z,3.2,.14,2.40,Math.atan2(p.tx,p.tz),.91);}
 }
 // Dry successional litter and rubble: instanced-looking but CPU merged once.
 for(let i=0;i<205;i++){const s=118+r()*196,side=r()<.5?-1:1,d=side*(3.1+r()*8),p=at(s,d),y=ground(p.x,p.z);if(r()<.40)early.box('brick',p.x,y+.08,p.z,.12+r()*.24,.08+r()*.10,.12+r()*.35,r()*Math.PI,.70+r()*.45);else for(let j=0;j<3;j++){const a=r()*6.283;early.rod('gravel',new T.Vector3(p.x,y,p.z),new T.Vector3(p.x+Math.cos(a)*.13,y+.10+r()*.34,p.z+Math.sin(a)*.13),.011);}}
 building(common,207,-1,{w:11,d:19,h:10.7,offset:27,blank:true,kind:1});
 building(common,258,1,{w:15,d:23,h:12.6,offset:23,kind:1});
 building(common,282,-1,{w:11,d:20,h:9.5,offset:11,kind:2});
 for(let s=318,i=0;s<627;s+=34,i++){for(const side of [-1,1])building(common,s+(side>0?6:0),side,{w:11+(i%3)*3,d:25+(i%2)*4,h:10+(i%3)*3.1,offset:8.8,kind:i+(side>0?1:0)});}
 fence(early,170,194,1);fence(early,210,230,-1);
 lamp(common,181,-1,true);lamp(common,229,1,true);for(let s=270,i=0;s<630;s+=31,i++)lamp(common,s,i%2?1:-1);
 sign(common,276,1,'street',.99,.33);
 // Worn paint pieces have real gaps and only appear after the old ruts flatten.
 for(let s=271;s<638;s+=5.7){const p=at(s);for(const side of [-1,1]){const q=at(s,side*.15);common.box('paint',q.x,EXIT_CITY_Y+.006,q.z,.10,.006,2.8,Math.atan2(p.tx,p.tz),.65+r()*.30);}if(s>300){for(const side of [-1,1]){const q=at(s,side*3.64);common.box('white',q.x,EXIT_CITY_Y+.008,q.z,.09,.006,3.1,Math.atan2(p.tx,p.tz),.67);}}}
 for(let s=289;s<625;s+=39){const p=at(s,3.62);common.box('dark',p.x,EXIT_CITY_Y+.015,p.z,.45,.026,.70);for(let j=0;j<7;j++)common.box('metal',p.x,EXIT_CITY_Y+.035,p.z-.30+j*.10,.43,.015,.034);}
 // Behind the threshold: municipal replacements become visible only after
 // their nearest changed surface is already outside the fog distance.
 for(let s=-115,i=0;s<255;s+=35,i++)for(const side of [-1,1])building(back,s,side,{offset:9.5,w:12,d:29,h:10+(i%3)*3.1,kind:i});
 for(let s=-120;s<248;s+=32)lamp(back,s,1);
 // End of this deliberately limited entry block: concrete service court.
 const end=at(644);common.box('wall',end.x,EXIT_CITY_Y+4,end.z,190,8,2,0,.77);common.solid(end.x,end.z,190,2);
 const root=new T.Group(),rural=early.finish('Exit / early remnants'),shared=common.finish('Exit / Bauhaus street'),urban=back.finish('Level 11 / streets behind');root.name='Level 10 to 11 / fixed exit';root.add(rural,shared,urban);const floor=routeGround(mats);urban.add(floor);urban.visible=false;root.visible=false;
 root.matrixAutoUpdate=false;let origin='',city=false;
 const stats={mode:'10',triangles:0,draws:0};root.traverse(m=>{if(m.isMesh){stats.triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;stats.draws++;}});
 const allSolids=[...early.colliders,...common.colliders],citySolids=[...common.colliders,...back.colliders];
 function update(state){
  const near=state.cx>=4n&&state.cx<=11n&&state.cz>=-1n&&state.cz<=14n;
  root.visible=city||near;if(!root.visible)return;
  const key=`${state.cx},${state.cz}`;if(key!==origin){origin=key;root.position.set(-Number(state.cx)*64,0,-Number(state.cz)*64);root.updateMatrix();root.updateMatrixWorld(true);}
 }
 function setCity(value){city=value;urban.visible=value;rural.visible=!value;stats.mode=value?'11':'10';}
 function resolve(position,state){if(!city&&!root.visible)return position;const wx=Number(state.cx)*64,wz=Number(state.cz)*64;position.x+=wx;position.z+=wz;resolveSolid(position,.26,city?citySolids:allSolids);
  if(city){const q=exitSample(position.x,position.z,{});if(q.distance>88){const p=exitPoint(q.s);position.x=p.x+p.nx*Math.sign(q.signed)*88;position.z=p.z+p.nz*Math.sign(q.signed)*88;}if(q.s< -150){const p=at(-150,q.signed);position.x=p.x;position.z=p.z;}}
  position.x-=wx;position.z-=wz;return position;
 }
 function floorAt(wx,wz){const q=exitSample(wx,wz,{});return EXIT_CITY_Y+(q.distance>4.3&&q.distance<7.4?.14:0);}
 function dispose(){const done=new Set();root.traverse(m=>{if(m.geometry&&!done.has(m.geometry)){done.add(m.geometry);m.geometry.dispose();}});for(const m of Object.values(mats))m.dispose();floor.material.dispose();root.removeFromParent();}
 return {object:root,update,setCity,resolve,floorAt,stats,dispose,colliders:allSolids,cityColliders:citySolids};
}
