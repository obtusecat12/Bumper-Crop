import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SPRING_SHELL as shell} from '../../dist/level27-shell-data.js?v=59';
const indices=new Uint32Array(Uint8Array.from(atob(shell.indices),c=>c.charCodeAt(0)).buffer),edges=new Map();
for(let i=0;i<indices.length;i+=3)for(const[k,l]of[[0,1],[1,2],[2,0]]){const a=indices[i+k],b=indices[i+l],key=a<b?a+','+b:b+','+a;edges.set(key,(edges.get(key)||0)+1);}
const report={vertices:shell.vertices.length/8,triangles:indices.length/3,boundaryEdges:[...edges.values()].filter(n=>n===1).length,nonManifoldEdges:[...edges.values()].filter(n=>n>2).length};
assert.equal(report.boundaryEdges,0,'unclosed cave surface');assert.equal(report.nonManifoldEdges,0,'overlapping cave topology');
fs.writeFileSync(new URL('./results/rock-topology.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);
