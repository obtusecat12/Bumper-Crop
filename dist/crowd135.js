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
// 3 shopping bags, phone, cap, beanie) each riding its baked bone matrix (props135.png).
// ④-2b (135z, user 10-20 06:26: use the Hope St kiosk / createRetroActor75 look): the dyed pattern atlas is gone; bodies wear
// V75-style photographic garment panels (garments135.png from scripts/crowd135/garments135.py: per top/coat a front, back
// and sleeve cell, per bottom one cell) through V75-layout uvs baked by bodies135.py (split vertices + map[] onto the baked
// stream); each person = seed -> top/coat + bottom + recolour (hue / tint / value per garment kind). Heads stay head130. Population: the SoHo street fair blocks (-2,0) (-2,1), walking strip
// |x| < 3.3 between the stall rows, z 21..91 in each block frame (road centre x = 0). ?crowd=0 turns it off.
import * as T from './vendor/three.module.min.js';
import {retrofitSkinnedHead130} from './retro-head130-gen.js';
import {cityToWorld,CITY_ANGLE} from './urban-layout.js?v=return-1';
import {roadHeight} from './urban-streets.js?v=135t';
import {EXIT_CITY_Y as Y} from './exit-route.js?v=60';
import {createTierB135,createTierC135,bRecord135,PROPS135} from './crowd135-far.js?v=135l';
const A=new URL('./assets/crowd135/',import.meta.url).href,V='135z',VS='135l';
const OFF=typeof location!=='undefined'&&/[?&]crowd=0\b/.test(location.search),NOLOD=typeof location!=='undefined'&&/[?&]crowdlod=0\b/.test(location.search);
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
// garments135.png: 64² cells, 8 per row (garments135.py order). kind -> first cell; tops/coats use 3 cells (front, back, sleeve).
const GW=512,GH=320,G135={tee:0,breton:3,chambray:6,floral:9,hoodie:12,knit:15,leather:18,trench:21,wool:24,jeans:27,blackjeans:28,chinos:29,greytrousers:30,tartanskirt:31,navyskirt:32};
const W_TOPS=[['tee',.22],['breton',.1],['chambray',.12],['floral',.12],['hoodie',.18],['knit',.14],['leather',.12]],W_COATS=[['trench',.55],['wool',.45]],
 W_TROUS=[['jeans',.4],['blackjeans',.2],['chinos',.22],['greytrousers',.18]],W_SKIRTS=[['tartanskirt',.45],['navyskirt',.55]];
// recolour per garment kind: tints (multiply, may exceed 1 to lift grey cloth), hue offsets (radians, YIQ rotation), value jitter
const TINT_TEE=[[1,1,1],[1,1,1],[.95,.32,.3],[.28,.38,.62],[.2,.2,.22],[1,.82,.3],[.45,.68,.45],[.9,.62,.72],[.55,.75,.95]],
 TINT_HOOD=[[1,1,1],[1,1,1],[.55,.62,1.15],[1.25,.55,.55],[.42,.42,.45],[.6,.95,.65],[1.45,1.4,1.3],[1.3,.95,.6]],
 TINT_WOOL=[[1,1,1],[1,1,1],[.95,1,1.5],[1.5,1.15,.85],[1.7,1.7,1.7]],TINT_GREY=[[1,1,1],[.62,.72,1.15],[1.05,.88,.72],[.55,.55,.58],[1.2,1.2,1.15]];
function recol(kind,u){const r=k=>u(k),pk=(L,k)=>L[Math.floor(r(k)*L.length)],v=.88+r(3)*.24;
 switch(kind){case'tee':return{t:pk(TINT_TEE,1),h:0,v};case'hoodie':return{t:pk(TINT_HOOD,1),h:0,v};
  case'breton':return{t:[1,1,1],h:pk([0,0,2.6,3.5,-1.2],1),v};case'chambray':return{t:[1,1,1],h:(r(1)-.5)*.6,v};
  case'floral':case'knit':case'tartanskirt':return{t:[1,1,1],h:r(1)*6.283,v};case'navyskirt':return{t:[1,1,1],h:pk([0,0,2.2,3.4,-1.6],1),v};
  case'chinos':return{t:[1,1,1],h:(r(1)-.5)*1.2,v};case'trench':return{t:[1,1,1],h:(r(1)-.5)*.45,v};case'wool':return{t:pk(TINT_WOOL,1),h:0,v};case'greytrousers':return{t:pk(TINT_GREY,1),h:0,v};
  default:return{t:[1,1,1],h:0,v};}}
