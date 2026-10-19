// V135-capital ④-1 crowd (notes/plan-v135-capital.md §3/§4): first visible stage of the pedestrian pipeline.
// Assets: assets/crowd135/crowd135.bin from bc/scripts/crowd135/bodies135.py (Blender 5.1: 12 PS1 bodies = 4 body types x
// 3 silhouettes on one 19-bone V75 hierarchy, one shared walk cycle 24 f + idle 12 f, armature-deformed per frame in
// Blender and stored as int16 positions + int8 normals) and 8 generated front faces assets/crowd135/face_<k>.png (128²,
// no painted ears; art-v135crowd + scripts/crowd135/faces135.py). Each head = front-UV'd head mesh from the bin turned into a
// whole head by retro-head130-gen retrofitSkinnedHead130 (generated rear band + modelled ears), riding the baked head-bone
// matrix. CPU only: a frame change copies one baked frame into the body's position/normal arrays (24 Hz stepped pose like
// the V75 cast) — no GPU skinning (SwiftShader drops the context on skinned meshes here).
// Seeds: person = hash(block, slot) -> {body type, silhouette, face, top/bottom/shoe/coat colours, lane, speed, phase}; the
// same block always brings back the same people.
// ④-2 (135y): bodies ~400-444 tris with cloth uv (metres); clothing = cloth135.png pattern atlas (12 tiles: R shading, G
// accent mask) dyed per person with two colours in the body shader; 24 faces; rigid props from the bin (backpack, satchel,
// 3 shopping bags, phone, cap, beanie) each riding its baked bone matrix (props135.png). Population: the SoHo street fair blocks (-2,0) (-2,1), walking strip
// |x| < 3.3 between the stall rows, z 21..91 in each block frame (road centre x = 0). ?crowd=0 turns it off.
import * as T from './vendor/three.module.min.js';
import {retrofitSkinnedHead130} from './retro-head130-gen.js';
import {cityToWorld,CITY_ANGLE} from './urban-layout.js?v=return-1';
import {roadHeight} from './urban-streets.js?v=135t';
import {EXIT_CITY_Y as Y} from './exit-route.js?v=60';
const A=new URL('./assets/crowd135/',import.meta.url).href,V='135y';
const OFF=typeof location!=='undefined'&&/[?&]crowd=0\b/.test(location.search);
export const CROWD135_FACES={
 m1:{g:'m',hairY:a=>Math.cos(a)<-.2?.34:.62},m2:{g:'m',hairY:a=>Math.cos(a)<-.2?.4:.66,beard:.22,nape:.3},m3:{g:'m',hairY:a=>Math.cos(a)<-.2?.36:.62,hairColor:0xb9b6ae},
 f1:{g:'f',long:1,hairY:a=>.04},f2:{g:'f',hairY:a=>Math.cos(a)<-.2?.36:.6},f3:{g:'f',long:1,hairY:a=>.06},
 c1:{g:'c',hairY:a=>Math.cos(a)<-.2?.34:.6},c2:{g:'c',long:1,hairY:a=>Math.cos(a)<-.2?.22:.5},
 m4:{g:'m',hairY:a=>Math.cos(a)<-.2?.36:.64},m5:{g:'m',bald:1,hairY:a=>.9,beard:.18},m6:{g:'m',hairY:a=>Math.cos(a)<-.2?.36:.62,beard:.26,nape:.3},
 m7:{g:'m',hairY:a=>Math.cos(a)<-.2?.36:.62,hairColor:0xa9a8a4},m8:{g:'m',hairY:a=>Math.cos(a)<-.2?.42:.7},m9:{g:'m',hairY:a=>Math.cos(a)<-.2?.36:.62,beard:.22},
 f4:{g:'f',hairY:a=>Math.cos(a)<-.2?.4:.62},f5:{g:'f',long:1,hairY:a=>Math.cos(a)<-.2?.22:.3},f6:{g:'f',hairY:a=>Math.cos(a)<-.2?.3:.62},
 f7:{g:'f',long:1,hairY:a=>.04},f8:{g:'f',long:1,scarf:1,hairY:a=>.02},f9:{g:'f',long:1,hairY:a=>.1},
 c3:{g:'c',long:1,hairY:a=>.06},c4:{g:'c',hairY:a=>Math.cos(a)<-.2?.34:.6},c5:{g:'c',long:1,hairY:a=>.06},c6:{g:'c',hairY:a=>Math.cos(a)<-.2?.34:.62}};
