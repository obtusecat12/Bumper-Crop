// V135-capital ④-4 crowd simulation core (pure JS, no three.js; runs in crowd135-sim-worker.js, or on the main thread as a
// fallback / for previews). City coordinates (urban-layout: block 112 m, road x = -224 is the closed SoHo fair road).
// - 2 m walkability grid over the fair corridor: walking strip |lx| < 4 between the stall rows (lz 20.5..91.5 of blocks
//   (-2,0) (-2,1)), both sidewalks 8..12 m off the road centre, the corner sidewalks and the zebra bands (lx = x + 224).
// - Flow fields: one Dijkstra distance field per goal (fair ends, every stall's queue head, every kerb wait point); agents
//   descend the bilinear gradient and add a keep-right lateral lane offset while the flow runs along the corridor.
// - Avoidance (only agents within AVOID m of the player = render tiers A/B): spatial hash 1.5 m, hard separation +
//   time-to-closest-approach sidestep to the right; queued / standing people are static obstacles; the player is one too.
// - Stalls: queue of up to 4 (head served 6-13 s); two hashed 'hot' stalls per block draw 6x the visits; fair walkers alternate ends / stalls.
// - Sidewalk walkers wait at the kerb and cross the E-W roads z = 0, 112, 224 only on the N-S green of traffic132's
//   signal at node (-2, j) (same hashed phase as traffic132-core signal132; the clock t comes from the main thread).
// Output per agent: id, x, z, heading (atan2(vx,vz)), clip (0 walk / 1 idle), anim phase (s at rate 1).
const B=112,RX=-224,CS=2,GX0=-242,GZ0=-30,NX=18,NZ=142,AVOID=48,CYCLE=36;
export const hash135s=(a,b=0,c=0)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1)^Math.imul(c|0,0x9e3779b1);h^=h>>>15;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return(h>>>0)/4294967296;};
// N-S phase position of node (k,j) — copy of traffic132-core signal132's clock (green 0-14, yellow 14-17)
const nsPhase=(k,j,t)=>((t+hash135s(k,j,7)*CYCLE)%CYCLE+CYCLE)%CYCLE;
// zebra crossings over the E-W roads sit 15 m off the N-S road centre (urban-streets: q = 15 / 97 in block frames), so the
// route turns the corner onto the E-W road's sidewalk, waits at the kerb there and crosses at |lx| = 15
export const CROSS135=[0,112,224],KERB=8.3,XW=15;
function walkable(x,z){const lx=x-RX,a=Math.abs(lx);let dz=1e9;for(const c of CROSS135)dz=Math.min(dz,Math.abs(z-c));
 if(dz<7.5)return a>=XW-1.4&&a<=XW+1.4;           // inside an E-W road: only the zebra band
 if(dz<=12&&a>=8&&a<=XW+2)return true;              // corner: the E-W road's sidewalk
 if(a>=8&&a<=12)return true;
 if(a<=4)for(const j of[0,1]){const lz=z-j*B;if(lz>=20.5&&lz<=91.5)return true;}return false;}
