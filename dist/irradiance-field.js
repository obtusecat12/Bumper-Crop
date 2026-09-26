import * as T from './vendor/three.module.min.js';
import {PROBE_GRID as GRID,PROBE_STEP as STEP,SKY_TOP,SKY_BOTTOM} from './lighting-config.js?v=48';

const pars=`
precision highp sampler3D;
varying vec3 vIrradianceWorld;
uniform sampler3D uProbeR,uProbeG,uProbeB,uProbePosition,uProbeMX,uProbeMY,uProbeMZ;
uniform vec3 uProbeOrigin;
uniform float uProbeReady,uProbeWeather;
uniform vec3 uShelterRoom,uShelterBounce,uWeatherTint;
const vec3 probeGrid=vec3(19.,7.,19.);
const vec3 probeStep=vec3(4.,2.,4.);
vec3 sampleProbe(vec3 uv,vec3 n){
  vec4 basis=vec4(1.,n);
  vec4 r=texture(uProbeR,uv),g=texture(uProbeG,uv),b=texture(uProbeB,uv);
  // Limit negative L1 ringing relative to measured energy, never add light to zero-energy probes.
  return max(vec3(r.x,g.x,b.x)*.06,vec3(dot(r,basis),dot(g,basis),dot(b,basis)));
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
bool shelterInside(vec3 p){
 if(uShelterRoom.z<.5)return false;vec2 q=p.xz-uShelterRoom.xy;float roof=q.y< -1.6?5.15+(q.y+5.8)*4.10/4.2:9.25-(q.y+1.6)*5.95/7.4;
 return abs(q.x)<11.71&&abs(q.y)<5.63&&p.y>.32&&p.y<roof+.24;
}
vec4 probeContribution(vec3 cell,float blend,vec3 p,vec3 n,out float available){
  vec3 uv=(cell+.5)/probeGrid;available=0.;
  if(blend<=0.)return vec4(uv,0.);
  vec4 location=texture(uProbePosition,uv);if(location.w<.5)return vec4(uv,0.);
  vec3 position=uProbeOrigin+cell*probeStep+location.xyz,delta=p-position;
  bool indoor=shelterInside(p);if(indoor&&!shelterInside(position))return vec4(uv,0.);
  float facing=dot(n,normalize(-delta+vec3(.00001)));
  float normalWeight=indoor?max(.12,facing*.5+.5):max(.05,facing*.5+.5);
  available=blend*normalWeight;
  return vec4(uv,available*probeVisibility(uv,delta));
}
// Low-frequency GGX prefilter of the same overcast sky used by the ray cache.
// Its first angular moment is fitted once; no cubemap or extra texture lookup.
vec3 ruralReflection(vec3 n,vec3 v,float roughness){
  float r=clamp(roughness,0.,1.),r2=r*r;
  float k=clamp(1.-r2/3.+r2*(1.-r)*(.5963702+r*(-3.4923372+r*(3.5997670-1.14283725*r))),.6666667,1.);
  vec3 reflected=normalize(mix(reflect(-v,n),n,r2));
  vec3 direction=normalize((vec4(reflected,0.)*viewMatrix).xyz);
  return mix(vec3(${SKY_BOTTOM.join(',')}),vec3(${SKY_TOP.join(',')}),.5+.5*k*direction.y)*uProbeWeather;
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
  if(status.w>1.5&&!shelterInside(p)){
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
    float a0,a1,a2,a3;
    vec4 p0=probeContribution(cell,w.x,p,normal,a0);
    vec4 p1=probeContribution(cell+a,w.y,p,normal,a1);
    vec4 p2=probeContribution(cell+b,w.z,p,normal,a2);
    vec4 p3=probeContribution(cell+1.,w.w,p,normal,a3);
    float weight=p0.w+p1.w+p2.w+p3.w,available=a0+a1+a2+a3;
    if(weight>.0001){
      // Reject only after normalization: dark interiors may have tiny absolute
      // visibility weights. Omitted total contribution is bounded below .04%.
      float cutoff=weight*.0001;vec3 sum=vec3(0.);
      if(p0.w>=cutoff)sum+=sampleProbe(p0.xyz,normal)*p0.w;
      if(p1.w>=cutoff)sum+=sampleProbe(p1.xyz,normal)*p1.w;
      if(p2.w>=cutoff)sum+=sampleProbe(p2.xyz,normal)*p2.w;
      if(p3.w>=cutoff)sum+=sampleProbe(p3.xyz,normal)*p3.w;
      irradiance=sum/weight;
    }else if(shelterInside(p)){
      // At a room corner the tetrahedron can contain no eligible room probe.
      // Gather the other corners only for this rare fallback, with real visibility.
      vec3 sum=vec3(0.);float total=0.;
      for(int i=0;i<8;i++){vec3 off=vec3(float(i%2),float((i/2)%2),float(i/4));vec3 w8=mix(1.-f,f,off);float av;vec4 pp=probeContribution(cell+off,w8.x*w8.y*w8.z,p,normal,av);sum+=sampleProbe(pp.xyz,normal)*pp.w;total+=pp.w;}
      irradiance=total>1.e-9?sum/total:vec3(0.);
    }else irradiance=available>.0001?vec3(.012):sky;
  }
  // Room-scale higher-bounce closure, measured from the room's traced L0 energy.
  // This low-frequency term stays zero in an unlit room and never crosses its walls.
  if(shelterInside(p))irradiance=max(irradiance,uShelterBounce);
  float edge=min(min(grid.x,probeGrid.x-1.-grid.x),min(grid.z,probeGrid.z-1.-grid.z));
  return mix(sky,irradiance,smoothstep(0.,2.,edge))*uProbeWeather*uWeatherTint;
}`;

