// V136-atm-lobby: the lobby behind the Hope St glass curtain wall (the ATM building), entered from the stair landing.
// Geometry/walk plan in atm136-geo.js; lighting = Blender Cycles per-vertex bake (assets/atm136/bake136.bin, ?bake=0 off).
// Unlit PS1 materials: albedo texture x baked radiance x a small normal-map relief term; polished GF marble shows a
// mirrored copy of the room through a semi-opaque floor (planar reflection without an extra render pass).
import * as T from './vendor/three.module.min.js';
import {buildLobby136,L136,resolve136,atLobbyExit136} from './atm136-geo.js?v=136b';
import {createAqua136} from './atm136-aqua.js?v=136b';
import {worldToCity} from './urban-layout.js?v=return-1';
export {L136,resolve136,atLobbyExit136};
const A=new URL('./assets/atm136/',import.meta.url).href,R=16;
// Hope-frame door test (reference-scenes hopeStreet frame is un-mirrored: hope x = -city x). Landing in front of the
// three door pairs of hopest118 glassEntrance (x 31.12, z 5.76..12.84, landing y 3.45).
export function nearAtmDoor136(wx,wz){const c=worldToCity(wx,wz),x=-c.x,z=c.z;return x>28.7&&x<31.4&&z>5.4&&z<13.2;}
const TEX={marble:[1,.8,.12],inlay:[1,.74,.15],marble2:[1,1,.12],wall:[1,1,.3],column:[1,1,.35],pebble:[1,1,.9],ceil:[1,1,.3],rattan:[1,1,.45],fabric:[1,1,.2],wood:[1,1,.3],gravel:[1.25,1,.5]};
function patch(m,nmap,relief,U){m.onBeforeCompile=sh=>{sh.uniforms.bakeOn=U.on;sh.uniforms.bakeGain=U.gain;if(nmap){sh.uniforms.nMap={value:nmap};}
 sh.vertexShader='attribute vec4 bake136;\nvarying vec4 vB136;\nvarying vec3 vN136;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvB136=bake136;vN136=normal;');
 sh.fragmentShader='varying vec4 vB136;\nvarying vec3 vN136;\nuniform float bakeOn;\nuniform float bakeGain;\n'+(nmap?'uniform sampler2D nMap;\n':'')+sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 { vec3 bk=vB136.rgb*vB136.a; bk=bk*bk*${R.toFixed(1)};
   vec3 fake=vec3(.62+.3*max(vN136.y,0.)+.12*abs(vN136.x));
   diffuseColor.rgb*=mix(fake,bk,bakeOn)*bakeGain;
   ${nmap?`vec3 nm=texture2D(nMap,vMapUv).xyz*2.-1.; diffuseColor.rgb*=clamp(1.+(nm.x*.55+nm.y*.75)*${relief.toFixed(2)},.55,1.45);`:''} }`);};
 m.customProgramCacheKey=()=>'atm136|'+(nmap?1:0)+relief;}
export async function createAtm136(progress=()=>{}){
 const q=new URLSearchParams(location.search),useBake=q.get('bake')!=='0';
 const {parts}=buildLobby136();progress(.15,'正在铺大理石地面');
 const tl=new T.TextureLoader(),load=n=>new Promise(r=>tl.load(A+n+'.webp',t=>{t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.NearestFilter;t.anisotropy=2;r(t);},undefined,()=>r(null)));
 const names=Object.keys(TEX),maps=await Promise.all(names.flatMap(n=>[load(n),load(n+'_n')])),sky=await load('sky');
 maps.forEach((t,i)=>{if(t&&i%2===0)t.colorSpace=T.SRGBColorSpace;});if(sky)sky.colorSpace=T.SRGBColorSpace;progress(.45,'正在读取烘焙光照');
 let bake=null;if(useBake){try{const r=await fetch(A+'bake136.bin?v=136b');if(r.ok)bake=new Uint8Array(await r.arrayBuffer());}catch(e){}}
 const total=Object.values(parts).reduce((a,p)=>a+p.P.length/3,0);if(bake&&bake.length!==total*4){console.warn('atm136 bake size mismatch',bake.length,total*4);bake=null;}
 const U={on:{value:bake?1:0},gain:{value:1}},scene=new T.Scene();scene.background=new T.Color(0xd9d2c4);
 const room=new T.Group();room.name='ATM lobby V136';scene.add(room);const mirror=new T.Group();mirror.name='ATM lobby floor reflection';mirror.scale.y=-1;scene.add(mirror);
 const mats={};
 for(let i=0;i<names.length;i++){const n=names[i],[c,op,rel]=TEX[n],m=new T.MeshBasicMaterial({map:maps[i*2],color:new T.Color(c,c,c)});m.name='atm136:'+n;
  if(op<1){m.transparent=true;m.opacity=op;}patch(m,maps[i*2+1],rel,U);mats[n]=m;}
 mats.metal=new T.MeshBasicMaterial({color:0x9c968a,name:'atm136:metal'});patch(mats.metal,null,0,U);
 mats.cove=new T.MeshBasicMaterial({color:new T.Color(1.25,1.05,.78),name:'atm136:cove'});
 mats.skylight=new T.MeshBasicMaterial({color:new T.Color(1.2,1.18,1.12),name:'atm136:skylight'});
 mats.lamp=new T.MeshBasicMaterial({color:new T.Color(1.6,1.4,1.1),name:'atm136:lamp'});
 mats.glass=new T.MeshBasicMaterial({color:0xcfe0e4,transparent:true,opacity:.16,depthWrite:false,name:'atm136:glass',side:T.DoubleSide});
 mats.door=new T.MeshBasicMaterial({color:0xe8ece8,transparent:true,opacity:.55,depthWrite:false,name:'atm136:door'});
 mats.acrylic=new T.MeshBasicMaterial({color:0xe4f2f2,transparent:true,opacity:.1,depthWrite:false,name:'atm136:acrylic'});
 if(sky){sky.wrapS=sky.wrapT=T.ClampToEdgeWrapping;sky.magFilter=T.LinearFilter;}
 mats.sky=new T.MeshBasicMaterial({map:sky,color:new T.Color(1.08,1.04,1.0),fog:false,name:'atm136:sky'});
 mats.street=new T.MeshBasicMaterial({color:new T.Color(1.05,1.08,1.12),name:'atm136:street'});
 let off=0;const meshes={};
 for(const[k,p]of Object.entries(parts)){const g=new T.BufferGeometry(),n=p.P.length/3;g.setAttribute('position',new T.Float32BufferAttribute(p.P,3));g.setAttribute('normal',new T.Float32BufferAttribute(p.N,3));g.setAttribute('uv',new T.Float32BufferAttribute(p.U,2));
  const b=bake?bake.subarray(off*4,(off+n)*4):new Uint8Array(n*4);off+=n;g.setAttribute('bake136',new T.BufferAttribute(b,4,true));g.setIndex(p.I);g.computeBoundingSphere();
  const m=new T.Mesh(g,mats[k]||mats.wall);m.name='atm136 '+k;m.matrixAutoUpdate=false;room.add(m);meshes[k]=m;
  if(k==='acrylic')m.renderOrder=4;
  if(!['marble','inlay','glass','door','sky','street'].includes(k)){const r=new T.Mesh(g,m.material);r.matrixAutoUpdate=false;r.name='atm136 mirror '+k;mirror.add(r);}}
 // stage 2: aquarium contents (fish/plant cutouts, refraction cube captured on the first rendered frame)
 const ld=n=>new Promise(r=>tl.load(A+n+'.webp',t=>{t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;t.minFilter=T.NearestFilter;t.generateMipmaps=false;r(t);},undefined,()=>r(null)));
 const ft=Object.fromEntries(await Promise.all(['fish_a','fish_b','plant_a','plant_b'].map(async n=>[n,await ld(n)])));
 const aqua=createAqua136(ft);room.add(aqua.group);const aquaM=new T.Group();aquaM.name='atm136 mirror aquarium';for(const m of aqua.meshes){const c=m.clone();aquaM.add(c);}mirror.add(aquaM);
 room.updateMatrixWorld(true);mirror.updateMatrixWorld(true);progress(.9,'大堂准备完成');
 return{scene,room,mirror,meshes,mats,baked:!!bake,arrival:L136.ARRIVAL,
  stats(){let t=0;room.traverse(o=>{if(o.isMesh)t+=o.geometry.index.count/3;});return{tris:t,draws:room.children.length+mirror.children.length,baked:!!bake};},
  aqua,update(t){aqua.update(t);aqua.capture(scene,[aqua.group,aquaM]);},
  dispose(){scene.traverse(o=>{if(o.isMesh&&o.parent===room)o.geometry.dispose();});Object.values(mats).forEach(m=>{m.map?.dispose();m.dispose();});aqua.dispose();Object.values(ft).forEach(t=>t?.dispose());}};
}