const FACE_BY_TYPE={man:['m1','m2','m3','m4','m5','m6','m7','m8','m9'],woman:['f1','f2','f3','f4','f5','f6','f7','f8','f9'],
 heavy:['m1','m2','m3','m5','m6','m7','f1','f2','f5','f9'],child:['c1','c2','c3','c4','c5','c6']},GIRLS=['c2','c3','c5'];
// clothing atlas (textures135.py): tile index -> pattern; weights per garment slot; dyes A (base) / B (accent, the mask's dark part)
const TILE=['plain','jersey','breton','gingham','tartan','denim','herringbone','floral','polka','corduroy','camo','tropical'];
const TWO=new Set([2,3,4,7,8,10,11]);
const W_TOP=[[0,.3],[1,.14],[2,.08],[3,.1],[4,.08],[7,.08],[8,.06],[10,.04],[11,.06],[5,.06]],W_BOT=[[0,.25],[5,.45],[9,.15],[6,.08],[10,.07]],
 W_SKIRT=[[0,.35],[5,.15],[4,.2],[7,.15],[8,.15]],W_COAT=[[0,.4],[6,.3],[4,.12],[9,.12],[10,.06]];
const LIGHT=[0xe8e4d8,0xf2efe6,0xc9ced6,0xbcd0e2,0xe9c9cf,0xd9cf9e,0xd6dccb],DARK=[0x1f2a44,0x8c2a2a,0x1b1b1d,0x2a4d2f,0x5e2236,0xb98a24,0x2d6b6b,0x3f5f8a];
const DENIM=[0x4a6a96,0x2f4a6e,0x23344e,0x6c8ab0,0x2b2b30],CORD=[0x8a6a44,0xb59a6a,0x5a4a34,0x56603a,0x7b2e3a],
 CAMO=[[0xb8ae86,0x4f5536],[0x9a9a8a,0x3a3c40],[0xc2a77a,0x6b5536]];
