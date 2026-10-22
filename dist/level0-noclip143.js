// V143 · the "4D space" of the Level 0 → Level 1 noclip (replaces V130-D's ghost-copy rush; ?nc4d=0 = old).
// One full-screen raymarch: an endless, flowing Menger-style box fractal tube the camera rides through
// (inner recursion levels slide at their own speeds, the tube spirals 90° per cell), its surfaces
// fading from the Level 0 wallpaper to Level 1 concrete — deepest recursion first, then the whole tube.
// Through the fractal's holes: the "blue channel" — one flat, uniform blue, no light, no fog, no pattern,
// with a few drifting rooms / clusters scattered in it. Void pixels are written as an exact constant
// chosen so the pixel filter's 4×4 dither + 5-bit quantise maps every one of them to the same colour.
export const VOID143=[12/255,44/255,252/255]; // each channel = 8k+4..8k+7 → dither-stable (R1 G5 B31 in 5-bit)

const VS=`varying vec2 vP;void main(){vP=position.xy;gl_Position=vec4(position.xy,0.,1.);}`;
const FS=`precision highp float;
uniform sampler2D uL0,uL1;uniform float uTime,uZ,uProg,uAspect,uFov,uRoll,uHas1;uniform vec3 uVoid;varying vec2 vP;
#define W 9.
#define CELL 18.
#define VC 45.
#define TW 36.
#define PI 3.14159265
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float hash(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float gLvl;
// fractal tube: coarse level fixed (keeps the ride clear), finer levels slide = "flowing" recursion
float tube(vec3 p){
 p.xy=rot(p.z*(PI*.5)/TW)*p.xy;
 float d=box(p,vec3(W,W,1e5));
 // whole wall sections missing in some cells: the tube breaks open onto the void
 float cz=floor(p.z/CELL);
 for(int k=0;k<4;k++){float fk=float(k);if(hash(vec3(cz,fk,3.7))<.55){vec2 dir=k==0?vec2(1,0):k==1?vec2(-1,0):k==2?vec2(0,1):vec2(0,-1);
  vec3 cc=vec3(dir*(W/3.+15.),(cz+.5)*CELL);vec3 hb=vec3(abs(dir.x)>.5?15.:40.,abs(dir.y)>.5?15.:40.,CELL*.5-1.6-hash(vec3(cz,fk,9.))*3.);
  d=max(d,-box(p-cc,hb));}}
 float s=1./W;gLvl=0.;
 for(int i=0;i<5;i++){float fi=float(i);
  vec3 o=i==0?vec3(0.):vec3(sin(fi*1.7)*.35,cos(fi*2.3)*.35,1.)*uTime*(.09+.05*fi)*(mod(fi,2.)<.5?1.:-1.);
  vec3 a=mod(p*s+o,2.)-1.;s*=3.;vec3 r=abs(1.-3.*abs(a));
  float c=(min(max(r.x,r.y),min(max(r.y,r.z),max(r.z,r.x)))-1.)/s;
  if(c>d){d=c;gLvl=fi+1.;}}
 return d;}
// sparse rooms and clusters drifting in the void, one per hashed cell
float gRoom;
float rooms(vec3 p,out float id){
 vec3 c=floor(p/VC),l=p-(c+.5)*VC;float h=hash(c);id=h;
 if(abs(c.x+.5)*VC<W+14.&&abs(c.y+.5)*VC<W+14.)return VC*.5;   // keep the tube's own neighbourhood empty
 if(h>.3)return VC*.5;
 vec3 j=vec3(hash(c+1.7),hash(c+3.1),hash(c+5.9))-.5;l-=j*14.;
 l.xz=rot(uTime*.05*(h-.11)*9.+h*40.)*l.xz;l.xy=rot(h*17.)*l.xy;
 vec3 sz=vec3(3.+h*14.,2.+hash(c+8.)*3.,3.+hash(c+9.)*9.);
 float shell=max(box(l,sz),-box(l,sz-.3));
 shell=max(shell,-box(l-vec3(0.,-sz.y+1.,sz.z),vec3(.6,1.05,.6)));      // a doorway
 shell=max(shell,-box(l-vec3(sz.x,.2,0.),vec3(.6,.6,sz.z*.6)));          // a window band
 if(h<.1){vec3 l2=l-vec3(sz.x+3.,sz.y*.6,-2.);shell=min(shell,max(box(l2,vec3(2.5,1.6,2.5)),-box(l2,vec3(2.2,1.3,2.2))));
  vec3 l3=l+vec3(sz.x*.6,sz.y+2.,3.);shell=min(shell,box(l3,vec3(1.8,.12,1.8)));}  // a cluster: annexe + slab
 return min(shell,VC*.5);}
float gMat;
float map(vec3 p){float id,dt=tube(p),dr=rooms(p,id);gMat=dt<dr?0.:1.;gRoom=id;return min(dt,dr);}
float cellStep(vec3 p,vec3 rd){vec3 c=floor(p/VC),b=(c+step(0.,rd))*VC;vec3 t=(b-p)/rd;return max(min(t.x,min(t.y,t.z)),.02)+.01;}
vec3 tri(sampler2D t,vec3 p,vec3 n,float k){vec3 w=pow(abs(n),vec3(4.));w/=w.x+w.y+w.z;
 return texture2D(t,fract(p.yz*k)).rgb*w.x+texture2D(t,fract(p.xz*k)).rgb*w.y+texture2D(t,fract(p.xy*k)).rgb*w.z;}
void main(){
 vec3 ro=vec3(0.,0.,uZ);
 vec2 sp=vP*vec2(uAspect,1.)*tan(uFov*.5*PI/180.);sp=rot(uRoll)*sp;
 vec3 rd=normalize(vec3(sp.x,sp.y,1.));
 float t=.05,d=0.;bool hit=false;int it=0;
 for(int i=0;i<150;i++){it=i;vec3 p=ro+rd*t;d=map(p);
  bool inTube=abs(p.x)<W*1.45&&abs(p.y)<W*1.45;
  float stp=d*.62;if(!inTube&&gMat>.5)stp=min(stp,cellStep(p,rd));
  if(d<.0012*t){hit=true;break;}
  t+=stp;if(t>300.)break;}
 if(!hit&&t>300.){gl_FragColor=vec4(uVoid,1.);return;}
 vec3 p=ro+rd*t;map(p);float mt=gMat,lv=gLvl,rid=gRoom;
 vec2 e=vec2(.0015*t,0.);vec3 n=normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));
 vec3 tp=p;if(mt<.5)tp.xy=rot(p.z*(PI*.5)/TW)*tp.xy;
 float k=mt<.5?pow(3.,max(lv-1.,0.))*.45:.4;
 // Level 0 → Level 1: deepest recursion turns first, then the whole tube; rooms keep their own
 float m=mt<.5?smoothstep(0.,1.,clamp(uProg*1.9-.35+(lv-2.5)*.22,0.,1.)):step(.5,fract(rid*7.));
 vec3 c0=tri(uL0,tp,n,k)*vec3(1.04,1.,.9),c1=mix(vec3(.62,.64,.63),tri(uL1,tp,n,k*.8),uHas1);
 vec3 c=mix(c0,c1,m);
 float ao=1.-float(it)/150.*.85;
 float lit=.32+.68*max(dot(n,normalize(-rd+vec3(.2,.5,0.))),0.);
 vec3 tint=mix(vec3(1.,.95,.72),vec3(.92,.96,1.),m);
 c*=lit*ao*tint*(mt<.5?exp(-t*.006):.75)*1.3;
 c=clamp(c,0.,1.);
 // keep lit surfaces from ever reading as the void colour
 if(c.b>c.r+.35&&c.b>c.g+.35)c.b=c.g+.3;
 gl_FragColor=vec4(c,1.);}`;

