/* V130-E: whole-head generator for the low-poly cast.
 * Given only the FRONT face texture (128², as every cast already ships) plus hair parameters, it bakes a second
 * 128² "head130" net — R side | BACK | L side band, CHIN cap, TOP cap, and outer/back islands for each ear — and
 * emits modelled, cupped ears (outline from the V118c keeper photo) that sit on the skull surface.
 * The face planes and their texture are never touched, so the front of every face stays pixel-identical.
 *
 * UV net (v up, like three.js):
 *   BAND  u .02–.98, v .345–.985   jf 0 = character's right face edge (image-left), .5 = back of skull, 1 = left edge;
 *                                  h 0 = chin row, 1 = crown row
 *   CHIN  u .02–.48, v .290–.335   TOP u .52–.98, v .290–.335
 *   EARS  R outer .02–.245 | R back .265–.49 | L outer .51–.735 | L back .755–.98, v .02–.28
 */
export const HEAD130_BAND=[.02,.345,.98,.985];
export const HEAD130_CHIN=[.02,.29,.48,.335];
export const HEAD130_TOP=[.52,.29,.98,.335];
export const HEAD130_EAR={R:{out:[.02,.02,.245,.28],back:[.265,.02,.49,.28]},L:{out:[.51,.02,.735,.28],back:[.755,.02,.98,.28]}};
// V118c keeper ear outline, normalised: s 0 = front attachment -> 1 = back rim, t 0 = top -> 1 = lobe.
const EAR_XY=[[452,452],[420,428],[360,424],[318,440],[298,480],[300,545],[322,620],[362,690],[405,700],[440,650],[452,560]];
export const HEAD130_EAR_ST=EAR_XY.map(([x,y])=>[(452-x)/154,(y-424)/276]);

const N=128;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const mix3=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t)];
const hash2=(x,y,s=0)=>{let n=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,2147483647);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;};
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

function pixels(tex){
  const im=tex?.image??tex?.source?.data;if(!im)return null;
  if(im.data&&im.width){return{w:im.width,h:im.height,d:im.data};}
  const c=(typeof OffscreenCanvas!=='undefined')?new OffscreenCanvas(im.width,im.height):Object.assign(document.createElement('canvas'),{width:im.width,height:im.height});
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);return{w:im.width,h:im.height,d:g.getImageData(0,0,im.width,im.height).data};
}
const px=(P,u,v)=>{const x=clamp(Math.floor(u*P.w),0,P.w-1),y=clamp(Math.floor(v*P.h),0,P.h-1),i=(y*P.w+x)*4;return[P.d[i],P.d[i+1],P.d[i+2],P.d[i+3]];};
function median(list){if(!list.length)return null;const out=[0,1,2].map(k=>{const s=list.map(c=>c[k]).sort((a,b)=>a-b);return s[s.length>>1];});return out;}
const dist3=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

/**
 * Bake the head130 net.
 * spec = {
 *   face: THREE.Texture (front photo, 128²), hair?: THREE.Texture, hairTint?: [r,g,b] 0..1, hairColor?: 0xRRGGBB,
 *   rows: [{h, v}]  chin(h 0) → crown(h 1) mapping to the face image row v (top-left origin),
 *   edgeU: [uRight, uLeft]  image u of the face planes' outer columns (character right = image left),
 *   cheek: [u0,v0,u1,v1]    image box of plain cheek skin,
 *   hairY(a): head-height fraction 0..1 where hair starts at azimuth a (a=0 front, sin(a)=x), or null (bald),
 *   ear: {hTop,hBot, jf0, jf1} in band coords (for the ear shadow), sideburn?: bool, nape?: 0..1 stubble,
 *   beard?: h below which the face-edge colour (beard) continues along the jaw,
 *   hairTop?(a): head-height fraction above which the scalp is bald again (horseshoe), earShadow?: 0..1,
 *   seed?: number
 * }
 */
