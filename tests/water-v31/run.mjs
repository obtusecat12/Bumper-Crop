import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url)),results={};
for(const name of ['water-v26/physics','water-v26/stick-slip','water-v26/rain','water-v31/system','water-v29/pipeline','water-v31/behavior','water-v31/material-chain','water-v30/regression','handheld-v27/integration']){
 const test=spawnSync(process.execPath,['tests/'+name+'.mjs'],{cwd:root,encoding:'utf8'});
 if(test.status){console.error(test.stdout,test.stderr);process.exit(test.status||1);}
 results[name]=JSON.parse(test.stdout);console.log('PASS '+name);
}
fs.writeFileSync(new URL('../../docs/water-v31/checks.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
