import {RayFrameBudget,probeRayUpperBound,RAY_FRAME_BUDGET,RAY_SLICE_MS} from './ray-budget.js?v=58';
import {REFERENCE_BARN as B,BARN_ROOFLIGHTS} from './reference-barn-layout.js?v=58';
import {TriangleBVH,ChunkBVHScene,traceRelocatedProbe} from './probe-bvh.js?v=58';
import {PROBE_GRID as GRID,PROBE_STEP as STEP,PROBE_RAYS,PROBE_FAR,SKY_TOP,SKY_BOTTOM,SUN_DIRECTION,SUN_COLOR,SUN_INTENSITY} from './lighting-config.js?v=58';

const budget=new RayFrameBudget();
const chunks=new Map(),cache=new Map(),scene=new ChunkBVHScene();
let revision=0,job=null,running=false,paused=false;
const linear=n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4;
const sun=[1,3,5].map(i=>linear(parseInt(SUN_COLOR.slice(i,i+2),16)/255)*SUN_INTENSITY);
const lighting={rays:PROBE_RAYS,maxDistance:PROBE_FAR,skyTop:SKY_TOP,skyBottom:SKY_BOTTOM,
  sunDirection:SUN_DIRECTION,sunRadiance:sun,bounceSkyRays:1,maxRelocation:.38};