const PROP_TINT=[0xffffff,0xffffff,0x6f8bc0,0xc06a6a,0x5a5a62,0x7d9a62,0xe0c060];
const SHOE=[0xe6e4de,0x1a1a1a,0x5b3b26,0x6d6f72,0x2b2b2f,0x8a6a4a];
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
 const[garm,props]=await Promise.all([tl('garments135.png',true),tl('props135.png',true)]);
 const skin={},hair={};for(const[k,t]of Object.entries(faces)){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(t.image,0,0);
  const med=(x,y,w,h)=>{const d=g.getImageData(x,y,w,h).data,ch=[[],[],[]];for(let i=0;i<d.length;i+=4)for(let j=0;j<3;j++)ch[j].push(d[i+j]);return ch.map(a=>a.sort((p,q)=>p-q)[a.length>>1]);};
  const sk=[...med(28,72,12,14),...med(88,72,12,14)],s3=[0,1,2].map(j=>(sk[j]+sk[j+3])/2);skin[k]=new T.Color().setRGB(s3[0]/255,s3[1]/255,s3[2]/255,T.SRGBColorSpace);
  const hc=CROWD135_FACES[k].long?med(1,50,8,40):med(44,0,40,5);hair[k]=CROWD135_FACES[k].bald?skin[k].getHex(T.SRGBColorSpace):(hc[0]<<16)|(hc[1]<<8)|hc[2];}
 const bodies=meta.bodies.map(b=>({...b,idx:new T.BufferAttribute(view(Uint16Array,b.index),1),map:view(Uint16Array,b.map),slot:view(Uint8Array,b.slot),P:view(Int16Array,b.pos),N:view(Int8Array,b.nrm),UV:new T.BufferAttribute(view(Float32Array,b.uv75),2)}));
 // body shader (135z): garment cell (flat per vertex, -1 = plain colour) + V75 uv inside the 64² cell; recolour = YIQ hue
 // rotation, value and tint per slot (flat attributes so the zero-height waist/torso seam band never blends two cells)
 const mat=new T.MeshLambertMaterial();mat.name='crowd135 body';
 mat.onBeforeCompile=sh=>{sh.uniforms.garmMap={value:garm};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 cA;attribute vec3 cB;attribute vec2 cuv;attribute vec2 ctile;flat varying vec3 vCA;flat varying vec3 vCB;varying vec2 vCuv;flat varying vec2 vTile;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvCA=cA;vCB=cB;vCuv=cuv;vTile=ctile;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D garmMap;flat varying vec3 vCA;flat varying vec3 vCB;varying vec2 vCuv;flat varying vec2 vTile;')
   .replace('#include <map_fragment>',`if(vTile.x<0.)diffuseColor.rgb*=vCA;else{vec3 c=texture2D(garmMap,vTile+(clamp(vCuv,0.,1.)*62.+1.)/vec2(${GW}.,${GH}.)).rgb;
 vec3 q=mat3(.299,.596,.211,.587,-.274,-.523,.114,-.322,.312)*c;float cs=cos(vCB.x),sn=sin(vCB.x);q.yz=mat2(cs,sn,-sn,cs)*q.yz;
 diffuseColor.rgb*=max(mat3(1.,1.,1.,.956,-.272,-1.106,.621,-.647,1.703)*q,0.)*vCB.z*vCA;}`);};
 mat.customProgramCacheKey=()=>'crowd135z';
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
 // ④-3 extras for tiers B/C: one head geometry per type, the head atlas (front + head130 rear per type/face key), garment
 // cell means (linear) for the sprite colours, the baked sprite sheet (absent while it is being baked)
 const EARF={man:'m1',woman:'f2',heavy:'m1',child:'c1'},headGeo=type=>head(type,EARF[type]);
 const AW=1024,AH=1152,ad=new Uint8Array(AW*AH*4),atlas=new T.DataTexture(ad,AW,AH,T.RGBAFormat);atlas.colorSpace=T.SRGBColorSpace;atlas.flipY=false;atlas.minFilter=atlas.magFilter=T.NearestFilter;atlas.generateMipmaps=false;atlas.needsUpdate=true;
 const tiles={};let ntile=0;
 function headTile(type,fk){const key=type+'/'+fk;if(tiles[key]!==undefined)return tiles[key];const ti=tiles[key]=ntile++,H=head(type,fk);
  const put=(t,src,top)=>{const x0=(t%8)*128,y0=Math.floor(t/8)*128;for(let r=0;r<128;r++)ad.set(src.subarray(r*512,r*512+512),((y0+r)*AW+x0)*4);};
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.drawImage(faces[fk].image,0,0,128,128);put(ti*2,new Uint8Array(g.getImageData(0,0,128,128).data.buffer));
  put(ti*2+1,H.rearMat.map.image.data);atlas.needsUpdate=true;return ti;}
 const gm=new Float32Array(40*3);{const c=document.createElement('canvas');c.width=GW;c.height=GH;const g=c.getContext('2d');g.drawImage(garm.image,0,0);const d=g.getImageData(0,0,GW,GH).data,lin=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  for(let ci=0;ci<40;ci++){const x0=(ci%8)*64+1,y0=Math.floor(ci/8)*64+1;let r=0,gg=0,b=0;for(let y=0;y<62;y++)for(let x=0;x<62;x++){const i=((y0+y)*GW+x0+x)*4;r+=lin(d[i]);gg+=lin(d[i+1]);b+=lin(d[i+2]);}gm.set([r/3844,gg/3844,b/3844],ci*3);}}
 let sprites=null;try{sprites=await loader.loadAsync(A+'sprites135.png?v='+VS);sprites.colorSpace=T.NoColorSpace;sprites.flipY=false;sprites.minFilter=sprites.magFilter=T.NearestFilter;sprites.generateMipmaps=false;sprites.needsUpdate=true;}catch(e){console.warn('[crowd135] no sprite sheet',e);}
 const uniformsB={garmMap:{value:garm},headAtlas:{value:atlas},propMap:{value:props},headAtlasSize:{value:new T.Vector2(AW,AH)}};
 return{meta,bodies,faces,skin,hair,mat,head,acc,propMat,clips:meta.clips,view,headGeo,headTile,atlas,gm,sprites,uniformsB};
})();}