export function bakeHead130(T,spec){
  const F=pixels(spec.face);if(!F)throw new Error('head130: face texture has no image');
  const H=spec.hair?pixels(spec.hair):null;
  const seed=spec.seed??130;
  // plain cheek skin
  const [cu0,cv0,cu1,cv1]=spec.cheek;const cheekList=[];
  for(let y=Math.floor(cv0*F.h);y<=Math.ceil(cv1*F.h);y++)for(let x=Math.floor(cu0*F.w);x<=Math.ceil(cu1*F.w);x++)cheekList.push(px(F,(x+.5)/F.w,(y+.5)/F.h));
  const cheek=median(cheekList)??[190,150,120];
  // hair colour
  let hairAvg=null;
  if(H){const R=spec.hairRect??[0,0,1,1],l=[];for(let y=0;y<24;y++)for(let x=0;x<24;x++)l.push(px(H,R[0]+(R[2]-R[0])*(x+.5)/24,R[1]+(R[3]-R[1])*(y+.5)/24));hairAvg=median(l);}
  if(!hairAvg){const c=new T.Color(spec.hairColor??0x3a3028);c.convertLinearToSRGB?.();hairAvg=[c.r*255,c.g*255,c.b*255];}
  const tint=spec.hairTint??[1,1,1];
  const HR=spec.hairRect??[0,0,1,1];
  const hairAt=(u,v)=>{const fu=((u%1)+1)%1,fv=((v%1)+1)%1,st=.86+.26*hash2(Math.floor(fu*97),Math.floor(fv*23),seed+21),c=H?px(H,HR[0]+(HR[2]-HR[0])*fu,HR[1]+(HR[3]-HR[1])*fv):hairAvg.map(k=>k*st);return[c[0]*tint[0],c[1]*tint[1],c[2]*tint[2]];};
  hairAvg=[hairAvg[0]*tint[0],hairAvg[1]*tint[1],hairAvg[2]*tint[2]];
  // per-row robust side colour (skin-like pixels in the outer strip of the face image) + the exact edge texel
  const rows=spec.rows,imgV=h=>{if(h<=rows[0].h)return rows[0].v;for(let i=1;i<rows.length;i++)if(h<=rows[i].h){const t=(h-rows[i-1].h)/(rows[i].h-rows[i-1].h);return mix(rows[i-1].v,rows[i].v,t);}return rows[rows.length-1].v;};
  const rowCol=[[],[]],edgeCol=[[],[]];
  for(let k=0;k<=32;k++){
    const h=k/32,v=imgV(h);
    for(const side of[0,1]){
      const ue=(typeof spec.edgeU==='function'?spec.edgeU(h):spec.edgeU)[side],dir=side===0?1:-1,l=[];
      for(let s=0;s<14;s++){const c=px(F,ue+dir*s/F.w,v);if(dist3(c,cheek)<70)l.push(c);}
      rowCol[side][k]=l.length>3?median(l):cheek.slice();
      const ec=[0,1,2].map(i=>(px(F,ue+dir*.5/F.w,v)[i]+px(F,ue+dir*1.5/F.w,v)[i])*.5);
      edgeCol[side][k]=dist3(ec,cheek)<85?ec:mix3(ec,rowCol[side][k],.8); // hair/background at the edge: lean on skin
    }
  }
  const rowAt=(arr,side,h)=>{const f=clamp(h,0,1)*32,i=Math.floor(f),t=f-i;return mix3(arr[side][i],arr[side][Math.min(32,i+1)],t);};
  const img=new Uint8ClampedArray(N*N*4);
  const put=(x,y,c)=>{const i=(y*N+x)*4;img[i]=c[0];img[i+1]=c[1];img[i+2]=c[2];img[i+3]=255;};
  const ear=spec.ear;
  // BAND
  const [b0,bv0,b1,bv1]=HEAD130_BAND;
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const u=(x+.5)/N,v=1-(y+.5)/N;
    let jf,h;
    if(v>=bv0-.02){jf=clamp((u-b0)/(b1-b0),0,1);h=clamp((v-bv0)/(bv1-bv0),0,1);}else continue;
    const side=jf<.5?0:1,e=side===0?jf:1-jf;          // e: 0 at face edge → .5 at back centre
    const a=-Math.PI/2-jf*Math.PI;
    // skin: exact edge texel at the seam, the row's side colour, then cheek skin further back
    let c=mix3(rowAt(edgeCol,side,h),rowAt(rowCol,side,h),smooth(0,.035,e));
    c=mix3(c,mix3(cheek,rowAt(rowCol,side,h),.35),smooth(.06,.22,e));
    // shading: jaw underside + nape + slight occiput roll-off
    const sh=1-.16*(1-smooth(0,.28,h))*smooth(.05,.35,e)-.07*smooth(.15,.5,e)*(1-smooth(.2,.9,h));
    c=c.map(k=>k*sh);
    // beard / stubble that reaches the face edge continues along the jaw
    if(spec.beard&&h<spec.beard){const ec=rowAt(edgeCol,side,h),w=(1-smooth(.09,.2+.04*hash2(x,y,seed+9),e))*(1-smooth(spec.beard-.1,spec.beard,h));c=mix3(c,ec.map(k=>k*.95),w*(hash2(x,y,seed+13)>.25?1:.6));}
    // ear shadow (ambient occlusion around the modelled ear)
    if(ear){const ex=(e-(ear.jf0+ear.jf1)/2)/((ear.jf1-ear.jf0)*.8),ey=(h-(ear.hTop+ear.hBot)/2)/((ear.hTop-ear.hBot)*.62);const d=ex*ex+ey*ey;if(d<1){const k=1-(spec.earShadow??.12)*(1-d);c=c.map(q=>q*k);}}
    // hair (under the hair shell + hairline fringe), sideburns, nape stubble
    if(spec.hairY){
      const hy=spec.hairY(a)+(hash2(x,y,seed)-.5)*.035;
      const hr=spec.hairRepeat??1,hc=hairAt(jf*1.7*hr,(1-h*1.1)*hr);
      const ht=spec.hairTop?spec.hairTop(a)+(hash2(x,y,seed+2)-.5)*.05:2;
      if(h>hy)c=mix3(c,hc,smooth(hy,hy+.04,h)*(1-smooth(ht-.05,ht,h)));
      else if(spec.nape&&e>.28){const t=spec.nape*smooth(hy-.22,hy,h)*smooth(.28,.38,e)*.55;c=mix3(c,hc,t*(hash2(x,y,seed+5)>.35?1:.4));}
      if(spec.sideburn&&ear&&e<ear.jf0+.012&&e>ear.jf0-.03&&h>ear.hBot+.08&&h<hy+.02){c=mix3(c,hc,.75);}
    }
    // low-fi grain + 6-bit quantise with ordered dither
    const n=(hash2(x,y,seed+11)-.5)*7,dz=((x&1)*2+(y&1)*3)%4-1.5;
    put(x,y,c.map(k=>Math.round(clamp(k+n+dz*1.2,0,255)/4)*4));
  }
  // CHIN + TOP caps
  const chinC=mix3(rowAt(rowCol,0,0),rowAt(rowCol,1,0),.5).map(k=>k*.74);
  for(const [rect,col,isHair] of [[HEAD130_CHIN,chinC,false],[HEAD130_TOP,spec.hairY?hairAvg:cheek.map(k=>k*.95),!!spec.hairY]]){
    const [u0,v0,u1,v1]=rect;
    for(let y=Math.floor((1-v1)*N)-1;y<=Math.ceil((1-v0)*N);y++)for(let x=Math.floor(u0*N);x<Math.ceil(u1*N);x++){
      if(y<0||y>=N)continue;const n=(hash2(x,y,seed+3)-.5)*8;
      const c=isHair?hairAt(x/40,y/9):col;put(x,y,c.map(k=>clamp(Math.round((k+n)/4)*4,0,255)));
    }
  }
  // EARS: outer (helix rim, scapha, antihelix, dark concha, lobe) and back
  const earSkin=[cheek[0]*1.0,cheek[1]*.965,cheek[2]*.955];
  const inPoly=(s,t,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const [xi,yi]=P[i],[xj,yj]=P[j];if(((yi>t)!==(yj>t))&&(s<(xj-xi)*(t-yi)/(yj-yi)+xi))c=!c;}return c;};
  const edgeDist=(s,t,P)=>{let m=9;for(let i=0;i<P.length;i++){const [ax,ay]=P[i],[bx,by]=P[(i+1)%P.length];const dx=bx-ax,dy=(by-ay)*1.8,l=dx*dx+dy*dy;let q=((s-ax)*dx+(t-ay)*1.8*dy)/l;q=clamp(q,0,1);m=Math.min(m,Math.hypot(s-ax-q*dx,(t-ay)*1.8-q*dy));}return m;};
  const P=HEAD130_EAR_ST;
  for(const sd of['R','L'])for(const kind of['out','back']){
    const [u0,v0,u1,v1]=HEAD130_EAR[sd][kind],pad=.012;
    for(let y=Math.floor((1-v1)*N);y<Math.ceil((1-v0)*N);y++)for(let x=Math.floor(u0*N);x<Math.ceil(u1*N);x++){
      const u=(x+.5)/N,v=1-(y+.5)/N,s=(u-u0-pad)/(u1-u0-2*pad),t=(v1-pad-v)/(v1-v0-2*pad);
      let c=earSkin.slice();
      if(kind==='back')c=c.map((k,i)=>k*(.80+.08*t));
      else if(inPoly(s,t,P)){
        const d=edgeDist(s,t,P);
        const conchaD=Math.hypot((s-.44)/.24,(t-.56)/.20),fossa=Math.hypot((s-.50)/.20,(t-.20)/.09);
        if(d<.05)c=c.map(k=>k*1.04);                                 // helix rim catches light
        else if(d<.11)c=c.map(k=>k*(.86+.6*(d-.05)));                // scapha groove fades into the antihelix
        else if(conchaD<1)c=c.map((k,i)=>k*(.74+.22*conchaD*conchaD)*(i===0?1.03:1)); // concha bowl
        else if(fossa<1)c=c.map(k=>k*.84);
        else c=c.map(k=>k*1.02);                                     // antihelix
        if(t>.80&&d>.04)c=c.map((k,i)=>k*(i===0?1.05:.99));         // fleshy lobe
        if(s<.16&&t>.42&&t<.62)c=c.map(k=>k*.9);                     // tragus notch
      }else c=c.map(k=>k*.86);
      const n=(hash2(x,y,seed+7)-.5)*6;put(x,y,c.map(k=>clamp(Math.round((k+n)/4)*4,0,255)));
    }
    // soften the painted ear inside its island (3x3 box) so the rim never reads as a drawn outline
    const x0=Math.floor(u0*N)+1,x1=Math.ceil(u1*N)-1,y0=Math.floor((1-v1)*N)+1,y1=Math.ceil((1-v0)*N)-1,src=img.slice();
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)for(let ch=0;ch<3;ch++){let m=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)m+=src[((y+dy)*N+x+dx)*4+ch]*(dx||dy?1:4);img[(y*N+x)*4+ch]=m/12;}
  }
  // gutters: nearest filled texel (keeps bleed clean under nearest filtering)
  for(let pass=0;pass<4;pass++)for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=(y*N+x)*4;if(img[i+3])continue;for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=N||yy>=N)continue;const j=(yy*N+xx)*4;if(img[j+3]===255){img[i]=img[j];img[i+1]=img[j+1];img[i+2]=img[j+2];img[i+3]=254;break;}}}
  for(let i=3;i<img.length;i+=4)img[i]=255;
  // DataTexture rows run bottom-up (v=0 first); the net was painted top-down.
  const flipped=new Uint8Array(img.length);for(let y=0;y<N;y++)flipped.set(img.subarray(y*N*4,(y+1)*N*4),(N-1-y)*N*4);
  const tex=new T.DataTexture(flipped,N,N,T.RGBAFormat);tex.flipY=false;
  tex.minFilter=T.NearestFilter;tex.magFilter=T.NearestFilter;tex.generateMipmaps=false;tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;
  tex.name='head130 net';tex.userData.head130={cheek,hairAvg,topDown:img};
  return tex;
}

