import {execFileSync}from'node:child_process';import fs from'node:fs';
const base=new URL('../../dist/',import.meta.url),sha='62f49f3fa6a3ca7570187bd5b1cb8cd8dc4eeef0';
for(const[file,out]of[['dense-wheat.js','dense-wheat-v32-appearance.mjs'],['world.js','world-v32-arrival.mjs']]){let s=execFileSync('git',['show',sha+':dist/'+file],{encoding:'utf8'});s=s.replace(/from '(\.\/[^']+)'/g,(_,p)=>"from '"+new URL(p.split('?')[0],base).href+(p.includes('vendor/')?'':'?v=34')+"'");fs.writeFileSync('/tmp/'+out,s);}
