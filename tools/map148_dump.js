(async()=>{const T=window.T;const e=__exit;const r=e.object;r.visible=true;window.__cap135NoIdle=true;
const OX=520.3172,OZ=552.7043,A=-0.07667245,ca=Math.cos(A),sa=Math.sin(A),Y0=EXR.EXIT_CITY_Y;
const CW=(cx,cz)=>({x:OX+ca*cx+sa*cz,z:OZ-sa*cx+ca*cz});
const X0=-448,Z0=-336,RES=0.5,NW=1568,NH=2240,N=NW*NH;
const H=new Float32Array(N).fill(-1e9),C=new Uint32Array(N),S=new Float32Array(N).fill(-1e9),CAN=new Float32Array(N).fill(-1e9),CC=new Uint32Array(N);
const texCache=new Map();const TS=96;
const cv=document.createElement('canvas');cv.width=TS;cv.height=TS;const cx2=cv.getContext('2d',{willReadFrequently:true});
function texData(t){if(!t)return null;if(texCache.has(t.uuid))return texCache.get(t.uuid);let d=null;try{const im=t.image;
 if(im&&im.data&&im.width){const w=im.width,h=im.height,src=im.data,o=new Uint8ClampedArray(TS*TS*4),ch=src.length/(w*h);for(let y=0;y<TS;y++)for(let x=0;x<TS;x++){const sx=Math.floor(x*w/TS),sy=Math.floor(y*h/TS),i=(sy*w+sx)*ch;let rr=src[i],gg=src[i+1],bb=src[i+2],aa=ch>3?src[i+3]:255;if(src instanceof Float32Array||src instanceof Uint16Array){rr=Math.min(255,rr*255);gg=Math.min(255,gg*255);bb=Math.min(255,bb*255);aa=255;}const j=((t.flipY?TS-1-y:y)*TS+x)*4;o[j]=rr;o[j+1]=ch>1?gg:rr;o[j+2]=ch>2?bb:rr;o[j+3]=aa;}d=o;}
 else if(im&&(im.width||im.naturalWidth)){cx2.clearRect(0,0,TS,TS);cx2.drawImage(im,0,0,TS,TS);d=cx2.getImageData(0,0,TS,TS).data;}}catch(err){d=null;}
 texCache.set(t.uuid,d);return d;}
const skip=new Set();for(const o of [e.crowd?.object,e.malt145npc?.object])if(o)skip.add(o);
const leafRe=/leaf|tree|shrub|hedge|m145tw|plant|canopy|foliage|ivy|grass|palm|frond/i;
let tris=0,meshes=0;
const v0=new T.Vector3(),v1=new T.Vector3(),v2=new T.Vector3(),M=new T.Matrix4(),IM=new T.Matrix4(),col=new T.Color();
function raster(root,skipSet){root.updateMatrixWorld(true);const list=[];root.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh)return;let p=o;while(p){if(!p.visible||skipSet.has(p)||skip.has(p))return;p=p.parent;}list.push(o);});
 for(const o of list){const g=o.geometry;if(!g||!g.attributes.position)continue;const pos=g.attributes.position,uv=g.attributes.uv,idx=g.index;const mats=Array.isArray(o.material)?o.material:[o.material];
  const groups=g.groups.length?g.groups:[{start:0,count:idx?idx.count:pos.count,materialIndex:0}];
  const nInst=o.isInstancedMesh?o.count:1;meshes++;
  for(let ii=0;ii<nInst;ii++){if(o.isInstancedMesh){o.getMatrixAt(ii,IM);M.multiplyMatrices(o.matrixWorld,IM);}else M.copy(o.matrixWorld);
   for(const gr of groups){const m=mats[gr.materialIndex||0];if(!m||m.visible===false)continue;if(m.transparent&&m.opacity<.35)continue;if(m.colorWrite===false)continue;
    const nm=(m.name||'')+' '+(o.name||'');const alpha=m.alphaTest>0||m.transparent;const leaf=leafRe.test(nm)||(m.alphaTest>0&&!/sign|text|label|fence|rail|grate|wire/i.test(nm));
    const map=m.map||m.uniforms?.map?.value||null;const td=texData(map);if(map)map.updateMatrix();const um=map?map.matrix.elements:null;
    let base=0xb0b0b0;if(m.color){base=m.color.getHex();}const br=base>>16&255,bg=base>>8&255,bb=base&255;
    const end=Math.min(gr.start+gr.count,idx?idx.count:pos.count);
    for(let k=gr.start;k+2<end;k+=3){const a=idx?idx.getX(k):k,b=idx?idx.getX(k+1):k+1,c=idx?idx.getX(k+2):k+2;
     v0.fromBufferAttribute(pos,a).applyMatrix4(M);v1.fromBufferAttribute(pos,b).applyMatrix4(M);v2.fromBufferAttribute(pos,c).applyMatrix4(M);tris++;
     const P=[v0,v1,v2].map(v=>{const dx=v.x-OX,dz=v.z-OZ;return[(ca*dx-sa*dz-X0)/RES,(sa*dx+ca*dz-Z0)/RES,v.y-Y0];});
     let minx=Math.min(P[0][0],P[1][0],P[2][0]),maxx=Math.max(P[0][0],P[1][0],P[2][0]),minz=Math.min(P[0][1],P[1][1],P[2][1]),maxz=Math.max(P[0][1],P[1][1],P[2][1]);
     if(maxx<0||maxz<0||minx>=NW||minz>=NH)continue;if(maxx-minx>4000||maxz-minz>4000)continue;
     const U=uv?[uv.getX(a),uv.getY(a),uv.getX(b),uv.getY(b),uv.getX(c),uv.getY(c)]:null;
     const area=(P[1][0]-P[0][0])*(P[2][1]-P[0][1])-(P[2][0]-P[0][0])*(P[1][1]-P[0][1]);
     const sample=(w0,w1,w2)=>{let R=br,G=bg,B=bb,AL=255;if(td&&U){let u=U[0]*w0+U[2]*w1+U[4]*w2,v=U[1]*w0+U[3]*w1+U[5]*w2;if(um){const uu=um[0]*u+um[3]*v+um[6],vv=um[1]*u+um[4]*v+um[7];u=uu;v=vv;}u=u-Math.floor(u);v=v-Math.floor(v);const tx=Math.min(TS-1,Math.floor(u*TS)),ty=Math.min(TS-1,Math.floor((1-v)*TS)),j=(ty*TS+tx)*4;R=R*td[j]/255;G=G*td[j+1]/255;B=B*td[j+2]/255;AL=td[j+3];}return[R|0,G|0,B|0,AL];};
     if(leaf&&alpha){ // vertical cross-card: splat a disc canopy at the centroid
      const cxp=(P[0][0]+P[1][0]+P[2][0])/3,czp=(P[0][1]+P[1][1]+P[2][1])/3,hy=Math.max(P[0][2],P[1][2],P[2][2]);const rad=Math.max(1,Math.min(14,.42*Math.max(maxx-minx,maxz-minz,(hy-Math.min(P[0][2],P[1][2],P[2][2]))/RES*.5)));
      const s=sample(.34,.33,.33);const cc=(255<<24)|(s[0]<<16)|(s[1]<<8)|s[2];
      for(let z=Math.max(0,Math.floor(czp-rad));z<=Math.min(NH-1,Math.ceil(czp+rad));z++)for(let x=Math.max(0,Math.floor(cxp-rad));x<=Math.min(NW-1,Math.ceil(cxp+rad));x++){const d=(x-cxp)**2+(z-czp)**2;if(d>rad*rad)continue;const hh=hy-Math.sqrt(d)*RES*.3,i=z*NW+x;if(hh>CAN[i]){CAN[i]=hh;CC[i]=cc;}}
      continue;}
     if(Math.abs(area)<1e-6){continue;}
     const x0=Math.max(0,Math.ceil(minx-.5)),x1=Math.min(NW-1,Math.floor(maxx-.5)),z0=Math.max(0,Math.ceil(minz-.5)),z1=Math.min(NH-1,Math.floor(maxz-.5));
     if(x0>x1||z0>z1){ // sub-cell triangle: plot centroid
      const xi=Math.floor((P[0][0]+P[1][0]+P[2][0])/3),zi=Math.floor((P[0][1]+P[1][1]+P[2][1])/3);if(xi<0||zi<0||xi>=NW||zi>=NH)continue;const hh=Math.max(P[0][2],P[1][2],P[2][2]),i=zi*NW+xi;
      if(hh>H[i]){const s=sample(.34,.33,.33);if(s[3]<128)continue;H[i]=hh;C[i]=(255<<24)|(s[0]<<16)|(s[1]<<8)|s[2];}if(!alpha&&hh>S[i])S[i]=hh;continue;}
     for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const px=x+.5,pz=z+.5;
      const w1=((px-P[0][0])*(P[2][1]-P[0][1])-(P[2][0]-P[0][0])*(pz-P[0][1]))/area,w2=((P[1][0]-P[0][0])*(pz-P[0][1])-(px-P[0][0])*(P[1][1]-P[0][1]))/area,w0=1-w1-w2;
      if(w0<-1e-4||w1<-1e-4||w2<-1e-4)continue;const hh=w0*P[0][2]+w1*P[1][2]+w2*P[2][2],i=z*NW+x;
      if(hh>H[i]){const s=sample(w0,w1,w2);if(s[3]<128)continue;H[i]=hh;C[i]=(255<<24)|(s[0]<<16)|(s[1]<<8)|s[2];}
      if(!alpha&&hh>S[i])S[i]=hh;}
    }}}}}
