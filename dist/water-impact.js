import * as T from './vendor/three.module.min.js';
// Event-driven pools, independent of lake count. No draw when the pools are dry.
export function createWaterImpact(scene,{limit=64,rng=Math.random}={}){
 const particles=[],rings=[],dummy=new T.Object3D(),group=new T.Group();group.name='water-entry spray and ripples';scene.add(group);
 function material(ring){const m=new T.MeshBasicMaterial({color:ring?'#a2b9b0':'#b2d0ca',transparent:true,opacity:ring?.58:.90,depthWrite:false,side:T.DoubleSide});m.defines={USE_UV:''};m.onBeforeCompile=s=>{s.vertexShader='attribute float splashOpacity;varying float vSplashAlpha;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSplashAlpha=splashOpacity;');s.fragmentShader='varying float vSplashAlpha;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\ndiffuseColor.a*=vSplashAlpha;'+(ring?'':`vec2 p=vec2((vUv.x-.5)*2.,vUv.y);float width=.32+.43*sin(p.y*2.9)+.10*sin(p.y*17.);if(abs(p.x)>width||p.y>.98-abs(p.x)*.20)discard;diffuseColor.rgb*=mix(.53,1.16,step(.36,abs(p.x-.12)));`));};m.customProgramCacheKey=()=>ring?'entry-ripple-v22':'ps1-water-impact-v22';return m;}
 function mesh(g,ring,cap){g.setAttribute('splashOpacity',new T.InstancedBufferAttribute(new Float32Array(cap),1).setUsage(T.DynamicDrawUsage));const m=new T.InstancedMesh(g,material(ring),cap);m.name=ring?'expanding polygon ripples':'chunky airborne water spray';m.count=0;m.frustumCulled=false;m.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(m);return m;}
 const spray=mesh(new T.PlaneGeometry(1,1),false,limit),rg=new T.RingGeometry(.84,1,12);rg.rotateX(-Math.PI/2);const ripple=mesh(rg,true,6);
 function clear(){particles.length=rings.length=0;spray.count=ripple.count=0;group.visible=false;}
 function emit(power,state,level){if(power<=0)return;const strong=power>.3,count=strong?Math.min(24,Math.round(14+power*6)):6,forward=strong?.85:.4,x=state.x-Math.sin(state.yaw)*forward,z=state.z-Math.cos(state.yaw)*forward;
  for(let i=0;i<count;i++){if(particles.length>=limit)particles.shift();const a=rng()*Math.PI*2,v=(strong?1.2:.5)+rng()*1.65;particles.push({cx:state.cx,cz:state.cz,x:x+Math.cos(a)*.18,z:z+Math.sin(a)*.18,y:level+.03,vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:(strong?3.6:1.9)+rng()*1.6,w:.13+rng()*.20,h:.25+rng()*.40,age:0,life:(strong?.66:.42)+rng()*.22,roll:(rng()-.5)*.65,level});}
  if(rings.length>=6)rings.shift();rings.push({cx:state.cx,cz:state.cz,x,z,y:level+.035,age:0,life:.8,power});
 }
 function update(dt,state,camera,enabled=true){if(!enabled){clear();return;}dt=Math.min(.05,dt);
  for(const p of particles){p.age+=dt;p.vy-=9.8*dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;}
  for(let i=particles.length-1;i>=0;i--)if(particles[i].age>=particles[i].life||particles[i].y<particles[i].level-.02)particles.splice(i,1);
  for(const p of rings)p.age+=dt;for(let i=rings.length-1;i>=0;i--)if(rings[i].age>=rings[i].life)rings.splice(i,1);
  particles.forEach((p,i)=>{dummy.position.set(Number(p.cx-state.cx)*64+p.x,p.y,Number(p.cz-state.cz)*64+p.z);dummy.quaternion.copy(camera.quaternion);dummy.rotateZ(p.roll+Math.atan2(p.vx,p.vy)*.15);dummy.scale.set(p.w,p.h*(.85+Math.abs(p.vy)*.10),1);dummy.updateMatrix();spray.setMatrixAt(i,dummy.matrix);spray.geometry.attributes.splashOpacity.setX(i,Math.min(1,(p.life-p.age)*5));});
  rings.forEach((p,i)=>{const r=.28+p.age*(1.5+p.power*.35);dummy.position.set(Number(p.cx-state.cx)*64+p.x,p.y,Number(p.cz-state.cz)*64+p.z);dummy.rotation.set(0,0,0);dummy.scale.set(r,1,r);dummy.updateMatrix();ripple.setMatrixAt(i,dummy.matrix);rg.attributes.splashOpacity.setX(i,(1-p.age/p.life)**1.2);});
  spray.count=particles.length;ripple.count=rings.length;group.visible=!!(spray.count+ripple.count);spray.visible=!!spray.count;ripple.visible=!!ripple.count;
  for(const m of[spray,ripple])if(m.count){m.instanceMatrix.needsUpdate=true;m.geometry.attributes.splashOpacity.needsUpdate=true;}
 }
 function dispose(){clear();scene.remove(group);for(const m of[spray,ripple]){m.geometry.dispose();m.material.dispose();}}
 clear();return{group,particles,rings,emit,update,clear,dispose};
}
