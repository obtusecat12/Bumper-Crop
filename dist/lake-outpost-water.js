import * as T from './vendor/three.module.min.js';
export function createOutpostPuddles(waterPose){
 const uniforms={picture:{value:null},depthMap:{value:null},viewport:{value:new T.Vector2(1,1)},inverseProjection:{value:new T.Matrix4()},projection:{value:new T.Matrix4()},clock:{value:0},nearFar:{value:new T.Vector2(.08,480)}};
 const material=new T.ShaderMaterial({name:'Wash station overflow / selective screen-space reflection',uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,
 vertexShader:`varying vec3 vView;varying vec2 vP;void main(){vP=uv;vec4 v=modelViewMatrix*vec4(position,1.);vView=v.xyz;gl_Position=projectionMatrix*v;}`,
 fragmentShader:`uniform sampler2D picture,depthMap;uniform vec2 viewport,nearFar;uniform mat4 inverseProjection,projection;uniform float clock;varying vec3 vView;varying vec2 vP;
 vec3 unproject(vec2 p,float d){vec4 q=inverseProjection*vec4(p*2.-1.,d*2.-1.,1.);return q.xyz/q.w;}
 void main(){vec2 q=gl_FragCoord.xy/viewport;float ripple=sin(length(vP-vec2(.24,.66))*74.-clock*8.)*.008;vec3 N=normalize(mat3(viewMatrix)*vec3(sin(vP.x*99.+clock)*.009+ripple,1.,cos(vP.y*88.-clock*1.4)*.007+ripple));vec3 V=normalize(vView),R=reflect(V,N);vec3 reflected=vec3(.23,.28,.27);float hit=0.;vec3 start=vView+N*.045;
 for(int i=1;i<=36;i++){float t=float(i)*.30;vec3 ray=start+R*t;vec4 clip=projection*vec4(ray,1.);vec2 p=clip.xy/clip.w*.5+.5;if(clip.w<=0.||p.x<.003||p.y<.003||p.x>.997||p.y>.997)break;float d=texture2D(depthMap,p).r;vec3 probe=unproject(p,d);float gap=probe.z-ray.z;if(d<.9999&&gap>0.&&gap<.28){float edge=smoothstep(0.,.10,min(min(p.x,1.-p.x),min(p.y,1.-p.y)));reflected=mix(reflected,texture2D(picture,p).rgb,edge);hit=1.;break;}}
 float fresnel=.025+.975*pow(1.-max(dot(-V,N),0.),5.);float edge=smoothstep(0.,.09,min(min(vP.x,1.-vP.x),min(vP.y,1.-vP.y)));gl_FragColor=vec4(mix(vec3(.042,.052,.033),reflected,.27+.64*fresnel),edge*(.56+.34*fresnel));}
 `});
 const group=new T.Group();group.name='Real shallow overflow water';
 const [wx,wz]=waterPose;const shapes=[[wx-3,wz+.9,2.1,.85],[wx-1.9,wz+1.7,.9,.6],[wx-4.7,wz+.7,.8,.45]];
 for(const [x,z,rx,rz]of shapes){const p=[0,0,0],uv=[.5,.5],idx=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,r=1+.07*Math.sin(a*7)+.06*Math.cos(a*11);p.push(Math.cos(a)*rx*r,0,Math.sin(a)*rz*r);uv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);if(i<48)idx.push(0,i+2,i+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const mesh=new T.Mesh(g,material);mesh.layers.set(6);mesh.position.set(x,.029,z);group.add(mesh);}
 return {group,material,active:false,update(t){uniforms.clock.value=t;},bind(color,depth,w,h,camera){uniforms.picture.value=color;uniforms.depthMap.value=depth;uniforms.viewport.value.set(w,h);uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);uniforms.projection.value.copy(camera.projectionMatrix);uniforms.nearFar.value.set(camera.near,camera.far);}};
}