const PROP_TINT=[0xffffff,0xffffff,0x6f8bc0,0xc06a6a,0x5a5a62,0x7d9a62,0xe0c060];
const TOP=[0x1f2a44,0x1b1b1d,0x6b6e72,0xd9d6cc,0x9b2b2b,0x56603a,0xc79a2e,0x3f5f8a,0x5e2236,0xd28a9c,0x2d6b6b,0xe8e4d8,0x8a8f96,0x2a4d2f];
const BOTTOM=[0x2f4a6e,0x23344e,0x1c1c1e,0xb5a27c,0x5a5d61,0x3b3f46,0x6f5a44,0x41536b];
const SHOE=[0xe6e4de,0x1a1a1a,0x5b3b26,0x6d6f72,0x2b2b2f,0x8a6a4a];
const COAT=[0xa77c4f,0x1d1d1f,0x3a3c40,0x22304a,0x4f5536,0x6e2a2a,0x8c8478];
const SKIRT=[0x1c1c1e,0x7b2e3a,0x2f4a6e,0xc9b48a,0x3d5a4a,0x6a4f7d];
const h32=(a,b=0)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1);h^=h>>>15;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);return(h^(h>>>16))>>>0;};
const r01=(a,b)=>h32(a,b)/4294967296;
let libP=null;
export function loadCrowd135(){return libP??=(async()=>{
 const buf=await (await fetch(A+'crowd135.bin?v='+V)).arrayBuffer(),n=new DataView(buf).getUint32(0,true);
 const meta=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,n))),base=4+n;
 const view=(C,[o,l])=>new C(buf,base+o,l/C.BYTES_PER_ELEMENT);
 const loader=new T.TextureLoader(),faces={};
 await Promise.all(Object.keys(CROWD135_FACES).map(async k=>{const t=await loader.loadAsync(A+'face_'+k+'.png?v='+V);t.colorSpace=T.SRGBColorSpace;t.flipY=false;t.minFilter=t.magFilter=T.NearestFilter;t.generateMipmaps=false;faces[k]=t;}));
 const tl=async(f,srgb)=>{const t=await loader.loadAsync(A+f+'?v='+V);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.flipY=false;t.minFilter=t.magFilter=T.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;};
 const[cloth,props]=await Promise.all([tl('cloth135.png',false),tl('props135.png',true)]);
 const skin={},hair={};for(const[k,t]of Object.entries(faces)){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(t.image,0,0);
  const med=(x,y,w,h)=>{const d=g.getImageData(x,y,w,h).data,ch=[[],[],[]];for(let i=0;i<d.length;i+=4)for(let j=0;j<3;j++)ch[j].push(d[i+j]);return ch.map(a=>a.sort((p,q)=>p-q)[a.length>>1]);};
  const sk=[...med(28,72,12,14),...med(88,72,12,14)],s3=[0,1,2].map(j=>(sk[j]+sk[j+3])/2);skin[k]=new T.Color().setRGB(s3[0]/255,s3[1]/255,s3[2]/255,T.SRGBColorSpace);
  const hc=CROWD135_FACES[k].long?med(1,50,8,40):med(44,0,40,5);hair[k]=CROWD135_FACES[k].bald?skin[k].getHex(T.SRGBColorSpace):(hc[0]<<16)|(hc[1]<<8)|hc[2];}
 const bodies=meta.bodies.map(b=>({...b,idx:new T.BufferAttribute(view(Uint16Array,b.index),1),reg:view(Uint8Array,b.region),P:view(Int16Array,b.pos),N:view(Int8Array,b.nrm),UV:new T.BufferAttribute(view(Float32Array,b.uv),2)}));
 // body shader: two per-vertex dyes + pattern tile offset; the pattern repeats every 0.40 x 0.80 m inside its 64x128 tile
 const mat=new T.MeshLambertMaterial();mat.name='crowd135 body';
 mat.onBeforeCompile=sh=>{sh.uniforms.clothMap={value:cloth};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 cA;attribute vec3 cB;attribute vec2 cuv;attribute vec2 ctile;varying vec3 vCA;varying vec3 vCB;varying vec2 vCuv;varying vec2 vTile;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvCA=cA;vCB=cB;vCuv=cuv;vTile=ctile;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D clothMap;varying vec3 vCA;varying vec3 vCB;varying vec2 vCuv;varying vec2 vTile;')
   .replace('#include <map_fragment>','vec2 ctu=vTile+(fract(vCuv*vec2(2.5,1.25))*vec2(62.,126.)+1.)/vec2(256.,384.);vec4 ctx=texture2D(clothMap,ctu);diffuseColor.rgb*=mix(vCA,vCB,ctx.g)*ctx.r;');};
 mat.customProgramCacheKey=()=>'crowd135y';
 const propMats={};const propMat=tint=>propMats[tint]??=Object.assign(new T.MeshLambertMaterial({map:props,color:tint}),{name:'crowd135 prop'});
 const acc={};for(const[type,H]of Object.entries(meta.heads)){acc[type]={};for(const[n,a]of Object.entries(H.acc||{})){const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(view(Float32Array,a.pos),3));g.setAttribute('normal',new T.BufferAttribute(view(Float32Array,a.nrm),3));g.setAttribute('uv',new T.BufferAttribute(view(Float32Array,a.uv),2));
  acc[type][n]={geo:g,tris:a.verts/3,mats:a.bone==='head'?view(Float32Array,H.mat):view(Float32Array,H.bones[a.bone])};}}
 const heads={},headMats={};
 function head(type,fk){const key=type+'/'+fk;if(heads[key])return heads[key];
  const H=meta.heads[type],pos=view(Float32Array,H.pos),uv=view(Float32Array,H.uv),ix=view(Uint16Array,H.index);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos.slice(),3));g.setAttribute('uv',new T.BufferAttribute(uv.slice(),2));g.setIndex(new T.BufferAttribute(ix.slice(),1));
  g.computeVertexNormals();const flat=g.toNonIndexed();g.dispose();const c=flat.attributes.position.count;
  flat.setAttribute('skinIndex',new T.Uint16BufferAttribute(new Uint16Array(c*4),4));flat.setAttribute('skinWeight',new T.Float32BufferAttribute(new Float32Array(c*4).map((_,i)=>i%4?0:1),4));
  const fm=headMats['f:'+fk]??=Object.assign(new T.MeshLambertMaterial({map:faces[fk]}),{name:'crowd135 face '+fk});
  const bone=new T.Bone();bone.name='head';const holder=new T.Group();holder.add(bone);const sk=new T.SkinnedMesh(flat,fm);holder.add(sk);sk.bind(new T.Skeleton([bone]));
  const F=CROWD135_FACES[fk],r=retrofitSkinnedHead130(T,sk,{phi0:100,cheek:[.22,.56,.32,.68],hairTexture:null,hairY:F.hairY,hairColor:F.hairColor??hair[fk],
   ears:F.long?false:undefined,earV:[.36,.58],earZ:-.12,beard:F.beard,nape:F.nape,seed:h32(type.length,fk.charCodeAt(0)*31+fk.charCodeAt(1)),
   makeMaterial:tex=>{tex.minFilter=tex.magFilter=T.NearestFilter;tex.generateMipmaps=false;return Object.assign(new T.MeshLambertMaterial({map:tex}),{name:'crowd135 head130 '+key});}});
  const strip=geo=>{geo.deleteAttribute('skinIndex');geo.deleteAttribute('skinWeight');if(!geo.attributes.normal)geo.computeVertexNormals();return geo;};
  return heads[key]={front:strip(sk.geometry),frontMat:fm,rear:strip(r.mesh.geometry),rearMat:r.mesh.material,tris:sk.geometry.attributes.position.count/3+r.rearTriangles,mats:view(Float32Array,H.mat)};}
 return{meta,bodies,faces,skin,mat,head,acc,propMat,clips:meta.clips};
})();}

