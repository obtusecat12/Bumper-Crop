// V132-traffic: city cars from GGBotNet "PSX Style Cars" (CC0 1.0, opengameart.org/content/psx-style-cars), converted by
// tools/cars132_assets.py (real dimensions, nose +Z, wheels on y=0). Each model keeps its own 128 px paint bitmaps.
// parkCar132() drops one into an UrbanBatch (merged, with an OBB collider); car132Mesh() makes a free mesh for traffic.
import * as T from './vendor/three.module.min.js';
import {CARS132} from './cars132-data.js?v=132t';
const BASE=new URL('./assets/l11-v132t/',import.meta.url).href;
const bytes=s=>{const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer;};
export const CAR132=Object.fromEntries(CARS132.map(c=>[c.id,c]));
export const CAR132_IDS=CARS132.map(c=>c.id);
const GEO=new Map(),TEX=new Map(),MAT=new Map();
export function car132Geometry(id){
 if(GEO.has(id))return GEO.get(id);const c=CAR132[id],g=new T.BufferGeometry();
 g.setAttribute('position',new T.BufferAttribute(new Float32Array(bytes(c.pos)),3));g.setAttribute('normal',new T.BufferAttribute(new Float32Array(bytes(c.nrm)),3));
 g.setAttribute('uv',new T.BufferAttribute(new Float32Array(bytes(c.uv)),2));g.setIndex(new T.BufferAttribute(new Uint16Array(bytes(c.idx)),1));
 g.computeBoundingBox();g.computeBoundingSphere();g.name='car132 '+id;GEO.set(id,g);return g;}
function tex(name){if(TEX.has(name))return TEX.get(name);const t=new T.TextureLoader().load(BASE+name+'.png?v=132t');t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;t.minFilter=T.NearestMipmapLinearFilter;t.anisotropy=2;TEX.set(name,t);return t;}
// batch=true: vertex colours carry the UrbanBatch tone/light term.
export function car132Material(paint,batch=false){const k=paint+(batch?'|b':'');if(MAT.has(k))return MAT.get(k);
 const m=new T.MeshStandardMaterial({map:tex(paint),roughness:.55,metalness:.08,vertexColors:batch});m.name='V132 car '+paint;MAT.set(k,m);return m;}
const hash=(a,b=0)=>{let h=Math.imul((a|0)^0x9e3779b9,0x85ebca6b)^Math.imul(b|0,0xc2b2ae35);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;return(h>>>0)/4294967296;};
// Pick a model + paint from a seed. kinds limits the model ids (e.g. a former SUV slot stays tall).
export function pickCar132(seed,kinds=null){const ids=kinds||['sedan','saloon','hatch','wagon','minivan','sedan','saloon','hatch','wagon','taxi','van'];
 const id=ids[Math.floor(hash(seed,17)*ids.length)%ids.length],c=CAR132[id];return{id,paint:c.tex[Math.floor(hash(seed,31)*c.tex.length)%c.tex.length],car:c};}
export function parkCar132(b,seed,{x=0,y=.02,z=0,ry=0,tone=1,kinds=null}={}){
 const{id,paint,car}=pickCar132(seed,kinds),key='car132:'+paint;if(!b.mats[key])b.mats[key]=car132Material(paint,true);
 b.push(x,y,z,ry);b.add(car132Geometry(id),key,0,0,0,1,1,1,0,0,0,tone);b.solid(0,0,car.W*.9,car.L*.97);b.pop();return car;}
export function car132Mesh(id,paint){const m=new T.Mesh(car132Geometry(id),car132Material(paint));m.name='car132 '+id+' '+paint;m.castShadow=true;m.receiveShadow=true;return m;}
