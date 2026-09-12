import * as T from './vendor/three.module.min.js';
import {PROBE_GRID as GRID,PROBE_STEP as STEP,SKY_TOP,SKY_BOTTOM} from './lighting-config.js?v=15';

const pars=`
precision highp sampler3D;
varying vec3 vIrradianceWorld;
uniform sampler3D uProbeR,uProbeG,uProbeB,uProbePosition,uProbeMX,uProbeMY,uProbeMZ;
uniform vec3 uProbeOrigin;
uniform float uProbeReady,uProbeWeather;
const vec3 probeGrid=vec3(19.,7.,19.);
const vec3 probeStep=vec3(4.,2.,4.);
vec3 sampleProbe(vec3 uv,vec3 n){
  vec4 basis=vec4(1.,n);
  return max(vec3(0.),vec3(dot(texture(uProbeR,uv),basis),dot(texture(uProbeG,uv),basis),dot(texture(uProbeB,uv),basis)));
}
float probeVisibility(vec3 uv,vec3 delta){
  float distance=length(delta);if(distance<.001)return 1.;
  vec3 d=delta/distance,w=d*d;w*=w;
  vec4 x=texture(uProbeMX,uv),y=texture(uProbeMY,uv),z=texture(uProbeMZ,uv);
  vec2 m=((d.x>=0.?x.xy:x.zw)*w.x+(d.y>=0.?y.xy:y.zw)*w.y+(d.z>=0.?z.xy:z.zw)*w.z)/max(.001,w.x+w.y+w.z);
  float gap=max(0.,distance-.035-m.x);
  float variance=max(.0025,m.y-m.x*m.x),p=variance/(variance+gap*gap);
  return p*p*p;
}
void gatherProbe(vec3 cell,float blend,vec3 p,vec3 n,inout vec3 sum,inout float weight,inout float available){
  vec3 uv=(cell+.5)/probeGrid;
  vec4 location=texture(uProbePosition,uv);if(location.w<.5)return;
  vec3 position=uProbeOrigin+cell*probeStep+location.xyz;
  vec3 delta=p-position;
  float normalWeight=max(.05,dot(n,normalize(-delta+vec3(.00001)))*.5+.5);
  float base=blend*normalWeight;
  float v=probeVisibility(uv,delta),w=base*v;
  sum+=sampleProbe(uv,n)*w;weight+=w;available+=base;
}
vec3 ruralIrradiance(vec3 point,vec3 normal){
  vec3 sky=mix(vec3(${SKY_BOTTOM.join(',')}),vec3(${SKY_TOP.join(',')}),normal.y/3.+.5);
  if(uProbeReady<.5)return sky*uProbeWeather;
  // Small surface/view biases stay below the thickness of the wooden walls.
  vec3 p=point+normal*.025;
  vec3 grid=(p-uProbeOrigin)/probeStep;
  if(any(lessThan(grid,vec3(0.)))||any(greaterThan(grid,probeGrid-1.)))return sky*uProbeWeather;
  vec3 uv=(grid+.5)/probeGrid;
  vec4 status=texture(uProbePosition,uv);
  vec3 irradiance;
  if(status.w>1.5){
    // Empty field: hardware interpolation of SH, no visibility gathers.
    irradiance=sampleProbe(uv,normal);
  }else{
    vec3 cell=min(floor(grid),probeGrid-2.),f=grid-cell;
    vec3 a,b;vec4 w;
    // Tetrahedral interpolation needs four visibility-aware probes, not eight.
    if(f.x>=f.y){
      if(f.y>=f.z){a=vec3(1,0,0);b=vec3(1,1,0);w=vec4(1.-f.x,f.x-f.y,f.y-f.z,f.z);}
      else if(f.x>=f.z){a=vec3(1,0,0);b=vec3(1,0,1);w=vec4(1.-f.x,f.x-f.z,f.z-f.y,f.y);}
      else{a=vec3(0,0,1);b=vec3(1,0,1);w=vec4(1.-f.z,f.z-f.x,f.x-f.y,f.y);}
    }else{
      if(f.x>=f.z){a=vec3(0,1,0);b=vec3(1,1,0);w=vec4(1.-f.y,f.y-f.x,f.x-f.z,f.z);}
      else if(f.y>=f.z){a=vec3(0,1,0);b=vec3(0,1,1);w=vec4(1.-f.y,f.y-f.z,f.z-f.x,f.x);}
      else{a=vec3(0,0,1);b=vec3(0,1,1);w=vec4(1.-f.z,f.z-f.y,f.y-f.x,f.x);}
    }
    vec3 sum=vec3(0.);float weight=0.,available=0.;
    gatherProbe(cell,w.x,p,normal,sum,weight,available);
    gatherProbe(cell+a,w.y,p,normal,sum,weight,available);
    gatherProbe(cell+b,w.z,p,normal,sum,weight,available);
    gatherProbe(cell+1.,w.w,p,normal,sum,weight,available);
    irradiance=weight>.0001?sum/weight:available>.0001?vec3(.012):sky;
  }
  float edge=min(min(grid.x,probeGrid.x-1.-grid.x),min(grid.z,probeGrid.z-1.-grid.z));
  return mix(sky,irradiance,smoothstep(0.,2.,edge))*uProbeWeather;
}`;

