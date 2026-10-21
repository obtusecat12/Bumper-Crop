// V135 ④-3 tier C sprite bake. Run in the crowd preview page (crowd.html: window.T, window.renderer, window.C = crowd135.js)
// through /workspace/work/v133c/run.py; shot 0 = assets/crowd135/sprites135.png (raw: row 0 = GL bottom, i.e. stored upside down,
// sampled with flipY=false), shot 1 = a decoded colour preview. Tier B geometry/VAT rendered with an orthographic camera per cell,
// 3x supersampled, downsampled here (coverage >= 5/9, slot = majority). Cell (col = dir*9 + frameCol, row = body): dir k = camera at
// local yaw k*45° (0 = in front of the person, +z), frameCol 0..7 = walk frames 0,3,..21, 8 = idle frame 0.
// R = shade (fixed view-space light), G = slot*32+16 (0 skin 1 top 2 bottom 3 shoe 4 hair), B = detail/2 (head texel luminance vs
// the slot colour; 1 elsewhere). V137 Q5: one row per (body, hair style) pair of crowd135.js sprRows137 (60 rows), each with its
// modelled hair (crowd137-hair.js) and a face of that style for the skin/hair split; colours come per person.
// V139 H3: heads = crowd139 whole heads (representative head per type, face key texture); f8 rows paint the neck as scarf (hair slot).
(async()=>{const T=window.T,renderer=window.renderer,C=window.C;const F=await import('./crowd135-far.js?v=139h');
const lib=await C.loadCrowd135();const ROWS=C.sprRows137(lib),S=F.SPR135,SS=3,W=S.cw*S.cols,H=S.ch*ROWS.length,RW=W*SS,RH=H*SS;
const RH1=S.ch*SS,rt=new T.WebGLRenderTarget(RW,RH1,{type:T.UnsignedByteType,depthBuffer:true});rt.texture.minFilter=rt.texture.magFilter=T.NearestFilter;
const scene=new T.Scene(),cam=new T.OrthographicCamera(-S.w/2,S.w/2,S.h/2,-S.h/2,.1,20);
const out=new Uint8ClampedArray(W*H*4),prev=new Uint8ClampedArray(W*H*4),buf=new Uint8Array(RW*RH1*4);
const PAL=[[224,180,150],[70,110,170],[60,60,70],[30,30,30],[90,60,40]];
for(let row=0;row<ROWS.length;row++){const{bi,hx,fk}=ROWS[row],Bd=lib.bodies[bi],b=F.BAKE135.buildBody(lib,bi),bt=F.BAKE135.boneTex(lib,Bd.type);
 const L=C.look135(lib,1,{type:Bd.type,sil:Bd.sil,face:fk,props:[]});L.hairIx=hx;const r=F.bRecord135(L,lib.headTile(Bd.type,fk));
 const mat=new T.ShaderMaterial({uniforms:{...lib.uniformsB,vatTex:{value:b.vat},boneTex:{value:bt},vatNB:{value:b.nb},hairC:{value:L.hairC}},
  vertexShader:F.BAKE135.GLSL_COMMON+`varying vec3 vN;flat varying vec3 vSkin;void main(){vat135();vN=normalize(normalMatrix*mat3(instanceMatrix)*vatNrm);vSkin=iSkin.rgb;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(vatPos,1.);}`,
  fragmentShader:F.BAKE135.GLSL_FRAG_COMMON+`flat varying float vSlot;varying vec3 vN;flat varying vec3 vSkin;uniform vec3 hairC;
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722))+1e-4;}
void main(){vec3 a=albedo135();float sh=.42+.58*max(dot(normalize(vN),normalize(vec3(-.35,.75,.55))),0.);float slot=vSlot,det=1.;
 if(vSlot>4.5){vec3 ca=a/(a.r+a.g+a.b+1e-4),cs=vSkin/(vSkin.r+vSkin.g+vSkin.b+1e-4);float lr=lum(a)/lum(vSkin);
  if(length(ca-cs)<.07&&lr>.4&&lr<1.9){slot=0.;det=lr;}else{slot=4.;det=lum(a)/lum(hairC);}}
 gl_FragColor=vec4(sh,(slot*32.+16.)/255.,clamp(det,0.,2.)/2.,1.);}`});
 const mesh=new T.InstancedMesh(b.g,mat,1);mesh.frustumCulled=false;mesh.setMatrixAt(0,new T.Matrix4());let k=0;
 for(const[n,s]of F.IATTR135){const at=new T.InstancedBufferAttribute(r.slice(k,k+s),s);b.g.setAttribute(n,at);k+=s;}
 scene.clear();scene.add(mesh);rt.scissorTest=false;renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,0);renderer.clear(true,true,true);
 for(let dk=0;dk<8;dk++){const a=dk*Math.PI/4;cam.position.set(Math.sin(a)*6,S.h/2,Math.cos(a)*6);cam.lookAt(0,S.h/2,0);cam.updateMatrixWorld();
  for(let fc=0;fc<9;fc++){const f=fc<8?lib.clips.walk.start+fc*3:lib.clips.idle.start;b.g.attributes.iMisc.array[2]=f;b.g.attributes.iMisc.needsUpdate=true;
   const col=dk*9+fc;rt.viewport.set(col*S.cw*SS,0,S.cw*SS,S.ch*SS);rt.scissor.copy(rt.viewport);rt.scissorTest=true;renderer.setRenderTarget(rt);renderer.render(scene,cam);}}
 renderer.readRenderTargetPixels(rt,0,0,RW,RH1,buf);
 for(let yy=0;yy<S.ch;yy++)for(let x=0;x<W;x++){let n=0,r=0,bb=0;const cnt=[0,0,0,0,0];
  for(let j=0;j<SS;j++)for(let i=0;i<SS;i++){const q=((yy*SS+j)*RW+x*SS+i)*4;if(buf[q+3]>127){n++;r+=buf[q];bb+=buf[q+2];cnt[Math.min(4,buf[q+1]>>5)]++;}}
  const y=row*S.ch+yy,o=(y*W+x)*4;if(n>=5){let sl=0;for(let k=1;k<5;k++)if(cnt[k]>cnt[sl])sl=k;out[o]=r/n;out[o+1]=sl*32+16;out[o+2]=bb/n;out[o+3]=255;
   const po=((H-1-y)*W+x)*4,m=out[o]/255*out[o+2]/127.5;for(let c=0;c<3;c++)prev[po+c]=PAL[sl][c]*m;prev[po+3]=255;}}
 mat.dispose();b.g.dispose();b.vat.dispose();bt.dispose();}
renderer.setRenderTarget(null);rt.dispose();
const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.putImageData(new ImageData(out,W,H),0,0);const s0=cv.toDataURL('image/png');
g.putImageData(new ImageData(prev,W,H),0,0);const s1=cv.toDataURL('image/png');
window.__shot=i=>[s0,s1][i];return 'SHOTS2';})()