// Shared bottle/vegetation materials survive map changes. Keep one shader
// injection per material while rebinding it to the current map's probe cache.
const irradianceBindings=new WeakMap();
export function createIrradianceField() {
  const count=GRID[0]*GRID[1]*GRID[2],textures=Array.from({length:7},(_,i)=>{
    const t=new T.Data3DTexture(new Uint16Array(count*4),...GRID);t.type=T.HalfFloatType;
    t.format=T.RGBAFormat;t.minFilter=t.magFilter=i<3?T.LinearFilter:T.NearestFilter;
    t.generateMipmaps=false;t.unpackAlignment=1;t.colorSpace=T.NoColorSpace;t.needsUpdate=true;return t;
  });
  const uniforms={uProbeOrigin:{value:new T.Vector3()},uProbeReady:{value:0},uProbeWeather:{value:1},uShelterRoom:{value:new T.Vector3(0,0,0)},uShelterBounce:{value:new T.Vector3()},uWeatherTint:{value:new T.Color(1,1,1)}};
  ['R','G','B','Position','MX','MY','MZ'].forEach((key,i)=>uniforms['uProbe'+key]={value:textures[i]});
  const registered=new WeakSet(),sent=new Set(),active=new Map();
  let worker,ready=false,failed=false,serial=0,wanted='',current=null,lastChange=0,latestState=null,paused=false;
  const values={status:'准备中',computed:0,reused:0,rays:0,ms:0,triangles:0,bytes:0};
  function fail(error){if(failed)return;failed=true;worker?.terminate();uniforms.uProbeReady.value=0;values.status='柔阴影模式';console.warn('Indirect ray cache unavailable',error)}
  try{
    worker=new Worker(new URL('./irradiance-worker.js?v=48',import.meta.url),{type:'module',name:'rural-ray-cache'});
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
      current=data;updateShelterBounce();Object.assign(values,data.stats,{status:'已缓存'});uniforms.uProbeReady.value=1;updateOrigin();
    };
  }catch(error){fail(error)}
  function updateShelterBounce(){
    const sum=uniforms.uShelterBounce.value;sum.set(0,0,0);
    if(!current||current.cx< -1n||current.cx>3n||current.cz< -4n||current.cz>0n)return;
    const centerX=84-Number(current.cx)*64,centerZ=-80-Number(current.cz)*64;let count=0;
    // Only interior probes below the roof, excluding outdoor samples and solids.
    for(let i=0;i<GRID[0]*GRID[1]*GRID[2];i++){const p=i*4,s=i*12;if(current.positions[p+3]<.5)continue;
      const x=current.baseX+(i%GRID[0])*STEP[0]+current.positions[p],y=current.baseY+(Math.floor(i/GRID[0])%GRID[1])*STEP[1]+current.positions[p+1],z=current.baseZ+Math.floor(i/(GRID[0]*GRID[1]))*STEP[2]+current.positions[p+2];
      if(Math.abs(x-centerX)>11.5||Math.abs(z-centerZ)>5.5||y<.35||y>4.5)continue;
      sum.x+=Math.max(0,current.sh[s]);sum.y+=Math.max(0,current.sh[s+1]);sum.z+=Math.max(0,current.sh[s+2]);count++;
    }
    if(count)sum.multiplyScalar(.22/count);
  }
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
        const existing=irradianceBindings.get(m);
        if(existing){existing.uniforms=uniforms;m.needsUpdate=true;registered.add(m);continue;}
        const binding={uniforms};irradianceBindings.set(m,binding);
        const previous=m.onBeforeCompile,key=m.customProgramCacheKey();
        m.onBeforeCompile=function(shader,r){
          previous.call(this,shader,r);Object.assign(shader.uniforms,binding.uniforms);
          shader.vertexShader='varying vec3 vIrradianceWorld;\n'+shader.vertexShader;
          shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
            vec4 giPosition=vec4(transformed,1.);
            #ifdef USE_INSTANCING
              giPosition=instanceMatrix*giPosition;
            #endif
            vIrradianceWorld=(modelMatrix*giPosition).xyz;`);
          shader.fragmentShader=pars+'\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`
            vec3 giNormal=inverseTransformDirection(normal,viewMatrix);
            vec3 ruralGI=ruralIrradiance(vIrradianceWorld,giNormal);
            #ifdef STANDARD
              // Let Three conserve energy between diffuse, single and multiple
              // specular scattering. Do not replace its diffuse result afterward.
              vec3 ruralSky=mix(vec3(${SKY_BOTTOM.join(',')}),vec3(${SKY_TOP.join(',')}),giNormal.y/3.+.5)*uProbeWeather;
              float ruralAO=clamp(dot(ruralGI,vec3(.2126,.7152,.0722))/max(.0001,dot(ruralSky,vec3(.2126,.7152,.0722))),0.,1.);
              float ruralSpecAO=computeSpecularOcclusion(saturate(dot(geometryNormal,geometryViewDir)),ruralAO,material.roughness);
              irradiance=vec3(0.);
              iblIrradiance=PI*ruralGI;
              radiance=ruralReflection(geometryNormal,geometryViewDir,material.roughness)*ruralSpecAO;
            #endif
            #include <lights_fragment_end>
            #ifndef STANDARD
              reflectedLight.indirectDiffuse=material.diffuseColor*ruralGI;
            #endif`);
        };
        m.customProgramCacheKey=()=>key+'|rural-ray-irradiance-v22';m.needsUpdate=true;registered.add(m);
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
  function update({state,now,rain=0,clear=0,dusk=0,enabled=true}) {
    const shelterNear=state.cx>=-1n&&state.cx<=3n&&state.cz>=-4n&&state.cz<=0n;
    uniforms.uShelterRoom.value.set(shelterNear?84-Number(state.cx)*64:0,shelterNear?-80-Number(state.cz)*64:0,shelterNear?1:0);
    latestState=state;updateOrigin();uniforms.uProbeWeather.value=(1-rain*.18)*(1+clear*.12-dusk*.25);uniforms.uWeatherTint.value.setRGB(1-dusk*.16,1-dusk*.07,1+dusk*.055);
    if(failed||!ready)return;
    pause(!enabled);
    // One worker credit per displayed animation frame; no full/half-resolution
    // screen-space tracing pass competes with the original rendering pipeline.
    if(enabled)worker.postMessage({type:'budget',frame:Math.floor(now)});
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
    const room=uniforms.uShelterRoom.value,inside=p=>{if(room.z<.5)return false;const x=p.x-room.x,z=p.z-room.y,roof=z< -1.6?5.15+(z+5.8)*4.10/4.2:9.25-(z+1.6)*5.95/7.4;return Math.abs(x)<11.71&&Math.abs(z)<5.63&&p.y>.32&&p.y<roof+.24;},indoors=inside(point);
    let light=0,weight=0;
    for(let z=0;z<2;z++)for(let y=0;y<2;y++)for(let x=0;x<2;x++){
      const i=((bz+z)*GRID[1]+by+y)*GRID[0]+bx+x,p=i*4,s=i*12;
      if(current.positions[p+3]<.5)continue;
      const dx=point.x-o.x-(bx+x)*STEP[0]-current.positions[p],dy=point.y-o.y-(by+y)*STEP[1]-current.positions[p+1],dz=point.z-o.z-(bz+z)*STEP[2]-current.positions[p+2];
      if(indoors&&!inside({x:point.x-dx,y:point.y-dy,z:point.z-dz}))continue;
      const d=Math.hypot(dx,dy,dz),ax=dx**4,ay=dy**4,az=dz**4,ws=Math.max(1e-9,ax+ay+az),m=current.moments;
      const ix=s+(dx<0?2:0),iy=s+4+(dy<0?2:0),iz=s+8+(dz<0?2:0);
      const mean=(m[ix]*ax+m[iy]*ay+m[iz]*az)/ws,variance=Math.max(.0025,(m[ix+1]*ax+m[iy+1]*ay+m[iz+1]*az)/ws-mean*mean);
      const gap=Math.max(0,d-.035-mean),visible=(variance/(variance+gap*gap))**3;
      const w=(x?fx:1-fx)*(y?fy:1-fy)*(z?fz:1-fz)*visible;
      light+=Math.max(0,current.sh[s]*.2126+current.sh[s+1]*.7152+current.sh[s+2]*.0722)*w;weight+=w;
    }
    if(weight<.0001)return 1.23;
    return 1.23*Math.min(indoors?20:3.2,Math.max(1,.13/Math.max(.001,light/weight)));
  }
  function restore(){for(const t of textures)t.needsUpdate=true;}
  function dispose(){worker?.terminate();for(const t of textures)t.dispose();}
  return {attach,put,remove,update,pause,exposure,restore,dispose,values,uniforms,textures};
}
