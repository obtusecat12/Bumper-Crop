import {buildLobby136,COLS136} from '../../dist/atm136-geo.js';
import fs from 'fs';
const t=Date.now(),{parts,lights}=buildLobby136();let V=0,Tn=0;const out={parts:{},lights};
for(const[k,q]of Object.entries(parts)){V+=q.P.length/3;Tn+=q.I.length/3;out.parts[k]={P:q.P,N:q.N,I:q.I,count:q.P.length/3};console.log(k,q.P.length/3,q.I.length/3);}
console.log('verts',V,'tris',Tn,'ms',Date.now()-t,'lights',lights.length);
fs.writeFileSync(process.argv[2]||'raw.json',JSON.stringify(out));
