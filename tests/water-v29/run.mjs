import {spawnSync} from 'node:child_process';import fs from 'node:fs';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),results={};
for(const file of ['water-v26/physics','water-v26/stick-slip','water-v26/rain','water-v29/system','water-v29/pipeline','water-v29/lens','water-v28/regression','handheld-v27/integration']){
 const run=spawnSync(process.execPath,['tests/'+file+'.mjs'],{cwd:root,encoding:'utf8'});if(run.status){console.error(run.stdout,run.stderr);process.exit(run.status);}results[file]=JSON.parse(run.stdout);console.log('PASS '+file);
}fs.writeFileSync(new URL('../../docs/water-v29/checks.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
