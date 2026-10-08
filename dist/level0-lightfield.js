// Level 0 light field (V103). A world-anchored 2D irradiance map baked on the CPU from the
// ceiling lamp grid of the resident chunk window. Every Level 0 surface reads it, so distant
// rooms are lit exactly as they will be when the player arrives (no light pop-in), switched-off
// circuits and blackout regions keep the light that bleeds in from neighbouring lit rooms, and
// the real-time light count never changes (no shader recompiles).
//  R: direct fluorescent pool (sigma ~2.1 m)   G: wide bounce (sigma ~5.4 m)
//  B: neutral mask (rooms with their own authored lighting: Manila, atrium)
// Values are sqrt-encoded in 8-bit for dark-range precision. Two textures crossfade so a
// breaker change fades instead of switching.
export const L0_FIELD_CELL=.6;
const DIRECT_SCALE=72,DIRECT_MAX=4,BOUNCE_SCALE=18,BOUNCE_MAX=2.2;
export function createLevel0LightField(T,size){
 const N=Math.round(size/L0_FIELD_CELL),H=N>>1;
 const emit=new Float32Array(N*N),tmpA=new Float32Array(N*N),tmpB=new Float32Array(N*N),half=new Float32Array(H*H),halfT=new Float32Array(H*H),neutral=new Float32Array(N*N);
 const line=new Float32Array(N+64);
 const make=()=>{const d=new Uint8Array(N*N*4);for(let i=0;i<N*N;i++){d[i*4]=Math.round(Math.sqrt(1/DIRECT_MAX)*255);d[i*4+1]=Math.round(Math.sqrt(1/BOUNCE_MAX)*255);d[i*4+3]=255;}const t=new T.DataTexture(d,N,N,T.RGBAFormat,T.UnsignedByteType);t.magFilter=t.minFilter=T.LinearFilter;t.generateMipmaps=false;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.colorSpace=T.NoColorSpace;t.needsUpdate=true;return t;};
 const texA=make(),texB=make();
 const uniforms={l0FieldA:{value:texA},l0FieldB:{value:texB},l0FieldMix:{value:1},l0FieldRect:{value:new T.Vector4(0,0,1/size,0)}};
 let front=texB,back=texA,fade=1,fadeRate=1;
 // Running-sum box blur, 1D, with edge clamping. Three passes approximate a gaussian.
 function boxPass(src,dst,n,r,stride,count,step){const w=2*r+1;for(let k=0;k<count;k++){const base=k*stride;let acc=0;for(let i=-r;i<=r;i++)acc+=src[base+Math.min(n-1,Math.max(0,i))*step];for(let i=0;i<n;i++){dst[base+i*step]=acc/w;const add=Math.min(n-1,i+r+1),sub=Math.max(0,i-r);acc+=src[base+add*step]-src[base+sub*step];}}}
 function blur(buf,tmp,n,r,passes){for(let p=0;p<passes;p++){boxPass(buf,tmp,n,r,n,n,1);boxPass(tmp,buf,n,r,1,n,n);}}
 // lamps: iterable of {x,z,power}; neutralRects: [{x0,x1,z0,z1}]
 function compute(x0,z0,lamps,neutralRects,{instant=false,seconds=.55}={}){
  emit.fill(0);neutral.fill(0);
  for(const l of lamps){if(l.power<=0)continue;const u=(l.x-x0)/L0_FIELD_CELL-.5,v=(l.z-z0)/L0_FIELD_CELL-.5,i=Math.floor(u),j=Math.floor(v),fu=u-i,fv=v-j;
   for(const[di,dj,w]of[[0,0,(1-fu)*(1-fv)],[1,0,fu*(1-fv)],[0,1,(1-fu)*fv],[1,1,fu*fv]]){const a=i+di,b=j+dj;if(a>=0&&b>=0&&a<N&&b<N)emit[b*N+a]+=w*l.power;}}
  for(const r of neutralRects){const a0=Math.max(0,Math.floor((r.x0-x0)/L0_FIELD_CELL)),a1=Math.min(N-1,Math.ceil((r.x1-x0)/L0_FIELD_CELL)),b0=Math.max(0,Math.floor((r.z0-z0)/L0_FIELD_CELL)),b1=Math.min(N-1,Math.ceil((r.z1-z0)/L0_FIELD_CELL));for(let b=b0;b<=b1;b++)for(let a=a0;a<=a1;a++)neutral[b*N+a]=1;}
  // Bounce: 2x2 downsample then wide blur on the half grid.
  for(let b=0;b<H;b++)for(let a=0;a<H;a++){const i=(b*2)*N+a*2;half[b*H+a]=emit[i]+emit[i+1]+emit[i+N]+emit[i+N+1];}
  blur(half,halfT,H,4,3);
  tmpA.set(emit);blur(tmpA,tmpB,N,3,3);
  blur(neutral,tmpB,N,2,2);
  const d=back.image.data;
  for(let b=0;b<N;b++){const hb=Math.min(H-1,Math.max(0,(b-.5)/2)),b0=Math.floor(hb),b1=Math.min(H-1,b0+1),fb=hb-b0;
   for(let a=0;a<N;a++){const i=b*N+a,ha=Math.min(H-1,Math.max(0,(a-.5)/2)),a0=Math.floor(ha),a1=Math.min(H-1,a0+1),fa=ha-a0;
    const bounce=((half[b0*H+a0]*(1-fa)+half[b0*H+a1]*fa)*(1-fb)+(half[b1*H+a0]*(1-fa)+half[b1*H+a1]*fa)*fb)*BOUNCE_SCALE;
    const direct=tmpA[i]*DIRECT_SCALE;
    d[i*4]=Math.round(Math.sqrt(Math.min(1,direct/DIRECT_MAX))*255);d[i*4+1]=Math.round(Math.sqrt(Math.min(1,bounce/BOUNCE_MAX))*255);d[i*4+2]=Math.round(Math.min(1,neutral[i])*255);d[i*4+3]=255;}}
  back.needsUpdate=true;
  if(instant||!(fade>=1)){// Window moved (or a fade was interrupted): both textures take the new state.
   front.image.data.set(d);front.needsUpdate=true;fade=1;uniforms.l0FieldMix.value=1;uniforms.l0FieldA.value=front;uniforms.l0FieldB.value=back;
   if(!instant){fade=1;}
  }else{uniforms.l0FieldA.value=front;uniforms.l0FieldB.value=back;fade=0;fadeRate=1/Math.max(.05,seconds);uniforms.l0FieldMix.value=0;}
  const t=front;front=back;back=t;
  uniforms.l0FieldRect.value.set(x0,z0,1/size,0);
 }
 // Decode for CPU queries (player-local darkness for fog / exposure).
 function sample(x,z){const r=uniforms.l0FieldRect.value,u=(x-r.x)*r.z,v=(z-r.y)*r.z;if(!(u>0&&v>0&&u<1&&v<1))return{direct:1,bounce:1,neutral:0};const a=Math.min(N-1,Math.floor(u*N)),b=Math.min(N-1,Math.floor(v*N)),i=(b*N+a)*4,A=uniforms.l0FieldA.value.image.data,B=uniforms.l0FieldB.value.image.data,m=uniforms.l0FieldMix.value;const dec=(D,k,s)=>{const q=D[i+k]/255;return q*q*s;};
  return{direct:dec(A,0,DIRECT_MAX)*(1-m)+dec(B,0,DIRECT_MAX)*m,bounce:dec(A,1,BOUNCE_MAX)*(1-m)+dec(B,1,BOUNCE_MAX)*m,neutral:(A[i+2]*(1-m)+B[i+2]*m)/255};}
 function update(dt){if(fade<1){fade=Math.min(1,fade+dt*fadeRate);const s=fade*fade*(3-2*fade);uniforms.l0FieldMix.value=s;}}
 return{uniforms,compute,update,sample,N,get fading(){return fade<1}};
}
// Shared GLSL: needs uniforms above. Returns vec3(direct, bounce, neutral) in linear units.
export const L0_FIELD_GLSL=`uniform sampler2D l0FieldA,l0FieldB;uniform float l0FieldMix;uniform vec4 l0FieldRect;
vec3 l0FieldAt(vec2 xz){vec2 uv=(xz-l0FieldRect.xy)*l0FieldRect.z;vec3 a=texture2D(l0FieldA,uv).rgb,b=texture2D(l0FieldB,uv).rgb;vec3 f=mix(a,b,l0FieldMix);f.rg=f.rg*f.rg*vec2(${DIRECT_MAX.toFixed(2)},${BOUNCE_MAX.toFixed(2)});
 float e=smoothstep(0.,.07,min(min(uv.x,uv.y),min(1.-uv.x,1.-uv.y)));return mix(vec3(1.,1.,0.),f,e);}`;