const t0=performance.now();
e.setCity(true);let c0=CW(-112,0);await e.prepareAt(c0.x,c0.z);
const blockObjs=()=>new Set([...e.blocks.values()].flatMap(v=>[v.object,v.sub?.object].filter(Boolean)));
raster(r,blockObjs());console.log('fixed done',tris,meshes,(performance.now()-t0|0));
const info=[];
for(let iz=-3;iz<=6;iz++)for(let ix=-4;ix<=2;ix++){const k=ix+','+iz;const c=CW(ix*112+56,iz*112+56);try{await e.prepareAt(c.x,c.z);}catch(err){info.push(k+' ERR');continue;}const v=e.blocks.get(k);if(!v){info.push(k+' none');continue;}raster(v.object,new Set([v.sub?.object].filter(Boolean)));info.push(k+':'+v.lod);}
console.log('blocks',info.join(' '),tris,(performance.now()-t0|0));
// waypoints
const wp={};for(const n of ['city-return','city-edge','city-core','city-plaza','city-vending','city-ad','city-bath','city-tiki','photo-hope','photo-clinic','photo-block122','photo-canal128']){try{const p=e.waypoint(n);const dx=p.x-OX,dz=p.z-OZ;wp[n]=[ca*dx-sa*dz,sa*dx+ca*dz,p.label||''];}catch(err){wp[n]=String(err);}}
const enc=a=>{const u=new Uint8Array(a.buffer);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);};
const j=JSON.stringify({X0,Z0,RES,NW,NH,wp,info,H:enc(H),C:enc(C),S:enc(S),CAN:enc(CAN),CC:enc(CC)});const CH=8e6;window.__chunk=i=>j.slice(i*CH,(i+1)*CH);
return Math.ceil(j.length/CH);})()
