import fs from 'node:fs';import * as T from '../../dist/vendor/three.module.min.js';
import {passVertex,copyDepthFragment,fusedFragment,resolveFragment} from '../../dist/water-pipeline.js';
import {surfaceVertex,surfaceFragment} from '../../dist/water-surface.js';
import {bubbleVertex,bubbleFragment} from '../../dist/water-bubbles.js';
import {createWaterImpact} from '../../dist/water-impact.js';
import {RIPPLE_NORMAL_FRAGMENT} from '../../dist/water-ripples.js';
import {DISPLAY_VERTEX,DISPLAY_FRAGMENT} from '../../dist/display-filter.js';
const out={};function raw(name,v,f){out[name]={vertex:'#version 300 es\n'+v,fragment:'#version 300 es\n'+f};}
raw('depth-copy',passVertex,copyDepthFragment);raw('fused-absorb-lens-dof',passVertex,fusedFragment);raw('tone-resolve',passVertex,resolveFragment);raw('two-sided-surface',surfaceVertex,surfaceFragment);raw('bubbles',bubbleVertex,bubbleFragment);raw('display-grade-ntsc',DISPLAY_VERTEX,DISPLAY_FRAGMENT);
function includes(s){return s.replace(/#include <([^>]+)>/g,(_,key)=>{if(!T.ShaderChunk[key])throw Error(key);return includes(T.ShaderChunk[key]);});}
function standard(name,v,f){const vp=`#version 300 es\nprecision highp float;precision highp int;\n#define attribute in\n#define varying out\nuniform mat4 modelMatrix,viewMatrix,modelViewMatrix,projectionMatrix;uniform vec3 cameraPosition;in vec3 position;in vec2 uv;in vec3 normal;\n`;
 const fp=`#version 300 es\nprecision highp float;precision highp int;\n#define varying in\n#define texture2D texture\nout vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\nuniform vec3 cameraPosition;\nvec4 linearToOutputTexel(vec4 c){return c;}\n`;
 out[name]={vertex:vp+includes(v),fragment:fp+includes(f)};
}
standard('radial-ripple','varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}',RIPPLE_NORMAL_FRAGMENT);
const impact=createWaterImpact(new T.Scene());for(const mesh of impact.group.children)standard(mesh.material.name,mesh.material.vertexShader,mesh.material.fragmentShader);impact.dispose();
const dir=process.env.V28_FIXTURE_DIR||'/tmp/level10-v28';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(process.argv[2]||dir+'/shaders.json',JSON.stringify(out));
