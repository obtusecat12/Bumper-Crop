// V135-capital ④-4: Web Worker host of crowd135-sim-core. Messages in: {op:'add',key,list,stalls} | {op:'drop',key} |
// {op:'step',t,dt,px,pz,pvx,pvz}. Out after every step: {op:'state',buf:Float32Array(n*6) id,x,z,h,clip,phase; n, ms, active}.
import {createSim135} from './crowd135-sim-core.js?v=135m';
const S=createSim135();
onmessage=e=>{const m=e.data;
 if(m.op==='add')S.addBlock(m.key,m.list,m.stalls);
 else if(m.op==='drop')S.dropBlock(m.key);
 else if(m.op==='step'){S.step(m.t,m.dt,m.px,m.pz,m.pvx,m.pvz);const buf=new Float32Array(Math.max(6,S.n*6)),n=S.write(buf);postMessage({op:'state',buf,n,ms:S.ms,active:S.active},[buf.buffer]);}};
