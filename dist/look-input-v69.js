// Pointer events may be coalesced just before RAF. Consume once per frame;
// never replay accumulated motion after a long task, focus change or lock warp.
export class LookInput {
 constructor(now=0){this.stats={stale:0,invalid:0,warps:0,stalls:0,capped:0};this.output={x:0,y:0,mode:'camera',recovered:false};this.reset(now);}
 reset(now,{locked=false}={}){this.x=this.y=0;this.mode='camera';this.lastFrame=now;this.epoch=now;this.skipLocked=locked;this.client=null;}
 beginDrag(x,y){this.client=Number.isFinite(x)&&Number.isFinite(y)?{x,y}:null;}
 endDrag(){this.client=null;}
 eventTime(stamp,now,origin){if(!Number.isFinite(stamp)||stamp<=0)return now;return stamp>1e12?stamp-origin:stamp;}
 push(dx,dy,{now,stamp=now,origin=0,scale=1,mode='camera',locked=false}={}){
  if(!Number.isFinite(now)||!Number.isFinite(dx)||!Number.isFinite(dy)||!Number.isFinite(scale)){this.stats.invalid++;return false;}
  const at=this.eventTime(stamp,now,origin);
  if(at<this.epoch-.5||now-at>140||at-now>8||now-this.lastFrame>180){this.stats.stale++;return false;}
  if(locked&&this.skipLocked){this.skipLocked=false;this.stats.warps++;return false;}
  // A cursor warp is discontinuous; throwing it away is preferable to turning
  // it into a small but still unrequested turn. Regular high-DPI flicks survive.
  if(Math.abs(dx)>8192||Math.abs(dy)>8192){this.stats.warps++;return false;}
  if(this.mode!==mode){this.x=this.y=0;this.mode=mode;}
  const nx=this.x+dx*scale,ny=this.y+dy*scale;
  if(!Number.isFinite(nx)||!Number.isFinite(ny)){this.stats.invalid++;return false;}
  // Sum before limiting: opposite reports in the same frame must cancel.
  this.x=nx;this.y=ny;
  return dx!==0||dy!==0;
 }
 drag(x,y,options){
  if(!Number.isFinite(x)||!Number.isFinite(y)){this.client=null;this.stats.invalid++;return false;}
  const before=this.client;this.client={x,y};if(!before)return false;
  return this.push(x-before.x,y-before.y,options);
 }
 frame(now){
  const out=this.output;out.recovered=now-this.lastFrame>180;
  if(out.recovered){this.x=this.y=0;this.client=null;this.epoch=now;this.stats.stalls++;}
  const limit=this.mode==='inspection'?240:Math.PI;
  out.x=Math.max(-limit,Math.min(limit,this.x));out.y=Math.max(-limit,Math.min(limit,this.y));
  if(out.x!==this.x||out.y!==this.y)this.stats.capped++;
  out.mode=this.mode;this.x=this.y=0;this.lastFrame=now;return out;
 }
}
