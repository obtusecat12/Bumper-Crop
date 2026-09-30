import * as T from './vendor/three.module.min.js';
import {powerMaterials,powerDepthMaterial} from './rural-power-materials.js?v=59';
const STRIDE=23;
function primitive(){const p=[],n=[],uv=[],face=[],idx=[];
 const v=(x,y,z,nx,ny,nz,u,w,fx=nx,fy=ny,fz=nz)=>{p.push(x,y,z);n.push(nx,ny,nz);uv.push(u,w);face.push(fx,fy,fz);};
 for(let j=0;j<8;j++){const a=j*Math.PI/4,b=(j+1)*Math.PI/4,m=(a+b)/2,fx=Math.abs(Math.cos(m))>Math.abs(Math.sin(m))?Math.sign(Math.cos(m)):0,fz=fx?0:Math.sign(Math.sin(m)),k=p.length/3;
  v(Math.cos(a)*.5,-.5,Math.sin(a)*.5,Math.cos(a),0,Math.sin(a),j/8,0,fx,0,fz);v(Math.cos(a)*.5,.5,Math.sin(a)*.5,Math.cos(a),0,Math.sin(a),j/8,1,fx,0,fz);v(Math.cos(b)*.5,-.5,Math.sin(b)*.5,Math.cos(b),0,Math.sin(b),(j+1)/8,0,fx,0,fz);v(Math.cos(b)*.5,.5,Math.sin(b)*.5,Math.cos(b),0,Math.sin(b),(j+1)/8,1,fx,0,fz);idx.push(k,k+1,k+2,k+1,k+3,k+2);
 }
 for(const sign of [-1,1]){const k=p.length/3;for(let j=0;j<8;j++){const a=j*Math.PI/4;v(Math.cos(a)*.5,sign*.5,Math.sin(a)*.5,0,sign,0,Math.cos(a)*.48+.5,Math.sin(a)*.48+.5);}for(let j=1;j<7;j++)idx.push(k,k+(sign<0?j:j+1),k+(sign<0?j+1:j));}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('utilityFaceNormal',new T.Float32BufferAttribute(face,3));g.setIndex(idx);g.computeBoundingSphere();return g;
}
function cableMesh(wind){const g=new T.InstancedBufferGeometry(),p=[],uv=[],indices=[],segments=12;
 for(let i=0;i<=segments;i++)for(const side of [-1,1]){p.push(i/segments,side,0);uv.push(i/segments,side*.5+.5);}for(let i=0;i<segments;i++){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.instanceCount=0;
 const viewport={value:new T.Vector2(960,720)},mat=new T.MeshBasicMaterial({color:'#252822',side:T.DoubleSide,alphaTest:.01,alphaToCoverage:true,fog:true});mat.name='GPU catenary ribbons';
 mat.onBeforeCompile=s=>{s.uniforms.powerTime=wind.time;s.uniforms.powerWind=wind.strength;s.uniforms.powerViewport=viewport;
  s.vertexShader=`attribute vec3 cableStart,cableEnd;attribute vec4 cableStyle;uniform float powerTime,powerWind;uniform vec2 powerViewport;varying float cableCoverage;\n`+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`float t=position.x,envelope=4.*t*(1.-t);vec3 delta=cableEnd-cableStart;float len=max(.001,length(delta.xz));vec2 sideways=vec2(-delta.z,delta.x)/len;float sway=sin(powerTime*.48+cableStyle.z)*.045*powerWind*envelope;float twist=t*len*6.2831853/1.2+cableStyle.z;vec3 transformed=mix(cableStart,cableEnd,t);transformed.y-=cableStyle.x*envelope;transformed.xz+=sideways*(sway+cos(twist)*cableStyle.w*envelope);transformed.y+=sin(twist)*cableStyle.w*envelope;`);
  s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`vec4 mvPosition=modelViewMatrix*vec4(transformed,1.);vec3 tangent=vec3(delta.x,delta.y-4.*cableStyle.x*(1.-2.*t),delta.z);vec3 tv=mat3(modelViewMatrix)*tangent;vec2 screenNormal=normalize(vec2(-tv.y,tv.x)+vec2(.00001));float physical=mix(.009,.018,step(.5,cableStyle.y));float pixels=physical*projectionMatrix[1][1]*powerViewport.y/max(.1,-mvPosition.z);float radius=max(.40,pixels);cableCoverage=clamp(pixels/.40,.20,1.);gl_Position=projectionMatrix*mvPosition;gl_Position.xy+=screenNormal*position.y*radius*2./powerViewport*gl_Position.w;`);
  s.fragmentShader='varying float cableCoverage;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>','diffuseColor.a*=cableCoverage;\n#include <alphatest_fragment>');
 };mat.customProgramCacheKey=()=> 'power-catenary-v45';const mesh=new T.Mesh(g,mat);mesh.name='All utility cables · one GPU batch';mesh.frustumCulled=false;return{mesh,viewport};
}
export function createRuralPowerNetwork(wind,{onMesh=()=>{},onRemove=()=>{}}={}){const object=new T.Group(),records=new Map(),materials=powerMaterials(),meshes=[],base=primitive(),depth=powerDepthMaterial(),wire=cableMesh(wind);object.name='Rural cooperative electrical network';object.matrixAutoUpdate=false;
 const stats={poles:0,cables:0,draws:0,triangles:0,rebuilds:0,matrixWrites:0,uploadBytes:0,commitMs:0};let dirty=true,originX=0n,originZ=0n,viewX=null,viewZ=null;
 function allocate(i,n){const old=meshes[i];if(old&&old.instanceMatrix.count>=n)return old;if(old){onRemove(old);object.remove(old);old.geometry.dispose();old.dispose();}
  const cap=Math.max(128,2**Math.ceil(Math.log2(Math.max(1,n)))),g=base.clone();g.setAttribute('utilityShape',new T.InstancedBufferAttribute(new Float32Array(cap*4),4).setUsage(T.StaticDrawUsage));const m=new T.InstancedMesh(g,materials[i],cap);m.instanceMatrix.setUsage(T.StaticDrawUsage);m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(cap*3),3).setUsage(T.StaticDrawUsage);m.name=materials[i].name;m.count=0;m.castShadow=false;m.receiveShadow=true;m.customDepthMaterial=depth;meshes[i]=m;object.add(m);onMesh(m);return m;
 }
 for(let i=0;i<3;i++)allocate(i,128);object.add(wire.mesh);onMesh(wire.mesh);
 function keep(a,k,i,dx,dz){const distance=Math.hypot(a[k+12]+dx-32,a[k+14]+dz-32);if(distance<110)return true;const sx=Math.hypot(a[k],a[k+1],a[k+2]),sy=Math.hypot(a[k+4],a[k+5],a[k+6]),sz=Math.hypot(a[k+8],a[k+9],a[k+10]),long=Math.max(sx,sy,sz),second=sx+sy+sz-long-Math.min(sx,sy,sz);if(long<.34)return false;return distance<145||long>2.4||second>.14;}

 function update(cx,cz){if(viewX!==cx||viewZ!==cz){viewX=cx;viewZ=cz;object.position.set(Number(originX-cx)*64,0,Number(originZ-cz)*64);object.updateMatrix();}if(!dirty)return;dirty=false;const started=performance.now();originX=cx;originZ=cz;object.position.set(0,0,0);object.updateMatrix();
  const nodes=new Map(),cables=new Map();for(const c of records.values()){const packet=c.powerPacket;if(!packet)continue;const dx=Number(c.field.x-cx)*64,dz=Number(c.field.z-cz)*64;
   for(const p of packet.poles){const old=nodes.get(p.id);if(!old||p.transformer&&!old.p.transformer)nodes.set(p.id,{p,dx,dz});}
   for(const wire of packet.cables)if(!cables.has(wire.id))cables.set(wire.id,{wire,dx,dz});
  }
  let tris=0,draws=0,writes=0,bytes=0;
  for(let i=0;i<3;i++){let count=0;for(const {p,dx,dz}of nodes.values())for(let k=0;k<p.groups[i].length;k+=STRIDE)if(keep(p.groups[i],k,i,dx,dz))count++;
   const mesh=allocate(i,count),matrix=mesh.instanceMatrix.array,shape=mesh.geometry.attributes.utilityShape.array,colors=mesh.instanceColor.array;let at=0;
   for(const {p,dx,dz}of nodes.values()){const a=p.groups[i];for(let k=0;k<a.length;k+=STRIDE){if(!keep(a,k,i,dx,dz))continue;for(let j=0;j<16;j++)matrix[at*16+j]=a[k+j];matrix[at*16+12]+=dx;matrix[at*16+14]+=dz;for(let j=0;j<4;j++)shape[at*4+j]=a[k+16+j];for(let j=0;j<3;j++)colors[at*3+j]=a[k+20+j];at++;}}
   mesh.count=count;mesh.visible=count>0;mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.geometry.attributes.utilityShape.needsUpdate=true;mesh.computeBoundingSphere();mesh.computeBoundingBox();tris+=count*28;writes+=count;bytes+=count*STRIDE*4;if(count)draws++;
  }
  const g=wire.mesh.geometry,n=cables.size,cap=Math.max(128,2**Math.ceil(Math.log2(Math.max(1,n))));for(const [name,size]of [['cableStart',3],['cableEnd',3],['cableStyle',4]])if(!g.attributes[name]||g.attributes[name].count<n)g.setAttribute(name,new T.InstancedBufferAttribute(new Float32Array(cap*size),size).setUsage(T.StaticDrawUsage));
  let at=0;for(const {wire:w,dx,dz}of cables.values()){g.attributes.cableStart.array.set([w.a.x+dx,w.a.y,w.a.z+dz],at*3);g.attributes.cableEnd.array.set([w.b.x+dx,w.b.y,w.b.z+dz],at*3);g.attributes.cableStyle.array.set([w.sag,w.kind,w.phase||0,w.helix||0],at*4);at++;}for(const name of ['cableStart','cableEnd','cableStyle'])g.attributes[name].needsUpdate=true;g.instanceCount=n;wire.mesh.visible=n>0;if(n)draws++;tris+=n*24;bytes+=n*40;
  Object.assign(stats,{poles:nodes.size,cables:n,draws,triangles:tris,rebuilds:stats.rebuilds+1,matrixWrites:stats.matrixWrites+writes,uploadBytes:stats.uploadBytes+bytes,commitMs:performance.now()-started});object.updateMatrixWorld(true);
 }
 return{object,stats,register(c){records.set(c.field.key,c);dirty=true;},remove(c){records.delete(c.field.key);dirty=true;},update,resize(w,h){wire.viewport.value.set(w,h);},dispose(){records.clear();for(const m of meshes){onRemove(m);m.geometry.dispose();m.dispose();}for(const m of materials)m.dispose();wire.mesh.geometry.dispose();wire.mesh.material.dispose();base.dispose();depth.dispose();object.clear();}};
}
