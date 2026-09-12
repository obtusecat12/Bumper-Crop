// Pure deterministic meadow coverage. No world.js import; no shared world RNG.
// Tile coordinates are exact BigInts. Numeric coordinates are metres in a tile.
// grid RGBA: cover, moisture, shade tendency, patch density; all are in [0,1].
export const MEADOW_CHUNK = 64;
export const MEADOW_GRID_SIZE = 33;
export const MEADOW_GRID_STEP = 2;
export const MEADOW_MACRO_CELLS = 8n;
export const MEADOW_PROBABILITY = .44;
const MACRO_METRES = Number(MEADOW_MACRO_CELLS) * MEADOW_CHUNK;
const MACRO_CACHE_LIMIT = 192, TILE_CACHE_LIMIT = 192;
const macros = new Map(), tiles = new Map();
const TAU = Math.PI * 2, INV_UINT = 1 / 4294967296;
const clamp01 = x => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp01((x-a)/(b-a)); return t*t*(3-2*t); };
const mix = (a, b, t) => t===0?a:t===1?b:a+(b-a)*t;
export const meadowFloorDiv = (x, divisor) => x >= 0n ? x/divisor : (x-divisor+1n)/divisor;

function hashText(text) {
 let h = 2166136261;
 for (let i=0; i<text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
 h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
 h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
 return (h ^ h >>> 16) >>> 0;
}
// Full signed decimal BigInts enter the hash; never Number(absoluteCell).
export function meadowHash(cx, cz, seed, domain='patch') {
 return hashText(`meadow-v12:${domain}:${String(seed)}:${cx}:${cz}`);
}
function random(seed) {
 let a = seed >>> 0;
 return () => {
  a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ a >>> 15, a | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) * INV_UINT;
 };
}
function lattice(x, z, seed) {
 let h = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(z, 0x85ebca77)) >>> 0;
 h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
 h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
 return ((h ^ h >>> 16) >>> 0) * INV_UINT;
}
function noise(x, z, seed) {
 const ix=Math.floor(x), iz=Math.floor(z), fx=x-ix, fz=z-iz;
 const u=fx*fx*(3-2*fx), v=fz*fz*(3-2*fz);
 return mix(mix(lattice(ix,iz,seed),lattice(ix+1,iz,seed),u),
  mix(lattice(ix,iz+1,seed),lattice(ix+1,iz+1,seed),u),v);
}
function cached(map, key) {
 if (!map.has(key)) return undefined;
 const value=map.get(key); map.delete(key); map.set(key,value); return value;
}
function remember(map, key, value, limit) {
 map.set(key,value);
 if (map.size > limit) map.delete(map.keys().next().value);
 return value;
}
function lobe(x,z,rx,rz,angle=0) {
 return {x,z,rx,rz,c:Math.cos(angle),s:Math.sin(angle),min:Math.min(rx,rz)};
}
function finishPatch(p) {
 // Smooth union grows an implicit field by <= join/4 per join. Its distance
 // approximation can stretch exterior feather by max(rx,rz)/min(rx,rz).
 // The conservative bound includes both this stretch and the bounded warp.
 let radius=0, ratio=1;
 for (const q of p.lobes) {
  radius=Math.max(radius,Math.hypot(q.x,q.z)+Math.max(q.rx,q.rz));
  ratio=Math.max(ratio,Math.max(q.rx,q.rz)/q.min);
 }
 p.radius=radius+Math.SQRT2*p.warp+ratio*(p.feather+p.join*p.lobes.length/4)+2;
 p.c=Math.cos(p.angle); p.s=Math.sin(p.angle);
 return p;
}
function macroPatch(mx,mz,seed) {
 const key=`${String(seed)}:${mx}:${mz}`, hit=cached(macros,key);
 if (hit!==undefined) return hit;
 const r=random(meadowHash(mx,mz,seed)), occurrence=r();
 if (occurrence>=MEADOW_PROBABILITY) return remember(macros,key,null,MACRO_CACHE_LIMIT);
 const px=r()*MACRO_METRES,pz=r()*MACRO_METRES;
 const rx=42+r()*33,rz=28+r()*24;
 const p={id:key,ownerX:mx*MEADOW_MACRO_CELLS,ownerZ:mz*MEADOW_MACRO_CELLS,
  x:px,z:pz,seed:meadowHash(mx,mz,seed,'shape'),angle:r()*TAU,
  warp:6+r()*3,feather:3.5,join:7,photo:false,
  wet:.28+r()*.32,shade:.10+r()*.23,density:.42+r()*.25,
  lobes:[lobe(0,0,rx,rz)]};
 // Attached off-centre lobes make bays/shoulders without a regular petal ring.
 const count=2+Math.floor(r()*3),start=r()*TAU;
 for (let i=0;i<count;i++) {
  const a=start+i*2.3999632297+(r()-.5)*.8;
  p.lobes.push(lobe(Math.cos(a)*rx*(.62+r()*.20),Math.sin(a)*rz*(.64+r()*.24),
   rx*(.36+r()*.20),rz*(.43+r()*.25),(r()-.5)*.8));
 }
 return remember(macros,key,finishPatch(p),MACRO_CACHE_LIMIT);
}

