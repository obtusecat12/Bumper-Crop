import {ALPHA_CHUNKS150,chunkAt150,describeChunk150} from './alpha150-plan.js';
const nextTurn=()=>new Promise(r=>setTimeout(r,0));
export function createAlphaStream150({prepare=async id=>{await nextTurn();return describeChunk150(id);},create,release,budgetMs=2,loadRadius=44,unloadRadius=76}){
 const resident=new Map(),pending=new Map(),ready=[],desired=new Set();let active=null,epoch=0,lastPlan='',lastX=0,lastZ=0,disposed=false;
 const stats={requested:0,cancelled:0,released:0,failed:0,created:0};
 function cancel(id){const p=pending.get(id);if(p){p.cancelled=true;p.abort?.();pending.delete(id);stats.cancelled++;}}
 function request(c){if(resident.has(c.id)||pending.has(c.id)||ready.some(a=>a.id===c.id)||active?.id===c.id)return;
  const token={epoch,cancelled:false};pending.set(c.id,token);stats.requested++;
  Promise.resolve().then(()=>prepare(c.id,token)).then(desc=>{if(disposed||token.cancelled||token.epoch!==epoch||!desired.has(c.id))return;ready.push(desc);},()=>{if(!token.cancelled)stats.failed++;}).finally(()=>{if(pending.get(c.id)===token)pending.delete(c.id);});
 }
 function plan(x,z,dx=0,dz=0,force=false){if(disposed)return;lastX=x;lastZ=z;const cell=chunkAt150(x,z);const dir=Math.hypot(dx,dz);const fx=dir>.01?dx/dir*18:0,fz=dir>.01?dz/dir*18:0;
  const key=`${cell?.id}:${Math.round(fx/9)}:${Math.round(fz/9)}`;if(!force&&lastPlan===key)return;lastPlan=key;desired.clear();
  const order=ALPHA_CHUNKS150.filter(c=>Math.hypot(c.cx-x,c.cz-z)<loadRadius+17||Math.hypot(c.cx-x-fx,c.cz-z-fz)<loadRadius).sort((a,b)=>Math.hypot(a.cx-x-fx,a.cz-z-fz)-Math.hypot(b.cx-x-fx,b.cz-z-fz));
  for(const c of order)desired.add(c.id);
  for(const id of pending.keys())if(!desired.has(id))cancel(id);
  for(let i=ready.length-1;i>=0;i--)if(!desired.has(ready[i].id))ready.splice(i,1);
  if(active&&!desired.has(active.id)){active.iterator.return?.();active=null;stats.cancelled++;}
  for(const [id,item]of resident){const c=item.chunk;if(Math.hypot(c.cx-x,c.cz-z)>unloadRadius){release(item);resident.delete(id);stats.released++;}}
  for(const c of order)request(c);
 }
 function tick(){if(disposed)return;const t=performance.now();let steps=0;
  while(steps++<32&&performance.now()-t<budgetMs){
   if(!active){const desc=ready.shift();if(!desc)return;if(!desired.has(desc.id))continue;active={id:desc.id,iterator:create(desc)};}
   const r=active.iterator.next();if(r.done){resident.set(active.id,r.value);active=null;stats.created++;}
  }
 }
 async function ensure(x,z){plan(x,z,0,0,true);const c=chunkAt150(x,z);if(!c)throw Error('Alpha destination outside layout');const started=performance.now(),ownEpoch=epoch;
  while(!resident.has(c.id)){if(disposed||epoch!==ownEpoch)throw Error('Alpha loading cancelled');tick();if(performance.now()-started>10000)throw Error('Alpha chunk preparation timed out');await nextTurn();}
 }
 function isReady(x,z,r=.3){return [[-r,-r],[r,-r],[-r,r],[r,r]].every(([dx,dz])=>{const c=chunkAt150(x+dx,z+dz);return c&&resident.has(c.id);});}
 function clear(){epoch++;for(const id of pending.keys())cancel(id);ready.length=0;active?.iterator.return?.();active=null;for(const item of resident.values()){release(item);stats.released++;}resident.clear();desired.clear();lastPlan='';}
 return{plan,tick,ensure,isReady,clear,dispose(){clear();disposed=true;},stats:()=>({...stats,resident:resident.size,pending:pending.size,queued:ready.length,building:active?.id||null,ids:[...resident.keys()],position:{x:lastX,z:lastZ}})};
}
