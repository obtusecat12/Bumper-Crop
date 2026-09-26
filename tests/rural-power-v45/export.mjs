import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fogVertex,fogIntegrateFragment,fogCompositeFragment} from '../../dist/advancing-fog.js';
const dir=process.argv[2];
execFileSync(process.execPath,['tests/visibility-cloud-v43/export.mjs',dir],{stdio:'inherit'});
const s=JSON.parse(fs.readFileSync(dir+'/shaders.json'));
for(const [name,fragment] of Object.entries({fogIntegrate:fogIntegrateFragment,fogComposite:fogCompositeFragment}))s[name]={vertex:'#version 300 es\n'+fogVertex,fragment:'#version 300 es\n'+fragment};
fs.writeFileSync(dir+'/shaders.json',JSON.stringify(s));
