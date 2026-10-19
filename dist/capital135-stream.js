// V135-capital ②c: per-cell streaming of the capital's Blender Cycles bake (bc/scripts/bake135 → cook135.py).
// Before: the whole 6.3 MB data module (+3.2 MB node bake) was fetched and filled 2.5 s after boot in EVERY level.
// Now nothing is fetched until the player is near the capital: the first tick keys the fixed meshes (time-sliced),
// then 112 m city cells are fetched as raw u8 packs (dist/capital135/c<ix>_<iz>.<hash>.bin) nearest-first, with the
// player's motion projected 2 s ahead, at most 2 fetches in flight, and filled under a per-frame time budget.
// Cells beyond the load ring are fetched later at idle (they're cheap once nearby ones are in). ?bake135=0 = old path.
import {keySky133,weld133} from './venue133-bake.js?v=133c';
const RING=2.6,SLICE=3,MAXF=2; // load ring in cells (Chebyshev-ish, centre distance), fill budget ms/frame, concurrent fetches
export function createCapitalStream(prep,{index,base,worldToCity,B=112,onCell=()=>{}}){
 const cells=Object.entries(index).map(([k,v])=>{const[ix,iz]=k.split(',').map(Number);return{id:k,ix,iz,cx:(ix+.5)*B,cz:(iz+.5)*B,...v,state:0,bytes:null};}); // state 0 idle 1 fetching 2 fetched 3 filled
 const st={keyed:false,keying:false,started:0,filled:0,cells:cells.length,bytes:0,fetching:0,vx:0,vz:0,lx:null,lz:null,lt:0,log:[]};
 let byKey=null,fillJob=null;const pend=[];
 function key(){st.keying=true;st.started=performance.now();keySky133(prep).then(()=>{byKey=new Map(prep.list.map(e=>[e.key,e]));st.keyed=true;st.keyMs=Math.round(performance.now()-st.started);});}
 function fetchCell(c){c.state=1;st.fetching++;fetch(base+c.f).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();}).then(b=>{c.bytes=new Uint8Array(b);c.state=2;st.bytes+=b.byteLength;pend.push(c);}).catch(e=>{console.warn('[capital135] cell',c.id,e);c.state=0;c.retry=performance.now()+4000;}).finally(()=>st.fetching--);}
 function* filler(c){const u8=c.bytes;let t=performance.now();
  for(const[k,off,len]of c.k){const e=byKey.get(k),a=e?.mesh.geometry.attributes.bake133;if(!a){prep.miss++;continue;}
   const{remap,count}=weld133(e.mesh.geometry);if(count*4!==len){prep.miss++;continue;}
   const u=a.array,n=a.count;for(let i=0;i<n;i++){const j=off+remap[i]*4,o=i*4;u[o]=u8[j];u[o+1]=u8[j+1];u[o+2]=u8[j+2];u[o+3]=u8[j+3];}
   a.needsUpdate=true;prep.hit++;prep.verts+=n;if(performance.now()-t>SLICE){yield;t=performance.now();}}
  c.bytes=null;c.state=3;st.filled++;st.log.push(c.id+'@'+Math.round(performance.now()-st.started));onCell(c);if(st.filled===cells.length){prep.filled=true;console.info('[capital135] all',cells.length,'cells filled',prep.hit,'meshes',Math.round(st.bytes/1024)+' KB');}}
 function tick(wx,wz){
  if(!st.keying)key();
  const now=performance.now(),p=worldToCity(wx,wz);
  if(st.lx!==null&&now>st.lt){const dt=Math.max(.016,(now-st.lt)/1000),k=Math.min(1,dt*2);st.vx+=((p.x-st.lx)/dt-st.vx)*k;st.vz+=((p.z-st.lz)/dt-st.vz)*k;}st.lx=p.x;st.lz=p.z;st.lt=now;
  const ax=p.x+st.vx*2,az=p.z+st.vz*2; // 2 s look-ahead
  if(!st.keyed)return;
  if(st.fetching<MAXF){let best=null,bd=1e9;for(const c of cells){if(c.state||c.retry>now)continue;const d=Math.min(Math.hypot(c.cx-p.x,c.cz-p.z),Math.hypot(c.cx-ax,c.cz-az))/B;
    const near=d<=RING;if(!near&&(pend.length||fillJob||st.fetching||globalThis.__cap135NoIdle))continue; // far cells only when idle (one at a time)
    if(d<bd){bd=d;best=c;}}if(best)fetchCell(best);}
  if(!fillJob&&pend.length){pend.sort((a,b)=>Math.hypot(a.cx-p.x,a.cz-p.z)-Math.hypot(b.cx-p.x,b.cz-p.z));fillJob=filler(pend.shift());}
  if(fillJob&&fillJob.next().done)fillJob=null;
 }
 return{tick,stats:st,cells};
}
