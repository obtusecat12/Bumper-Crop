// V132-street: per-building CC0 wall textures for the L11 procedural buildings (addBuilding). The flat-colour keys white / metal / dark
// (curtain-wall mullions, spandrels, clinic + lab shells, louvers) and stucco get a texture variant hashed from the building seed, so
// neighbouring buildings no longer share one surface. Tiles: ambientCG CC0 (Plaster001/003/007, PaintedPlaster017, PaintedMetal004/006/013,
// Metal029) via tools/street132_walls.py -> assets/l11-v132st. Off with ?st132=0 / localStorage bumpercrop.st132=0.
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {ST132_ON} from './street132-props.js?v=132';
const A=new URL('./assets/l11-v132st/',import.meta.url).href;
const VAR={white:['wallWhite0','wallWhite1','wallWhite2'],metal:['wallMetal0','wallMetal1'],dark:['wallDark0','wallDark1'],stucco:[null,'wallStucco1']};
const TILE={wallWhite0:3,wallWhite1:3,wallWhite2:2.6,wallMetal0:2.2,wallMetal1:2.4,wallDark0:2.6,wallDark1:2.6,wallStucco1:3.2};
for(const[k,t]of Object.entries(TILE))URBAN_TILE_SIZE['w132:'+k]=t;
const ld=new T.TextureLoader(),tx=(n,s)=>{const t=ld.load(A+n+'.webp?v=132');if(s)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;};
function mat(m,name){const key='w132:'+name;if(!m[key]){const metal=name.startsWith('wallMetal')||name.startsWith('wallDark');
 m[key]=new T.MeshStandardMaterial({map:tx(name,true),normalMap:tx(name+'-n',false),normalScale:new T.Vector2(.6,.6),roughness:metal?.62:.92,metalness:metal?.15:0,vertexColors:true});m[key].name='V132 '+name+' (ambientCG CC0)';m[key].userData.urbanShared=true;}return key;}
const hash=s=>{let h=Math.imul((s|0)^0x9e3779b9,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);return(h^h>>>16)>>>0;};
// Wrap one building's batch calls: remap the flat keys to this building's variant, then restore the batch.
export function withWalls132(batch,seed,fn){
 if(!ST132_ON||!batch?.mats)return fn();
 const h=hash(seed??1),map={};for(const[k,v]of Object.entries(VAR)){const n=v[(h>>>(k.length*3))%v.length];if(n)map[k]=mat(batch.mats,n);}
 const r=k=>map[k]||k,own=['add','box','plane'].filter(n=>Object.prototype.hasOwnProperty.call(batch,n)),saved={};for(const n of own)saved[n]=batch[n];
 const P=Object.getPrototypeOf(batch);
 batch.add=function(src,key,...a){return P.add.call(this,src,r(key),...a);};
 batch.box=function(key,...a){return P.box.call(this,r(key),...a);};
 batch.plane=function(key,...a){return P.plane.call(this,r(key),...a);};
 try{return fn();}finally{for(const n of ['add','box','plane']){if(own.includes(n))batch[n]=saved[n];else delete batch[n];}}
}