export const bandUV130=(jf,h)=>[HEAD130_BAND[0]+(HEAD130_BAND[2]-HEAD130_BAND[0])*jf,HEAD130_BAND[1]+(HEAD130_BAND[3]-HEAD130_BAND[1])*clamp(h,0,1)];
export const capUV130=(kind,nx,nz)=>{const r=kind==='top'?HEAD130_TOP:HEAD130_CHIN;return[mix(r[0],r[2],clamp(nx*.5+.5,0,1)),mix(r[1],r[3],clamp(nz*.5+.5,0,1))];};
const earUV=(sd,kind,s,t)=>{const [a0,b0,a1,b1]=HEAD130_EAR[sd][kind],pad=.012;return[a0+pad+s*(a1-a0-2*pad),b1-pad-t*(b1-b0-2*pad)];};

/**
 * Modelled ears. emit(a,b,c,uva,uvb,uvc) receives head-local triangles (outward winding).
 * e = {skullX(y,z)→half width, yTop, yBot, zFront, depth, lift?, cup?}
 */
export function emitEars130(e,emit){
  const P=HEAD130_EAR_ST,n=P.length,lift=e.lift??.016,cup=e.cup??.006;
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const face=(a,b,c,ua,ub,uc,want)=>{const nn=cross(sub(b,a),sub(c,a));if(nn[0]*want[0]+nn[1]*want[1]+nn[2]*want[2]<0)emit(b,a,c,ub,ua,uc);else emit(a,b,c,ua,ub,uc);};
  for(const [sd,sign] of [['R',-1],['L',1]]){
    const pt=(s,t,extra=0)=>{const y=mix(e.yTop,e.yBot,t),z=e.zFront-s*e.depth;return[sign*(e.skullX(y,z)*.985+.002+lift*s+extra),y,z];};
    const A=P.map(([s,t])=>pt(s,t));
    const cs=P.reduce((q,p)=>q+p[0],0)/n,ct=P.reduce((q,p)=>q+p[1],0)/n;
    const M=P.map(([s,t])=>{const ss=mix(cs,s,.55),tt=mix(ct,t,.55);return{p:pt(ss,tt,-cup*.6),s:ss,t:tt};});
    const C=pt(cs,ct,-cup);
    const out=[sign,0,.15];
    for(let k=0;k<n;k++){const q=(k+1)%n;
      const ua=earUV(sd,'out',...P[k]),ub=earUV(sd,'out',...P[q]),ma=earUV(sd,'out',M[k].s,M[k].t),mb=earUV(sd,'out',M[q].s,M[q].t),uc=earUV(sd,'out',cs,ct);
      face(A[k],A[q],M[q].p,ua,ub,mb,out);face(A[k],M[q].p,M[k].p,ua,mb,ma,out);face(M[k].p,M[q].p,C,ma,mb,uc,out);
      // back of the ear (flush toward the skull) + rim thickness
      const ins=p=>[p[0]-sign*.0045,p[1],p[2]+.0015],Ai=ins(A[k]),Bi=ins(A[q]),Ci=[sign*e.skullX(mix(e.yTop,e.yBot,ct),e.zFront-cs*e.depth)*.97,mix(e.yTop,e.yBot,ct),e.zFront-cs*e.depth];
      const va=earUV(sd,'back',...P[k]),vb=earUV(sd,'back',...P[q]),vc=earUV(sd,'back',cs,ct);
      face(Ai,Bi,Ci,va,vb,vc,[-sign,0,-.4]);
      const mid=[(A[k][0]+A[q][0])/2,(A[k][1]+A[q][1])/2,(A[k][2]+A[q][2])/2],rw=[0,mid[1]-C[1],mid[2]-C[2]];
      face(A[k],Ai,Bi,ua,ua,ub,rw);face(A[k],Bi,A[q],ua,ub,ub,rw);
    }
  }
}

