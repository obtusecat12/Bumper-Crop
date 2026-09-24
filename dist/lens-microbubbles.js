import * as T from './vendor/three.module.min.js';
// Air adheres to submerged front glass, in tiny clusters, rather than a ring of
// large world-space bubbles. Cached half-size normal field, updated at 24 Hz.
export function createLensMicrobubbles(rng=Math.random){
 const count=260,records=new Float32Array(count*6),centers=new Float32Array(24);
 let width=384,height=288,pixels=new Uint8Array(width*height*4),texture=null,age=99,acc=0,active=false;
 function allocate(aspect){const h=288,w=Math.max(128,Math.min(512,Math.round(h*aspect)));
  if(texture&&w===width)return;texture?.dispose();width=w;height=h;pixels=new Uint8Array(w*h*4);
  texture=new T.DataTexture(pixels,w,h,T.RGBAFormat);texture.minFilter=texture.magFilter=T.LinearFilter;texture.colorSpace=T.NoColorSpace;texture.generateMipmaps=false;texture.flipY=false;
 }
 function emit(aspect){allocate(aspect);age=0;acc=1;active=true;
  for(let i=0;i<8;i++){centers[i*3]=.08+rng()*.84;centers[i*3+1]=.12+rng()*.77;centers[i*3+2]=.025+rng()*.05;}
  for(let i=0;i<count;i++){const k=i*6,c=(i%8)*3,a=rng()*6.283,r=Math.sqrt(rng())*centers[c+2];
   records[k]=centers[c]+Math.cos(a)*r/aspect;records[k+1]=centers[c+1]+Math.sin(a)*r;
   records[k+2]=.0022+rng()**2*.0043;records[k+3]=.25+rng()*4.8;records[k+4]=1.2+rng()*3.5;records[k+5]=rng()*6.283;
  }
 }
 function update(dt,wet,aspect){allocate(aspect);if(!active)return;age+=dt;acc+=dt;if(!wet||age>9){active=false;return;}if(acc<1/24)return;acc=0;
  for(let i=0;i<pixels.length;i+=4){pixels[i]=pixels[i+1]=128;pixels[i+2]=pixels[i+3]=0;}
  for(let i=0;i<count;i++){const k=i*6,released=Math.max(0,age-records[k+3]),life=records[k+4];if(released>life)continue;
   const x=(records[k]+Math.sin(age*3.5+records[k+5])*.0006)*width;
   const y=(records[k+1]-.022*released*released)*height,r=records[k+2]*height;
   const fade=Math.min(1,age/.06)*Math.min(1,(life-released)*2);
   for(let yy=Math.max(0,Math.floor(y-r-1));yy<=Math.min(height-1,Math.ceil(y+r+1));yy++)for(let xx=Math.max(0,Math.floor(x-r-1));xx<=Math.min(width-1,Math.ceil(x+r+1));xx++){
    const dx=(xx+.5-x)/r,dy=(y-yy-.5)/r,q=dx*dx+dy*dy;if(q>=1)continue;
    const rim=(1-Math.max(0,(q-.65)/.35))*fade,o=(yy*width+xx)*4;
    if(rim*255<pixels[o+3])continue;
    pixels[o]=128+Math.round(dx*.72*127);pixels[o+1]=128+Math.round(dy*.72*127);pixels[o+2]=Math.round(Math.sqrt(1-q)*255);pixels[o+3]=Math.round(rim*255);
   }
  }texture.needsUpdate=true;
 }
 return {emit,update,get texture(){return texture;},get weight(){return active?1:0;},get age(){return age;},reset(){active=false;age=99;},dispose(){texture?.dispose();}};
}