async function run() {
  if(running)return;running=true;
  try {
    while(job&&!paused){
      const current=job;job=null;const start=performance.now(),rev=revision;
      const {id,cx,cz,baseX,baseY,baseZ}=current;
      const entries=[];
      for(const c of chunks.values()){
        const dx=Number(c.cx-cx),dz=Number(c.cz-cz);
        if(Math.abs(dx)<=2&&Math.abs(dz)<=2)entries.push({bvh:c.bvh,x:dx*64,y:0,z:dz*64});
      }
      scene.setEntries(entries);
      const shelter=entries.some(e=>e.x===(1-Number(cx))*64&&e.z===(-2-Number(cz))*64)&&cx>=-1n&&cx<=3n&&cz>=-4n&&cz<=0n?{x:B.x-Number(cx)*64,z:B.z-Number(cz)*64}:null;
      const portal=shelter?{x:shelter.x+B.doorX,y:B.y+B.doorHeight*.5,z:shelter.z+B.depth*.5,width:B.doorWidth,height:B.doorHeight}:null;
      const roofPortals=shelter?BARN_ROOFLIGHTS.map(p=>({x:shelter.x+p.x,y:B.y+B.rearEave+(p.z+B.depth*.5)*(B.ridge-B.rearEave)/(B.ridgeZ+B.depth*.5)+.05,z:shelter.z+p.z,width:p.width,height:p.depth*Math.hypot(1,(B.ridge-B.rearEave)/(B.ridgeZ+B.depth*.5)),roofSlope:(B.ridge-B.rearEave)/(B.ridgeZ+B.depth*.5)})):[];
      const count=GRID[0]*GRID[1]*GRID[2],sh=new Float32Array(count*12),moments=new Float32Array(count*12),positions=new Float32Array(count*4);
      let computed=0,reused=0,rays=0,slice=performance.now();
      const gx=cx*16n+BigInt(baseX/4),gz=cz*16n+BigInt(baseZ/4);
      // Near floor layers and central probes are computed first. The completed
      // volume is exchanged atomically, avoiding partially lit moving stripes.
      for(let z=0;z<GRID[2];z++)for(let y=0;y<GRID[1];y++)for(let x=0;x<GRID[0];x++){
        if(paused||job||revision!==rev)break;
        const index=(z*GRID[1]+y)*GRID[0]+x,key=`${gx+BigInt(x)}:${baseY+y*STEP[1]}:${gz+BigInt(z)}`;
        let p=cache.get(key);
        if(p){cache.delete(key);cache.set(key,p);reused++;}
        else {
          const px=baseX+x*STEP[0],py=baseY+y*STEP[1],pz=baseZ+z*STEP[2];
          // Keep samples stable in absolute integer-grid coordinates.
          const seed=Number(BigInt.asUintN(32,(gx+BigInt(x))*73856093n^(gz+BigInt(z))*19349663n^BigInt(y*83492791)));
          // The reserved bound includes the possible 96-ray interior refinement,
          // all three portals, secondary visibility and one relocation attempt.
          const reserve=await budget.reserve(probeRayUpperBound(PROBE_RAYS,1)+probeRayUpperBound(96,4,3));
          if(paused||job||revision!==rev){budget.settle(reserve,0);break;}
          let probeRays=0;
          p=traceRelocatedProbe(scene,px,py,pz,{...lighting,seed});
          // Narrow doorways need more visibility samples; cache this work once.
          // Open fields retain the inexpensive 32-ray path.
          if(p.valid&&p.visibility<.18&&p.closestObstacle<12){const coarse=p;rays+=coarse.rayCount;probeRays+=coarse.rayCount;p=traceRelocatedProbe(scene,px,py,pz,{...lighting,seed,rays:96,bounceSkyRays:4,skyPortals:portal&&Math.abs(px-shelter.x)<12&&Math.abs(pz-shelter.z)<5.8&&py>B.y&&py<B.y+B.ridge?[portal,...roofPortals]:[]});if(p.valid&&p.position.every((v,i)=>Math.abs(v-coarse.position[i])<.00001)){for(let i=0;i<12;i++){p.sh[i]=coarse.sh[i]*.25+p.sh[i]*.75;p.moments[i]=coarse.moments[i]*.25+p.moments[i]*.75;}}}
          p.offset=[p.position[0]-px,p.position[1]-py,p.position[2]-pz];
          cache.set(key,p);if(cache.size>10000)cache.delete(cache.keys().next().value);
          computed++;rays+=p.rayCount;budget.settle(reserve,probeRays+p.rayCount);
        }
        sh.set(p.sh,index*12);moments.set(p.moments,index*12);
        positions.set(p.offset,index*4);
        const near=p.closestObstacle<8||Math.min(p.moments[0],p.moments[2],p.moments[8],p.moments[10])<8||p.moments[4]<4;
        positions[index*4+3]=p.valid?(near?1:2):0;
        if(performance.now()-slice>=RAY_SLICE_MS){await budget.yieldFrame();slice=performance.now();}
      }
      if(!paused&&!job&&revision===rev){
        self.postMessage({type:'volume',id,cx,cz,baseX,baseY,baseZ,sh,moments,positions,
          stats:{computed,reused,rays,rayFrameCap:RAY_FRAME_BUDGET,peakFrameRays:budget.peak,ms:performance.now()-start,triangles:entries.reduce((a,e)=>a+e.bvh.count,0),bytes:entries.reduce((a,e)=>a+e.bvh.byteLength,0)}},[sh.buffer,moments.buffer,positions.buffer]);
      } else if(!job) job=current;
    }
  } catch(error){self.postMessage({type:'error',message:String(error?.stack||error)});}
  finally {running=false;}
}
function invalidate(cx,cz){
  revision++;
  // Both primary and bounce visibility rays have finite reach. Retain probes
  // that cannot be affected by this tile, including distant revisited areas.
  const max=PROBE_FAR*2;
  for(const [key,p] of cache){
    const [x,,z]=key.split(':');
    const dx=Number(BigInt(x)-cx*16n)*4,dz=Number(BigInt(z)-cz*16n)*4;
    const ex=Math.max(0,-dx,dx-64),ez=Math.max(0,-dz,dz-64);
    if(ex*ex+ez*ez<=max*max)cache.delete(key);
  }
}
self.onmessage=({data})=>{
  try{
    if(data.type==='budget'){budget.grant(data.frame);return;}
    if(data.type==='put'){
      const {geometry:g,key,cx,cz}=data;
      chunks.set(key,{cx,cz,bvh:new TriangleBVH(g.positions,g.colors,g)});
      // Any nearby occluder change invalidates visibility and bounce radiance.
      // An immutable volume can still be displayed while replacement converges.
      invalidate(cx,cz);
    }else if(data.type==='remove'){const c=chunks.get(data.key);if(c){chunks.delete(data.key);invalidate(c.cx,c.cz);}}
    else if(data.type==='pause'){paused=data.value;if(!paused)run();}
    else if(data.type==='trace'){job=data;run();}
  }catch(error){self.postMessage({type:'error',message:String(error?.stack||error)});}
};
self.postMessage({type:'ready'});
