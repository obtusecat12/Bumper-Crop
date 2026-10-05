import * as T from './vendor/three.module.min.js';
import {nearManila} from './manila-plan.js';
// One existing scene depth texture, no second geometry/normal pass or SSR allocation.
export function createLevel0Occlusion94(){
 const uniforms={colorMap:{value:null},depthMap:{value:null},inverseProjection:{value:new T.Matrix4()},size:{value:new T.Vector2()}};
 const material=new T.RawShaderMaterial({glslVersion:T.GLSL3,depthTest:false,depthWrite:false,toneMapped:false,uniforms,
  vertexShader:'precision highp float;in vec3 position;out vec2 uv;void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1.);}',
  fragmentShader:`precision highp float;uniform sampler2D colorMap,depthMap;uniform mat4 inverseProjection;uniform vec2 size;in vec2 uv;out vec4 fragColor;
 vec3 point(vec2 q){float d=texture(depthMap,q).r;vec4 p=inverseProjection*vec4(q*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
 void main(){vec3 c=texture(colorMap,uv).rgb;float d=texture(depthMap,uv).r;if(d>.99995){fragColor=vec4(c,1);return;}
 vec3 p=point(uv);vec3 px=point(uv+vec2(1./size.x,0.))-p,mx=p-point(uv-vec2(1./size.x,0.));vec3 py=point(uv+vec2(0.,1./size.y))-p,my=p-point(uv-vec2(0.,1./size.y));
 vec3 n=normalize(cross(dot(px,px)<dot(mx,mx)?px:mx,dot(py,py)<dot(my,my)?py:my));float ao=0.;
 float radius=clamp(size.y*.37/max(1.,-p.z),3.,74.);
 for(int i=0;i<16;i++){float a=float(i)*2.399963,r=sqrt((float(i)+.5)/16.)*radius;vec2 q=clamp(uv+vec2(cos(a),sin(a))*r/size,.001,.999);vec3 delta=point(q)-p;float dist=length(delta);ao+=max(dot(n,delta)/max(dist,.001)-.11,0.)*(1.-smoothstep(.05,.86,dist));}
 c*=1.-min(.55,ao*.15);
 // Restrained lens halation from luminaires only, not uniform haze over the image.
 vec3 glow=vec3(0.);for(int i=0;i<4;i++){float a=float(i)*1.570796;vec3 q=texture(colorMap,uv+vec2(cos(a),sin(a))*3.2/size).rgb;glow+=max(q-vec3(1.25),vec3(0.));}c+=glow*.022;
 fragColor=vec4(c,1.);}`});
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3)),scene=new T.Scene(),camera=new T.Camera(),quad=new T.Mesh(geometry,material);scene.add(quad);quad.frustumCulled=false;let target,w0=0,h0=0;
 return{compose(renderer,color,depth,view,w,h){if(!depth||nearManila(view.position.x,view.position.z))return color;if(!target||w!==w0||h!==h0){target?.dispose();w0=w;h0=h;target=new T.WebGLRenderTarget(w,h,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,depthBuffer:false});}
  uniforms.colorMap.value=color;uniforms.depthMap.value=depth;uniforms.inverseProjection.value.copy(view.projectionMatrixInverse);uniforms.size.value.set(w,h);const prev=renderer.getRenderTarget();renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(prev);return target.texture;
 },dispose(){target?.dispose();geometry.dispose();material.dispose();}};
}
