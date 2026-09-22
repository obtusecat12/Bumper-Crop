import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
const root=fileURLToPath(new URL('../../',import.meta.url));
for(const name of ['motion','integration']){
 const run=spawnSync(process.execPath,[`tests/handheld-v27/${name}.mjs`],{cwd:root,encoding:'utf8'});
 if(run.status!==0){console.error(run.stdout,run.stderr);process.exit(run.status||1);}
 if(name==='integration')fs.writeFileSync(new URL('../../docs/handheld-v27/integration-report.json',import.meta.url),run.stdout);
 console.log(`PASS handheld-v27/${name}`);
}