export function createSim135(){
 const grid=new Uint8Array(NX*NZ);for(let iz=0;iz<NZ;iz++)for(let ix=0;ix<NX;ix++)grid[iz*NX+ix]=walkable(GX0+(ix+.5)*CS,GZ0+(iz+.5)*CS)?1:0;
 const fields=new Map(),agents=new Map(),stalls=new Map(),hash=new Map();let simMs=0,nActive=0;
 const cellOf=(x,z)=>{const ix=Math.floor((x-GX0)/CS),iz=Math.floor((z-GZ0)/CS);return ix<0||iz<0||ix>=NX||iz>=NZ?-1:iz*NX+ix;};
 const okAt=(x,z)=>{const c=cellOf(x,z);return c>=0&&grid[c]===1;};
 function field(key,gx,gz){let F=fields.get(key);if(F)return F;const D=new Float32Array(NX*NZ).fill(1e9),g=cellOf(gx,gz);
  // Dijkstra on 8-neighbours (no corner cutting); small grid so a sorted frontier array is plenty
  if(g>=0){D[g]=0;const open=[g];while(open.length){let bi=0;for(let i=1;i<open.length;i++)if(D[open[i]]<D[open[bi]])bi=i;const c=open[bi];open[bi]=open[open.length-1];open.pop();
   const cx=c%NX,cz=(c/NX)|0;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=cx+dx,nz=cz+dz;if(nx<0||nz<0||nx>=NX||nz>=NZ)continue;const n=nz*NX+nx;if(!grid[n])continue;
    if(dx&&dz&&(!grid[cz*NX+nx]||!grid[nz*NX+cx]))continue;const nd=D[c]+(dx&&dz?1.4142:1);if(nd<D[n]){if(D[n]>=1e9)open.push(n);D[n]=nd;}}}}
  F={D,gx,gz};fields.set(key,F);return F;}
 const sampleD=(D,x,z)=>{const fx=(x-GX0)/CS-.5,fz=(z-GZ0)/CS-.5,ix=Math.floor(fx),iz=Math.floor(fz),tx=fx-ix,tz=fz-iz,c0=cellOf(x,z),d0=c0>=0?D[c0]:1e9;
  const v=(i,k)=>{if(i<0||k<0||i>=NX||k>=NZ)return d0+3;const d=D[k*NX+i];return d>=1e9?d0+3:d;};
  return (v(ix,iz)*(1-tx)+v(ix+1,iz)*tx)*(1-tz)+(v(ix,iz+1)*(1-tx)+v(ix+1,iz+1)*tx)*tz;};
 // desired unit direction toward goal (gx,gz) via its flow field; direct steering in the last 2.5 m
 function flow(F,x,z,o,tx=F.gx,tz=F.gz){const dx0=tx-x,dz0=tz-z,dd=Math.hypot(dx0,dz0);const c0=cellOf(x,z);if(dd<2.5||c0<0||F.D[c0]<=1.5){o.x=dx0/(dd||1);o.z=dz0/(dd||1);o.d=dd;return o;}
  const e=.5,gx=sampleD(F.D,x+e,z)-sampleD(F.D,x-e,z),gz=sampleD(F.D,x,z+e)-sampleD(F.D,x,z-e),m=Math.hypot(gx,gz);
  if(m<1e-4){o.x=dx0/dd;o.z=dz0/dd;}else{o.x=-gx/m;o.z=-gz/m;}o.d=dd;return o;}
 const rnd=a=>(a.r=(Math.imul(a.r^(a.r>>>15),0x2c1b3c6d)+0x6d2b79f5)>>>0)/4294967296;
 // ---- population
 function addBlock(key,list,stallList){const S=[],kh=[...key].reduce((m,c)=>m*31+c.charCodeAt(0),7),h1=Math.floor(hash135s(kh,1)*stallList.length),h2=(h1+1+Math.floor(hash135s(kh,2)*(stallList.length-1)))%stallList.length;
  stallList.forEach((s,i)=>S.push({...s,q:[],pop:i===h1||i===h2?6:1}));stalls.set(key,S);
  for(const p of list){const a={...p,key,vx:0,vz:0,h:p.h??0,ph:p.phase||0,clip:p.kind==='stand'?1:0,r:(p.seed>>>0)||1,st:p.kind,goal:null,wait:0,stall:-1,cool:0};
   if(a.kind==='fair')pickFair(a,true);else if(a.kind==='walk')nextKerb(a);agents.set(a.id,a);}
  // precompute the block's fields now (no Dijkstra spike inside a step)
  for(const j of new Set(list.map(p=>p.j)))for(const e of[-1,1])field('f'+j+':'+e,RX,j*B+(e>0?89.5:22.5));S.forEach((s,i)=>field(key+':s'+i,s.qx,s.qz));
  for(const c of CROSS135)for(const k of[-1,1])for(const sd of[-1,1])field('k'+sd+':'+(c+k*KERB),RX+sd*XW,c+k*KERB);
  for(const tz of[-14,-16,-18,238,240,242])for(const sd of[-1,1])field('t'+sd+':'+tz,RX+sd*10.1,tz);}
 function dropBlock(key){for(const[id,a]of agents)if(a.key===key)agents.delete(id);stalls.delete(key);}
 const fairGoal=(a,end)=>{const j=a.j,z=j*B+(end>0?89.5:22.5);return{F:field('f'+j+':'+end,RX,z),tx:RX+(rnd(a)-.5)*5,tz:z+(rnd(a)-.5)*3,end};};
 function pickFair(a,first){const S=stalls.get(a.key);a.st='fair';a.stall=-1;
  if(!first&&S&&S.length&&rnd(a)<.6&&a.cool<=0){let u=rnd(a)*S.reduce((m,q)=>m+q.pop,0),i=0;while(i<S.length-1&&(u-=S[i].pop)>0)i++;const s=S[i];a.stall=i;a.goal={F:field(a.key+':s'+i,s.qx,s.qz)};a.st='toStall';return;}
  const zr=a.z-a.j*B,end=first?(rnd(a)<.5?1:-1):(zr>56?-1:1);a.goal=fairGoal(a,end);a.dir=end;}
 // sidewalk: side = sign(lx); dir = +-1 along z; head to the next kerb in that direction (or the turn-around point beyond an end crossing)
 function nextKerb(a){const side=Math.sign(a.x-RX)||1,cx=RX+side*10.1;a.side=side;a.st='walk';
  if(a.turnZ!==undefined){const tz=Math.round(a.turnZ/2)*2;a.goal={F:field('t'+side+':'+tz,cx,tz),tx:cx+(rnd(a)-.5)*1.6,tz:a.turnZ,turn:1};return;}
  let best=null;for(const c of CROSS135){for(const s of[-1,1]){const kz=c+s*KERB;if((kz-a.z)*a.dir>.5&&(best===null||Math.abs(kz-a.z)<Math.abs(best.kz-a.z)))best={c,kz};}}
  if(!best){a.dir=-a.dir;return nextKerb(a);}a.goal={F:field('k'+side+':'+best.kz,RX+side*XW,best.kz),tx:RX+side*(XW+(rnd(a)-.5)*1.8),tz:best.kz-a.dir*rnd(a)*.9,c:best.c,kz:best.kz};}
 function arrive(a,t){const G=a.goal;
  if(a.st==='walk'){if(G.turn){a.turnZ=undefined;a.dir=-a.dir;a.wait=.6+rnd(a)*1.2;a.st='pause';return;}
   const across=G.kz+Math.sign(G.c-G.kz)*2*KERB;a.st='waitX';a.cross={c:G.c,to:across,x:a.x};return;}
  if(a.st==='fair'){a.wait=rnd(a)<.3?1+rnd(a)*3:0;a.st=a.wait?'look':'fair';pickFair(a,false);if(a.wait)a.st='look';return;}
  if(a.st==='toStall'){const s=stalls.get(a.key)?.[a.stall];if(!s||s.q.length>=4){a.cool=8;pickFair(a,false);return;}s.q.push(a.id);a.st='queue';a.wait=6+rnd(a)*7;return;}}
 const slot=(s,i,o)=>{o.x=s.qx;o.z=s.qz+s.dq*.8*i;return o;};
 const _f={x:0,z:0,d:0},_s={x:0,z:0},NB=[],PL={x:0,z:0,vx:0,vz:0,me:1},HP=[];
 function step(t,dt,px,pz,pvx=0,pvz=0){const t0=performance.now();if(dt<=0){simMs=0;return;}
  for(const L of hash.values()){L.length=0;HP.push(L);}hash.clear();for(const a of agents.values()){const k=Math.floor(a.x/1.5)*4096+Math.floor(a.z/1.5);let L=hash.get(k);if(!L)hash.set(k,L=HP.pop()||[]);L.push(a);}
  nActive=0;PL.x=px;PL.z=pz;PL.vx=pvx;PL.vz=pvz;
  for(const a of agents.values()){a.cool-=dt;let dx=0,dz=0,spd=a.speed||1.2,lane=true,face=null;
   const pd=Math.hypot(a.x-px,a.z-pz),act=pd<AVOID;if(act)nActive++;
   switch(a.st){
    case'stand':a.vx=a.vz=0;a.clip=1;a.ph+=dt;continue;
    case'pause':case'look':a.wait-=dt;if(a.wait<=0){a.st=a.kind==='walk'?'walk':(a.goal?.F&&a.stall>=0?'toStall':'fair');if(a.kind==='walk')nextKerb(a);}spd=0;break;
    case'waitX':{const p=nsPhase(-2,a.cross.c/B,t);face=a.cross.to>a.z?0:Math.PI;spd=0;
     if(p<7){a.st='crossing';}break;}
    case'crossing':{const tz=a.cross.to,d=tz-a.z;dx=(a.cross.x-a.x)*.3;dz=Math.sign(d);spd=(a.speed||1.2)*1.25;lane=false;
     if(Math.abs(d)<.4){a.st='walk';const beyond=(a.cross.c===0&&a.dir<0)||(a.cross.c===224&&a.dir>0);if(beyond){a.turnZ=a.cross.c+a.dir*(KERB+6+rnd(a)*4);}nextKerb(a);}break;}
    case'queue':{const s=stalls.get(a.key)?.[a.stall];if(!s){pickFair(a,false);break;}const i=s.q.indexOf(a.id);if(i<0){pickFair(a,false);break;}
     slot(s,i,_s);const ex=_s.x-a.x,ez=_s.z-a.z,ed=Math.hypot(ex,ez);lane=false;
     if(ed>.12){dx=ex/ed;dz=ez/ed;spd=Math.min(.9,ed*1.5);}else{spd=0;face=i===0?Math.atan2(s.fx,0):s.dq>0?Math.PI:0;
      if(i===0){a.wait-=dt;if(a.wait<=0){s.q.shift();a.cool=6+rnd(a)*6;pickFair(a,false);}}}
     break;}
   }
   if((a.st==='fair'||a.st==='toStall'||a.st==='walk')&&a.goal){flow(a.goal.F,a.x,a.z,_f,a.goal.tx,a.goal.tz);dx=_f.x;dz=_f.z;
    if(_f.d<(a.st==='toStall'?3.2:1))arrive(a,t);
    // keep-right lane offset while the flow runs along the corridor (heading +z -> -x side)
    if(lane&&_f.d>3&&Math.abs(dz)>.7){const c=a.kind==='walk'?RX+a.side*10.1:RX,want=c-Math.sign(dz)*a.lane;dx+=Math.max(-.45,Math.min(.45,(want-a.x)*.5));}}
   // avoidance (tiers A/B only)
   if(act){let ax=0,az=0,slow=1;const moving=spd>0;const mvx=dx*spd,mvz=dz*spd,cx=Math.floor(a.x/1.5),cz=Math.floor(a.z/1.5);NB.length=0;
    for(let i=-1;i<=1;i++)for(let k=-1;k<=1;k++){const L=hash.get((cx+i)*4096+cz+k);if(L)for(const b of L)if(b!==a)NB.push(b);}
    NB.push(PL);
    for(const b of NB){const rx=b.x-a.x,rz=b.z-a.z,d=Math.hypot(rx,rz),R=b.me?.85:.62;if(d>2.4||d<1e-4)continue;
     if(d<R){const f=(R-d)/R*2.2;ax-=rx/d*f;az-=rz/d*f;}
     if(!moving)continue;const wx=b.vx-mvx,wz=b.vz-mvz,w2=wx*wx+wz*wz;if(w2<1e-4)continue;const tc=-(rx*wx+rz*wz)/w2;if(tc<=0||tc>2.2)continue;
     const mx=rx+wx*tc,mz=rz+wz*tc,md=Math.hypot(mx,mz);if(md>R+.1)continue;
     // sidestep right of my heading (right of +z = -x), harder the sooner and the closer
     const k=(1-tc/2.2)*(1-md/(R+.1))*1.6;ax+=-dz*k;az+=dx*k;if(rx*dx+rz*dz>0)slow=Math.min(slow,.45+.55*tc/2.2);}
    dx+=ax;dz+=az;spd*=slow;if(!moving){const f=Math.hypot(ax,az);if(f>.05&&a.st!=='queue')spd=Math.min(.6,f*.5);}}
   const m=Math.hypot(dx,dz);if(m>1e-4){dx/=m;dz/=m;}else spd=0;
   const k=Math.min(1,dt*4);a.vx+=(dx*spd-a.vx)*k;a.vz+=(dz*spd-a.vz)*k;
   let nx=a.x+a.vx*dt,nz=a.z+a.vz*dt;
   if(a.st!=='crossing'&&!okAt(nx,nz)){if(okAt(nx,a.z))nz=a.z;else if(okAt(a.x,nz))nx=a.x;else{nx=a.x;nz=a.z;}}
   a.x=nx;a.z=nz;const v=Math.hypot(a.vx,a.vz);
   if(face!==null&&v<.25){let d=face-a.h;d=Math.atan2(Math.sin(d),Math.cos(d));a.h+=d*Math.min(1,dt*5);}
   else if(v>.15){let d=Math.atan2(a.vx,a.vz)-a.h;d=Math.atan2(Math.sin(d),Math.cos(d));a.h+=d*Math.min(1,dt*7);}
   if(v>.25){a.clip=0;a.ph+=dt*v/1.38;}else{a.clip=1;a.ph+=dt;}}
  simMs=performance.now()-t0;}
 function write(out){let i=0;for(const a of agents.values()){out[i++]=a.id;out[i++]=a.x;out[i++]=a.z;out[i++]=a.h;out[i++]=a.clip;out[i++]=a.ph;}return i/6;}
 return{addBlock,dropBlock,step,write,get n(){return agents.size;},get ms(){return simMs;},get active(){return nActive;},agents,stalls,grid,NX,NZ,GX0,GZ0,CS};
}
