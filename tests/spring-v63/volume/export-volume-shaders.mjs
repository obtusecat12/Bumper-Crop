import fs from 'node:fs';
import * as T from '../../../dist/vendor/three.module.min.js';
import {shaderSources,makePeriodicNoiseData,createSpringVolume} from '../../../dist/spring-volume-v63.js';
const prefix='#version 300 es\n';
const shaders=Object.fromEntries(['advection','lightCache','raymarch','composite'].map(k=>[k,{vertex:prefix+shaderSources.vertex,fragment:prefix+shaderSources[k]}]));
fs.writeFileSync(new URL('./volume-shaders.json',import.meta.url),JSON.stringify(shaders));
const start=performance.now(),data=makePeriodicNoiseData();
fs.writeFileSync(new URL('./volume-noise.bin',import.meta.url),data);
let sum=0,sq=0;for(let i=0;i<data.length;i+=2){sum+=data[i];sq+=data[i]*data[i];}
const n=data.length/2,mean=sum/n;
console.log(JSON.stringify({noiseBytes:data.length,noiseBuildMS:Math.round(performance.now()-start),meanFBM:mean,standardDeviationFBM:Math.sqrt(sq/n-mean*mean)}));
const lights=[{p:[5.7,2.2,.8],color:0xff9d47,power:24,range:10},{p:[-1.6,2.6,-1.5],color:0xffa751,power:10,range:8}];
const volume=createSpringVolume(T,{lights});console.log(JSON.stringify(volume.diagnostics));
const camera=new T.PerspectiveCamera(56,4/3,.06,30);camera.position.set(3.7,1.75,5.3);camera.lookAt(-.3,.35,0);camera.updateMatrixWorld();
const uniforms=volume.uniforms;const mask=uniforms.poolMask.value;
fs.writeFileSync(new URL('./volume-mask.bin',import.meta.url),mask.image.data);
fs.writeFileSync(new URL('./volume-fixture.json',import.meta.url),JSON.stringify({boundsMin:uniforms.boundsMin.value.toArray(),boundsMax:uniforms.boundsMax.value.toArray(),camera:{eye:camera.position.toArray(),world:camera.matrixWorld.toArray(),inverseProjection:camera.projectionMatrixInverse.toArray(),projection:camera.projectionMatrix.toArray(),near:camera.near,far:camera.far},lights:uniforms.lampPositionPower.value.map(v=>v.toArray()),colors:uniforms.lampColorRange.value.map(v=>v.toArray())}));
volume.dispose();