const _m=new T.Matrix4(),_c=new T.Color();
// one pedestrian: seed -> look; update(t, clip) steps the baked pose at 24 Hz
export function createPerson135(lib,seed,opts={}){
 const types=['man','woman','heavy','child'],tw=[.36,.36,.14,.14];let u=r01(seed,1),ti=0;while(ti<3&&u>tw[ti]){u-=tw[ti];ti++;}
 const type=opts.type??types[ti],sil=opts.sil??['short','coat','skirt'][Math.floor(r01(seed,2)*3)];
 const B=lib.bodies.find(b=>b.type===type&&b.sil===sil),fl=type==='child'&&sil==='skirt'?GIRLS:FACE_BY_TYPE[type],fk=opts.face??fl[Math.floor(r01(seed,3)*fl.length)];
 const pick=(L,k)=>L[Math.floor(r01(seed,k)*L.length)];
 const wpick=(Wl,k)=>{let u=r01(seed,k);for(const[i,w]of Wl){if(u<w)return i;u-=w;}return Wl[0][0];};
 // garment slot -> [tile, dyeA, dyeB]
 function garment(Wl,k,base){const t=opts.tiles?.[k]??wpick(Wl,k);let a=base,b=pick(DARK,k+1);
  if(TWO.has(t)){a=pick(LIGHT,k+2);if(t===10)[a,b]=pick(CAMO,k+3);}
  else if(t===5)a=pick(DENIM,k+2);else if(t===9)a=pick(CORD,k+2);
  return[t,new T.Color(a),new T.Color(b)];}
 const skirtish=sil==='skirt'&&type!=='man'&&type!=='heavy';
 const gTop=garment(W_TOP,40,pick(TOP,4)),gBot=garment(skirtish?W_SKIRT:W_BOT,44,skirtish?pick(SKIRT,5):pick(BOTTOM,5)),gCoat=garment(W_COAT,48,pick(COAT,7));
 const plain=c=>[0,c,c],sk=lib.skin[fk].clone();
 const G=[plain(sk),gTop,gBot,plain(new T.Color(pick(SHOE,6))),gCoat,plain(new T.Color(pick(TOP,8)))];
 const nv=B.verts,g=new T.BufferGeometry(),pos=new Float32Array(nv*3),nrm=new Float32Array(nv*3),ca=new Float32Array(nv*3),cb=new Float32Array(nv*3),ct=new Float32Array(nv*2),S=lib.meta.posScale;
 for(let i=0;i<nv;i++){const[t,a,b]=G[B.reg[i]];ca[i*3]=a.r;ca[i*3+1]=a.g;ca[i*3+2]=a.b;cb[i*3]=b.r;cb[i*3+1]=b.g;cb[i*3+2]=b.b;ct[i*2]=(t%4)*.25;ct[i*2+1]=Math.floor(t/4)/3;}
 g.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));g.setAttribute('normal',new T.BufferAttribute(nrm,3).setUsage(T.DynamicDrawUsage));
 g.setAttribute('cA',new T.BufferAttribute(ca,3));g.setAttribute('cB',new T.BufferAttribute(cb,3));g.setAttribute('ctile',new T.BufferAttribute(ct,2));g.setAttribute('cuv',B.UV);g.setIndex(B.idx);
 const H=lib.head(type,fk),object=new T.Group(),body=new T.Mesh(g,lib.mat),head=new T.Group();
 object.name='crowd135 '+type+'/'+sil+'/'+fk;body.frustumCulled=false;head.matrixAutoUpdate=false;
 head.add(new T.Mesh(H.front,H.frontMat),new T.Mesh(H.rear,H.rearMat));object.add(body,head);
 // props: seed picks; each prop rides its baked bone matrix
 const AC=lib.acc[type]||{},props=[],want=opts.props??(()=>{const L=[],ra=r01(seed,30);
  if(ra<.2)L.push('backpack');else if(ra<.32&&type!=='child')L.push('satchel');
  if(r01(seed,31)<(opts.stand?.45:.28))L.push(['bag_kraft','bag_white','tote'][Math.floor(r01(seed,34)*3)]);
  if(type!=='child'&&r01(seed,32)<.18)L.push('phone');
  if(!CROWD135_FACES[fk].scarf&&r01(seed,33)<.22)L.push(r01(seed,35)<.6?'cap':'beanie');return L;})();
 let ptris=0;for(const n of want){const a=AC[n];if(!a)continue;const tint=n==='backpack'||n==='cap'?pick(PROP_TINT,36+n.length):0xffffff;
  const pm=new T.Mesh(a.geo,lib.propMat(tint));pm.matrixAutoUpdate=false;pm.frustumCulled=false;pm.name='crowd135 '+n;object.add(pm);props.push([pm,a.mats]);ptris+=a.tris;}
 const setM=(o,M,k)=>{const e=o.matrix.elements;e[0]=M[k];e[1]=M[k+1];e[2]=M[k+2];e[3]=0;e[4]=M[k+3];e[5]=M[k+4];e[6]=M[k+5];e[7]=0;e[8]=M[k+6];e[9]=M[k+7];e[10]=M[k+8];e[11]=0;e[12]=M[k+9];e[13]=M[k+10];e[14]=M[k+11];e[15]=1;o.matrixWorldNeedsUpdate=true;};
 let last=-1;
 function frame(f){if(f===last)return;last=f;const o=f*nv*3;for(let i=0;i<nv*3;i++){pos[i]=B.P[o+i]*S;nrm[i]=B.N[o+i]/127;}
  g.attributes.position.needsUpdate=true;g.attributes.normal.needsUpdate=true;
  const M=H.mats,k=f*12,e=_m.elements;e[0]=M[k];e[1]=M[k+1];e[2]=M[k+2];e[3]=0;e[4]=M[k+3];e[5]=M[k+4];e[6]=M[k+5];e[7]=0;e[8]=M[k+6];e[9]=M[k+7];e[10]=M[k+8];e[11]=0;e[12]=M[k+9];e[13]=M[k+10];e[14]=M[k+11];e[15]=1;
  head.matrix.copy(_m);head.matrixWorldNeedsUpdate=true;for(const[pm,PM]of props)setM(pm,PM,k);}
 function update(t,clip='walk',rate=1){const C=lib.clips[clip],f=C.start+(Math.floor(t*24*rate)%C.frames+C.frames)%C.frames;frame(f);}
 update(r01(seed,9)*4);
 return{object,update,type,sil,face:fk,props:want,tiles:[gTop[0],gBot[0],gCoat[0]],tris:B.tris+H.tris+ptris,dispose(){g.dispose();}};
}

