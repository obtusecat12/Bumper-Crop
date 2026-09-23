import * as T from './vendor/three.module.min.js';
import {LensDropletPhysics,WaterEntryTracker,CameraWaterTracker} from './lens-physics.js?v=28';
export {LensDropletPhysics,WaterEntryTracker,CameraWaterTracker};
// V28: simulation + cached data texture only. All screen optics live in the
// single half-resolution water-pipeline shader; no capture/blur ping-pong here.
export function createLensWater(renderer,{limit=64}={}){
 const physics=new LensDropletPhysics(limit),entry=new WaterEntryTracker(),cameraEntry=new CameraWaterTracker();
 let texture=null,normals=null,width=0,height=0,uploaded=-1,enabled=true,disposed=false;
 const diagnostics={normalUploads:0,wetPasses:0,copies:0};
 function reset(){physics.clear();entry.reset();cameraEntry.reset();uploaded=-1;}
 function update(dt,state){if(disposed)return 0;enabled=state.enabled!==false;if(!enabled){physics.accumulator=physics.rainBudget=0;return 0;}
  physics.setAspect(state.aspect||physics.aspect);const crossed=state.waterCrossing||cameraEntry.update(state);cameraEntry.wet=crossed.submerged;physics.setCameraWet(crossed.submerged,crossed.crossing);
  const burst=entry.update(state);if(burst>.2&&!crossed.submerged)physics.splash(burst);
  else if(burst>0&&!crossed.submerged)for(let i=0;i<2;i++)physics.add(.24+physics.rng()*.52,.60+physics.rng()*.27,.70+physics.rng()*.7,0,-.055);
  physics.step(dt,state);return burst;
 }
 function prepareField(){
  if(!texture||width!==physics.fieldWidth||height!==physics.fieldHeight){texture?.dispose();width=physics.fieldWidth;height=physics.fieldHeight;normals=new Uint8Array(width*height*4);
   for(let i=0;i<normals.length;i+=4){normals[i]=normals[i+1]=128;}
   texture=new T.DataTexture(normals,width,height,T.RGBAFormat,T.UnsignedByteType);texture.colorSpace=T.NoColorSpace;texture.minFilter=texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.flipY=false;texture.needsUpdate=true;uploaded=-1;}
  if(physics.wet&&uploaded!==physics.version){physics.buildTexture(false);const src=physics.pixels,w=width,h=height,gx=.5*w/physics.aspect*.0135/31.75,gy=.5*h*.0135/31.75;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;
    const dx=-(src[(y*w+Math.min(w-1,x+1))*4]-src[(y*w+Math.max(0,x-1))*4])*gx;
    const dy=-(src[(Math.max(0,y-1)*w+x)*4]-src[(Math.min(h-1,y+1)*w+x)*4])*gy;
    const inv=1/Math.sqrt(1+dx*dx+dy*dy);normals[i]=Math.round(128+dx*inv*127);normals[i+1]=Math.round(128+dy*inv*127);normals[i+2]=src[i+2];normals[i+3]=src[i+1];
   }texture.needsUpdate=true;uploaded=physics.version;diagnostics.normalUploads++;
  }return texture;
 }
 function contextLost(){texture?.dispose();texture=null;width=height=0;uploaded=-1;reset();}
 return {physics,entry,cameraEntry,diagnostics,update,prepareField,reset,contextLost,dispose(){if(disposed)return;disposed=true;texture?.dispose();physics.clear();}};
}