// The same photographic landmark for every world seed, as before. Shape only
// replaces the former rotated rectangle; it does not move the B camera.
const PHOTO_PATCH=finishPatch({id:'photo-b',ownerX:8n,ownerZ:5n,x:10,z:24,
 seed:hashText('meadow-v12:photo-b'),angle:Math.atan2(-.825,.565),
 warp:5.2,feather:3.5,join:6,photo:true,wet:.43,shade:.08,density:.64,
 lobes:[lobe(0,0,56,28),lobe(-38,3,30,24,-.13),
  lobe(35,-3,32,25,.20),lobe(8,19,27,19,-.35),lobe(-12,-15,24,21,.2)]});

function relativePatch(p,cx,cz) {
 const dx=cx-p.ownerX,dz=cz-p.ownerZ;
 // Check exact differences before any conversion; distant photo queries stay
 // exact even at +/-10^100 cells. All converted numbers are bounded integers.
 const reach=BigInt(Math.ceil((p.radius+MACRO_METRES)/MEADOW_CHUNK)+1);
 if (dx < -reach || dx > reach || dz < -reach || dz > reach) return null;
 const tileX=Number(dx)*MEADOW_CHUNK,tileZ=Number(dz)*MEADOW_CHUNK;
 const centreX=p.x-tileX,centreZ=p.z-tileZ;
 if (centreX+p.radius<0 || centreX-p.radius>64 || centreZ+p.radius<0 || centreZ-p.radius>64) return null;
 return {patch:p,tileX,tileZ};
}
function signedDepth(x,z,p) {
 const coarseX=noise(x/48,z/48,p.seed)-.5;
 const coarseZ=noise(x/48+17.3,z/48-9.1,p.seed^0x4f1bbcdc)-.5;
 const fineX=noise(x/16+3.4,z/16,p.seed^0x632be5ab)-.5;
 const fineZ=noise(x/16,z/16+21.7,p.seed^0x85157af5)-.5;
 const wx=x+p.warp*(coarseX*1.5+fineX*.5),wz=z+p.warp*(coarseZ*1.5+fineZ*.5);
 const u=p.c*wx+p.s*wz,v=-p.s*wx+p.c*wz;
 let depth=-1e9;
 for (const q of p.lobes) {
  const dx=u-q.x,dz=v-q.z,a=q.c*dx+q.s*dz,b=-q.s*dx+q.c*dz;
  const d=(1-Math.hypot(a/q.rx,b/q.rz))*q.min;
  const h=Math.max(p.join-Math.abs(depth-d),0)/p.join;
  depth=Math.max(depth,d)+h*h*p.join*.25;
 }
 return depth;
}
function analytic(x,z,nearby,out) {
 let cover=0,wet=0,shade=0,density=0,weight=0;
 for (const ref of nearby) {
  const p=ref.patch;
  // Add the small integer tile origin BEFORE subtracting the fractional
  // patch centre, producing bit-identical coordinates on shared grid edges.
  const px=ref.tileX+x-p.x,pz=ref.tileZ+z-p.z;
  if (Math.abs(px)>p.radius || Math.abs(pz)>p.radius) continue;
  const c=smooth(-p.feather,p.feather,signedDepth(px,pz,p));
  if (c===0) continue;
  const broad=noise(px/39+8.2,pz/39-5.7,p.seed^0xa511e9b3);
  const patch=noise(px/11-4.1,pz/11+9.2,p.seed^0x63d83595);
  cover=1-(1-cover)*(1-c);
  wet+=c*clamp01(p.wet+(broad-.5)*.48);
  // A habitat tendency, not a substitute for actual tree/hedge shadow.
  shade+=c*clamp01(p.shade+(.5-broad)*.20);
  density+=c*clamp01(p.density+(patch-.5)*.72+(broad-.5)*.14);
  weight+=c;
 }
 out[0]=cover;
 // Premultiplied habitat channels are continuous at a patch's last texel.
 // The environment sampler unmultiples after bilinear interpolation.
 out[1]=weight?wet/weight*cover:0;
 out[2]=weight?shade/weight*cover:0;
 out[3]=weight?density/weight*cover:0;
}

/** Return cached tile descriptor or null. Caller owns GPU resource lifetime.
 * grid is immutable-by-convention, row-major RGBA Float32, x varying fastest.
 * RGB habitat channels after cover are premultiplied by cover; use
 * meadowEnvironment() to obtain unpremultiplied ecological values.
 */