export function createRush143(T,{l0Map,l1Url}={}){
 const scene=new T.Scene();const cam=new T.Camera();
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const blank=new T.DataTexture(new Uint8Array([200,190,120,255]),1,1);blank.needsUpdate=true;
 const mat=new T.ShaderMaterial({vertexShader:VS,fragmentShader:FS,depthTest:false,depthWrite:false,toneMapped:false,
  uniforms:{uL0:{value:l0Map||blank},uL1:{value:blank},uHas1:{value:0},uTime:{value:0},uZ:{value:0},uProg:{value:0},uAspect:{value:1.6},uFov:{value:72},uRoll:{value:0},uVoid:{value:new T.Vector3(...VOID143)}}});
 const quad=new T.Mesh(geo,mat);quad.frustumCulled=false;scene.add(quad);
 let l1=null;
 if(l1Url){new T.TextureLoader().load(l1Url,tx=>{tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.colorSpace=T.SRGBColorSpace;tx.magFilter=T.NearestFilter;l1=tx;mat.uniforms.uL1.value=tx;mat.uniforms.uHas1.value=1;},undefined,()=>{});}
 let z=0;
 // u: seconds since the rush started; prog: 0..1 through the ride (Level 0 → Level 1 materials)
 function update(u,dt,prog,aspect){
  const speed=2.6+3.2*Math.sin(Math.min(1,u/7)*Math.PI*.5);z=(z+dt*speed)%720; // 720 = 40 cells, 20 quarter twists = whole turns, 16 void cells
  const U=mat.uniforms;U.uTime.value=u;U.uZ.value=z;U.uProg.value=Math.max(0,Math.min(1,prog));U.uAspect.value=aspect||1.6;
  U.uFov.value=74+Math.sin(u*.45)*7;U.uRoll.value=Math.sin(u*.31)*.35+u*.04;}
 // Drawn straight to the canvas (not through the scene pipeline / filters, which would grade or noise the void),
 // via a capped-height buffer so the raymarch stays cheap and keeps the game's chunky pixels.
 const BLIT_FS=`precision highp float;uniform sampler2D uPic;varying vec2 vP;void main(){gl_FragColor=texture2D(uPic,vP*.5+.5);}`;
 const blitMat=new T.ShaderMaterial({vertexShader:VS,fragmentShader:BLIT_FS,uniforms:{uPic:{value:null}},depthTest:false,depthWrite:false,toneMapped:false});
 const blit=new T.Scene(),bq=new T.Mesh(geo,blitMat);bq.frustumCulled=false;blit.add(bq);
 let rt=null;const sz=new T.Vector2();
 function render(renderer,maxH=450){renderer.getDrawingBufferSize(sz);const h=Math.max(120,Math.min(maxH,sz.y)),w=Math.max(160,Math.round(h*sz.x/Math.max(1,sz.y)));
  if(!rt||rt.width!==w||rt.height!==h){rt?.dispose();rt=new T.WebGLRenderTarget(w,h,{depthBuffer:false,minFilter:T.NearestFilter,magFilter:T.NearestFilter,generateMipmaps:false});}
  mat.uniforms.uAspect.value=w/h;const old=renderer.getRenderTarget();
  renderer.setRenderTarget(rt);renderer.render(scene,cam);blitMat.uniforms.uPic.value=rt.texture;renderer.setRenderTarget(null);renderer.render(blit,cam);renderer.setRenderTarget(old);}
 function setZ(v){z=v;}
 function dispose(){geo.dispose();mat.dispose();blitMat.dispose();blank.dispose();l1?.dispose();rt?.dispose();}
 return{scene,cam,mat,update,render,setZ,dispose};}
