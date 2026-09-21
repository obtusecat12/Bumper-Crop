import * as T from './vendor/three.module.min.js';
// Cumulative view-ray radiance, shared by every material. Eight depth knots,
// one low-resolution pass; never ray-march separately for every wheat layer.
export const FOG_DEPTHS=Object.freeze([2,4,7,11,16,23,32,48]);
export const fogVolumePars=`
uniform sampler2D uFogVolume;
uniform vec2 uFogViewport,uFogTileSize;
uniform float uFogVolumeAmount;
vec4 fogKnot(float i,vec2 uv){
 vec2 p=clamp(uv, .5/uFogTileSize,1.-.5/uFogTileSize);
 return texture2D(uFogVolume,(vec2(mod(i,4.),floor(i/4.))+p)/vec2(4.,2.));
}
vec4 fogVolumeAt(float distance){
 vec2 uv=gl_FragCoord.xy/uFogViewport;
 float a=0.,b=2.,ia=-1.,ib=0.;
 if(distance>2.){a=2.;b=4.;ia=0.;ib=1.;}
 if(distance>4.){a=4.;b=7.;ia=1.;ib=2.;}
 if(distance>7.){a=7.;b=11.;ia=2.;ib=3.;}
 if(distance>11.){a=11.;b=16.;ia=3.;ib=4.;}
 if(distance>16.){a=16.;b=23.;ia=4.;ib=5.;}
 if(distance>23.){a=23.;b=32.;ia=5.;ib=6.;}
 if(distance>32.){a=32.;b=48.;ia=6.;ib=7.;}
 vec4 lo=ia<0.?vec4(0.,0.,0.,1.):fogKnot(ia,uv),hi=fogKnot(ib,uv);
 hi.a=min(hi.a,lo.a);
 float f=clamp((distance-a)/(b-a),0.,1.);
 float trans=exp(mix(log(max(lo.a,.0001)),log(max(hi.a,.0001)),f));
 float w=abs(lo.a-hi.a)>.0001?(lo.a-trans)/(lo.a-hi.a):f;
 return vec4(mix(lo.rgb,hi.rgb,clamp(w,0.,1.)),trans);
}
vec3 volumeOverOutput(vec3 background,float distance){
 if(uFogVolumeAmount<.001)return background;
 vec4 v=fogVolumeAt(distance);float opacity=1.-v.a;
 vec3 scatter=linearToOutputTexel(vec4(v.rgb/max(opacity,.0001),1.)).rgb*opacity;
 return background*v.a+scatter;
}`;
export function createFogVolume(renderer,noise){
 const target=new T.WebGLRenderTarget(4,2,{depthBuffer:false,stencilBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
 target.texture.name='cumulative-fog-radiance';target.texture.colorSpace=T.NoColorSpace;
 const uniforms={uFogVolume:{value:target.texture},uFogViewport:{value:new T.Vector2(1,1)},uFogTileSize:{value:new T.Vector2(1,1)},uFogVolumeAmount:{value:0}};
 const values={...uniforms,uNoise:{value:noise},uInvProjection:{value:new T.Matrix4()},uViewWorld:{value:new T.Matrix4()},uOrigin:{value:new T.Vector2()},uTime:{value:0},uFogColor:{value:new T.Color('#b9c3c0')}};
 const material=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:values,
 vertexShader:'varying vec2 vUV;void main(){vUV=position.xy*.5+.5;gl_Position=vec4(position,1.);}',
 fragmentShader:`precision highp sampler3D;
 varying vec2 vUV;uniform sampler3D uNoise;uniform mat4 uInvProjection,uViewWorld;uniform vec2 uOrigin;uniform float uTime,uFogVolumeAmount;uniform vec3 uFogColor;
 void main(){
 vec2 tile=floor(vUV*vec2(4.,2.)),uv=fract(vUV*vec2(4.,2.));float index=tile.x+4.*tile.y;
 float depth=index<.5?2.:index<1.5?4.:index<2.5?7.:index<3.5?11.:index<4.5?16.:index<5.5?23.:index<6.5?32.:48.;
 vec4 nearPoint=uInvProjection*vec4(uv*2.-1.,1.,1.);
 vec3 rd=normalize(mat3(uViewWorld)*nearPoint.xyz),ro=uViewWorld[3].xyz+vec3(uOrigin.x,0.,uOrigin.y);
 vec3 radiance=vec3(0.);float trans=1.,travel=0.;
 // All knots share nested sample intervals. No frame-jitter or depth popping.
 for(int k=0;k<44;k++){
  if(travel>=depth||trans<.002)break;
  float stepSize=min(depth-travel,travel<8.?.5:travel<24.?1.:2.);
  vec3 p=ro+rd*(travel+stepSize*.5);
  vec3 wind=vec3(uTime*.57,uTime*.013,uTime*.19);
  vec4 bank=textureLod(uNoise,(p+wind)/vec3(64.,16.,128.),0.);
  vec3 warp=(bank.gbr-.5)*vec3(3.,.60,4.);
  vec4 folds=textureLod(uNoise,(p+warp+wind*1.7)/vec3(32.,4.,128.),0.);
  vec4 strands=textureLod(uNoise,(p+warp+vec3(-uTime*.31,uTime*.04,uTime*.42))/vec3(16.,2.,64.),0.);
  float ribbon=pow(max(0.,1.-abs(folds.g-.48)*4.8),3.);
  ribbon*=smoothstep(.22,.65,strands.b);
  float height=exp(-max(0.,p.y-.4)*.085);
  float density=(.028+height*(.030+.42*ribbon+.15*smoothstep(.35,.65,bank.r)))*uFogVolumeAmount;
  float extinction=exp(-density*stepSize);
  // Broad sky fill, denser folds self-attenuate. Sunward illumination stays
  // coherent in world space; fine wisps modulate depth rather than screen noise.
  float forward=pow(max(0.,dot(rd,normalize(vec3(-.45,.84,-.3)))),5.);
  float fill=.43+.38*bank.g+.16*strands.r+.20*forward+.34*ribbon;
  vec3 light=uFogColor*fill*mix(vec3(.94,.985,1.04),vec3(1.04,1.015,.96),bank.g);
  radiance+=trans*(1.-extinction)*light;trans*=extinction;travel+=stepSize;
 }
 gl_FragColor=vec4(radiance,trans);
}`});
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const scene=new T.Scene(),camera=new T.Camera(),mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
 const size=new T.Vector2(),viewport=new T.Vector4(),scissor=new T.Vector4();let quality='balanced';
 const wrap=v=>typeof v==='bigint'?Number((v%1024n+1024n)%1024n)*64:((Number(v)||0)%65536+65536)%65536;
 function update({mist=0,time=0,originX=0,originZ=0,quality:q='balanced',color}={}){uniforms.uFogVolumeAmount.value=Math.max(0,Math.min(1,mist));values.uTime.value=time;values.uOrigin.value.set(wrap(originX),wrap(originZ));quality=q;if(color)values.uFogColor.value.copy(color);}
 function render(view){
  if(uniforms.uFogVolumeAmount.value<.001)return false;
  renderer.getDrawingBufferSize(size);uniforms.uFogViewport.value.copy(size);
  const h={low:108,balanced:144,high:180}[quality]||144,w=Math.max(96,Math.min(320,Math.round(h*size.x/size.y)));
  if(target.width!==w*4||target.height!==h*2)target.setSize(w*4,h*2);uniforms.uFogTileSize.value.set(w,h);
  view.updateMatrixWorld(true);values.uInvProjection.value.copy(view.projectionMatrixInverse);values.uViewWorld.value.copy(view.matrixWorld);
  const prior=renderer.getRenderTarget(),auto=renderer.autoClear,test=renderer.getScissorTest();renderer.getViewport(viewport);renderer.getScissor(scissor);
  renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.autoClear=true;renderer.render(scene,camera);
  renderer.setRenderTarget(prior);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(test);renderer.autoClear=auto;return true;
 }
 return {uniforms,material,target,scene,camera,update,render,dispose(){target.dispose();material.dispose();geometry.dispose();}};
}
