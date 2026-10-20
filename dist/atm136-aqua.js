// V136-atm-lobby stage 2: the cylindrical acrylic aquarium's living contents (runtime only; cabinet, gravel bed and the
// acrylic shell are baked geometry in atm136-geo.js). Everything moves on one time uniform inside the shaders, so the
// mirror-floor copy shares geometry + materials and costs no extra JS.
//  - water: back wall = cylinder BackSide that REFRACTS a cube capture of the (static) lobby taken once from the tank
//    centre (refract() through the far wall + chord-length absorption + in-scatter + caustics + light shafts);
//    front = thin transparent FrontSide layer (fresnel reflection of the same cube, meniscus line, caustic shimmer);
//    top = rippled surface disc (seen from the 2F gallery).
//  - plants: cross-quad clumps (plant_a stems sway, plant_b coral cluster), fish: shader-swum quads with tail wiggle
//    (fish_a yellow tang, fish_b regal tang), bubbles: two air-stone columns of ring sprites.
import * as T from './vendor/three.module.min.js';
import {AQ136} from './atm136-geo.js?v=136b';
const CAUST=`float caust(vec2 p,float t){vec2 q=p*5.;float c=0.;for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.3+t*.9),cos(q.x*1.1-t*.7))*.65;c+=1./(1.+18.*abs(sin(q.x)+sin(q.y)));}return c/3.;}`;
const OUT='\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n';
export function createAqua136(tex){
 const {x:CX,z:CZ,r:R0,base:B,water:WY}=AQ136,R=R0-.006,H=WY-B,U={t:{value:0},env:{value:null},envOn:{value:0},px:{value:270},
  c:{value:new T.Vector3(CX,B,CZ)},rad:{value:R},wy:{value:WY}};
 const group=new T.Group();group.name='atm136 aquarium';const all=[];
 const add=(m,order=0)=>{m.renderOrder=order;m.matrixAutoUpdate=false;m.updateMatrix();group.add(m);all.push(m);return m;};
 const common=`uniform float t;uniform samplerCube env;uniform float envOn;uniform vec3 c;uniform float rad;uniform float wy;varying vec3 vW;varying vec3 vN;\n${CAUST}
 vec3 envS(vec3 d){return envOn>.5?textureCube(env,d).rgb:mix(vec3(.62,.6,.56),vec3(.95,.93,.88),d.y*.5+.5);}
 float chord(vec3 ro,vec3 rd){vec2 o=ro.xz-c.xz,d=rd.xz;float a=dot(d,d),b=dot(o,d),k=dot(o,o)-rad*rad,h=b*b-a*k;if(h<0.)return 0.;h=sqrt(h);return max(0.,(-b+h)/a-max(0.,(-b-h)/a))*length(rd);}
 vec3 WATER=vec3(.03,.24,.40);vec3 ABS=vec3(1.7,.52,.3);`;
 const vs=`varying vec3 vW;varying vec3 vN;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
 const cyl=new T.CylinderGeometry(R,R,H,48,1,true);cyl.translate(CX,B+H/2,CZ);
 // far wall: what you see THROUGH the tank
 add(new T.Mesh(cyl,new T.ShaderMaterial({uniforms:U,side:T.BackSide,name:'atm136:water-back',vertexShader:vs,fragmentShader:common+`void main(){
  vec3 V=normalize(vW-cameraPosition),n=normalize(vec3(vW.x-c.x,0.,vW.z-c.z));
  vec3 d=refract(V,-n,1.33);if(dot(d,d)<.01)d=reflect(V,-n);
  d.xz+=vec2(sin(vW.y*9.+t*1.7),cos(vW.y*7.-t*1.3))*.025;
  float L=chord(cameraPosition,V)+.15,h=clamp((vW.y-c.y)/(wy-c.y),0.,1.);
  vec3 col=envS(normalize(d))*exp(-L*ABS);
  vec3 sc=WATER*(.55+.75*h)+vec3(.05,.22,.42)*(1.-h)*(1.-h)*.6;   // blue LED glow off the glass gravel
  col+=sc*(1.-exp(-L*.9));
  col+=vec3(.35,.55,.6)*caust(vW.xz*1.6+vW.y*.35,t*.8)*.55*h;
  float sh=pow(max(0.,sin(atan(vW.z-c.z,vW.x-c.x)*5.+vW.y*.6+t*.25)),8.)*h*.12;col+=vec3(.6,.85,.9)*sh;
  gl_FragColor=vec4(col,1.);${OUT}}`})),0);
 // near wall: thin transparent layer
 add(new T.Mesh(cyl,new T.ShaderMaterial({uniforms:U,side:T.FrontSide,transparent:true,depthWrite:false,name:'atm136:water-front',vertexShader:vs,fragmentShader:common+`void main(){
  vec3 V=normalize(vW-cameraPosition),n=normalize(vN);float cs=clamp(-dot(V,n),0.,1.),F=.03+.97*pow(1.-cs,5.);
  float h=clamp((vW.y-c.y)/(wy-c.y),0.,1.);vec3 col=mix(WATER*.7,envS(reflect(V,n)),F);
  col+=vec3(.5,.75,.8)*caust(vW.xz*2.1-vW.y*.2,t)*.18*h;
  float men=smoothstep(.02,0.,abs(vW.y-wy+.012));col+=vec3(.75,.9,.95)*men*.8;
  float a=.26+F*.55+men*.5;gl_FragColor=vec4(col,clamp(a,0.,.92));${OUT}}`})),2);
 // water surface (seen from above)
 const top=new T.CircleGeometry(R,40);top.rotateX(-Math.PI/2);top.translate(CX,WY,CZ);
 add(new T.Mesh(top,new T.ShaderMaterial({uniforms:U,side:T.DoubleSide,transparent:true,depthWrite:false,name:'atm136:water-top',vertexShader:vs,fragmentShader:common+`void main(){
  vec3 V=normalize(vW-cameraPosition);vec2 q=(vW.xz-c.xz)*14.;vec3 n=normalize(vec3(sin(q.x+t*2.1)*.06+sin(q.y*1.3-t*1.7)*.05,1.,cos(q.y+t*1.9)*.06));
  float F=.04+.96*pow(1.-abs(dot(V,n)),5.);vec3 col=mix(WATER*.8+vec3(.03,.12,.16)*caust(vW.xz*2.5,t),envS(reflect(V,n)),F*.9);
  gl_FragColor=vec4(col,.62+F*.3);${OUT}}`})),3);
 // ---- plants: cross quads (2 planes) ----
 {const P=[],UV=[],S=[],I=[],Q=[];let rnd=136;const rn=()=>((rnd=(rnd*16807)%2147483647)/2147483647);
  const clump=(x,z,w,h,kind,amp)=>{const a0=rn()*Math.PI;for(let k=0;k<2;k++){const a=a0+k*Math.PI/2,dx=Math.cos(a)*w/2,dz=Math.sin(a)*w/2,o=P.length/3,ph=rn()*6.28;
    for(const[u,v]of[[0,0],[1,0],[1,1],[0,1]]){P.push(x+(u*2-1)*dx,B+.02+v*h,z+(u*2-1)*dz);UV.push(u,v);S.push(ph,amp,kind);}I.push(o,o+1,o+2,o,o+2,o+3);}};
  for(let i=0;i<4;i++){const f=i/4*Math.PI*2+.5,rr=R*(.6+rn()*.15);clump(CX+Math.cos(f)*rr,CZ+Math.sin(f)*rr,.38+rn()*.15,.8+rn()*.8,0,1);}
  for(let i=0;i<3;i++){const f=i/3*Math.PI*2+1.2,rr=R*.35;clump(CX+Math.cos(f)*rr,CZ+Math.sin(f)*rr,.9+rn()*.3,.45+rn()*.15,1,0);}clump(CX,CZ,.42,1.5,0,1);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(UV,2));g.setAttribute('aS',new T.Float32BufferAttribute(S,3));g.setIndex(I);
  add(new T.Mesh(g,new T.ShaderMaterial({uniforms:{...U,ta:{value:tex.plant_a},tb:{value:tex.plant_b}},side:T.DoubleSide,name:'atm136:plants',
   vertexShader:`uniform float t;attribute vec3 aS;varying vec2 vU;varying float vK;varying vec3 vW;void main(){vec3 p=position;float k=uv.y*uv.y*aS.y;
    p.x+=sin(t*1.1+aS.x+p.y*3.)*.05*k;p.z+=cos(t*.9+aS.x*1.7+p.y*2.5)*.04*k;vU=uv;vK=aS.z;vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
   fragmentShader:`uniform float t;uniform sampler2D ta;uniform sampler2D tb;uniform vec3 c;uniform float wy;varying vec2 vU;varying float vK;varying vec3 vW;${CAUST}
    void main(){vec4 s=vK<.5?texture2D(ta,vU):texture2D(tb,vU);if(s.a<.5)discard;float h=clamp((vW.y-c.y)/(wy-c.y),0.,1.);
    vec3 col=s.rgb*(.62+.35*h)+s.rgb*caust(vW.xz*1.8+vW.y*.4,t*.8)*.45*h;col=mix(col,vec3(.03,.24,.40),.25);gl_FragColor=vec4(col,1.);${OUT}}`})),1);}
 // ---- fish ----
 {const P=[],C=[],F=[],I=[];const N=12;let rnd=9136;const rn=()=>((rnd=(rnd*16807)%2147483647)/2147483647);
  for(let i=0;i<N;i++){const sp=i%3===2?1:0,len=sp?.26+rn()*.06:.22+rn()*.07,rr=Math.min(R-.12-len*.5,.2+rn()*.42),hh=B+.35+rn()*(H-.6),w=(rn()<.5?-1:1)*(.25+rn()*.3),o=P.length/3,ph=rn()*6.28;
   for(const[u,v]of[[0,0],[1,0],[1,1],[0,1]]){P.push(0,0,0);C.push(u,v,sp);F.push(rr,hh,w,ph);}I.push(o,o+1,o+2,o,o+2,o+3);
   for(let k=0;k<4;k++)C[(o+k)*3+2]=sp*10+len;}   // pack species + length: z = sp*10 + len
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('aC',new T.Float32BufferAttribute(C,3));g.setAttribute('aF',new T.Float32BufferAttribute(F,4));g.setIndex(I);
  g.boundingSphere=new T.Sphere(new T.Vector3(CX,B+H/2,CZ),H);
  add(new T.Mesh(g,new T.ShaderMaterial({uniforms:{...U,ta:{value:tex.fish_a},tb:{value:tex.fish_b}},side:T.DoubleSide,name:'atm136:fish',
   vertexShader:`uniform float t;uniform vec3 c;attribute vec3 aC;attribute vec4 aF;varying vec2 vU;varying float vS;varying vec3 vW;void main(){
    float sp=aC.z>=5.?1.:0.;float len=aC.z-sp*10.;
    float a=aF.w+aF.z*t+.35*sin(t*.37+aF.w*3.),r=aF.x*(.85+.15*sin(t*.5+aF.w)),y=aF.y+.09*sin(t*.6+aF.w*2.);
    vec3 ctr=vec3(c.x+cos(a)*r,y,c.z+sin(a)*r),hd=normalize(vec3(-sin(a),.12*cos(t*.6+aF.w*2.),cos(a))*sign(aF.z)),sd=normalize(cross(hd,vec3(0.,1.,0.)));
    float u=aC.x,v=aC.y;vec3 p=ctr+hd*(u-.5)*len+vec3(0.,1.,0.)*(v-.5)*len*.5+sd*sin(t*9.+aF.w-u*4.)*.035*(1.-u)*(1.-u)*len*3.;
    vU=vec2(sp>.5?1.-u:u,v);vS=sp;vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
   fragmentShader:`uniform float t;uniform sampler2D ta;uniform sampler2D tb;uniform vec3 c;uniform float wy;varying vec2 vU;varying float vS;varying vec3 vW;${CAUST}
    void main(){vec4 s=vS<.5?texture2D(ta,vU):texture2D(tb,vU);if(s.a<.5)discard;float h=clamp((vW.y-c.y)/(wy-c.y),0.,1.);
    vec3 col=s.rgb*(.7+.3*h)+s.rgb*caust(vW.xz*2.+vW.y*.5,t)*.35*h;col=mix(col,vec3(.03,.24,.40),.2);gl_FragColor=vec4(col,1.);${OUT}}`})),1);}
 // ---- bubbles: two air stones ----
 {const P=[],A=[];let rnd=31;const rn=()=>((rnd=(rnd*16807)%2147483647)/2147483647);
  for(const[sx,sz]of[[-.38,.32],[.4,-.3]])for(let i=0;i<26;i++){P.push(CX+sx,B,CZ+sz);A.push(.25+rn()*.35,rn()*H,rn()*6.28,.012+rn()*.016);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('aB',new T.Float32BufferAttribute(A,4));g.boundingSphere=new T.Sphere(new T.Vector3(CX,B+H/2,CZ),H);
  add(new T.Points(g,new T.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,name:'atm136:bubbles',
   vertexShader:`uniform float t;uniform float wy;uniform float px;attribute vec4 aB;varying float vA;void main(){vec3 p=position;float H=wy-p.y-.03,y=mod(aB.y+t*aB.x,H);
    p.y+=y;p.x+=sin(t*3.+aB.z+y*6.)*.02*(.3+y/H);p.z+=cos(t*2.6+aB.z*1.3+y*5.)*.02*(.3+y/H);vA=smoothstep(0.,.05,y)*smoothstep(H,H-.06,y);
    vec4 mv=viewMatrix*modelMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.5,aB.w*(1.+y/H*.6)*projectionMatrix[1][1]*px*.5/-mv.z);}`,
   fragmentShader:`varying float vA;void main(){vec2 q=gl_PointCoord*2.-1.;float d=dot(q,q);if(d>1.)discard;float ring=smoothstep(.45,1.,d)+smoothstep(.12,0.,dot(q+vec2(.35,.35),q+vec2(.35,.35)))*.9;
    gl_FragColor=vec4(vec3(.85,.95,1.),clamp(ring,0.,1.)*.8*vA);${OUT}}`})),2);}
 // ---- one-time refraction capture of the static lobby from the tank centre ----
 let rendererRef=null,cube=null,cam=null,captured=false;
 all[0].onBeforeRender=(r)=>{if(!rendererRef){rendererRef=r;}U.px.value=r.getDrawingBufferSize?r.getDrawingBufferSize(new T.Vector2()).y:270;};
 return{group,meshes:all,U,
  capture(scene,hide=[]){if(captured||!rendererRef)return false;cube=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType});cam=new T.CubeCamera(.05,60,cube);cam.position.set(CX,B+H*.5,CZ);
   const vis=hide.map(o=>o.visible);hide.forEach(o=>o.visible=false);scene.add(cam);cam.update(rendererRef,scene);scene.remove(cam);hide.forEach((o,i)=>o.visible=vis[i]);
   U.env.value=cube.texture;U.envOn.value=1;captured=true;return true;},
  update(t){U.t.value=t;},
  dispose(){all.forEach(m=>{m.geometry.dispose();m.material.dispose();});cube?.dispose();}};
}