// the fair population of one block: walkers on lanes between the stall rows + a few browsers standing at the stalls
const Z0=21,Z1=91,STALLS={east:[32,50,68,86],west:[26,44,62,80]};
function planBlock(key,n){const kh=h32(key.length*977,[...key].reduce((a,c)=>a*31+c.charCodeAt(0),7)),out=[];
 for(let i=0;i<n;i++){const s=h32(kh,i+1);
  if(i%6===5){const east=r01(s,20)<.5,L=east?STALLS.east:STALLS.west,z=L[Math.floor(r01(s,21)*4)]+(r01(s,22)-.5)*1.8,x=(east?1:-1)*(3.25+r01(s,23)*.35);
   out.push({seed:s,stand:true,x,z,h:east?Math.PI/2:-Math.PI/2+0,rate:1});continue;}
  const dir=r01(s,10)<.5?1:-1;out.push({seed:s,lane:(dir>0?-.4:.4)-dir*(.5+r01(s,11)*2.3),dir,z:Z0+r01(s,12)*(Z1-Z0),speed:1.05+r01(s,13)*.45,phase:r01(s,14)*3,turn:0});}
 return out;}
export function createCrowd135({blocks,perBlock=36}){
 const object=new T.Group();object.name='V135 crowd';const solids=[];let lib=null,loading=false,last=0;const pops=new Map(),w={};
 function ensure(key,v){let P=pops.get(key);if(P)return P;P={key,plan:v.plan,group:new T.Group(),people:[]};P.group.name='crowd135 '+key;
  for(const q of planBlock(key,perBlock)){const p=createPerson135(lib,q.seed,{stand:q.stand});P.people.push({q,p});P.group.add(p.object);}object.add(P.group);pops.set(key,P);return P;}
 function drop(key){const P=pops.get(key);if(!P)return;for(const{p}of P.people)p.dispose();P.group.removeFromParent();pops.delete(key);}
 function place(P,e,lx,lz,h,px,pz,t){const cx=P.plan.x+lx,cz=P.plan.z+lz;cityToWorld(cx,cz,w);const o=e.p.object;o.position.set(w.x,Y+roadHeight(cx,cz)+.004,w.z);o.rotation.set(0,CITY_ANGLE+h,0);
  const d=Math.hypot(cx-px,cz-pz);o.visible=d<110;return d;}
 function step(t,dt,px,pz,frameN){solids.length=0;
  for(const P of pops.values())for(const e of P.people){const q=e.q;let d;
   if(q.stand){d=place(P,e,q.x,q.z,q.h,px,pz,t);if(d<110&&(d<40||frameN%3===0))e.p.update(t+q.seed%7,'idle',1);}
   else{if(q.turn>0){q.turn-=dt;if(q.turn<=0){q.dir=-q.dir;q.lane=-q.lane+(r01(q.seed,q.z|0)-.5)*.6;q.lane=Math.max(-3.1,Math.min(3.1,q.lane));}}
    else{q.z+=q.dir*q.speed*dt;if(q.z>Z1||q.z<Z0){q.z=Math.max(Z0,Math.min(Z1,q.z));q.turn=.7+r01(q.seed,5)*.8;}}
    d=place(P,e,q.lane,q.z,q.dir>0?0:Math.PI,px,pz,t);
    if(d<110&&(d<40||frameN%3===0))e.p.update(t+q.phase,q.turn>0?'idle':'walk',q.speed/1.38);}
   if(d<6){const o=e.p.object;solids.push({kind:'obb',x:o.position.x,z:o.position.z,w:.5,d:.4,ry:o.rotation.y});}}}
 let frameN=0;
 function update(wx,wz,active,pc){object.visible=active&&!OFF;if(!object.visible){solids.length=0;return;}
  const want=[];for(const[k,v]of blocks())if(v.plan?.soho135==='a'||v.plan?.soho135==='b')if(v.lod===0||v.lod===undefined)want.push([k,v]);
  if(!lib){if(want.length&&!loading){loading=true;loadCrowd135().then(l=>{lib=l;}).catch(e=>console.warn('[crowd135]',e));}return;}
  const keep=new Set(want.map(x=>x[0]));for(const k of[...pops.keys()])if(!keep.has(k))drop(k);for(const[k,v]of want)ensure(k,v);
  const now=performance.now()*.001,dt=Math.min(.1,last?now-last:0);last=now;frameN++;step(now,dt,pc.x,pc.z,frameN);}
 function dispose(){for(const k of[...pops.keys()])drop(k);object.removeFromParent();}
 return{object,update,solids,dispose,step:(t,dt,px,pz)=>step(t,dt,px,pz,frameN++),ensure:(k,v)=>lib&&ensure(k,v),setLib:l=>{lib=l;},get pops(){return pops;}};
}