const _m=new T.Matrix4(),_c=new T.Color();
// one pedestrian: seed -> look; update(t, clip) steps the baked pose at 24 Hz
// seed -> look (shared by tier A meshes and the tier B/C instance records)
export function look135(lib,seed,opts={}){
 const types=['man','woman','heavy','child'],tw=[.36,.36,.14,.14];let u=r01(seed,1),ti=0;while(ti<3&&u>tw[ti]){u-=tw[ti];ti++;}
 const type=opts.type??types[ti],sil=opts.sil??['short','coat','skirt'][Math.floor(r01(seed,2)*3)];
 const bi=lib.bodies.findIndex(b=>b.type===type&&b.sil===sil),B=lib.bodies[bi],fl=type==='child'&&sil==='skirt'?GIRLS:FACE_BY_TYPE[type],fk=opts.face??fl[Math.floor(r01(seed,3)*fl.length)];
 const pick=(L,k)=>L[Math.floor(r01(seed,k)*L.length)];
 const wpick=(Wl,k,ok=()=>true)=>{for(let tr=0;tr<6;tr++){let u=r01(seed,k+tr*7);for(const[n,w]of Wl){if(u<w){if(ok(n))return n;break;}u-=w;}}return Wl[0][0];};
 const skirtish=sil==='skirt'&&type!=='man'&&type!=='heavy',fem=type==='woman'||GIRLS.includes(fk);
 const top=opts.top??(sil==='coat'?wpick(W_COATS,40):wpick(W_TOPS,40,n=>n!=='floral'||fem)),bot=opts.bot??(skirtish?wpick(W_SKIRTS,44):wpick(W_TROUS,44));
 const rT=recol(top,k=>r01(seed,50+k)),rB=recol(bot,k=>r01(seed,60+k)),sk=lib.skin[fk].clone(),shoe=new T.Color(pick(SHOE,6));
 const AC=lib.acc[type]||{},props=opts.props??(()=>{const L=[],ra=r01(seed,30);
  if(ra<.2)L.push('backpack');else if(ra<.32&&type!=='child')L.push('satchel');
  if(r01(seed,31)<(opts.stand?.45:.28))L.push(['bag_kraft','bag_white','tote'][Math.floor(r01(seed,34)*3)]);
  if(type!=='child'&&r01(seed,32)<.18)L.push('phone');
  if(!CROWD135_FACES[fk].scarf&&r01(seed,33)<.22)L.push(r01(seed,35)<.6?'cap':'beanie');return L;})();
 const propTint=n=>n==='backpack'||n==='cap'?pick(PROP_TINT,36+n.length):0xffffff;
 const propMask=props.reduce((m,n)=>AC[n]?m|(1<<PROPS135.indexOf(n)):m,0);
 return{seed,type,sil,bi,B,fk,top,bot,rT,rB,sk,shoe,props,propTint,propMask,t0:G135[top],b0:G135[bot],ears:!CROWD135_FACES[fk].long,
  tintA:new T.Color(propTint('backpack')),tintB:new T.Color(propTint('cap')),hairC:new T.Color(CROWD135_FACES[fk].hairColor??lib.hair[fk])};}
