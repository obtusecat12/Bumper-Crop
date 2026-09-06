import * as T from './vendor/three.module.min.js';
import {buildDenseWheat,isSharedWheatResource} from './dense-wheat.js';
import {CHUNK,random,height,roadDistance,pondDistance,buildingSize,wheatCandidates,periodOrigin} from './world.js';
const UP=new T.Vector3(0,1,0),dummy=new T.Object3D(),color=new T.Color();
const box=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,7),cone=new T.ConeGeometry(1,1,8),leafGeo=foliageGeometry();
function foliageGeometry(){
 const rng=random(0x101ea5),positions=[],colors=[];
 const tint=new T.Color(),normal=new T.Vector3(),axis=new T.Vector3(),side=new T.Vector3();
 const center=new T.Vector3();
 function vertex(a,col){positions.push(a.x,a.y,a.z);colors.push(col.r,col.g,col.b);}
 for(let i=0;i<72;i++){
  const longitude=rng()*Math.PI*2,vertical=rng()*2-1,radius=Math.cbrt(rng())*.93;
  center.set(Math.cos(longitude)*Math.sqrt(1-vertical*vertical)*radius,vertical*radius,Math.sin(longitude)*Math.sqrt(1-vertical*vertical)*radius);
  normal.set((rng()-.5)*.8,.4+rng()*.6,(rng()-.5)*.8).normalize();
  axis.set(Math.cos(longitude),.16*(rng()-.5),Math.sin(longitude));
  side.crossVectors(normal,axis).normalize();axis.crossVectors(side,normal).normalize();
  const length=.13+rng()*.13,width=.055+rng()*.045;
  const tip=center.clone().addScaledVector(axis,length),base=center.clone().addScaledVector(axis,-length*.8);
  const left=center.clone().addScaledVector(side,width),right=center.clone().addScaledVector(side,-width);
  const ridge=center.clone().addScaledVector(normal,.025);
  tint.setScalar(.78+rng()*.22);
  for(const [a,b]of [[base,left],[left,tip],[tip,right],[right,base]]){vertex(a,tint);vertex(b,tint);vertex(ridge,tint);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();return geometry;
}
function noiseTexture(kind){const n=128,data=new Uint8Array(n*n*4),r=random(kind==='brick'?971:kind==='wood'?941:717);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4;let a=.72+r()*.28;if(kind==='wood')a*=.75+.25*Math.sin(x*.72+Math.sin(y*.04)*.3)**2;if(kind==='roof')a*=.75+.25*Math.sin(x*.72)**4;if(kind==='brick'){const mortar=y%16<2||(x+(Math.floor(y/16)%2)*16)%32<2;a=mortar?.58:a;}data[i]=Math.floor(255*a);data[i+1]=Math.floor(250*a);data[i+2]=Math.floor(237*a);data[i+3]=255;}const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t}
const woodTex=noiseTexture('wood'),brickTex=noiseTexture('brick'),roofTex=noiseTexture('roof');
function material(hex,texture=null){return new T.MeshStandardMaterial({color:hex,map:texture,roughness:1})}
export const materials={wood:material('#73624a',woodTex),darkwood:material('#3c3c30',woodTex),red:material('#793a2b',woodTex),brick:material('#956346',brickTex),trim:material('#b8b9a1',woodTex),roof:material('#626762',roofTex),steel:material('#77817b',roofTex),door:material('#3e5354',woodTex),black:material('#19231d'),nails:material('#5c6660'),floor:material('#6c6550'),label:material('#d8cfad'),cap:material('#938773')};
const glass=new T.MeshStandardMaterial({color:'#a1aa86',transparent:true,opacity:.75,roughness:.2,metalness:.12});
const bucket=new Map();Object.entries(materials).forEach(([k,m])=>bucket.set(m,k));
// Collapse architectural details into one geometry per material, per field.
class Batch{
 constructor(){this.parts=new Map()}
 add(geo,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();const g=geo.index?geo.toNonIndexed():geo.clone();g.applyMatrix4(dummy.matrix);if(!this.parts.has(mat))this.parts.set(mat,[]);this.parts.get(mat).push(g)}
 box(mat,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){this.add(box,mat,x,y,z,sx,sy,sz,rx,ry,rz)}
 beam(mat,a,b,r=.07){const mid=a.clone().add(b).multiplyScalar(.5),q=new T.Quaternion().setFromUnitVectors(UP,b.clone().sub(a).normalize());dummy.position.copy(mid);dummy.quaternion.copy(q);dummy.scale.set(r,a.distanceTo(b),r);dummy.updateMatrix();const g=cylinder.toNonIndexed();g.applyMatrix4(dummy.matrix);if(!this.parts.has(mat))this.parts.set(mat,[]);this.parts.get(mat).push(g)}
 finish(group){for(const [mat,parts]of this.parts){let count=parts.reduce((n,g)=>n+g.attributes.position.count,0),p=new Float32Array(count*3),n=new Float32Array(count*3),uv=new Float32Array(count*2),at=0;for(const g of parts){p.set(g.attributes.position.array,at*3);n.set(g.attributes.normal.array,at*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,at*2);at+=g.attributes.position.count;g.dispose()}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(n,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.computeBoundingSphere();const mesh=new T.Mesh(g,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}}
}
const terrainVertex=`varying vec3 vTerrain;\n`;
const terrainFragment=`
varying vec3 vTerrain;
uniform vec4 uFeature;
uniform vec2 uFeatureSize;
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x),mix(hash2(i+vec2(0,1)),hash2(i+1.),f.x),f.y);}
`;
function terrainMaterial(f){const mat=new T.MeshStandardMaterial({color:'#8e8154',roughness:1});mat.onBeforeCompile=s=>{s.uniforms.uFeature={value:new T.Vector4(f.cx,f.cz,f.type==='pond'?1:f.type==='building'?2:0,f.tint)};s.uniforms.uFeatureSize={value:new T.Vector2(f.rx,f.rz)};s.vertexShader=terrainVertex+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTerrain=position;');s.fragmentShader=terrainFragment+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec2 p=vTerrain.xz;float n=noise2(p*3.)*.5+noise2(p*17.)*.23+noise2(p*.2)*.27;
float dx=min(p.x,64.-p.x),dz=min(p.y,64.-p.y),edge=min(dx,dz);
float ruts=max(1.-smoothstep(.31,.6,abs(dx-1.12)),1.-smoothstep(.31,.6,abs(dz-1.12)));
vec3 wheat=mix(vec3(.28,.225,.11),vec3(.49,.40,.21),n);
vec3 grass=mix(vec3(.12,.18,.078),vec3(.29,.32,.14),n);
vec3 dirt=mix(vec3(.19,.185,.135),vec3(.32,.29,.205),n);
vec3 base=mix(grass,wheat,smoothstep(5.9,8.3,edge));base=mix(base,dirt,ruts);
if(uFeature.z==1.){float pd=length((p-uFeature.xy)/uFeatureSize);base=mix(dirt,base,smoothstep(1.03,1.26,pd));base=mix(base,grass,smoothstep(.95,1.12,pd)*(1.-smoothstep(1.22,1.42,pd)));}
if(uFeature.z==2.){float bd=max(abs(p.x-uFeature.x)/11.,abs(p.y-uFeature.y)/13.);base=mix(dirt,base,smoothstep(.8,1.2,bd));}
diffuseColor.rgb=base*(.89+n*.35);
`)};return mat}
function ground(f){const g=new T.PlaneGeometry(CHUNK,CHUNK,28,28);g.rotateX(-Math.PI/2);g.translate(CHUNK/2,0,CHUNK/2);const a=g.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i);let y=height(x,z,f.x,f.z);if(f.type==='pond'){const pd=pondDistance(x,z,f);y-=Math.max(0,1-pd)*2.3+.22*Math.max(0,1.18-pd)}a.setY(i,y)}g.computeVertexNormals();const mesh=new T.Mesh(g,terrainMaterial(f));mesh.receiveShadow=true;return mesh}
export const wind={time:{value:0},player:{value:new T.Vector3()},strength:{value:.32}};
function gableGeometry(w,h){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,0,w/2,0,0,0,h,0,w/2,0,0,-w/2,0,0,0,h,0],3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1,1,0,0,0,.5,1],2));g.computeVertexNormals();return g}
function building(f,b,colliders,pickups){const {cx:x,cz:z,variant:v}=f,[w,d,h]=buildingSize(f),y=height(x,z,f.x,f.z)+.04,wall=v===0?materials.red:v===1?materials.brick:materials.wood,roof=v===0?materials.steel:materials.roof,doorW=v===2?2:3.8,roofH=w*.36;
 b.box(materials.floor,x,y-.02,z,w,.18,d);b.box(wall,x-w/2,y+h/2,z,.23,h,d);b.box(wall,x+w/2,y+h/2,z,.23,h,d);b.box(wall,x,y+h/2,z-d/2,w,h,.23);
 for(const side of[-1,1])b.box(wall,x+side*(w+doorW)/4,y+h/2,z+d/2,(w-doorW)/2,h,.23);
 b.box(wall,x,y+h-.48,z+d/2,doorW,.96,.23);const gab=gableGeometry(w,roofH);b.add(gab,wall,x,y+h,z-d/2);b.add(gab,wall,x,y+h,z+d/2);gab.dispose();
 const slope=Math.atan(roofH/(w/2)),len=Math.hypot(w/2+.55,roofH+.2);for(const side of[-1,1])b.box(roof,x+side*w/4,y+h+roofH/2+.05,z,len,.17,d+1.0,0,0,-side*slope);
 b.box(materials.trim,x,y+h+roofH+.03,z,.18,.16,d+1.05);
 for(const xx of[-w/2,w/2])for(const zz of[-d/2,d/2])b.box(materials.trim,x+xx,y+h/2,z+zz,.16,h,.18);
 for(const zz of[-d/2-.14,d/2+.14]){b.beam(materials.trim,new T.Vector3(x-w/2-.3,y+h,z+zz),new T.Vector3(x,y+h+roofH+.04,z+zz),.1);b.beam(materials.trim,new T.Vector3(x,y+h+roofH+.04,z+zz),new T.Vector3(x+w/2+.3,y+h,z+zz),.1);b.box(materials.trim,x,y+h,z+zz,w,.13,.1)}
 // Open entrance and swung doors; the center stays traversable.
 for(const side of[-1,1]){b.box(v===1?materials.door:materials.darkwood,x+side*(doorW/2+.28),y+(h-.98)/2,z+d/2+.68,.16,h-.98,doorW/2,0,side*.21,0);b.box(materials.trim,x+side*(doorW/2+.04),y+(h-.85)/2,z+d/2+.16,.12,h-.85,.15)}
 const plankStep=v===2?.38:.54;for(let zz=-d/2+.28;zz<d/2;zz+=plankStep)for(const side of[-1,1])b.box(v===0?materials.darkwood:wall,x+side*(w/2+.125),y+h/2,z+zz,.018,h-.08,.028);
 if(v===1){for(let yy=.36;yy<h;yy+=.38)b.box(materials.brick,x,y+yy,z+d/2+.13,w,.013,.012)}
 // Interior posts, roof trusses, horizontal rails, and a small pile of lumber.
 for(let zz=-d/2+2;zz<d/2;zz+=4.1){b.box(materials.darkwood,x,y+h-.2,z+zz,w-.2,.2,.20);for(const side of[-1,1]){b.box(materials.darkwood,x+side*(w/2-.35),y+h/2,z+zz,.18,h,.18);b.beam(materials.darkwood,new T.Vector3(x+side*(w/2-.3),y+h-.2,z+zz),new T.Vector3(x,y+h+roofH-.25,z+zz),.08)}}
 for(let i=0;i<7;i++)b.box(materials.wood,x-w/2+1.1+(i%2)*.13,y+.16+Math.floor(i/2)*.12,z-2+i%3*.09,.24,.12,3.5,0,(i%3-.5)*.035,0);
 b.box(materials.wood,x+w/2-1,y+.4,z-d/2+1.2,1.0,.8,1);b.box(materials.nails,x+w/2-1,y+.85,z-d/2+1.2,.30,.1,.26);
 for(const side of[-1,1]){b.box(materials.black,x+side*(w/2+.13),y+h*.64,z-1,.012,1.35,1.0);b.box(materials.trim,x+side*(w/2+.15),y+h*.64,z-1,.03,1.45,.05);for(const zz of[-.52,.52])b.box(materials.trim,x+side*(w/2+.15),y+h*.64,z-1+zz,.03,1.45,.07);for(const yy of[-.68,.68])b.box(materials.trim,x+side*(w/2+.15),y+h*.64+yy,z-1,.03,.07,1.12)}
 if(v===3)for(const side of[-1,1])for(let zz=-d/2+2;zz<d/2-2;zz+=3){for(let hh=.5;hh<1.8;hh+=.5)b.box(materials.wood,x+side*(w/2-1.7),y+hh,z+zz,3,.1,.1);b.box(materials.darkwood,x+side*(w/2-3.1),y+1,z+zz,.15,2,.15)}
 const addBox=(x1,z1,x2,z2)=>colliders.push({kind:'box',x1,z1,x2,z2});addBox(x-w/2-.15,z-d/2,x-w/2+.15,z+d/2);addBox(x+w/2-.15,z-d/2,x+w/2+.15,z+d/2);addBox(x-w/2,z-d/2-.15,x+w/2,z-d/2+.15);addBox(x-w/2,z+d/2-.15,x-doorW/2,z+d/2+.15);addBox(x+doorW/2,z+d/2-.15,x+w/2,z+d/2+.15);addBox(x-w/2+.55,z-3.9,x-w/2+1.65,z-.1);addBox(x+w/2-1.6,z-d/2+.65,x+w/2-.45,z-d/2+1.8);
 pickups.push({id:f.key+':barn',x:x-1,z:z+1,y:y+.03});
}
const leafMats=[new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide,roughness:1})];
const bushMat=material('#495332');
function vegetation(f,b,colliders,level){const r=random(f.seed^84234),crowns=[];
 for(const tree of f.trees){const x=tree.x,z=tree.z,s=tree.scale,y=height(x,z,f.x,f.z),h=(tree.variant===1?9:6.5)*s,tr=.21*s;b.add(cylinder,materials.darkwood,x,y+h*.4,z,tr,h*.8,tr);colliders.push({kind:'circle',x,z,r:tr+.10});
 const count=tree.variant===1?17:22;
 for(let j=0;j<count;j++){const a=r()*Math.PI*2,rad=(.5+r()*2.4)*s,yy=y+h*.68+r()*h*.35;let xx=x+Math.cos(a)*rad,zz=z+Math.sin(a)*rad,sy=(1.0+r())*s,sx=(1.0+r()*.9)*s;if(tree.variant===1){xx=x+(xx-x)*.6;zz=z+(zz-z)*.6;sy*=1.6;sx*=.8}if(tree.variant===2){sy*=.7;sx*=1.25}crowns.push({x:xx,y:yy,z:zz,sx,sy,sz:sx*(.75+r()*.35),variant:tree.variant,shade:r()});if(j<5)b.beam(materials.darkwood,new T.Vector3(x,y+h*.45,z),new T.Vector3(xx,yy,zz),.085*s)}
 }
 // Rows of clipped hedgerow, with gaps to reach the field.
 for(let i=10;i<56;i+=2.1){if(i>27&&i<34)continue;for(const side of[0,1]){const x=side?5.4:i,z=side?i:5.4,y=height(x,z,f.x,f.z);crowns.push({x,y:y+.9,z,sx:1.30,sy:.98,sz:1.2,variant:2,shade:r()});if(level<2)crowns.push({x:x+(r()-.5)*.5,y:y+1.25,z:z+.15,sx:.75,sy:.65,sz:.80,variant:1,shade:r()})}}
 colliders.push({kind:'box',x1:4.55,z1:8.8,x2:6.25,z2:26.5},{kind:'box',x1:4.55,z1:34,x2:6.25,z2:56.9},{kind:'box',x1:8.8,z1:4.55,x2:26.5,z2:6.25},{kind:'box',x1:34,z1:4.55,x2:56.9,z2:6.25});
 const leaves=new T.InstancedMesh(leafGeo,leafMats[0],crowns.length);crowns.forEach((a,i)=>{dummy.position.set(a.x,a.y,a.z);dummy.rotation.set(r(),r()*6.28,r());dummy.scale.set(a.sx,a.sy,a.sz);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);color.setHSL(.19+a.variant*.012,.24+a.shade*.13,.28+a.shade*.09);leaves.setColorAt(i,color)});leaves.instanceMatrix.needsUpdate=true;leaves.instanceColor.needsUpdate=true;leaves.computeBoundingSphere();leaves.castShadow=true;leaves.receiveShadow=true;
 return leaves;
}
function poles(f,b,colliders,group){const x=3.5,z=34,y=height(x,z,f.x,f.z),h=9.8;b.add(cylinder,materials.wood,x,y+h/2,z,.115,h,.115);b.box(materials.darkwood,x,y+h-.65,z,2.9,.13,.15);for(const side of[-1,0,1]){b.add(cylinder,materials.trim,x+side*1.1,y+h-.41,z,.10,.26,.10);const pts=[];for(let k=0;k<=20;k++){const t=k/20,zz=z-64*t,base=height(x,zz,f.x,f.z);pts.push(new T.Vector3(x+side*1.1,base+h-.24-Math.sin(t*Math.PI)*1.5,zz))}const geo=new T.BufferGeometry().setFromPoints(pts);group.add(new T.Line(geo,new T.LineBasicMaterial({color:'#333d34'})))}colliders.push({kind:'circle',x,z,r:.18})}
export const waterTime={value:0};
function pond(f){const g=new T.CircleGeometry(1,48);g.rotateX(-Math.PI/2);const mat=new T.MeshStandardMaterial({color:'#667c77',roughness:.28,metalness:.28,transparent:true,opacity:.9});mat.onBeforeCompile=s=>{s.uniforms.uWaterTime=waterTime;s.vertexShader='varying vec3 vWater;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWater=position;');s.fragmentShader='uniform float uWaterTime;varying vec3 vWater;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float w=sin(vWater.x*210.+sin(vWater.z*67.+uWaterTime*.4)*2.+uWaterTime*1.6)*sin(vWater.z*120.+vWater.x*30.-uWaterTime*.8);diffuseColor.rgb*=.80+w*.18;
`)};const mesh=new T.Mesh(g,mat);mesh.position.set(f.cx,height(f.cx,f.cz,f.x,f.z)-.14,f.cz);mesh.scale.set(f.rx,1,f.rz);mesh.rotation.x=0;return mesh}
function grassGeometry(){const p=[];for(let i=0;i<5;i++){const a=i*2.399,x=Math.cos(a)*.19,z=Math.sin(a)*.19,h=.26+(i%3)*.15;p.push(x-.023,0,z,x+.023,0,z,x+.11,h,z+.04)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g}
const grassGeo=grassGeometry(),grassMat=new T.MeshStandardMaterial({color:'#5c6436',roughness:1,side:T.DoubleSide});
function grasses(f,level){const r=random(f.seed^179123),points=[];for(let i=0;i<(level===2?320:700);i++){let x=r()*64,z=r()*64;if(roadDistance(x,z)<.5||roadDistance(x,z)>3.2&&roadDistance(x,z)<7.1||f.type==='pond'&&pondDistance(x,z,f)>1.04&&pondDistance(x,z,f)<1.27)points.push([x,z,.6+r()*.8])}const mesh=new T.InstancedMesh(grassGeo,grassMat,points.length);points.forEach(([x,z,s],i)=>{dummy.position.set(x,height(x,z,f.x,f.z),z);dummy.rotation.set(0,r()*6.28,0);dummy.scale.setScalar(s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.computeBoundingSphere();return mesh}
export function makeBottle(x,y,z){const g=new T.Group();const body=new T.Mesh(new T.CylinderGeometry(.095,.085,.32,8),glass);body.position.y=.19;const label=new T.Mesh(new T.CylinderGeometry(.097,.089,.15,8),materials.label);label.position.y=.19;const neck=new T.Mesh(new T.CylinderGeometry(.044,.07,.09,8),glass);neck.position.y=.40;const cap=new T.Mesh(new T.CylinderGeometry(.048,.048,.045,8),materials.cap);cap.position.y=.46;const stripe=new T.Mesh(new T.BoxGeometry(.1,.028,.01),materials.darkwood);stripe.position.set(0,.20,.095);g.add(body,label,neck,cap,stripe);g.position.set(x,y,z);g.rotation.z=.18;return g}
export function makeChunk(f,level,quality,collected){const group=new T.Group(),b=new Batch(),colliders=[],pickups=[];group.add(ground(f));const wheat=buildDenseWheat(f,level,quality,wind);group.add(wheat.mesh,vegetation(f,b,colliders,level),grasses(f,level));poles(f,b,colliders,group);if(f.type==='building')building(f,b,colliders,pickups);if(f.type==='pond')group.add(pond(f));const r=random(f.seed^28391);if(r()<.36)pickups.push({id:f.key+':road',x:2.8,z:18+r()*23,y:0});if(f.x===0n&&f.z===0n)pickups.push({id:'0,0:welcome',x:1.9,z:46,y:0});b.finish(group);for(const p of pickups){p.y=Math.max(p.y,height(p.x,p.z,f.x,f.z)+.025);if(!collected.has(p.id)){p.mesh=makeBottle(p.x,p.y,p.z);group.add(p.mesh)}}const wheatBuckets=new Map();for(const w of wheat.candidates){const key=`${Math.floor(w.x/2)},${Math.floor(w.z/2)}`;if(!wheatBuckets.has(key))wheatBuckets.set(key,[]);wheatBuckets.get(key).push(w)}return {group,colliders,pickups,wheatBuckets,field:f,level,quality}}
export function disposeChunk(chunk){chunk.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry&&!isSharedWheatResource(o.geometry)&&![box,cylinder,cone,leafGeo,grassGeo].includes(o.geometry))o.geometry.dispose();if(o.material&&!isSharedWheatResource(o.material)&&!Object.values(materials).includes(o.material)&&!leafMats.includes(o.material)&&![grassMat,glass].includes(o.material))o.material.dispose()});}
export function makeSky(){const mat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{uTime:wind.time},vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`precision highp float;varying vec3 vDirection;uniform float uTime;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}float fbm(vec2 p){float a=.52,n=0.;for(int i=0;i<5;i++){n+=a*noise(p);p=p*2.03+vec2(7.1,3.7);a*=.5;}return n;}void main(){vec3 d=normalize(vDirection);float elev=max(d.y,0.);vec2 p=d.xz/(elev+.35)*2.1;float n=fbm(p+vec2(uTime*.002,0.));float fine=fbm(p*3.8);vec3 cloud=mix(vec3(.33,.38,.39),vec3(.66,.69,.69),smoothstep(.22,.76,n));cloud-=smoothstep(.4,.8,fine)*.075;vec3 col=mix(vec3(.65,.69,.68),cloud,smoothstep(-.04,.35,d.y));gl_FragColor=vec4(col,1.);}`});return new T.Mesh(new T.SphereGeometry(420,24,16),mat)}
