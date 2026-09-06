import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
async function check(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const path=join(directory,entry.name);
    if(entry.isDirectory()){await check(path);continue;}
    if(!path.endsWith('.js'))continue;
    const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:await readFile(path,'utf8'),encoding:'utf8'});
    if(result.status!==0){console.error(path+'\n'+result.stderr);process.exit(1);}
    console.log('Parsed as browser module: '+path);
  }
}
await check('dist');
