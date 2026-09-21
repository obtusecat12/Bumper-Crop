import * as T from './vendor/three.module.min.js';
import {weatherSurface} from './weather-surfaces.js?v=25';
const SIZE=32,SPAN=48,COUNT=1100,RINGS=40;
export function createRainRenderer(scene,{rng=Math.random}={}){
 const data=new Float32Array(SIZE*SIZE).fill(1000),floor=new T.DataTexture(data,SIZE,SIZE,T.RedFormat,T.FloatType);floor.minFilter=floor.magFilter=T.NearestFilter;floor.generateMipmaps=false;floor.needsUpdate=true;
 const pos=new Float32Array(COUNT*6),seeds=new Float32Array(COUNT*8),tips=new Float32Array(COUNT*2);
 for(let i=0;i<COUNT;i++){const seed=[rng(),rng(),rng(),rng()];seeds.set(seed,i*8);seeds.set(seed,i*8+4);tips[i*2+1]=1;}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('rainSeed',new T.BufferAttribute(seeds,4));geo.setAttribute('rainTip',new T.BufferAttribute(tips,1));
 const u={uRainTime:{value:0},uRainTop:{value:20},uRainMin:{value:new T.Vector2()},uRainOrigin:{value:new T.Vector2()},uRainFloor:{value:floor},uRainStrength:{value:0}};
 const mat=new T.LineBasicMaterial({color:'#c0d3dc',transparent:true,opacity:.56,depthWrite:false});
 mat.onBeforeCompile=s=>{Object.assign(s.uniforms,u);s.vertexShader='attribute vec4 rainSeed;attribute float rainTip;uniform float uRainTime,uRainTop,uRainStrength;uniform vec2 uRainMin,uRainOrigin;uniform sampler2D uRainFloor;varying float vRainFade;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec2 xz=mod(rainSeed.xz*48.-uRainOrigin+vec2(uRainTime*.65,uRainTime*.22)-uRainMin,48.)+uRainMin;
   float yy=uRainTop-mod(rainSeed.y*28.+uRainTime*(15.+rainSeed.x*5.),28.);
   float support=texture2D(uRainFloor,(xz-uRainMin)/48.).r;
   float lengthDrop=.38+rainSeed.z*.35;
   transformed=vec3(xz.x+rainTip*.04,yy-rainTip*lengthDrop,xz.y);
   vec2 edge=min(xz-uRainMin,uRainMin+48.-xz);
   vRainFade=smoothstep(0.,4.,min(edge.x,edge.y))*(.65+.35*uRainStrength);
   if(yy-lengthDrop<support+.035||rainSeed.w>uRainStrength){transformed=vec3(10000.);vRainFade=0.;}
  `);
  s.fragmentShader='varying float vRainFade;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vRainFade;');};
 mat.customProgramCacheKey=()=> 'independent-density-gpu-rain-v24';
 const rain=new T.LineSegments(geo,mat);rain.frustumCulled=false;rain.name='rain / roof clipped columns';rain.visible=false;scene.add(rain);
 const rg=new T.PlaneGeometry(1,1);rg.rotateX(-Math.PI/2);const phases=new T.InstancedBufferAttribute(new Float32Array(RINGS),1);rg.setAttribute('impactAge',phases);
 const rm=new T.MeshBasicMaterial({color:'#d7e1db',transparent:true,depthWrite:false,side:T.DoubleSide});
 rm.onBeforeCompile=s=>{s.vertexShader='attribute float impactAge;varying float vImpactAge;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvImpactAge=impactAge;');s.fragmentShader='varying float vImpactAge;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 vec2 qp=(vUv-.5)*2.;float rr=length(qp),theta=atan(qp.y,qp.x);
 float center=.07+vImpactAge*.88+.012*sin(theta*3.+vImpactAge*7.);
 float crest=0.;
 for(int k=0;k<3;k++){
  float d=rr-center+float(k)*.13;
  crest+=exp(-pow(d/.014,2.))*exp(-float(k)*.55);
 }
 float facing=.5+.5*sin(theta+.8);
 diffuseColor.rgb=mix(vec3(.12,.19,.22),vec3(.69,.76,.77),facing);
 diffuseColor.a=crest*smoothstep(0.,.06,vImpactAge)*pow(1.-vImpactAge,1.3)*.38;
 if(diffuseColor.a<.012)discard;
 `);};rm.defines={USE_UV:''};rm.customProgramCacheKey=()=> 'fine-reflected-ripple-crests-v25';
 const rings=new T.InstancedMesh(rg,rm,RINGS);rings.instanceMatrix.setUsage(T.DynamicDrawUsage);rings.frustumCulled=false;rings.count=0;rings.name='rain / independent surface rings';scene.add(rings);
 const pool=[],dummy=new T.Object3D();let gridTimer=Infinity,lastGrid='',budget=0,clock=0;
 function update(dt,{state,camera,chunks,rain:amount=0,active=true}){
  if(!active)return;
  clock+=dt;gridTimer+=dt;const minX=Math.floor(state.x/4)*4-24,minZ=Math.floor(state.z/4)*4-24,key=`${state.cx},${state.cz},${minX},${minZ}`;
  rain.visible=amount>.01;u.uRainStrength.value=amount;u.uRainTime.value=clock;u.uRainTop.value=camera.position.y+18;
  if(rain.visible&&(lastGrid!==key||gridTimer>.75)){
   lastGrid=key;gridTimer=0;u.uRainMin.value.set(minX,minZ);u.uRainOrigin.value.set(Number((state.cx*64n)%48n),Number((state.cz*64n)%48n));
   for(let z=0;z<SIZE;z++)for(let x=0;x<SIZE;x++){const sample=weatherSurface(minX+(x+.5)*SPAN/SIZE,minZ+(z+.5)*SPAN/SIZE,state,chunks,.8);data[z*SIZE+x]=sample?Math.max(sample.y,sample.roof):1000;}
   floor.needsUpdate=true;
  }
  budget=Math.min(3,budget+dt*amount*22);
  while(budget>=1){budget--;const a=rng()*Math.PI*2,r=2+rng()*11,x=state.x+Math.cos(a)*r,z=state.z+Math.sin(a)*r,s=weatherSurface(x,z,state,chunks);
   if(!s||s.roof>s.y+.2||(!s.water&&rng()>.42)||pool.length>=RINGS)continue;
   pool.push({cx:state.cx,cz:state.cz,x,z,y:s.y+.035,age:0,life:.62+rng()*.35,size:.23+rng()*.31});
  }
  for(let i=pool.length-1;i>=0;i--)if((pool[i].age+=dt)>pool[i].life)pool.splice(i,1);
  let n=0;for(const p of pool){const dx=p.cx-state.cx,dz=p.cz-state.cz;if(dx< -2n||dx>2n||dz< -2n||dz>2n)continue;dummy.position.set(Number(dx)*64+p.x,p.y,Number(dz)*64+p.z);dummy.scale.setScalar(p.size);dummy.updateMatrix();rings.setMatrixAt(n,dummy.matrix);phases.setX(n,p.age/p.life);n++;}
  rings.count=n;rings.visible=n>0;if(n){rings.instanceMatrix.needsUpdate=true;phases.needsUpdate=true;}
 }
 function clear(){pool.length=0;budget=0;rings.count=0;rain.visible=rings.visible=false;lastGrid='';}
 function dispose(){clear();scene.remove(rain,rings);geo.dispose();mat.dispose();rg.dispose();rm.dispose();rings.dispose();floor.dispose();}
 return {rain,rings,update,clear,dispose,uniforms:u};
}
