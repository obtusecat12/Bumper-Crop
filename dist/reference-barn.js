import * as T from './vendor/three.module.min.js';
import {REFERENCE_BARN as B,barnHarvest,barnFootprintDistance,barnLandscape} from './reference-barn-layout.js?v=21';
import {landmarkTextures as tex} from './landmark-textures.js?v=21';
import {surfaceHeight,random,roadDistance} from './world.js?v=21';
import {makeNature} from './nature.js?v=21';
const shared=new Set(),keep=x=>(shared.add(x),x);
export const isSharedReferenceBarnResource=x=>shared.has(x);
const mat=(name,color,map=null)=>keep(new T.MeshStandardMaterial({name,color,map,roughness:.94,side:T.DoubleSide}));
const M={brick:mat('reference orange brick','#b5a699',tex.brick),roof:mat('weathered slate roof','#b1b3b1',tex.slate),door:mat('blue grey vertical boards','#b6c0bb',tex.bluewood),wood:mat('old exposed rafters','#4c4030'),iron:mat('black iron hinges','#34382f'),floor:mat('earthen barn floor','#544936'),grass:mat('rough grass along brick footings','#8d9b61',tex.straw),straw:mat('loose straw bed','#c3b18a',tex.straw),quilt:mat('faded cotton blanket','#a9a99e',tex.quilt),enamel:mat('1980s speckled enamel steel','#939994',tex.enamel),rim:mat('rolled black enamel rim','#172020'),paste:mat('warm flour paste','#d0c4a2',tex.paste),stove:mat('painted camp burner','#364b3c'),flame:mat('small blue burner flame','#365db2')};
M.brick.color.setRGB(2.0,1.38,1.00);M.roof.color.setRGB(2.4,2.4,2.48);M.door.color.setRGB(1.0,1.25,1.50);M.floor.color.set('#8f8468');
M.flame.emissive.set('#477bee');M.flame.emissiveIntensity=.75;M.enamel.roughness=.36;M.rim.roughness=.3;M.iron.metalness=.3;M.paste.roughness=.64;
const unitBox=keep(new T.BoxGeometry(1,1,1)),unitCylinder=keep(new T.CylinderGeometry(1,1,1,12)),dummy=new T.Object3D();
class Batch{
 constructor(){this.parts=new Map()}
 add(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,uvScale=1){let a=g.index?g.toNonIndexed():g.clone();dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();a.applyMatrix4(dummy.matrix);const uv=a.attributes.uv;if(uv&&uvScale!==1)for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*uvScale,uv.getY(i)*uvScale);if(!this.parts.has(m))this.parts.set(m,[]);this.parts.get(m).push(a)}
 box(m,x,y,z,w,h,d,rx=0,ry=0,rz=0){const g=unitBox.clone(),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const face=Math.floor(i/4),u=face<2?d:w,v=face>=2&&face<4?d:h;uv.setXY(i,uv.getX(i)*u/(m===M.brick?2.6:2),uv.getY(i)*v/(m===M.brick?2.6:2))}this.add(g,m,x,y,z,w,h,d,rx,ry,rz);g.dispose()}
 quad(m,a,b,c,d,scale=2.6){const p=[...a,...b,...c,...a,...c,...d],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));const w=Math.hypot(...a.map((v,i)=>v-b[i]))/scale,h=Math.hypot(...a.map((v,i)=>v-d[i]))/scale;g.setAttribute('uv',new T.Float32BufferAttribute([0,0,w,0,w,h,0,0,w,h,0,h],2));g.computeVertexNormals();this.add(g,m);g.dispose()}
 beam(m,a,b,w=.16,d=w){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),mid=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5);dummy.position.copy(mid);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());dummy.scale.set(w,v.length(),d);dummy.updateMatrix();const g=unitBox.clone().applyMatrix4(dummy.matrix);this.add(g,m);g.dispose()}
 finish(group){for(const[m,parts]of this.parts){const n=parts.reduce((a,g)=>a+g.attributes.position.count,0),p=new Float32Array(n*3),ns=new Float32Array(n*3),uv=new Float32Array(n*2);let at=0;for(const g of parts){p.set(g.attributes.position.array,at*3);ns.set(g.attributes.normal.array,at*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,at*2);at+=g.attributes.position.count;g.dispose()}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(ns,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.computeBoundingSphere();const mesh=new T.Mesh(g,m);mesh.name=m.name;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh)}}
}
function polygon(batch,m,points,scale=2.6){for(let i=1;i<points.length-1;i++){const g=new T.BufferGeometry(),a=[points[0],points[i],points[i+1]];g.setAttribute('position',new T.Float32BufferAttribute(a.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(a.flatMap(p=>[(p[0]+p[2])/scale,p[1]/scale]),2));g.computeVertexNormals();batch.add(g,m);g.dispose()}}
function cloth(w,d,height,phase){const nx=8,nz=12,p=[],uv=[],ids=[];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=(i/nx-.5)*w,z=(j/nz-.5)*d,edge=Math.min(i/nx,1-i/nx,j/nz,1-j/nz);p.push(x,height+Math.min(1,edge*9)*.08+Math.sin(z*13+x*4+phase)*.023+Math.sin(x*17+z*2)*.013,z);uv.push(i/nx,j/nz)}for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;ids.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g}
function tubeRing(radius,tube){const g=new T.TorusGeometry(radius,tube,4,16);g.rotateX(Math.PI/2);return g}
function interior(b,group,wind){
 b.box(M.straw,-4,.11,2.5,1.22,.20,2.35);let g=cloth(1.10,1.98,.23,.2);b.add(g,M.quilt,-4,0,2.64);g.dispose();g=cloth(.85,.44,.36,1.3);b.add(g,M.quilt,-4,0,1.86);g.dispose();
 // Individual straw ends silhouette the loose bedding, rather than a rectangular bale.
 const r=random(71443);for(let i=0;i<100;i++){const x=-4+(r()-.5)*1.40,z=2.5+(r()-.5)*2.50;b.beam(M.straw,[x,.07+r()*.10,z],[x+(r()-.5)*.28,.13+r()*.07,z+(r()-.5)*.22],.009,.013)}
 const px=-2,pz=3.4;
 b.box(M.stove,px,.13,pz,.38,.21,.33);b.box(M.iron,px,.25,pz,.35,.024,.30);for(let i=0;i<8;i++){const a=i*Math.PI/4,x=px+Math.cos(a)*.065,z=pz+Math.sin(a)*.065;polygon(b,M.flame,[[x-.009,.26,z],[x+.009,.26,z],[x,.288,z+.007]],1);}
 for(const x of[-.14,.14])b.box(M.iron,px+x,.28,pz,.025,.025,.30);
 const profile=[[.00,.0],[.105,.0],[.129,.018],[.133,.16],[.125,.168],[.120,.154],[.118,.035],[0,.032]].map(a=>new T.Vector2(...a));
 g=new T.LatheGeometry(profile,16);b.add(g,M.enamel,px,.28,pz);g.dispose();
 g=tubeRing(.129,.008);b.add(g,M.rim,px,.447,pz);g.dispose();
 for(const side of[-1,1]){const x=px+side*.164;g=new T.TorusGeometry(.037,.008,4,8,Math.PI*1.7);b.add(g,M.rim,x,.398,pz,1,.62,1,0,Math.PI/2,Math.PI*.15);g.dispose();}
 g=new T.SphereGeometry(.134,16,5,0,Math.PI*2,0,Math.PI/2);b.add(g,M.enamel,px+.34,.034,pz+.08,1,.24,1,0,0,.16);g.dispose();b.box(M.rim,px+.34,.094,pz+.08,.055,.036,.024);
 // The opaque flour mixture is a small real triangulated surface, with slow swelling.
 g=new T.CircleGeometry(.117,24);g.rotateX(-Math.PI/2);const paste=M.paste.clone();paste.onBeforeCompile=s=>{s.uniforms.uTime=wind.time;s.vertexShader='uniform float uTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y+=sin(position.x*41.+uTime*1.8)*sin(position.z*36.-uTime)*.0025;');};paste.customProgramCacheKey=()=> 'v21-flour-paste';
 const mesh=new T.Mesh(g,paste);mesh.name='gently simmering low-poly flour paste';mesh.position.set(px,.409,pz);mesh.receiveShadow=true;group.add(mesh);
 for(let i=0;i<5;i++){const a=i*2.39,rr=.03+(.055*(i%2));g=new T.SphereGeometry(.010+i*.001,6,3,0,Math.PI*2,0,Math.PI/2);b.add(g,paste,px+Math.cos(a)*rr,.409,pz+Math.sin(a)*rr,1,.44,1);g.dispose()}
 // Four small transparent vapour ribbons, no lights or fullscreen postprocess.
 const steam=new T.MeshBasicMaterial({color:'#c2c3b9',transparent:true,opacity:.11,depthWrite:false,side:T.DoubleSide});
 steam.onBeforeCompile=s=>{s.uniforms.uTime=wind.time;s.vertexShader='uniform float uTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(uTime*1.15+position.y*12.)*position.y*.06;');s.fragmentShader=s.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a*=pow(max(0.,1.-abs(vUv.x-.5)*2.),2.)*sin(vUv.y*3.14159);');};steam.defines={USE_UV:''};steam.customProgramCacheKey=()=> 'v21-gentle-steam';
 for(let i=0;i<4;i++){const s=new T.Mesh(new T.PlaneGeometry(.07,.42,1,5),steam);s.name='pot vapour';s.position.set(px+(i-1.5)*.025,.66,pz);s.rotation.y=i*1.9;group.add(s)}
}
export function updateBarnDoors(chunk,angle){if(!chunk?.field.barn)return;for(const side of[-1,1]){const name=side<0?'barn-door-left':'barn-door-right',hinge=chunk.group.getObjectByName(name);if(!hinge)continue;const a=side*angle;hinge.rotation.y=a;hinge.updateMatrix();const c=chunk.colliders.find(c=>c.id===name),offset=-side*B.doorWidth/4;if(c){c.angle=a;c.x=-chunk.field.barn.x+B.doorX+side*B.doorWidth/2+Math.cos(a)*offset;c.z=-chunk.field.barn.z+B.depth/2+.10-Math.sin(a)*offset;}}}
export function makeReferenceBarn(f,level,wind){if(!f.barn)return null;const group=new T.Group(),colliders=[],b=new Batch(),r=random(f.seed^0x210cab);
 // Stubble remains geometrical close up. Root positions follow broad harvested swaths.
 const stalks=new Batch();for(let i=0;i<(level===0?6000:level===1?2600:1000);i++){let x=r()*64,z=r()*64;const cover=barnHarvest(x,z,f);if(cover<.3||barnFootprintDistance(x,z,f)<1||roadDistance(x,z,f)<2)continue;const wz=z+f.barn.z,swath=.55+.45*Math.sin(wz*2.45+Math.sin((x+f.barn.x)*.05)*.4);if(r()>cover*(.38+swath*.5))continue;const y=surfaceHeight(x,z,f)+.005;for(let j=0;j<3;j++){const xx=x+(r()-.5)*.11,zz=z+(r()-.5)*.11,h=.07+r()*.12;stalks.quad(M.straw,[xx-.009,y,zz],[xx+.009,y,zz],[xx+.014,y+h,zz+.018],[xx-.004,y+h,zz+.018],.20)}}stalks.finish(group);group.children.forEach(m=>{m.castShadow=false;m.name='harvested stubble rows'});
 const landscape=barnLandscape(f),inside=t=>t.x>=0&&t.x<64&&t.z>=0&&t.z<64,trees=landscape.trees.filter(inside),shrubs=landscape.shrubs.filter(inside);let landscapeSoft=[];
 if(trees.length||shrubs.length){const nature=makeNature({...f,trees,shrubs},f.z===-3n?2:Math.max(1,level),wind);group.add(nature.group);colliders.push(...nature.colliders);landscapeSoft=nature.softVolumes;}
 if(f.x!==1n||f.z!==-2n)return{group,colliders,softVolumes:landscapeSoft};
 const building=new T.Group();building.name='reference brick barn';building.position.set(-f.barn.x,B.y,-f.barn.z);group.add(building);
 const d=5.8,e=3.3,re=5.15,rz=-1.6,rh=9.25,dx=B.doorX,half=B.doorWidth/2;
 b.box(M.floor,0,-.015,0,23.5,.055,11.2);
 b.box(M.brick,(-12+dx-half)/2,e/2,d,12+dx-half,e,.38);b.box(M.brick,(12+dx+half)/2,e/2,d,12-dx-half,e,.38);
 b.box(M.brick,dx,3.16,d,3.8,.32,.42);b.box(M.brick,0,re/2,-d,24,re,.38);
 for(const x of[-12,12]){polygon(b,M.brick,[[x,0,-d],[x,0,d],[x,e,d],[x,rh,rz],[x,re,-d]]);polygon(b,M.brick,[[x-Math.sign(x)*.32,0,-d],[x-Math.sign(x)*.32,0,d],[x-Math.sign(x)*.32,e,d],[x-Math.sign(x)*.32,rh,rz],[x-Math.sign(x)*.32,re,-d]]);}
 // The front roof has an actual cut-out for the projecting entrance dormer.
 const roofY=z=>rh+(e-rh)*(z-rz)/(d-rz),front=d+.34,back=-d-.30,ext=12.32,cut=2.15,joinZ=1.28;
 b.quad(M.roof,[-ext,roofY(front),front],[dx-cut,roofY(front),front],[dx-cut,rh+.05,rz],[-ext,rh+.05,rz],2.5);
 b.quad(M.roof,[dx+cut,roofY(front),front],[ext,roofY(front),front],[ext,rh+.05,rz],[dx+cut,rh+.05,rz],2.5);
 b.quad(M.roof,[dx-cut,roofY(joinZ),joinZ],[dx+cut,roofY(joinZ),joinZ],[dx+cut,rh+.05,rz],[dx-cut,rh+.05,rz],2.5);
 b.quad(M.roof,[-ext,rh+.05,rz],[ext,rh+.05,rz],[ext,re-.24,back],[-ext,re-.24,back],2.5);
 const doorFront=d+.22,top=6.85,peak=8.06;
 b.box(M.door,dx,4.95,doorFront,3.80,3.78,.17);
 for(const s of[-1,1]){const x=dx+s*half;b.box(M.brick,x+s*.17,(top+e)/2,d-.30,.34,top-e,.85);polygon(b,M.brick,[[x+s*.34,e,d],[x+s*.34,top,d],[x+s*.34,roofY(joinZ),joinZ]]);b.beam(M.wood,[x,0,d+.34],[x,top,d+.34],.14,.18);}
 polygon(b,M.door,[[dx-half,top,doorFront],[dx+half,top,doorFront],[dx,peak,doorFront]]);
 for(const s of[-1,1]){b.quad(M.roof,[dx,peak+.06,d+.52],[dx+s*(half+.36),top+.06,d+.52],[dx+s*(half+.36),top+.06,joinZ-.3],[dx,peak+.06,joinZ-.3],2.5);b.beam(M.wood,[dx,peak,d+.55],[dx+s*(half+.25),top,d+.55],.12,.12);}
 // Low lintel, centre seam, continuous jambs and narrow iron straps.
 b.box(M.wood,dx,3.05,d+.36,4.14,.18,.19);b.box(M.wood,dx,top,d+.30,3.8,.11,.16);b.box(M.iron,dx,4.94,doorFront+.10,.028,3.68,.025);
 for(const h of[3.3,6.58])for(const s of[-1,1])b.box(M.iron,dx+s*.95,h,doorFront+.11,1.67,.045,.032);
 for(let x=-11.5;x<=12;x+=3.8){b.beam(M.wood,[x,e-.12,d-.3],[x,rh-.25,rz],.20,.18);b.beam(M.wood,[x,rh-.25,rz],[x,re-.18,-d+.3],.20,.18);b.beam(M.wood,[x,e-.2,d-.3],[x,re-.2,-d+.3],.19,.22);}
 for(const z of[-4.7,-2.8,.15,2.6,4.8])b.beam(M.wood,[-11.8,z<rz?re+(rh-re)*(z+d)/(rz+d)-.14:roofY(z)-.17,z],[11.8,z<rz?re+(rh-re)*(z+d)/(rz+d)-.14:roofY(z)-.17,z],.11,.14);
 b.box(M.brick,0,.12,-d,24,.24,.44);b.box(M.brick,(-12+dx-half)/2,.12,d,12+dx-half,.24,.44);b.box(M.brick,(12+dx+half)/2,.12,d,12-dx-half,.24,.44);
 // Remove the threshold's obstruction to foot traffic; doors have their own OBBs.
 const bx=-f.barn.x,bz=-f.barn.z;
 const wall=(x,z,hx,hz)=>colliders.push({kind:'obb',x:bx+x,z:bz+z,hx,hz,angle:0});
 wall(-12,0,.21,d);wall(12,0,.21,d);wall(0,-d,12,.21);wall((-12+dx-half)/2,d,(12+dx-half)/2,.22);wall((12+dx+half)/2,d,(12-dx-half)/2,.22);
 for(const side of[-1,1]){const hinge=new T.Group();hinge.name=side<0?'barn-door-left':'barn-door-right';hinge.position.set(dx+side*half,0,d+.10);const door=new Batch();door.box(M.door,-side*half/2,1.48,0,half-.02,2.96,.14);for(const y of[.30,2.64])door.box(M.iron,-side*half/2,y,.092,half-.10,.060,.038);door.beam(M.wood,[-side*.12,.26,-.12],[-side*(half-.1),2.65,-.12],.10,.055);door.box(M.iron,-side*(half-.13),1.24,.105,.044,.20,.045);door.finish(hinge);hinge.traverse(o=>{o.userData.dynamicDoor=true});building.add(hinge);colliders.push({kind:'obb',id:hinge.name,x:bx+dx+side*half/2,z:bz+d+.10,hx:half/2,hz:.12,angle:0});}
 // Broken green/dry grass at the footings, with the working entrance left clear.
 const edgeRandom=random(0x2173bc);
 for(let i=0;i<620;i++){const front=i<340,side=i>=340&&i<480,x=front?-14+edgeRandom()*28:side?-12.3-edgeRandom()*1.8:-13+edgeRandom()*26,z=front?6.15+edgeRandom()*1.5:side?-6+edgeRandom()*13:-6.15-edgeRandom()*1.6;if(front&&Math.abs(x-dx)<2.7)continue;const yy=surfaceHeight(bx+x,bz+z,f)-B.y+.012,mm=edgeRandom()<.7?M.grass:M.straw;for(let j=0;j<4;j++){const a=edgeRandom()*Math.PI*2,w=.012+edgeRandom()*.014,h=.12+edgeRandom()*.40,xx=x+(edgeRandom()-.5)*.18,zz=z+(edgeRandom()-.5)*.18;b.quad(mm,[xx-Math.cos(a)*w,yy,zz-Math.sin(a)*w],[xx+Math.cos(a)*w,yy,zz+Math.sin(a)*w],[xx+.05*Math.sin(a),yy+h,zz+.08*Math.cos(a)],[xx+.05*Math.sin(a)-.003,yy+h*.97,zz+.08*Math.cos(a)-.003],.4);}}
 interior(b,building,wind);b.finish(building);colliders.push({kind:'circle',x:bx-2,z:bz+3.4,r:.25});
 group.updateMatrixWorld(true);return{group,colliders,softVolumes:landscapeSoft};
}
