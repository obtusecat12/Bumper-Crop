import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fogVertex,fogIntegrateFragment,fogCompositeFragment} from '../../dist/advancing-fog.js';
const dir=process.argv[2];
execFileSync(process.execPath,['tests/visibility-cloud-v43/export.mjs',dir],{stdio:'inherit'});
const s=JSON.parse(fs.readFileSync(dir+'/shaders.json'));
for(const [name,fragment] of Object.entries({fogIntegrate:fogIntegrateFragment,fogComposite:fogCompositeFragment}))s[name]={vertex:'#version 300 es\n'+fogVertex,fragment:'#version 300 es\n'+fragment};
// Compare production optics to the actual previous commit, not a mock equation.
const old=execFileSync('git',['show','HEAD:dist/water-pipeline.js'],{encoding:'utf8'});
const fragment=old.slice(old.indexOf('export const fusedFragment=`')+'export const fusedFragment=`'.length,old.indexOf('export const resolveFragment=`')).replace(/`;\s*$/,'');
const {lensGLSL,discGLSL}=await import('../../dist/dof-shaders.js');
s.fusedBefore={...s.fused,fragment:'#version 300 es\n'+fragment.replace('${lensGLSL}',lensGLSL).replace('${discGLSL}',discGLSL)};
const fogOld=execFileSync('git',['show','HEAD:dist/fog-volume.js'],{encoding:'utf8'});
const fa=fogOld.indexOf('fragmentShader:`')+'fragmentShader:`'.length;
const fbody=fogOld.slice(fa,fogOld.indexOf('`});',fa));
s.fogBefore={vertex:'#version 300 es\n'+fogVertex.replaceAll('uv','vUV'),fragment:'#version 300 es\nprecision highp float;\n#define varying in\n#define gl_FragColor result\nout vec4 result;\n'+fbody};
fs.writeFileSync(dir+'/shaders.json',JSON.stringify(s));
