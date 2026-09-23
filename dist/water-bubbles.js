import * as T from './vendor/three.module.min.js';
export const bubbleVertex=`precision highp float;
 in vec3 position;in vec2 uv;in vec4 originBirth;in vec4 velocitySize;
 uniform mat4 modelMatrix,viewMatrix,projectionMatrix;uniform float time,level;uniform vec3 eye;
 out vec2 tex;out float alpha;
 void main(){float t=time-originBirth.w;tex=uv;alpha=0.;
 if(t<0.||t>5.){gl_Position=vec4(2.,2.,2.,1.);return;}
 vec3 center=originBirth.xyz+velocitySize.xyz*t+.5*vec3(0.,.65,0.)*t*t;
 center.xz+=vec2(sin(t*23.+originBirth.x),sin(t*19.+originBirth.z))*.013;
 float scale=velocitySize.w*clamp((level-center.y)/.09,0.,1.);
 vec3 transformed=center;float dist=distance(center,eye);
 if(dist<.25||scale<=0.){transformed=vec3(0.0);gl_Position=vec4(2.,2.,2.,1.);return;}
 vec4 mv=viewMatrix*vec4(center,1.);mv.xy+=position.xy*scale;
 alpha=clamp((dist-.25)/.25,0.,1.)*clamp((5.-t)*2.,0.,1.);gl_Position=projectionMatrix*mv;}`;
export const bubbleFragment=`precision highp float;in vec2 tex;in float alpha;out vec4 outColor;
 const float b[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
 void main(){vec2 q=tex*2.-1.;float r=length(q);if(r>1.||r<.42)discard;
 float rim=smoothstep(.46,.96,r),highlight=pow(max(0.,1.-length(q-vec2(-.38,.40))*.9),8.);
 ivec2 p=ivec2(gl_FragCoord.xy)&3;if(alpha*(.25+rim*.65)<(b[p.y*4+p.x]+.5)/16.)discard;
 outColor=vec4(vec3(.19,.33,.36)+vec3(.43,.48,.44)*(rim*.55+highlight),1.);}`;
export function createWaterBubbles(scene){
 const count=60,g=new T.PlaneGeometry(2,2),birth=new T.InstancedBufferAttribute(new Float32Array(count*4),4),motion=new T.InstancedBufferAttribute(new Float32Array(count*4),4);
 g.setAttribute('originBirth',birth);g.setAttribute('velocitySize',motion);birth.array.fill(-99);
 const u={time:{value:0},level:{value:0},eye:{value:new T.Vector3()}};
 const m=new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:bubbleVertex,fragmentShader:bubbleFragment,uniforms:u,depthTest:true,depthWrite:true,transparent:false,blending:T.NoBlending,side:T.DoubleSide});
 const mesh=new T.InstancedMesh(g,m,count);mesh.frustumCulled=false;mesh.visible=false;mesh.name='Entry bubbles front cone';scene.add(mesh);
 const forward=new T.Vector3(),right=new T.Vector3(),up=new T.Vector3();let clock=0,end=0,cx=0n,cz=0n,known=false;
 function emit(camera,s,level){cx=s.cx;cz=s.cz;known=true;camera.getWorldDirection(forward);right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);
  for(let i=0;i<count;i++){const depth=.3+Math.random()*.7,a=Math.random()*6.283,r=depth*.24*Math.sqrt(Math.random()),o=i*4;
   birth.array[o]=camera.position.x+forward.x*depth+(right.x*Math.cos(a)+up.x*Math.sin(a))*r;
   birth.array[o+1]=Math.min(level-.02,camera.position.y+forward.y*depth+(right.y*Math.cos(a)+up.y*Math.sin(a))*r);
   birth.array[o+2]=camera.position.z+forward.z*depth+(right.z*Math.cos(a)+up.z*Math.sin(a))*r;birth.array[o+3]=clock+Math.random()*.12;
   motion.array[o]=(Math.random()-.5)*.08;motion.array[o+1]=.12+Math.random()*.28;motion.array[o+2]=(Math.random()-.5)*.08;motion.array[o+3]=.008+Math.random()**2*.028;
  }u.level.value=level;birth.needsUpdate=motion.needsUpdate=true;end=clock+5;mesh.visible=true;
 }
 function update(dt,camera,s,active){if(active)clock+=dt;u.time.value=clock;u.eye.value.copy(camera.position);mesh.visible=clock<end;
  if(known&&(cx!==s.cx||cz!==s.cz)){const dx=Number(cx-s.cx)*64,dz=Number(cz-s.cz)*64;for(let i=0;i<count;i++){birth.array[i*4]+=dx;birth.array[i*4+2]+=dz;}cx=s.cx;cz=s.cz;birth.needsUpdate=true;}
 }
 return {mesh,emit,update,clear(){end=0;mesh.visible=false;},dispose(){scene.remove(mesh);mesh.dispose();g.dispose();m.dispose();}};
}