// tier C record: [body, frame col, skin, top, bottom, shoe, hair] with the garment cell means recoloured like the shader does
function rec135(m,ci,n,r){const c=[0,0,0];for(let k=0;k<n;k++)for(let j=0;j<3;j++)c[j]+=m[(ci+k)*3+j]/n;
 const y=.299*c[0]+.587*c[1]+.114*c[2],i=.596*c[0]-.274*c[1]-.322*c[2],q=.211*c[0]-.523*c[1]+.312*c[2],cs=Math.cos(r.h),sn=Math.sin(r.h),i2=cs*i-sn*q,q2=sn*i+cs*q;
 return[y+.956*i2+.621*q2,y-.272*i2-.647*q2,y-1.106*i2+1.703*q2].map((v,j)=>Math.max(v,0)*r.v*r.t[j]);}
export function cRecord135(lib,L){return new Float32Array([L.bi,0,L.sk.r,L.sk.g,L.sk.b,...rec135(lib.gm,L.t0,3,L.rT),...rec135(lib.gm,L.b0,1,L.rB),L.shoe.r,L.shoe.g,L.shoe.b,L.hairC.r,L.hairC.g,L.hairC.b]);}
export function createPerson135(lib,seed,opts={}){
 const L=opts.look??look135(lib,seed,opts),{type,sil,B,fk,top,bot,rT,rB,sk,shoe}=L,want=L.props,pick=(Q,k)=>Q[Math.floor(r01(seed,k)*Q.length)];
 const cell=c=>[(c%8)*64/GW,Math.floor(c/8)*64/GH],t0=G135[top],b0=G135[bot];
 // slot: 0 skin, 1 top front, 2 top back, 3 sleeve, 4 bottom, 5 shoe -> [tile|null, tint rgb, hue, value]
 const SL=[[null,[sk.r,sk.g,sk.b]],[cell(t0),rT.t,rT.h,rT.v],[cell(t0+1),rT.t,rT.h,rT.v],[cell(t0+2),rT.t,rT.h,rT.v],[cell(b0),rB.t,rB.h,rB.v],[null,[shoe.r,shoe.g,shoe.b]]];
 const nv=B.split,nb=B.verts,g=new T.BufferGeometry(),pos=new Float32Array(nv*3),nrm=new Float32Array(nv*3),ca=new Float32Array(nv*3),cb=new Float32Array(nv*3),ct=new Float32Array(nv*2),S=lib.meta.posScale,MP=B.map;
 for(let i=0;i<nv;i++){const[tile,t,h=0,v=1]=SL[B.slot[i]];ca.set(t,i*3);cb[i*3]=h;cb[i*3+1]=1;cb[i*3+2]=v;ct[i*2]=tile?tile[0]:-1;ct[i*2+1]=tile?tile[1]:-1;}
 g.setAttribute('position',new T.BufferAttribute(pos,3).setUsage(T.DynamicDrawUsage));g.setAttribute('normal',new T.BufferAttribute(nrm,3).setUsage(T.DynamicDrawUsage));
 g.setAttribute('cA',new T.BufferAttribute(ca,3));g.setAttribute('cB',new T.BufferAttribute(cb,3));g.setAttribute('ctile',new T.BufferAttribute(ct,2));g.setAttribute('cuv',B.UV);g.setIndex(B.idx);
 const H=lib.head(type,fk),object=new T.Group(),body=new T.Mesh(g,lib.mat),head=new T.Group();
 object.name='crowd135 '+type+'/'+sil+'/'+fk;body.frustumCulled=false;head.matrixAutoUpdate=false;
 head.add(new T.Mesh(H.front,H.frontMat),new T.Mesh(H.rear,H.rearMat));object.add(body,head);
 // props: seed picks; each prop rides its baked bone matrix
 const AC=lib.acc[type]||{},props=[];
 let ptris=0;for(const n of want){const a=AC[n];if(!a)continue;const tint=L.propTint(n);
  const pm=new T.Mesh(a.geo,lib.propMat(tint));pm.matrixAutoUpdate=false;pm.frustumCulled=false;pm.name='crowd135 '+n;object.add(pm);props.push([pm,a.mats]);ptris+=a.tris;}
 const setM=(o,M,k)=>{const e=o.matrix.elements;e[0]=M[k];e[1]=M[k+1];e[2]=M[k+2];e[3]=0;e[4]=M[k+3];e[5]=M[k+4];e[6]=M[k+5];e[7]=0;e[8]=M[k+6];e[9]=M[k+7];e[10]=M[k+8];e[11]=0;e[12]=M[k+9];e[13]=M[k+10];e[14]=M[k+11];e[15]=1;o.matrixWorldNeedsUpdate=true;};
 let last=-1;
 function frame(f){if(f===last)return;last=f;const o=f*nb*3;for(let i=0,j=0;i<nv;i++,j+=3){const k=o+MP[i]*3;pos[j]=B.P[k]*S;pos[j+1]=B.P[k+1]*S;pos[j+2]=B.P[k+2]*S;nrm[j]=B.N[k]/127;nrm[j+1]=B.N[k+1]/127;nrm[j+2]=B.N[k+2]/127;}
  g.attributes.position.needsUpdate=true;g.attributes.normal.needsUpdate=true;
  const M=H.mats,k=f*12,e=_m.elements;e[0]=M[k];e[1]=M[k+1];e[2]=M[k+2];e[3]=0;e[4]=M[k+3];e[5]=M[k+4];e[6]=M[k+5];e[7]=0;e[8]=M[k+6];e[9]=M[k+7];e[10]=M[k+8];e[11]=0;e[12]=M[k+9];e[13]=M[k+10];e[14]=M[k+11];e[15]=1;
  head.matrix.copy(_m);head.matrixWorldNeedsUpdate=true;for(const[pm,PM]of props)setM(pm,PM,k);}
 function update(t,clip='walk',rate=1){const C=lib.clips[clip],f=C.start+(Math.floor(t*24*rate)%C.frames+C.frames)%C.frames;frame(f);}
 update(r01(seed,9)*4);
 return{object,update,type,sil,face:fk,props:want,top,bot,tris:B.tris+H.tris+ptris,dispose(){g.dispose();}};
}

