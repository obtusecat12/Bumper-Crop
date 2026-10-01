import * as T from './vendor/three.module.min.js';
import {createLensMicrobubbles} from './lens-microbubbles.js?v=60';
import {LensDropletPhysics,WaterEntryTracker,CameraWaterTracker} from './lens-physics.js?v=63';
export {LensDropletPhysics,WaterEntryTracker,CameraWaterTracker};
// V28: simulation + cached data texture only. All screen optics live in the
// shared water-pipeline shader; no capture/blur ping-pong here.
export function createLensWater(renderer,{limit=64,rng=Math.random}={}){
 const microbubbles=createLensMicrobubbles(rng);
 const physics=new LensDropletPhysics(limit,rng),entry=new WaterEntryTracker(),cameraEntry=new CameraWaterTracker();
 const flatNormalWord=new Uint32Array(new Uint8Array([128,128,0,0]).buffer)[0];
 let texture=null,normals=null,normalWords=null,width=0,height=0,uploaded=-1,enabled=true,disposed=false,drainAge=99,washAge=99,submerged=false,raining=false;
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
 function spray(power=1){if(disposed||submerged)return;for(let i=0;i<4;i++){const x=.08+physics.rng()*.84,y=.05+physics.rng()*.80;const d=physics.add(x,y,1.5+physics.rng()*2.8*power,(physics.rng()-.5)*.05,.05+physics.rng()*.15);if(d){d.tailX=x;d.tailY=y-.02;}}drainAge=0;}
 function exitFilm(){runoff();drainAge=washAge=0;}
 // Reuse the lake crossing sheet, rupture, retained heads and conserved trails.
 // A spray contact wets the lens, then drains; it does not immerse the body.
 function showerContact(){if(disposed||submerged)return;physics.setCameraWet(true,1);physics.setCameraWet(false,-1);exitFilm();}
 function update(dt,state){if(disposed)return 0;enabled=state.enabled!==false;if(!enabled){physics.accumulator=physics.rainBudget=0;return 0;}
  const step=Math.max(0,Math.min(dt,.1));drainAge+=step;washAge+=step;
  physics.setAspect(state.aspect||physics.aspect);const crossed=state.waterCrossing||cameraEntry.update(state);cameraEntry.wet=crossed.submerged;submerged=crossed.submerged;
  physics.setCameraWet(submerged,crossed.crossing);
  // Body/stride crossings do not wet the lens. Only exit, a real spray contact,
  // or ongoing exposed rain can activate optical droplets.
  raining=state.rain>.005&&!state.sheltered&&!submerged;
  if(crossed.crossing===1){washAge=0;microbubbles.emit(state.aspect||4/3);}
  if(crossed.crossing===-1){exitFilm();}
  microbubbles.update(step,submerged,state.aspect||4/3);
  if(raining)drainAge=0;
  physics.step(dt,state);
  if(!raining&&!submerged&&drainAge>=7.5&&physics.wet){physics.clear();uploaded=-1;}
  return 0;
 }
 function fade(){const t=Math.max(0,Math.min(1,(drainAge-5.0)/2.5));return 1-t*t*(3-2*t);}
 function prepareField(){
  const opticalWidth=physics.aspect>=1?1024:Math.max(256,Math.round(1024*physics.aspect));
  const opticalHeight=physics.aspect>=1?Math.max(256,Math.round(1024/physics.aspect)):1024;
  if(!texture||width!==opticalWidth||height!==opticalHeight){texture?.dispose();width=opticalWidth;height=opticalHeight;normals=new Uint8Array(width*height*4);
   normalWords=new Uint32Array(normals.buffer);normalWords.fill(flatNormalWord);
   texture=new T.DataTexture(normals,width,height,T.RGBAFormat,T.UnsignedByteType);texture.colorSpace=T.NoColorSpace;texture.minFilter=texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.flipY=false;texture.needsUpdate=true;uploaded=-1;}
  if(physics.wet&&uploaded!==physics.version){const field=physics.buildOpticalField(width,height),H=field.heightField,C=field.coverageField,w=width,h=height,gx=.5*w/physics.aspect*.0135,gy=.5*h*.0135;normalWords.fill(flatNormalWord);
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const index=y*w+x,i=index*4;
    if(C[index]<=0)continue;
    const dx=-(H[y*w+Math.min(w-1,x+1)]-H[y*w+Math.max(0,x-1)])*gx;
    const dy=-(H[Math.max(0,y-1)*w+x]-H[Math.min(h-1,y+1)*w+x])*gy;
    const inv=1/Math.sqrt(1+dx*dx+dy*dy);normals[i]=Math.round(128+dx*inv*127);normals[i+1]=Math.round(128+dy*inv*127);normals[i+2]=Math.round(Math.min(1,Math.abs(H[index])/3)*255);normals[i+3]=Math.round(Math.max(0,Math.min(1,C[index]))*255);
   }texture.needsUpdate=true;uploaded=physics.version;diagnostics.normalUploads++;
  }return texture;
 }
 function contextLost(){texture?.dispose();texture=null;width=height=0;uploaded=-1;reset();}
 return {microbubbles,physics,entry,cameraEntry,diagnostics,update,impact,spray,showerContact,prepareField,reset,contextLost,get washAge(){return washAge;},get washWeight(){return submerged?Math.max(0,1-washAge/.38):Math.max(0,1-washAge/2.4);},get submerged(){return submerged;},get wetWeight(){return physics.wet&&!submerged?fade():0;},dispose(){if(disposed)return;disposed=true;texture?.dispose();microbubbles.dispose();physics.clear();}};
}
