import * as T from './vendor/three.module.min.js';
// Asset preparation only. Fill RGB beyond cutout edges, keep alpha untouched,
// and prefilter RGB by coverage so transparent texels cannot bleach the mips.
export function plantTexture(data,width,height,{columns=1,rows=1,name='Cutout plants'}={}){
 const levels=[],cw=width/columns,ch=height/rows;
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const n=cw*ch,known=new Uint8Array(n),queue=new Int32Array(n),source=new Int32Array(n);let head=0,tail=0;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const j=y*cw+x,k=((row*ch+y)*width+col*cw+x)*4;if(data[k+3]>=32){known[j]=1;source[j]=j;queue[tail++]=j;}}
  while(head<tail){const j=queue[head++],x=j%cw,y=Math.floor(j/cw);for(const q of [x?j-1:-1,x<cw-1?j+1:-1,y?j-cw:-1,y<ch-1?j+cw:-1])if(q>=0&&!known[q]){known[q]=1;source[q]=source[j];queue[tail++]=q;}}
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const j=y*cw+x,k=((row*ch+y)*width+col*cw+x)*4;if(data[k+3]>=32||!known[j])continue;const a=source[j],s=((row*ch+Math.floor(a/cw))*width+col*cw+a%cw)*4;data[k]=data[s];data[k+1]=data[s+1];data[k+2]=data[s+2];}
 }
 let pixels=data,w=width,h=height;levels.push({data:pixels,width:w,height:h});
 while(w>1||h>1){const nw=Math.max(1,w>>1),nh=Math.max(1,h>>1),next=new Uint8Array(nw*nh*4);
  for(let y=0;y<nh;y++)for(let x=0;x<nw;x++){let a=0,r=0,g=0,b=0,ur=0,ug=0,ub=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=(Math.min(h-1,y*2+dy)*w+Math.min(w-1,x*2+dx))*4,alpha=pixels[i+3];a+=alpha;r+=pixels[i]*alpha;g+=pixels[i+1]*alpha;b+=pixels[i+2]*alpha;ur+=pixels[i];ug+=pixels[i+1];ub+=pixels[i+2];}const k=(y*nw+x)*4;next[k]=a?r/a:ur/4;next[k+1]=a?g/a:ug/4;next[k+2]=a?b/a:ub/4;next[k+3]=a/4;}
  levels.push({data:next,width:nw,height:nh});pixels=next;w=nw;h=nh;
 }
 const t=new T.DataTexture(data,width,height);t.name=name;t.colorSpace=T.SRGBColorSpace;t.mipmaps=levels;t.generateMipmaps=false;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=4;t.needsUpdate=true;return t;
}
export const plantAlpha=`
 #ifdef USE_ALPHATEST
  // The other perpendicular card carries the silhouette when this card is
  // viewed edge-on. Suppress subpixel stripes before alpha reconstruction.
  vec3 cardN=normalize(cross(dFdx(vViewPosition),dFdy(vViewPosition)));
  float cardFacing=abs(dot(cardN,normalize(vViewPosition)));
  diffuseColor.a*=smoothstep(.07,.23,cardFacing);
  float edgeWidth=max(fwidth(diffuseColor.a)*.7,.035);
  diffuseColor.a=smoothstep(alphaTest-edgeWidth,alphaTest+edgeWidth,diffuseColor.a);
  if(diffuseColor.a<.015)discard;
 #endif
`;
