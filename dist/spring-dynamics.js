import * as T from './vendor/three.module.min.js';
// Wave-equation integration adapted from Clearwater, Copyright (c) 2026
// Lumaris, MIT. See licenses/clearwater-MIT.txt. This bounded cave solver
// uses the same damped height/velocity state, with a fixed timestep and
// byte-packed slope output, avoiding floating-render-target requirements.
export function createSpringDynamics(size=72,span=5.6){
 const count=size*size,h=new Float32Array(count),v=new Float32Array(count),next=new Float32Array(count),data=new Uint8Array(count*4),step=span/size;
 const texture=new T.DataTexture(data,size,size);texture.minFilter=texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.colorSpace=T.NoColorSpace;
 let accumulator=0,elapsed=0,version=0;
 function drop(x,z,radius=.13,strength=.006){const cx=(x/span+.5)*size,cz=(z/span+.5)*size,r=radius/step;for(let j=Math.max(1,Math.floor(cz-r));j<Math.min(size-1,cz+r);j++)for(let i=Math.max(1,Math.floor(cx-r));i<Math.min(size-1,cx+r);i++){const d=Math.hypot(i-cx,j-cz)/r;if(d<1)h[j*size+i]-=strength*(.5+.5*Math.cos(Math.PI*d));}}
 function pack(){for(let j=0;j<size;j++)for(let i=0;i<size;i++){const k=j*size+i,p=k*4,left=h[j*size+Math.max(0,i-1)],right=h[j*size+Math.min(size-1,i+1)],up=h[Math.max(0,j-1)*size+i],down=h[Math.min(size-1,j+1)*size+i];const sx=(right-left)/(2*step),sz=(down-up)/(2*step);data[p]=Math.round(T.MathUtils.clamp(.5+sx*2,0,1)*255);data[p+1]=Math.round(T.MathUtils.clamp(.5+sz*2,0,1)*255);data[p+2]=Math.round(T.MathUtils.clamp(.5+h[k]*12,0,1)*255);data[p+3]=Math.round(T.MathUtils.clamp(.5+(left+right+up+down-4*h[k])/(step*step)*.04,0,1)*255);}texture.needsUpdate=true;version++;}
 function update(dt,sources=[]){accumulator+=Math.min(.1,Math.max(0,dt));let changed=false;while(accumulator>=1/60){accumulator-=1/60;elapsed+=1/60;for(let n=0;n<sources.length;n++){const p=sources[n];drop(p[0]+Math.sin(elapsed*13+n)*.045,p[1]+Math.cos(elapsed*9+n)*.035,.095,.0018);}
   for(let j=1;j<size-1;j++)for(let i=1;i<size-1;i++){const k=j*size+i,avg=(h[k-1]+h[k+1]+h[k-size]+h[k+size])*.25;let speed=(v[k]+(avg-h[k])*.9)*.9955;const edge=Math.min(i,j,size-i-1,size-j-1);if(edge<4)speed*=.90+edge*.025;v[k]=speed;next[k]=(h[k]+speed)*.9985;}
   h.set(next);changed=true;}
  if(changed)pack();return changed;}
 pack();return{texture,drop,update,get version(){return version;},get energy(){return h.reduce((s,q)=>s+q*q,0);},dispose(){texture.dispose();}};
}