/**
 * Drop-in for the V75 family (retro-cast-v75, tiki-cast-v80, tiki-garden-cast-v85): rebuilds jaw/temples/occiput,
 * chin + crown caps and ears on material `mat`, returning the baked texture. Facial planes are left to the caller.
 * c = {T, tri, Wh (head weights), mat, front, rear, faceRows, faceU, landmarks, hW, hH, hD, headY,
 *      textures:{face, hair}, hairBottom(a) (metres-free head units as in the cast), ears:true|false, seed,
 *      sideburn, nape, earY:[top,bottom] head units}
 */
export function buildV75Head130(c){
  const {T,tri,Wh,mat,front,rear,faceRows,faceU,landmarks,hW,hH,hD,headY}=c,white=[1,1,1];
  const top=faceRows[faceRows.length-1][0],hOf=y=>(y-headY)/hH/top;
  const depth=[.067,.078,.088,.092,.096,.098,.092,.071];
  const skullX=(y,z)=>{const yy=(y-headY)/hH;let i=0;while(i<faceRows.length-2&&faceRows[i+1][0]<yy)i++;const t=clamp((yy-faceRows[i][0])/(faceRows[i+1][0]-faceRows[i][0]),0,1);
    const w=mix(faceRows[i][1],faceRows[i+1][1],t)*hW,dp=mix(depth[i],depth[i+1],t)*hD,q=(z+.010)/dp;return z<-.010?w*Math.sqrt(Math.max(.05,1-q*q)):w;};
  const earTop=(c.earY?.[0]??.150),earBot=(c.earY?.[1]??.082),zF=.006*hD,dep=.036*hD;
  // band coordinate of the ear for its shadow: z on the first rear quad (front edge z → j=1 z)
  const zEdge=front[4][0][2],z1=rear[4][1][2],jfOf=z=>clamp((zEdge-z)/(zEdge-z1),0,1)/6;
  const tex=bakeHead130(T,{face:c.textures.face,hair:c.textures.hair,hairTint:c.hairTint,hairColor:c.hairColor,seed:c.seed,
    rows:faceRows.map(r=>({h:r[0]/top,v:r[3]})),edgeU:[faceU[0],faceU[faceU.length-1]],
    cheek:[faceU[1]+.02,landmarks[0]+.07,Math.max(faceU[1]+.07,landmarks[4]-.06),landmarks[2]-.02],
    hairY:c.hairBottom?(a=>c.hairBottom(a)/top):null,sideburn:c.sideburn,beard:c.beard,nape:c.nape??.6,
    ear:c.ears===false?null:{hTop:earTop/top,hBot:earBot/top,jf0:jfOf(zF),jf1:jfOf(zF-dep)}});
  const quad=(a,b,cc,d,ua,ub,uc,ud)=>{tri(mat,a,b,d,ua,ub,ud,white,Wh,Wh,Wh);tri(mat,b,cc,d,ub,uc,ud,white,Wh,Wh,Wh);};
  for(let i=0;i<faceRows.length-1;i++)for(let j=0;j<6;j++){
    const uv=(r,k)=>bandUV130(k/6,faceRows[r][0]/top);
    quad(rear[i][j+1],rear[i][j],rear[i+1][j],rear[i+1][j+1],uv(i,j+1),uv(i,j),uv(i+1,j),uv(i+1,j+1));
  }
  for(const r of[0,faceRows.length-1]){
    const ring=[...front[r],...rear[r].slice(1,6).reverse()],center=[0,headY+faceRows[r][0]*hH,-.012],kind=r===0?'chin':'top';
    const R=Math.max(...ring.map(p=>Math.hypot(p[0],p[2]-center[2])))||1,cu=p=>capUV130(kind,p[0]/R,(p[2]-center[2])/R);
    for(let j=0;j<ring.length;j++){const k=(j+1)%ring.length,[p,q]=r===0?[ring[k],ring[j]]:[ring[j],ring[k]];tri(mat,center,p,q,cu(center),cu(p),cu(q),white,Wh,Wh,Wh);}
  }
  if(c.ears!==false)emitEars130({skullX,yTop:headY+earTop*hH,yBot:headY+earBot*hH,zFront:zF,depth:dep,lift:.015},(a,b,cc,ua,ub,uc)=>tri(mat,a,b,cc,ua,ub,uc,white,Wh,Wh,Wh));
  return tex;
}