export function meadowForTile(cx,cz,seed) {
 if (typeof cx!=='bigint' || typeof cz!=='bigint') throw new TypeError('Meadow cells must be BigInt');
 const key=`${String(seed)}:${cx}:${cz}`,hit=cached(tiles,key);
 if (hit!==undefined) return hit;
 const mx=meadowFloorDiv(cx,MEADOW_MACRO_CELLS),mz=meadowFloorDiv(cz,MEADOW_MACRO_CELLS);
 const nearby=[];
 for (let dz=-1;dz<=1;dz++) for (let dx=-1;dx<=1;dx++) {
  const p=macroPatch(mx+BigInt(dx),mz+BigInt(dz),seed);
  if (p) { const ref=relativePatch(p,cx,cz); if(ref) nearby.push(ref); }
 }
 const photo=relativePatch(PHOTO_PATCH,cx,cz);if(photo)nearby.push(photo);
 if (!nearby.length) return remember(tiles,key,null,TILE_CACHE_LIMIT);
 // Stable order avoids order-dependent blending when crossing macro edges.
 nearby.sort((a,b)=>a.patch.id<b.patch.id?-1:a.patch.id>b.patch.id?1:0);
 const size=MEADOW_GRID_SIZE,grid=new Float32Array(size*size*4),sample=[0,0,0,0];
 let maxCover=0,sumCover=0;
 for(let iz=0;iz<size;iz++) for(let ix=0;ix<size;ix++) {
  analytic(ix*MEADOW_GRID_STEP,iz*MEADOW_GRID_STEP,nearby,sample);
  const offset=(iz*size+ix)*4;grid.set(sample,offset);
  maxCover=Math.max(maxCover,sample[0]);sumCover+=sample[0];
 }
 if(maxCover===0) return remember(tiles,key,null,TILE_CACHE_LIMIT);
 return remember(tiles,key,{cx,cz,size,step:MEADOW_GRID_STEP,grid,maxCover,
  meanCover:sumCover/(size*size),patchIds:nearby.map(r=>r.patch.id),
  photoOriginX:photo?PHOTO_PATCH.x-photo.tileX:null,
  photoOriginZ:photo?PHOTO_PATCH.z-photo.tileZ:null},TILE_CACHE_LIMIT);
}

function interpolate(x,z,d,channel) {
 const gx=Math.max(0,Math.min(d.size-1,x/d.step)),gz=Math.max(0,Math.min(d.size-1,z/d.step));
 const ix=Math.min(d.size-2,Math.floor(gx)),iz=Math.min(d.size-2,Math.floor(gz));
 const tx=gx-ix,tz=gz-iz,i=(iz*d.size+ix)*4+channel,stride=d.size*4,g=d.grid;
 return mix(mix(g[i],g[i+4],tx),mix(g[i+stride],g[i+stride+4],tx),tz);
}
/** O(1), no allocations, local x/z in [0,64]. Null descriptor means no meadow. */
export function meadowSample(x,z,descriptor) {
 return descriptor?interpolate(x,z,descriptor,0):0;
}
/** Fill reusable output, making no allocations when out is provided. */
export function meadowEnvironment(x,z,descriptor,out={}) {
 const cover=meadowSample(x,z,descriptor);
 out.cover=cover;
 out.moisture=cover>1e-7?clamp01(interpolate(x,z,descriptor,1)/cover):.4;
 out.shade=cover>1e-7?clamp01(interpolate(x,z,descriptor,2)/cover):.12;
 out.patchDensity=cover>1e-7?clamp01(interpolate(x,z,descriptor,3)/cover):0;
 out.shortness=0;
 if(descriptor?.photoOriginX!==null && descriptor?.photoOriginX!==undefined) {
  const dx=x-descriptor.photoOriginX,dz=z-descriptor.photoOriginZ;
  out.shortness=(1-smooth(18*18,95*95,dx*dx+dz*dz))*cover;
 }
 return out;
}
/** Direct RGBA interpolation for geometry attributes; all habitat channels
 * remain premultiplied. out[offset+0..3] may be a Float32Array. */
export function meadowVertex(x,z,descriptor,out,offset=0) {
 for(let c=0;c<4;c++)out[offset+c]=descriptor?interpolate(x,z,descriptor,c):0;
 return out;
}
export function meadowCacheStats() {
 return {macroEntries:macros.size,tileEntries:tiles.size,
  macroLimit:MACRO_CACHE_LIMIT,tileLimit:TILE_CACHE_LIMIT,
  gridBytes:[...tiles.values()].reduce((n,d)=>n+(d?.grid.byteLength||0),0)};
}
export function clearMeadowCache() { macros.clear();tiles.clear(); }