// the fair population of one block: walkers on lanes between the stall rows + a few browsers standing at the stalls
const Z0=21,Z1=91,STALLS={east:[32,50,68,86],west:[26,44,62,80]};
function planBlock(key,n){const kh=h32(key.length*977,[...key].reduce((a,c)=>a*31+c.charCodeAt(0),7)),out=[];
 for(let i=0;i<n;i++){const s=h32(kh,i+1);
  if(i%6===5){const east=r01(s,20)<.5,L=east?STALLS.east:STALLS.west,z=L[Math.floor(r01(s,21)*4)]+(r01(s,22)-.5)*1.8,x=(east?1:-1)*(3.25+r01(s,23)*.35);
   out.push({seed:s,stand:true,x,z,h:east?Math.PI/2:-Math.PI/2+0,rate:1});continue;}
  const dir=r01(s,10)<.5?1:-1;out.push({seed:s,lane:(dir>0?-.4:.4)-dir*(.5+r01(s,11)*2.3),dir,z:Z0+r01(s,12)*(Z1-Z0),speed:1.05+r01(s,13)*.45,phase:r01(s,14)*3,turn:0});}
 return out;}
// ④-3 tiers: A (CPU meshes) < 12 m, B (VAT instancing) < 45 m, C (sprites) < 150 m, with 1–2 m hysteresis; ?crowdlod=0 = A only (old)
const TA=[11,13],TB=[44,47],TC=150,_mw=new T.Matrix4(),_w={};
const frameOf=(lib,t,clip,rate)=>{const C=lib.clips[clip];return C.start+(Math.floor(t*24*rate)%C.frames+C.frames)%C.frames;};
export function createCrowd135({blocks,perBlock=36}){
 const object=new T.Group();object.name='V135 crowd';const solids=[];let lib=null,loading=false,last=0,tb=null,tc=null;const pops=new Map(),w={};
 const stats={a:0,b:0,c:0,trisB:0,draws:0};
 function tiers(){if(tb||!lib||NOLOD)return;tb=createTierB135(lib,lib.uniformsB);object.add(tb.group);if(lib.sprites){tc=createTierC135(lib.sprites);object.add(tc.group);}}
 function ensure(key,v){let P=pops.get(key);if(P)return P;tiers();P={key,plan:v.plan,group:new T.Group(),people:[]};P.group.name='crowd135 '+key;
  for(const q of planBlock(key,perBlock)){const L=look135(lib,q.seed,{stand:q.stand}),e={q,L,tier:-1,p:null};
   if(!NOLOD){e.rB=bRecord135(L,lib.headTile(L.type,L.fk));e.rC=cRecord135(lib,L);}P.people.push(e);}
  object.add(P.group);pops.set(key,P);return P;}
 function drop(key){const P=pops.get(key);if(!P)return;for(const e of P.people)e.p?.dispose();P.group.removeFromParent();pops.delete(key);}
 function step(t,dt,px,pz,frameN){solids.length=0;stats.a=stats.b=stats.c=0;tb?.begin();tc?.begin();
  for(const P of pops.values())for(const e of P.people){const q=e.q;let lx,lz,h,tt,clip,rate;
   if(q.stand){lx=q.x;lz=q.z;h=q.h;tt=t+q.seed%7;clip='idle';rate=1;}
   else{if(q.turn>0){q.turn-=dt;if(q.turn<=0){q.dir=-q.dir;q.lane=-q.lane+(r01(q.seed,q.z|0)-.5)*.6;q.lane=Math.max(-3.1,Math.min(3.1,q.lane));}}
    else{q.z+=q.dir*q.speed*dt;if(q.z>Z1||q.z<Z0){q.z=Math.max(Z0,Math.min(Z1,q.z));q.turn=.7+r01(q.seed,5)*.8;}}
    lx=q.lane;lz=q.z;h=q.dir>0?0:Math.PI;tt=t+q.phase;clip=q.turn>0?'idle':'walk';rate=q.speed/1.38;}
   const cx=P.plan.x+lx,cz=P.plan.z+lz,d=Math.hypot(cx-px,cz-pz);cityToWorld(cx,cz,w);const y=Y+roadHeight(cx,cz)+.004,yaw=CITY_ANGLE+h;
   const pt=e.tier,tier=NOLOD?(d<110?0:3):d<(pt===0?TA[1]:TA[0])?0:d<(pt===0||pt===1?TB[1]:TB[0])?1:d<TC?2:3;e.tier=tier;
   if(tier===0){if(!e.p){e.p=createPerson135(lib,q.seed,{stand:q.stand,look:e.L});P.group.add(e.p.object);}
    const o=e.p.object;o.position.set(w.x,y,w.z);o.rotation.set(0,yaw,0);if(NOLOD&&d>=40&&frameN%3)void 0;else e.p.update(tt,clip,rate);stats.a++;}
   else{if(e.p){e.p.object.removeFromParent();e.p.dispose();e.p=null;}
    if(tier<3){_mw.makeRotationY(yaw).setPosition(w.x,y,w.z);const f=frameOf(lib,tt,clip,rate);
     if(tier===1){tb.push(e.L.bi,_mw,e.rB,f);stats.b++;}else if(tc){tc.push(_mw,e.rC,clip==='idle'?8:Math.floor((f-lib.clips.walk.start)/3));stats.c++;}}}
   if(d<6)solids.push({kind:'obb',x:w.x,z:w.z,w:.5,d:.4,ry:yaw});}
  stats.trisB=tb?tb.end():0;tc?.end();stats.draws=(tb?tb.draws:0)+(tc&&stats.c?1:0);}
 let frameN=0;
 function update(wx,wz,active,pc){object.visible=active&&!OFF;if(!object.visible){solids.length=0;return;}
  const want=[];for(const[k,v]of blocks())if(v.plan?.soho135==='a'||v.plan?.soho135==='b')if(v.lod===0||v.lod===undefined)want.push([k,v]);
  if(!lib){if(want.length&&!loading){loading=true;loadCrowd135().then(l=>{lib=l;}).catch(e=>console.warn('[crowd135]',e));}return;}
  const keep=new Set(want.map(x=>x[0]));for(const k of[...pops.keys()])if(!keep.has(k))drop(k);for(const[k,v]of want)ensure(k,v);
  const now=performance.now()*.001,dt=Math.min(.1,last?now-last:0);last=now;frameN++;step(now,dt,pc.x,pc.z,frameN);}
 function dispose(){for(const k of[...pops.keys()])drop(k);tb?.dispose();tc?.dispose();object.removeFromParent();}
 return{object,update,solids,dispose,stats,step:(t,dt,px,pz)=>step(t,dt,px,pz,frameN++),ensure:(k,v)=>lib&&ensure(k,v),setLib:l=>{lib=l;},get pops(){return pops;}};
}