/**
 * Retrofit an existing skinned head mesh whose texture is a front photo wrapped all the way round (V69 spring bathers):
 * triangles behind ±phi0 move to a generated head130 band (no more mirrored face / painted ears on the back of the skull),
 * and modelled ears are added. Returns a new SkinnedMesh (same skeleton) to add next to the face mesh; the face mesh
 * keeps only its front triangles, untouched. Assumes +Y up in mesh space; forward is found from the nose texels.
 * o = {phi0:deg, headBone:'head', cheek:[u0,v0,u1,v1], hairRect, hairY(a)→h, earV:[vTop,vBot] image rows of the painted ear,
 *      earZ (fraction of head radius, + forward), earDepth (fraction), sideburn, beard, nape, makeMaterial(tex)}
 */
export function retrofitSkinnedHead130(T,face,o){
  const g=face.geometry.index?face.geometry.toNonIndexed():face.geometry,P=g.attributes.position,U=g.attributes.uv,n=P.count;
  const hi=face.skeleton.bones.findIndex(b=>b.name===(o.headBone??'head'));if(hi<0)throw new Error('head130 retrofit: no head bone');
  const V=i=>new T.Vector3().fromBufferAttribute(P,i);
  const c=new T.Vector3();for(let i=0;i<n;i++)c.add(V(i));c.multiplyScalar(1/n);
  const nose=new T.Vector3();let nn=0;for(let i=0;i<n;i++){const u=U.getX(i),v=U.getY(i);if(Math.abs(u-.5)<.06&&v>.45&&v<.6){nose.add(V(i));nn++;}}
  const fwd=nose.multiplyScalar(1/Math.max(1,nn)).sub(c);fwd.y=0;fwd.normalize();const right=new T.Vector3(0,1,0).cross(fwd).normalize();
  const loc=p=>{const d=p.clone().sub(c);return[d.dot(right),d.y,d.dot(fwd)];};
  const L=Array.from({length:n},(_,i)=>loc(V(i)));
  let y0=Infinity,y1=-Infinity,R=0;for(const q of L){y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);R=Math.max(R,Math.hypot(q[0],q[2]));}
  const phi0=(o.phi0??100)*Math.PI/180,phiOf=q=>Math.atan2(q[0],q[2]);
  // image row v as a linear function of height (front vertices), image u at ±phi0
  let sy=0,sv=0,syy=0,syv=0,m=0,uA=[],uB=[];
  for(let i=0;i<n;i++){const q=L[i],ph=phiOf(q);if(Math.abs(ph)<1){sy+=q[1];sv+=U.getY(i);syy+=q[1]*q[1];syv+=q[1]*U.getY(i);m++;}
    if(Math.abs(ph-phi0)<.09)uA.push(U.getX(i));if(Math.abs(ph+phi0)<.09)uB.push(U.getX(i));}
  const b=(m*syv-sy*sv)/(m*syy-sy*sy),a=(sv-b*sy)/m,vOf=y=>a+b*y,yOfV=v=>(v-a)/b;
  const med=l=>l.sort((x,y)=>x-y)[l.length>>1]??.25;const uPlus=med(uA),uMinus=med(uB);
  const s0=uPlus<uMinus?1:-1;        // the side whose edge texel has the smaller u is band jf=0
  const H=y1-y0,hOf=y=>(y-y0)/H;
  const rows=[];for(let k=0;k<=8;k++){const y=y0+H*k/8;rows.push({h:k/8,v:clamp(vOf(y),0,1)});}
  const ev=o.earV??[.35,.59],eyT=yOfV(ev[0]),eyB=yOfV(ev[1]);
  const zF=(o.earZ??-.05)*R,dep=(o.earDepth??.40)*R;
  const skullX=(y,z)=>{let best=0;for(const q of L)if(Math.abs(q[1]-y)<H*.05&&Math.abs(q[2]-z)<R*.18)best=Math.max(best,Math.abs(q[0]));return best||R*.9;};
  // ear shadow position in band coordinates: angle of the ear centre past phi0
  const jfE=z=>clamp((Math.acos(clamp(z/R,-1,1))-phi0)/(2*Math.PI-2*phi0),0,1);
  const tex=bakeHead130(T,{face:o.faceTexture??face.material.map,hair:o.hairTexture===null?null:(o.hairTexture??o.faceTexture??face.material.map),hairColor:o.hairColor,hairRect:o.hairRect,hairTint:o.hairTint,seed:o.seed??69,
    rows,edgeU:s0===1?[uPlus,uMinus]:[uMinus,uPlus],cheek:o.cheek,hairY:o.hairY??null,hairTop:o.hairTop,hairRepeat:o.hairRepeat??(o.hairRect?3:1),earShadow:o.earShadow??.07,sideburn:o.sideburn,beard:o.beard,nape:o.nape??.6,
    ear:o.ears===false?null:{hTop:hOf(eyT),hBot:hOf(eyB),jf0:jfE(zF),jf1:jfE(zF-dep)}});
  const keepP=[],keepU=[],keepN=[],newP=[],newU=[];const N0=g.attributes.normal;
  const toMesh=q=>c.clone().addScaledVector(right,q[0]).add(new T.Vector3(0,q[1],0)).addScaledVector(fwd,q[2]);
  const psiOf=q=>{let ps=s0*phiOf(q);if(ps<0)ps+=2*Math.PI;return ps;};
  for(let t=0;t<n;t+=3){
    const cq=[0,1,2].map(k=>(L[t][k]+L[t+1][k]+L[t+2][k])/3),ps=psiOf(cq);
    if(ps>phi0&&ps<2*Math.PI-phi0){for(let k=0;k<3;k++){const q=L[t+k];newP.push(V(t+k).toArray());newU.push(bandUV130(clamp((psiOf(q)-phi0)/(2*Math.PI-2*phi0),0,1),hOf(q[1])));}}
    else for(let k=0;k<3;k++){keepP.push(...V(t+k).toArray());keepU.push(U.getX(t+k),U.getY(t+k));if(N0)keepN.push(N0.getX(t+k),N0.getY(t+k),N0.getZ(t+k));}
  }
  if(o.ears!==false)emitEars130({skullX,yTop:eyT,yBot:eyB,zFront:zF,depth:dep,lift:.016*R/.085,cup:.006*R/.085},(p1,p2,p3,u1,u2,u3)=>{
    // emitEars130 works in a frame where +x is the character's left; map it onto this head's frame
    for(const [q,u] of [[p1,u1],[p2,u2],[p3,u3]]){newP.push(toMesh(q).toArray());newU.push(u);}});
  const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute(keepP,3));fg.setAttribute('uv',new T.Float32BufferAttribute(keepU,2));if(keepN.length)fg.setAttribute('normal',new T.Float32BufferAttribute(keepN,3));else fg.computeVertexNormals();
  const cnt=keepP.length/3;const si=new Uint16Array(cnt*4),sw=new Float32Array(cnt*4);for(let i=0;i<cnt;i++){si[i*4]=hi;sw[i*4]=1;}
  // keep the original skin attributes for the front triangles
  if(g.attributes.skinIndex){const SI=g.attributes.skinIndex,SW=g.attributes.skinWeight;let w=0;for(let t=0;t<n;t+=3){const cq=[0,1,2].map(k=>(L[t][k]+L[t+1][k]+L[t+2][k])/3),ps=psiOf(cq);if(ps>phi0&&ps<2*Math.PI-phi0)continue;for(let k=0;k<3;k++,w++)for(let j=0;j<4;j++){si[w*4+j]=SI.getComponent(t+k,j);sw[w*4+j]=SW.getComponent(t+k,j);}}}
  fg.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));fg.setAttribute('skinWeight',new T.Float32BufferAttribute(sw,4));
  face.geometry=fg;
  const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(newP.flat(),3));rg.setAttribute('uv',new T.Float32BufferAttribute(newU.flat(),2));rg.computeVertexNormals();
  const rc=newP.length,rsi=new Uint16Array(rc*4),rsw=new Float32Array(rc*4);for(let i=0;i<rc;i++){rsi[i*4]=hi;rsw[i*4]=1;}
  rg.setAttribute('skinIndex',new T.Uint16BufferAttribute(rsi,4));rg.setAttribute('skinWeight',new T.Float32BufferAttribute(rsw,4));
  const mat=o.makeMaterial?o.makeMaterial(tex):new T.MeshBasicMaterial({map:tex});
  const mesh=new T.SkinnedMesh(rg,mat);mesh.name=face.name+' / head130 rear + ears';mesh.bind(face.skeleton,face.bindMatrix);
  face.parent.add(mesh);
  return{mesh,texture:tex,rearTriangles:newP.length/3};
}
