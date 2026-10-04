const lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t),ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function posePlan79(role,t,{seatHeight=.24}={}){
 const sit=role==='footbath',wave=Math.sin(t*Math.PI/3),p={hips:[wave*.004,sit?seatHeight+.095:.96,sit?-.015:0],pelvis:wave*.004,lean:sit?.05:.025,head:[sit?.16:.07,Math.sin(t*.47)*.04,sit?.025:0],feet:{L:[.13,sit?-.20:.075,sit?.51:.01],R:[-.15,sit?-.18:.075,sit?.49:-.06]},hands:{L:sit?[.16,seatHeight+.19,.30]:[.285,.895,.11],R:sit?[-.16,seatHeight+.18,.30]:[-.27,.88,.075]},orient:{L:sit?[-Math.PI/2,0,-.12]:[0,0,0],R:sit?[-Math.PI/2,0,.12]:[0,0,0]},elbows:{L:[1,-.2,.1],R:[-1,-.2,.1]}};
 if(!sit){p.hips[0]=-.025+wave*.006;p.head[1]=-.12+Math.sin(t*.37)*.055;
  if(t>=12){const a=t-12,lift=ease(a/.38)*(1-ease((a-2.55)/.8)),wipe=Math.sin(Math.max(0,a-.7)*10)*.025*ease((a-.55)/.2)*(1-ease((a-2.1)/.35));
   p.lean=-.055*lift;p.head=[-.06*lift,Math.sin(a*13)*.115*lift,.035*lift];p.hands.R=lerp(p.hands.R,[-.055+wipe,1.68,.164],lift);p.orient.R=lerp([0,0,0],[.1,Math.PI,-.17],lift);p.elbows.R=[-1,.1,.15];p.hips[0]-=.018*lift;
  }
 }
 return p;
}