export function createIrradianceField() {
  const count=GRID[0]*GRID[1]*GRID[2],textures=Array.from({length:7},(_,i)=>{
    const t=new T.Data3DTexture(new Uint16Array(count*4),...GRID);t.type=T.HalfFloatType;
    t.format=T.RGBAFormat;t.minFilter=t.magFilter=i<3?T.LinearFilter:T.NearestFilter;
    t.generateMipmaps=false;t.unpackAlignment=1;t.colorSpace=T.NoColorSpace;t.needsUpdate=true;return t;
  });
  const uniforms={uProbeOrigin:{value:new T.Vector3()},uProbeReady:{value:0},uProbeWeather:{value:1}};
  ['R','G','B','Position','MX','MY','MZ'].forEach((key,i)=>uniforms['uProbe'+key]={value:textures[i]});
  const registered=new WeakSet(),sent=new Set(),active=new Map();
  let worker,ready=false,failed=false,serial=0,wanted='',current=null,lastChange=0,latestState=null,paused=false;
  const values={status:'准备中',computed:0,reused:0,rays:0,ms:0,triangles:0,bytes:0};
  function fail(error){if(failed)return;failed=true;worker?.terminate();uniforms.uProbeReady.value=0;values.status='柔阴影模式';console.warn('Indirect ray cache unavailable',error)}
  try{
    worker=new Worker(new URL('./irradiance-worker.js?v=15',import.meta.url),{type:'module',name:'rural-ray-cache'});
    worker.onerror=e=>{e.preventDefault?.();fail(new Error(e.message||'Ray worker failed'))};
    worker.onmessageerror=()=>fail(new Error('Ray cache transfer failed'));
    worker.onmessage=({data})=>{
      if(data.type==='error'){fail(new Error(data.message));return;}
      if(data.type==='ready'){ready=true;return;}
      if(data.type!=='volume'||data.id!==serial)return;
      const arrays=textures.map(t=>t.image.data),half=T.DataUtils.toHalfFloat;
      // Keep obstructed/invalid neighbors on the visibility-aware path. Read an
      // immutable snapshot so a single obstruction cannot flood the whole grid.
      const flags=Uint8Array.from({length:count},(_,i)=>data.positions[i*4+3]);
      // Open field shading
      // then needs just three SH fetches plus one status fetch.
      for(let z=0;z<GRID[2];z++)for(let y=0;y<GRID[1];y++)for(let x=0;x<GRID[0];x++){
        const i=(z*GRID[1]+y)*GRID[0]+x;
        if(data.positions[i*4+3]>1.5){
          for(let dz=-1;dz<=1;dz++)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            const xx=x+dx,yy=y+dy,zz=z+dz;if(xx<0||yy<0||zz<0||xx>=GRID[0]||yy>=GRID[1]||zz>=GRID[2])continue;
            if(flags[(zz*GRID[1]+yy)*GRID[0]+xx]<1.5)data.positions[i*4+3]=1;
          }
        }
        for(let k=0;k<4;k++){
          for(let c=0;c<3;c++)arrays[c][i*4+k]=half(data.sh[i*12+k*3+c]);
          arrays[3][i*4+k]=half(data.positions[i*4+k]);
          for(let c=0;c<3;c++)arrays[4+c][i*4+k]=half(data.moments[i*12+c*4+k]);
        }
      }
      for(const t of textures)t.needsUpdate=true;
      current=data;Object.assign(values,data.stats,{status:'已缓存'});uniforms.uProbeReady.value=1;updateOrigin();
    };
  }catch(error){fail(error)}
  function updateOrigin(){
    if(!current||!latestState)return;
    const dx=Number(current.cx-latestState.cx),dz=Number(current.cz-latestState.cz);
    if(Math.abs(dx)>4||Math.abs(dz)>4){uniforms.uProbeReady.value=0;return;}
    uniforms.uProbeOrigin.value.set(dx*64+current.baseX,current.baseY,dz*64+current.baseZ);
  }
  function attach(root) {
    root.traverse(o=>{
      if(!o.isMesh)return;
      for(const m of Array.isArray(o.material)?o.material:[o.material]){
        if(!m||registered.has(m)||!(m.isMeshStandardMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial))continue;
        const previous=m.onBeforeCompile,key=m.customProgramCacheKey();
        m.onBeforeCompile=function(shader,r){
          previous.call(this,shader,r);Object.assign(shader.uniforms,uniforms);
          shader.vertexShader='varying vec3 vIrradianceWorld;\n'+shader.vertexShader;
          shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
            vec4 giPosition=vec4(transformed,1.);
            #ifdef USE_INSTANCING
              giPosition=instanceMatrix*giPosition;
            #endif
            vIrradianceWorld=(modelMatrix*giPosition).xyz;`);
          shader.fragmentShader=pars+'\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
            vec3 giNormal=inverseTransformDirection(normal,viewMatrix);
            reflectedLight.indirectDiffuse=material.diffuseColor*ruralIrradiance(vIrradianceWorld,giNormal);`);
        };
        m.customProgramCacheKey=()=>key+'|rural-ray-irradiance-v15';m.needsUpdate=true;registered.add(m);
      }
    });
  }
  function put(chunk) {
    const g=chunk.rayGeometry;if(!g||failed)return;
    const f=chunk.field,key=f.key;
    const transfer=[g.positions,g.colors,g.uvs,g.textureIds,g.thin,g.ground,...g.alphaTextures.map(t=>t.data)].map(a=>a.buffer);
    worker.postMessage({type:'put',key,cx:f.x,cz:f.z,geometry:g},transfer);chunk.rayGeometry=null;sent.add(key);active.set(key,chunk);
    lastChange=performance.now();wanted='';
  }
  function remove(chunk){const key=chunk.field.key;if(active.get(key)!==chunk)return;active.delete(key);if(sent.delete(key)&&!failed){worker.postMessage({type:'remove',key});lastChange=performance.now();wanted='';}}
  function update({state,now,rain=0,enabled=true}) {
    latestState=state;updateOrigin();uniforms.uProbeWeather.value=1-rain*.18;
    if(failed||!ready)return;
    pause(!enabled);
    if(!enabled||!sent.size||now-lastChange<300)return;
    const baseX=Math.floor((state.x-36)/8)*8,baseZ=Math.floor((state.z-36)/8)*8,baseY=-1.5;
    const signature=`${state.cx}:${state.cz}:${baseX}:${baseZ}`;
    if(signature===wanted)return;wanted=signature;values.status='后台追踪';
    worker.postMessage({type:'trace',id:++serial,cx:state.cx,cz:state.cz,baseX,baseY,baseZ});
  }
  function pause(value=true){if(!failed&&worker&&paused!==value){paused=value;worker.postMessage({type:'pause',value})}}
  function exposure(point){
    // Meter the already traced local illumination, avoiding another framebuffer
    // readback or luminance pyramid alongside the VHS processor. This preserves
    // outdoor exposure and slowly opens the camera iris inside dark buildings.
    if(!current||uniforms.uProbeReady.value<.5)return 1.23;
    const o=uniforms.uProbeOrigin.value,gx=(point.x-o.x)/STEP[0],gy=(point.y-o.y)/STEP[1],gz=(point.z-o.z)/STEP[2];
    if(gx<0||gy<0||gz<0||gx>GRID[0]-1||gy>GRID[1]-1||gz>GRID[2]-1)return 1.23;
    const bx=Math.min(Math.floor(gx),GRID[0]-2),by=Math.min(Math.floor(gy),GRID[1]-2),bz=Math.min(Math.floor(gz),GRID[2]-2),fx=gx-bx,fy=gy-by,fz=gz-bz;
    let light=0,weight=0;
    for(let z=0;z<2;z++)for(let y=0;y<2;y++)for(let x=0;x<2;x++){
      const i=((bz+z)*GRID[1]+by+y)*GRID[0]+bx+x,p=i*4,s=i*12;
      if(current.positions[p+3]<.5)continue;
      const dx=point.x-o.x-(bx+x)*STEP[0]-current.positions[p],dy=point.y-o.y-(by+y)*STEP[1]-current.positions[p+1],dz=point.z-o.z-(bz+z)*STEP[2]-current.positions[p+2];
      const d=Math.hypot(dx,dy,dz),ax=dx**4,ay=dy**4,az=dz**4,ws=Math.max(1e-9,ax+ay+az),m=current.moments;
      const ix=s+(dx<0?2:0),iy=s+4+(dy<0?2:0),iz=s+8+(dz<0?2:0);
      const mean=(m[ix]*ax+m[iy]*ay+m[iz]*az)/ws,variance=Math.max(.0025,(m[ix+1]*ax+m[iy+1]*ay+m[iz+1]*az)/ws-mean*mean);
      const gap=Math.max(0,d-.035-mean),visible=(variance/(variance+gap*gap))**3;
      const w=(x?fx:1-fx)*(y?fy:1-fy)*(z?fz:1-fz)*visible;
      light+=Math.max(0,current.sh[s]*.2126+current.sh[s+1]*.7152+current.sh[s+2]*.0722)*w;weight+=w;
    }
    if(weight<.0001)return 1.23;
    return 1.23*Math.min(3.2,Math.max(1,.13/Math.max(.004,light/weight)));
  }
  function restore(){for(const t of textures)t.needsUpdate=true;}
  function dispose(){worker?.terminate();for(const t of textures)t.dispose();}
  return {attach,put,remove,update,pause,exposure,restore,dispose,values,uniforms,textures};
}
