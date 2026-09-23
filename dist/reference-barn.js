import * as T from './vendor/three.module.min.js';
import {REFERENCE_BARN as B,BARN_ROOFLIGHTS,barnFootprintDistance,barnLandscape} from './reference-barn-layout.js?v=30';
import {landmarkTextures as tex} from './landmark-textures.js?v=30';
import {surfaceHeight,random,roadDistance} from './world.js?v=30';
import {makeNature} from './nature.js?v=30';
const shared=new Set(),keep=x=>(shared.add(x),x);
export const isSharedReferenceBarnResource=x=>shared.has(x);
const mat=(name,color,map=null)=>keep(new T.MeshStandardMaterial({name,color,map,roughness:.94,side:T.DoubleSide}));
const M={brick:mat('reference orange brick','#b5a699',tex.brick),roof:mat('weathered slate roof','#b1b3b1',tex.slate),door:mat('blue grey vertical boards','#b6c0bb',tex.bluewood),wood:mat('old exposed rafters','#4c4030'),iron:mat('black iron hinges','#34382f'),floor:mat('earthen barn floor','#544936'),grass:mat('rough grass along brick footings','#8d9b61',tex.straw),straw:mat('loose straw bed','#c3b18a',tex.straw),quilt:mat('faded cotton blanket','#a9a99e',tex.quilt),enamel:mat('1980s speckled enamel steel','#939994',tex.enamel),rim:mat('rolled black enamel rim','#172020'),paste:mat('warm flour paste','#d0c4a2',tex.paste),stove:mat('painted camp burner','#364b3c'),flame:mat('small blue burner flame','#365db2')};
M.brick.color.setRGB(1.18,1.08,1.0);M.roof.color.setRGB(1.12,1.12,1.15);M.door.color.setRGB(.95,1.08,1.23);M.floor.color.setRGB(.91,.91,.88);M.floor.map=tex.stubble;M.wood.map=tex.bluewood;M.wood.color.setRGB(1.02,.88,.69);
Object.assign(M,{rope:mat('natural twine','#796b48'),pillow:mat('worn linen pillow','#dad1b2',tex.quilt),blanket:mat('rolled wool blanket','#717667',tex.quilt),pack:mat('olive canvas and straps','#68705a',tex.quilt),sack:mat('canvas flour and feed sacks','#b7ac88',tex.quilt),boot:mat('worn leather boots','#443b2e'),paper:mat('folded field notebook','#baae88'),stone:mat('flat kitchen hearth stones','#77756a',tex.slate),lantern:mat('warm lantern mantle','#cbb482')});M.lantern.emissive.set('#ffc87b');M.lantern.emissiveIntensity=2.0;M.rooflight=keep(new T.MeshBasicMaterial({name:'aged translucent rear rooflight',color:'#b4b9a7',transparent:true,opacity:.24,depthWrite:false,side:T.DoubleSide}));
M.flame.emissive.set('#477bee');M.flame.emissiveIntensity=.75;M.enamel.roughness=.36;M.rim.roughness=.3;M.iron.metalness=.3;M.paste.roughness=.64;
const unitBox=keep(new T.BoxGeometry(1,1,1)),unitCylinder=keep(new T.CylinderGeometry(1,1,1,12)),dummy=new T.Object3D();
class Batch{
 constructor(){this.parts=new Map()}
 add(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,uvScale=1){let a=g.index?g.toNonIndexed():g.clone();dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,rz);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();a.applyMatrix4(dummy.matrix);const uv=a.attributes.uv;if(uv&&uvScale!==1)for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*uvScale,uv.getY(i)*uvScale);if(!this.parts.has(m))this.parts.set(m,[]);this.parts.get(m).push(a)}
 box(m,x,y,z,w,h,d,rx=0,ry=0,rz=0){const g=unitBox.clone(),uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const face=Math.floor(i/4),u=face<2?d:w,v=face>=2&&face<4?d:h;uv.setXY(i,uv.getX(i)*u/(m===M.brick?2.6:2),uv.getY(i)*v/(m===M.brick?2.6:2))}this.add(g,m,x,y,z,w,h,d,rx,ry,rz);g.dispose()}
 quad(m,a,b,c,d,scale=2.6){const p=[...a,...b,...c,...a,...c,...d],g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));const w=Math.hypot(...a.map((v,i)=>v-b[i]))/scale,h=Math.hypot(...a.map((v,i)=>v-d[i]))/scale;g.setAttribute('uv',new T.Float32BufferAttribute([0,0,w,0,w,h,0,0,w,h,0,h],2));g.computeVertexNormals();g.setAttribute('rayTwoSided',new T.Uint8BufferAttribute(new Uint8Array(6).fill(1),1));this.add(g,m);g.dispose()}
 beam(m,a,b,w=.16,d=w){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),mid=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5);dummy.position.copy(mid);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());dummy.scale.set(w,v.length(),d);dummy.updateMatrix();const g=unitBox.clone().applyMatrix4(dummy.matrix);this.add(g,m);g.dispose()}
 finish(group){for(const[m,parts]of this.parts){const n=parts.reduce((a,g)=>a+g.attributes.position.count,0),p=new Float32Array(n*3),ns=new Float32Array(n*3),uv=new Float32Array(n*2),twoSided=new Uint8Array(n);let at=0;for(const g of parts){p.set(g.attributes.position.array,at*3);ns.set(g.attributes.normal.array,at*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,at*2);if(g.attributes.rayTwoSided)twoSided.set(g.attributes.rayTwoSided.array,at);at+=g.attributes.position.count;g.dispose()}const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(ns,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setAttribute('rayTwoSided',new T.BufferAttribute(twoSided,1));g.computeBoundingSphere();const mesh=new T.Mesh(g,m);mesh.name=m.name;mesh.castShadow=!m.transparent;mesh.receiveShadow=true;group.add(mesh)}}
}
function polygon(batch,m,points,scale=2.6){for(let i=1;i<points.length-1;i++){const g=new T.BufferGeometry(),a=[points[0],points[i],points[i+1]];g.setAttribute('position',new T.Float32BufferAttribute(a.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(a.flatMap(p=>[(p[0]+p[2])/scale,p[1]/scale]),2));g.computeVertexNormals();g.setAttribute('rayTwoSided',new T.Uint8BufferAttribute([1,1,1],1));batch.add(g,m);g.dispose()}}
function cloth(w,d,height,phase){const nx=8,nz=12,p=[],uv=[],ids=[];for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=(i/nx-.5)*w,z=(j/nz-.5)*d,edge=Math.min(i/nx,1-i/nx,j/nz,1-j/nz);p.push(x,height+Math.min(1,edge*9)*.08+Math.sin(z*13+x*4+phase)*.023+Math.sin(x*17+z*2)*.013,z);uv.push(i/nx,j/nz)}for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;ids.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.setAttribute('rayTwoSided',new T.Uint8BufferAttribute(new Uint8Array(p.length/3).fill(1),1));return g}
function tubeRing(radius,tube){const g=new T.TorusGeometry(radius,tube,4,16);g.rotateX(Math.PI/2);return g}
function mound(b,m,x,z,w,d,h,seed,y=0){
 const rr=random(seed),rings=5,n=24,ps=[],uv=[],ids=[];
 ps.push(x,y+h*.86,z);uv.push(.5,.5);
 for(let j=1;j<=rings;j++)for(let i=0;i<n;i++){const a=i/n*Math.PI*2,t=j/rings,rag=1+(rr()-.5)*.15,px=Math.cos(a)*w*.5*t*rag,pz=Math.sin(a)*d*.5*t*rag;ps.push(x+px,y+h*Math.pow(Math.max(0,1-t*t),.6)*(.82+rr()*.24)+(j===rings?.007:rr()*.05),z+pz);uv.push((px/w+.5)*w/1.2,(pz/d+.5)*d/1.2);}
 for(let i=0;i<n;i++)ids.push(0,1+(i+1)%n,1+i);
 for(let j=0;j<rings-1;j++)for(let i=0;i<n;i++){const a=1+j*n+i,c=1+j*n+(i+1)%n;ids.push(a,c,a+n,c,c+n,a+n);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.setAttribute('rayTwoSided',new T.Uint8BufferAttribute(new Uint8Array(ps.length/3).fill(1),1));b.add(g,m);g.dispose();
 // Coarse intersecting straw blades break the silhouette and cover the base.
 for(let i=0;i<Math.ceil(w*d*36);i++){const a=rr()*Math.PI*2,t=Math.sqrt(rr()),xx=x+Math.cos(a)*w*.5*t,zz=z+Math.sin(a)*d*.5*t,yy=y+h*Math.pow(Math.max(0,1-t*t),.6)*.9+.035,len=.14+rr()*.34,dir=rr()*Math.PI*2;const dx=Math.cos(dir)*len,dz=Math.sin(dir)*len;
 b.quad(m,[xx-dx*.5,yy-.02,zz-dz*.5],[xx-dx*.5+.019,yy,zz-dz*.5],[xx+dx*.5,yy+.055,zz+dz*.5],[xx+dx*.5-.012,yy+.026,zz+dz*.5],.55);}
}
function rounded(b,m,x,y,z,w,h,d,rot=0){const g=new T.SphereGeometry(1,10,6);b.add(g,m,x,y,z,w*.5,h*.5,d*.5,0,rot);g.dispose();}
function bale(b,x,y,z,w=1.35,h=.56,d=.78,rot=0){
 const g=new T.BoxGeometry(w,h,d,5,3,3),p=g.attributes.position,rr=random(Math.round((x+30)*83+(z+20)*171+y*122));
 // Round compressed bale edges; duplicate face vertices use the same displacement,
 // keeping the block closed instead of opening random black cracks at every face.
 for(let i=0;i<p.count;i++){const v=new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)),r=.048,core=new T.Vector3(Math.max(-w/2+r,Math.min(w/2-r,v.x)),Math.max(-h/2+r,Math.min(h/2-r,v.y)),Math.max(-d/2+r,Math.min(d/2-r,v.z))),delta=v.clone().sub(core).normalize().multiplyScalar(r),noise=Math.sin(v.x*27.1+v.y*41.7+v.z*19.3+x*3+z)*.012;core.add(delta).addScaledVector(v.clone().normalize(),noise);p.setXYZ(i,core.x,core.y,core.z);}g.computeVertexNormals();b.add(g,M.straw,x,y+h*.5,z,1,1,1,0,rot);g.dispose();
 for(const side of[-.31,.31]){const xx=x+side*w;for(const dz of[-d*.5,d*.5])b.beam(M.rope,[xx,y+.03,z+dz],[xx,y+h-.02,z+dz],.012);b.beam(M.rope,[xx,y+h+.015,z-d*.5],[xx,y+h+.015,z+d*.5],.013);}
}
function crate(b,x,y,z,w=.7,h=.52,d=.55){
 for(const xx of[-w*.45,w*.45])for(const zz of[-d*.45,d*.45])b.box(M.wood,x+xx,y+h*.5,z+zz,.065,h,.065);
 for(let k=0;k<4;k++){const yy=y+.06+k*(h-.09)/3;for(const zz of[-d*.5,d*.5])b.box(M.wood,x,yy,z+zz,w,.092,.034);for(const xx of[-w*.5,w*.5])b.box(M.wood,x+xx,yy,z,.035,.092,d);}
 b.box(M.wood,x,y+.025,z,w,.05,d);
}
function bucket(b,m,x,y,z,r=.18,h=.32){const g=new T.LatheGeometry([[0,0],[r*.78,0],[r,h],[r-.018,h],[r*.78-.018,.024],[0,.024]].map(p=>new T.Vector2(...p)),12);b.add(g,m,x,y,z);g.dispose();let t=tubeRing(r,.009);b.add(t,M.iron,x,y+h,z);t.dispose();t=new T.TorusGeometry(r*.97,.008,4,12,Math.PI);b.add(t,M.iron,x,y+h,z);t.dispose();}
function interior(b,group,wind){
 const rr=random(71443);
 // Loose agricultural storage along the back wall. Irregular stepped ends and
 // fallen straw tie the sleeping bay into the working barn, at human scale.
 for(let row=0;row<3;row++)for(let col=0;col<5;col++){const n=col<3?3:col===3?2:1;for(let layer=0;layer<n;layer++)bale(b,-9.8+col*1.42+layer*.10,layer*.56,-4.55+row*.82,1.38,.55,.78,(rr()-.5)*.07);}
 mound(b,M.straw,-7.0,-2.1,8.0,3.7,.28,911);
 mound(b,M.straw,-5.25,1.12,3.25,4.2,.37,813);
 // Two bales shelter the head; the bed is depressed into deep loose straw.
 bale(b,-5.65,0,-.86,1.55,.55,.78,.05);bale(b,-7.05,0,.10,.78,.56,1.45,-.06);
 let g=cloth(1.22,2.13,.38,.8);b.add(g,M.quilt,-5.35,0,1.65,1,1,1,0,-.08);g.dispose();
 // Rolled edge and sagging underside supply quilt thickness, not a flat card.
 rounded(b,M.quilt,-5.35,.405,1.65,1.18,.20,2.12,-.08);
 g=cloth(1.23,2.15,.49,.8);b.add(g,M.quilt,-5.35,0,1.65,1,1,1,0,-.08);g.dispose();
 rounded(b,M.pillow,-5.40,.63,.87,.85,.23,.48,-.13);
 rounded(b,M.blanket,-5.16,.64,2.50,1.1,.24,.42,.08);
 // Boots, pack, canteen and a bedside crate have contact and a common use.
 crate(b,-3.72,0,.10,.72,.62,.62);
 rounded(b,M.pack,-6.8,.47,-.15,.48,.85,.31,.15);b.box(M.pack,-6.8,.54,.015,.36,.28,.10,0,.15);
 for(const side of[-1,1]){b.beam(M.iron,[-6.8+side*.22,.06,-.30],[-6.8+side*.22,.88,-.35],.018);b.beam(M.rope,[-6.8+side*.13,.17,.02],[-6.8+side*.13,.77,-.08],.038,.015);}
 for(const x of[-4.15,-3.82]){rounded(b,M.boot,x,.14,1.27,.24,.24,.48,.18);b.box(M.boot,x,.24,1.14,.19,.35,.20,0,.18);}
 bucket(b,M.enamel,-3.93,.64,.18,.055,.092);
 b.box(M.paper,-3.54,.652,.12,.24,.036,.18,0,.12);
 // A real lantern provides the warm local light configured in main.js.
 const lx=-3.68,lz=-.09;
 g=new T.CylinderGeometry(.095,.12,.12,10);b.add(g,M.stove,lx,.70,lz);g.dispose();
 g=new T.CylinderGeometry(.072,.09,.22,10);b.add(g,M.lantern,lx,.87,lz);g.dispose();
 g=new T.ConeGeometry(.12,.09,10);b.add(g,M.iron,lx,1.025,lz);g.dispose();
 for(const side of[-1,1])b.beam(M.iron,[lx+side*.088,.73,lz],[lx+side*.088,1.00,lz],.013);
 g=new T.TorusGeometry(.105,.011,4,10,Math.PI);b.add(g,M.iron,lx,1.04,lz);g.dispose();
 // Kitchen on a clear stone hearth, separated from bedding and doorway aisle.
 const px=-.8,pz=3.8;
 for(let i=0;i<6;i++)b.box(M.stone,px+(i%3-1)*.41,.026,pz+(Math.floor(i/3)-.5)*.47,.4,.055,.45,0,(rr()-.5)*.06);
 g=new T.CylinderGeometry(.19,.195,.22,12);b.add(g,M.stove,px,.17,pz);g.dispose();
 g=new T.CylinderGeometry(.09,.12,.13,12);b.add(g,M.iron,px,.345,pz);g.dispose();
 for(const a of[0,2.094,4.188])b.beam(M.iron,[px+Math.cos(a)*.11,.34,pz+Math.sin(a)*.11],[px+Math.cos(a)*.21,.44,pz+Math.sin(a)*.21],.025);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=px+Math.cos(a)*.09,z=pz+Math.sin(a)*.09;polygon(b,M.flame,[[x-.012,.40,z],[x+.012,.40,z],[x,.443,z+.01]],1);}
 const potY=.445,pr=.205;
 g=new T.LatheGeometry([[0,0],[.17,0],[pr,.025],[pr,.235],[.191,.248],[.183,.230],[.180,.032],[0,.032]].map(a=>new T.Vector2(...a)),16);b.add(g,M.enamel,px,potY,pz);g.dispose();
 g=tubeRing(.201,.010);b.add(g,M.rim,px,potY+.241,pz);g.dispose();
 for(const side of[-1,1]){g=new T.TorusGeometry(.057,.011,4,10,Math.PI*1.7);b.add(g,M.rim,px+side*.246,potY+.18,pz,1,.66,1,0,Math.PI/2,Math.PI*.15);g.dispose();}
 g=new T.SphereGeometry(.203,16,5,0,Math.PI*2,0,Math.PI/2);b.add(g,M.enamel,px+.40,.074,pz+.08,1,.25,1,0,0,.12);g.dispose();b.box(M.rim,px+.40,.153,pz+.08,.074,.039,.03);
 g=new T.CircleGeometry(.182,24);g.rotateX(-Math.PI/2);const paste=M.paste.clone();paste.onBeforeCompile=s=>{s.uniforms.uTime=wind.time;s.vertexShader='uniform float uTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y+=sin(position.x*27.+uTime*1.8)*sin(position.z*31.-uTime)*.004;');};paste.customProgramCacheKey=()=> 'v22-flour-paste';
 const mesh=new T.Mesh(g,paste);mesh.name='gently simmering low-poly flour paste';mesh.position.set(px,potY+.211,pz);mesh.receiveShadow=true;group.add(mesh);
 for(let i=0;i<6;i++){const a=i*2.39,r=.04+.067*(i%2);g=new T.SphereGeometry(.016+i*.001,6,3,0,Math.PI*2,0,Math.PI/2);b.add(g,paste,px+Math.cos(a)*r,potY+.209,pz+Math.sin(a)*r,1,.50,1);g.dispose();}
 b.beam(M.wood,[px-.1,potY+.18,pz],[px+.19,potY+.37,pz-.16],.016);rounded(b,M.wood,px-.09,potY+.194,pz,.04,.015,.06);
 // Low preparation bench, flour bag, water pail and used dishes.
 const tx=-2.75,tz=4.45;
 b.box(M.wood,tx,.79,tz,1.18,.08,.55);for(const x of[-.48,.48])for(const z of[-.19,.19])b.box(M.wood,tx+x,.39,tz+z,.065,.78,.065);
 rounded(b,M.sack,tx-.34,1.04,tz,.42,.48,.31,.06);b.beam(M.rope,[tx-.48,1.24,tz],[tx-.19,1.24,tz],.016);
 bucket(b,M.enamel,tx+.13,.835,tz,.14,.085);bucket(b,M.enamel,tx+.43,.835,tz-.11,.056,.105);
 b.box(M.wood,tx+.10,.841,tz+.13,.33,.014,.21,0,.10);b.beam(M.iron,[tx+.05,.86,tz+.1],[tx+.3,.86,tz+.18],.016,.009);
 bucket(b,M.iron,-2.2,0,3.45,.22,.36);rounded(b,M.pack,-3.2,.28,3.75,.36,.55,.24,-.1);
 b.box(M.wood,-1.95,.43,2.65,.39,.07,.37);for(const x of[-.13,.13])for(const z of[-.12,.12])b.beam(M.wood,[-1.95+x,.40,2.65+z],[-1.95+x*1.4,.02,2.65+z*1.4],.045);
 // Working-barn zone: trough and rack, handcart, leaning tools, timber and sacks.
 const rz=-4.48;
 b.box(M.wood,8.1,.40,rz,4.6,.14,.62);for(const z of[-.33,.33])b.box(M.wood,8.1,.66,rz+z,4.6,.47,.065);for(const x of[5.8,10.4])b.box(M.wood,x,.65,rz,.07,.48,.66);
 for(const x of[6.1,7.4,8.7,10]){b.box(M.wood,x,.20,rz,.13,.4,.47);b.beam(M.wood,[x,.78,rz-.1],[x,2.03,rz-.59],.068);}
 for(const y of[1.12,1.54,1.96])b.beam(M.wood,[5.8,y,rz-.1-(y-.78)*.39],[10.4,y,rz-.1-(y-.78)*.39],.066);
 for(let i=0;i<5;i++){bale(b,6.4+i*.85,0,-2.8,.78,.52,.75,(rr()-.5)*.24);}
 for(let i=0;i<6;i++)b.box(M.wood,11.05+(i%3)*.12,.9,-1.3+Math.floor(i/3)*.2,.16,1.85,.055,0,0,-.2);
 // Ladder feet planted on the floor, top against the rear wall.
 for(const x of[2.5,3.1])b.beam(M.wood,[x,.03,-4.32],[x,3.5,-5.54],.065);
 for(let i=0;i<10;i++){const y=.24+i*.33,z=-4.32-(y-.03)*1.22/3.47;b.beam(M.wood,[2.5,y,z],[3.1,y,z],.04);}
 for(let i=0;i<3;i++){const x=10.45+i*.36;b.beam(M.wood,[x,.08,.9],[x+.20,1.84,1.23],.028);if(i===0)b.box(M.iron,x,.13,.92,.22,.27,.035,.15);else for(let j=0;j<4;j++)b.beam(M.iron,[x+(j-1.5)*.052,.03,.92],[x+(j-1.5)*.052,.29,.93],.013);}
 // Small wooden handcart on an iron-rimmed wheel.
 const cx=8.45,cz=.0;
 b.box(M.wood,cx,.55,cz,1.0,.10,1.27);for(const x of[-.52,.52])b.box(M.wood,cx+x,.78,cz,.06,.42,1.3);b.box(M.wood,cx,.78,cz-.65,1.04,.42,.06);
 g=new T.TorusGeometry(.30,.047,5,16);b.add(g,M.iron,cx,.32,cz-.56,1,1,1,0,Math.PI/2);g.dispose();
 for(let i=0;i<6;i++){const a=i*Math.PI/3;b.beam(M.wood,[cx,.32,cz-.56],[cx,.32+Math.cos(a)*.28,cz-.56+Math.sin(a)*.28],.022);}
 for(const side of[-1,1]){b.beam(M.wood,[cx+side*.39,.48,cz-.5],[cx+side*.5,.82,cz+1.45],.065);b.beam(M.iron,[cx+side*.39,.48,cz+.35],[cx+side*.39,.015,cz+.58],.035);}
 mound(b,M.straw,cx,cz,.93,1.2,.25,187,.6);
 crate(b,10.75,0,3.3,1.04,.69,.74);crate(b,10.68,.7,3.28,.75,.45,.64);
 for(const p of[[9.45,3.72],[9.99,4.45],[10.5,4.51]])rounded(b,M.sack,p[0],.36,p[1],.57,.75,.50,rr()*.3);
 // Accumulated straw hugs stores and footings; the trampled centre stays legible.
 for(let i=0;i<850;i++){const x=-11.5+rr()*23,z=-5.45+rr()*10.9;if(Math.abs(x-3.1)<2.3&&z>-.5)continue;if(Math.abs(x)<5&&Math.abs(z)<2&&rr()<.78)continue;const a=rr()*6.283,len=.12+rr()*.35,y=.019;const dx=Math.cos(a)*len,dz=Math.sin(a)*len;b.quad(M.straw,[x,y,z],[x+.014,y,z+.006],[x+dx,y+.018,z+dz],[x+dx-.010,y+.011,z+dz],.52);}
 const steam=new T.MeshBasicMaterial({color:'#d1d5cb',transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide});steam.defines={USE_UV:''};
 steam.onBeforeCompile=s=>{s.uniforms.uTime=wind.time;s.vertexShader='uniform float uTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(uTime*1.4+position.y*8.)*position.y*.10;');s.fragmentShader=s.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a*=pow(max(0.,1.-abs(vUv.x-.5)*2.),2.)*sin(vUv.y*3.14159);');};steam.customProgramCacheKey=()=> 'v22-pot-steam';
 for(let i=0;i<3;i++){const s=new T.Mesh(new T.PlaneGeometry(.12,.68,1,5),steam);s.name='pot vapour';s.position.set(px+(i-1)*.07,1.00,pz);s.rotation.y=i*2.1;group.add(s);}
}
export function updateBarnDoors(chunk,angle){if(!chunk?.field.barn)return;for(const side of[-1,1]){const name=side<0?'barn-door-left':'barn-door-right',hinge=chunk.group.getObjectByName(name);if(!hinge)continue;const a=side*angle;hinge.rotation.y=a;hinge.updateMatrix();const c=chunk.colliders.find(c=>c.id===name),offset=-side*B.doorWidth/4;if(c){c.angle=a;c.x=-chunk.field.barn.x+B.doorX+side*B.doorWidth/2+Math.cos(a)*offset;c.z=-chunk.field.barn.z+B.depth/2+.10-Math.sin(a)*offset;}}}
export function makeReferenceBarn(f,level,wind){if(!f.barn)return null;const group=new T.Group(),colliders=[],b=new Batch(),r=random(f.seed^0x210cab);
 const landscape=barnLandscape(f),inside=t=>t.x>=0&&t.x<64&&t.z>=0&&t.z<64,trees=landscape.trees.filter(inside),shrubs=landscape.shrubs.filter(inside);let landscapeSoft=[];
 if(trees.length||shrubs.length){const nature=makeNature({...f,trees,shrubs},f.z===-3n?2:Math.max(1,level),wind);group.add(nature.group);colliders.push(...nature.colliders);landscapeSoft=nature.softVolumes;}
 if(f.x!==1n||f.z!==-2n)return{group,colliders,softVolumes:landscapeSoft};
 const building=new T.Group();building.name='reference brick barn';building.position.set(-f.barn.x,B.y,-f.barn.z);group.add(building);
 const d=5.8,e=3.3,re=5.15,rz=-1.6,rh=9.25,dx=B.doorX,half=B.doorWidth/2;
 b.box(M.floor,0,-.015,0,23.5,.055,11.2);
 b.box(M.brick,(-12+dx-half)/2,e/2,d,12+dx-half,e,.38);b.box(M.brick,(12+dx+half)/2,e/2,d,12-dx-half,e,.38);
 b.box(M.brick,dx,3.16,d,3.8,.32,.42);b.box(M.brick,0,re/2,-d,24,re,.38);
 for(const x of[-12,12]){const points=xx=>[[xx,0,-d],[xx,0,d],[xx,e,d],[xx,rh,rz],[xx,re,-d]],outer=points(x),inner=points(x-Math.sign(x)*.32);if(x>0)outer.reverse();else inner.reverse();polygon(b,M.brick,outer);polygon(b,M.brick,inner);}
 // The front roof has an actual cut-out for the projecting entrance dormer.
 const roofY=z=>rh+(e-rh)*(z-rz)/(d-rz),front=d+.34,back=-d-.30,ext=12.32,cut=2.15,joinZ=1.28;
 b.quad(M.roof,[-ext,roofY(front),front],[dx-cut,roofY(front),front],[dx-cut,rh+.05,rz],[-ext,rh+.05,rz],2.5);
 b.quad(M.roof,[dx+cut,roofY(front),front],[ext,roofY(front),front],[ext,rh+.05,rz],[dx+cut,rh+.05,rz],2.5);
 b.quad(M.roof,[dx-cut,roofY(joinZ),joinZ],[dx+cut,roofY(joinZ),joinZ],[dx+cut,rh+.05,rz],[dx-cut,rh+.05,rz],2.5);
 const rearY=z=>re+(z+d)*(rh-re)/(rz+d);
 const roofX=[-ext,...BARN_ROOFLIGHTS.flatMap(p=>[p.x-p.width*.5,p.x+p.width*.5]),ext].sort((a,b)=>a-b),roofZ=[back,-4.58,-3.22,rz];
 for(let i=0;i<roofX.length-1;i++)for(let j=0;j<roofZ.length-1;j++){
  const x1=roofX[i],x2=roofX[i+1],z1=roofZ[j],z2=roofZ[j+1],pane=BARN_ROOFLIGHTS.some(p=>Math.abs((x1+x2)*.5-p.x)<p.width*.49&&Math.abs((z1+z2)*.5-p.z)<p.depth*.49);
  b.quad(pane?M.rooflight:M.roof,[x1,rearY(z2)+.05,z2],[x2,rearY(z2)+.05,z2],[x2,rearY(z1)+.05,z1],[x1,rearY(z1)+.05,z1],2.5);
  if(!pane)b.quad(M.wood,[x1,rearY(z1)-.10,z1],[x2,rearY(z1)-.10,z1],[x2,rearY(z2)-.10,z2],[x1,rearY(z2)-.10,z2],1.7);
 }
 for(const p of BARN_ROOFLIGHTS){for(const side of[-1,1]){const x=p.x+side*p.width*.5;b.beam(M.wood,[x,rearY(p.z-p.depth*.5)-.02,p.z-p.depth*.5],[x,rearY(p.z+p.depth*.5)-.02,p.z+p.depth*.5],.055);}for(const side of[-1,1]){const z=p.z+side*p.depth*.5;b.beam(M.wood,[p.x-p.width*.5,rearY(z)-.02,z],[p.x+p.width*.5,rearY(z)-.02,z],.055);}}

 // Separate inward-facing wooden boarding beneath the exterior slate.
 const under=(a,c,d,e)=>b.quad(M.wood,[a[0],a[1]-.10,a[2]],[e[0],e[1]-.10,e[2]],[d[0],d[1]-.10,d[2]],[c[0],c[1]-.10,c[2]],1.7);
 under([-12,roofY(5.8),5.8],[dx-cut,roofY(5.8),5.8],[dx-cut,rh,rz],[-12,rh,rz]);
 under([dx+cut,roofY(5.8),5.8],[12,roofY(5.8),5.8],[12,rh,rz],[dx+cut,rh,rz]);
 under([dx-cut,roofY(joinZ),joinZ],[dx+cut,roofY(joinZ),joinZ],[dx+cut,rh,rz],[dx-cut,rh,rz]);

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
 interior(b,building,wind);b.finish(building);colliders.push({kind:'circle',x:bx-.8,z:bz+3.8,r:.38});wall(-7,-3.6,4.0,1.7);wall(-5.35,1.5,.75,1.4);wall(-3.72,.10,.4,.35);wall(-2.75,4.45,.64,.32);wall(8.1,-3.95,2.5,1.25);wall(8.45,.35,.64,1.5);wall(10.2,3.9,1.3,1.0);
 group.updateMatrixWorld(true);return{group,colliders,softVolumes:landscapeSoft};
}
