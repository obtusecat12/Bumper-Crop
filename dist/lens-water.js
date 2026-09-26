import * as T from './vendor/three.module.min.js';
import {createLensMicrobubbles} from './lens-microbubbles.js?v=50';
import {LensDropletPhysics,WaterEntryTracker,CameraWaterTracker} from './lens-physics.js?v=50';
export {LensDropletPhysics,WaterEntryTracker,CameraWaterTracker};
// V28: simulation + cached data texture only. All screen optics live in the
// single half-resolution water-pipeline shader; no capture/blur ping-pong here.
export function createLensWater(renderer,{limit=64,rng=Math.random}={}){
 const microbubbles=createLensMicrobubbles(rng);
 const physics=new LensDropletPhysics(limit,rng),entry=new WaterEntryTracker(),cameraEntry=new CameraWaterTracker();
 let texture=null,normals=null,width=0,height=0,uploaded=-1,enabled=true,disposed=false,drainAge=99,washAge=99,submerged=false,raining=false;
 const diagnostics={normalUploads:0,wetPasses:0,copies:0};
 function reset(){microbubbles.reset();physics.clear();entry.reset();cameraEntry.reset();uploaded=-1;drainAge=washAge=99;submerged=raining=false;}
 function runoff(power=1){
  // An exiting lens carries a sheet of water: broad heads and connected trails,
  // with conserved volume in the existing stick-slip/coalescence simulation.
  for(let i=0;i<12;i++){
   const x=.04+physics.rng()*.92,y=.07+physics.rng()*.58,r=2.7+physics.rng()*1.9;
   const d=physics.add(x,y,r,(physics.rng()-.5)*.10,.10+physics.rng()*.16);
   if(d){d.tailX=x+(physics.rng()-.5)*.025;d.tailY=Math.max(-.02,y-.14-physics.rng()*.16);}
  }
 }
 function impact(power=1){if(disposed||submerged)return;runoff(power);drainAge=0;washAge=0;}
 function update(dt,state){if(disposed)return 0;enabled=state.enabled!==false;if(!enabled){physics.accumulator=physics.rainBudget=0;return 0;}
  const step=Math.max(0,Math.min(dt,.1));drainAge+=step;washAge+=step;
  physics.setAspect(state.aspect||physics.aspect);const crossed=state.waterCrossing||cameraEntry.update(state);cameraEntry.wet=crossed.submerged;submerged=crossed.submerged;
  physics.setCameraWet(submerged,crossed.crossing);
  // Body/stride crossings do not wet the lens. Only exit, a real spray contact,
  // or ongoing exposed rain can activate optical droplets.
  raining=state.rain>.005&&!state.sheltered&&!submerged;
  if(crossed.crossing===1){washAge=0;microbubbles.emit(state.aspect||4/3);}
  if(crossed.crossing===-1){runoff();drainAge=washAge=0;}
  microbubbles.update(step,submerged,state.aspect||4/3);
  if(raining)drainAge=0;
  physics.step(dt,state);
  if(!raining&&!submerged&&drainAge>=7.5&&physics.wet){physics.clear();uploaded=-1;}
  return 0;
 }
 function fade(){const t=Math.max(0,Math.min(1,(drainAge-5.0)/2.5));return 1-t*t*(3-2*t);}
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
 return {microbubbles,physics,entry,cameraEntry,diagnostics,update,impact,prepareField,reset,contextLost,get washAge(){return washAge;},get washWeight(){return submerged?Math.max(0,1-washAge/.38):Math.max(0,1-washAge/2.4);},get submerged(){return submerged;},get wetWeight(){return physics.wet&&!submerged?fade():0;},dispose(){if(disposed)return;disposed=true;texture?.dispose();microbubbles.dispose();physics.clear();}};
}
