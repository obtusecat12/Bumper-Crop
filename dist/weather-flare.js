import * as T from './vendor/three.module.min.js';
import {weatherSurface} from './weather-surfaces.js?v=60';
export function createWeatherFlare(renderer){
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const uniforms={uSun:{value:new T.Vector2()},uStrength:{value:0},uAspect:{value:4/3}};
 const material=new T.RawShaderMaterial({glslVersion:T.GLSL3,uniforms,transparent:true,blending:T.AdditiveBlending,depthTest:false,depthWrite:false,toneMapped:false,
 vertexShader:'precision highp float;in vec3 position;out vec2 uv;void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1.);}',
 fragmentShader:`precision highp float;in vec2 uv;uniform vec2 uSun;uniform float uStrength,uAspect;out vec4 outColor;
 float disc(vec2 q,float r){float d=length(q);return exp(-d*d/(r*r));}
 void main(){vec2 aspect=vec2(uAspect,1.),q=(uv-uSun)*aspect,axis=vec2(.5)-uSun;float halo=disc(q,.105)*.36+disc(q,.028)*.70;
 vec3 c=vec3(1.,.75,.38)*halo;
 for(int i=0;i<3;i++){float f=.55+float(i)*.62;vec2 g=(uv-(uSun+axis*f))*aspect;float r=.025+float(i)*.013;float ring=exp(-pow((length(g)-r)/.008,2.));c+=mix(vec3(.28,.42,.20),vec3(.36,.22,.42),float(i)*.5)*(disc(g,r)*.16+ring*.08);}
 c+=vec3(.30,.20,.10)*exp(-abs(q.y)*80.)*exp(-abs(q.x)*2.3)*.11;
 outColor=vec4(c,uStrength);}`});
 const scene=new T.Scene(),cam=new T.Camera(),mesh=new T.Mesh(geo,material);mesh.frustumCulled=false;scene.add(mesh);const sun=new T.Vector3(),point=new T.Vector3(),view=new T.Vector3();let target=0,occlusion=0,check=0;
 function update(dt,{weather,camera,state,chunks}){
  sun.set(-.45,.84,-.30).lerp(new T.Vector3(-.86,.065,-.45),weather.dusk||0).normalize();
  point.copy(camera.position).addScaledVector(sun,800).project(camera);camera.getWorldDirection(view);check-=dt;
  if(check<=0&&weather.flare>.005){check=.18;occlusion=1;for(let d=0;d<155;d+=d<20?2:10){const x=camera.position.x+sun.x*d,z=camera.position.z+sun.z*d,s=weatherSurface(x,z,state,chunks);if(s&&Math.max(s.y,s.roof)>camera.position.y+sun.y*d+.04){occlusion=0;break;}}}
  target=weather.flare*(view.dot(sun)>.15?1:0)*occlusion;
  target*=Math.max(0,1-Math.max(Math.abs(point.x),Math.abs(point.y))*.65);
  uniforms.uStrength.value+=(target-uniforms.uStrength.value)*(1-Math.exp(-dt*10));uniforms.uSun.value.set(point.x*.5+.5,point.y*.5+.5);uniforms.uAspect.value=camera.aspect;
 }
 function render(){if(uniforms.uStrength.value<.001)return false;const old=renderer.autoClear;renderer.autoClear=false;renderer.render(scene,cam);renderer.autoClear=old;return true;}
 function reset(){uniforms.uStrength.value=0;check=0;}
 function dispose(){geo.dispose();material.dispose();}
 return {update,render,reset,dispose,uniforms};
}
