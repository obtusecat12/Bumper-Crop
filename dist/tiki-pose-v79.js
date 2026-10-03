// One metre-scale authority for body targets, held props and points of contact.
// These targets are baked once into AnimationMixer clips. No IK runs in the RAF.
import {Vector3,Euler,Quaternion} from './vendor/three.module.min.js';
const V=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function pulse(t,a,b,c,d){return t<a||t>d?0:t<b?smooth((t-a)/(b-a)):t<c?1:1-smooth((t-c)/(d-c));}
const palmToWrist=(p,e)=>new Vector3(0,.047,-.011).applyEuler(new Euler(...e)).add(new Vector3(...p)).toArray();
export function posePlan79(role,time,{seatHeight=.545,groundHeight=0}={}){
 return plan(role,((time%({bartender:18,elder:14}[role]??12))+({bartender:18,elder:14}[role]??12))%({bartender:18,elder:14}[role]??12),seatHeight,groundHeight);
}
function plan(role,t,seat,ground){
 const wave=Math.sin(t*Math.PI/3),seated=['sleeper','barwoman','orderer','elder','asianwoman'].includes(role);
 const p={hips:[wave*.002,seated?seat+.115:.96,0],pelvis:wave*.002,lean:.025,head:[.06,Math.sin(t*.31)*.017,0],feet:{L:[.13,.075+ground,seated?.43:0],R:[-.13,.075+ground,seated?.43:.035]},hands:{},orient:{L:[0,0,0],R:[0,0,0]},props:{}};
 const palms=(l,r,le,re)=>{p.orient={L:le,R:re};p.hands.L=palmToWrist(l,le);p.hands.R=palmToWrist(r,re);};
 if(role==='bartender'){
  const pour=pulse(t,2.4,4.0,7.1,8.5),setDown=pulse(t,8.5,9.5,16.5,17.5),reach=pulse(t,9.5,10.7,15.7,16.5),lift=pulse(t,10.7,11.7,14.6,15.7),shake=pulse(t,11.7,12.1,14.2,14.6),osc=Math.sin(t*2*Math.PI*2.15)*shake;
  p.lean=.08+.40*pour;p.head=[.10-.10*pour,-.045+.07*shake,0];
  const bottle={p:V(V([-.23,1.30,.29],[-.09,1.52,.67],pour),[-.23,1.14/1.035+.14,.41],setDown),r:[(.14+1.85*pour)*(1-setDown),0,.10*(1-pour)*(1-setDown)],visible:true};
  const shaker={p:V([.14,1.14/1.035+.15,.43],[osc*.033,1.37+osc*.018,.27+osc*.038],lift),r:[0,0,(Math.PI/2-.23+osc*.055)*lift],visible:true};
  const q=new Quaternion().setFromEuler(new Euler(...bottle.r));
  bottle.tip=new Vector3(0,.235,0).applyQuaternion(q).add(new Vector3(...bottle.p)).toArray();
  const sr=new Quaternion().setFromEuler(new Euler(...shaker.r));
  const rightShake=new Vector3(0,.092,0).applyQuaternion(sr).add(new Vector3(...shaker.p)).toArray(),leftShake=new Vector3(0,-.087,0).applyQuaternion(sr).add(new Vector3(...shaker.p)).toArray();
  const right=V(bottle.p,rightShake,reach),left=V([.21,1.14/1.035+.05,.41],leftShake,reach);
  palms(left,right,V([-Math.PI/2,0,0],[0,0,-Math.PI/2],reach),[bottle.r[0]*(1-reach),0,Math.PI/2]);
  p.props={bottle,shaker,pour:pour>.985&&t>4.15&&t<6.95,glass:[-.09,1.14/1.035,.884]};
 }else if(role==='sleeper'){
  p.hips[0]=0;p.pelvis=0;p.lean=1.28;p.head=[.22,0,.12];p.feet={L:[.16,.305,.15],R:[-.16,.305,.16]};
  palms([-.06,1.17,.62],[.16,1.17,.54],[-Math.PI/2,0,-.25],[-Math.PI/2,0,.55]);
 }else if(role==='barwoman'){
  p.feet={L:[.09,.305,.32],R:[-.13,.305,.30]};p.lean=.06;p.head=[.07,Math.sin(t*.35)*.033-.09,.02];
  palms([.20,1.14/.94+.014,.56],[-.19,seat+.21,.29],[-Math.PI/2,0,.15],[-Math.PI/2,0,-.2]);
 }else if(role==='waiter'){
  p.hips[0]=-.012+wave*.003;p.lean=.055;p.head=[.27,Math.sin(t*.3)*.025,-.02];p.feet={L:[.12,.075,.04],R:[-.11,.075,-.04]};
  const pad=[.035,1.19,.31],pen=[-.025+.015*Math.sin(t*3.4),1.198,.31+.017*Math.sin(t*1.9)];
  palms([.13,1.177,.28],[pen[0]-.016,pen[1]+.059,pen[2]-.020],[Math.PI/2,0,-.4],[0,0,Math.PI/2]);
  p.props={pad,pen};
 }else if(role==='orderer'){
  p.lean=.12;p.head=[.25,-.08+Math.sin(t*.3)*.025,0];
  const pointing=[-.11+.065*Math.sin(t*.48),.852,.53+.056*Math.sin(t*.8)];
  palms([.21,.821,.36],[pointing[0],.840,pointing[2]-.073],[-Math.PI/2,0,0],[-1.05,0,0]);p.props={pointing};
 }else if(role==='elder'){
  const cut=pulse(t,2,3,7,8.2),bite=pulse(t,9.2,10.4,11.8,13),stroke=Math.sin(t*3.3)*.021*cut;
  p.lean=.13;p.head=[.16-.09*bite,Math.sin(t*.21)*.025,.02];
  const knife=[-.055,.902,.38+stroke],fork=V([.055,.889,.38],[.04,1.245,.30],bite);
  palms(fork,knife,[-1.24+3.44*bite,0,-.10],[-1.24,0,.10]);p.props={bite,cut,knife,fork};
 }else if(role==='asianwoman'){
  p.lean=.04;p.head=[.09,Math.sin(t*.28)*.045+.04,-.018];
  palms([.19,.886,.42],[-.20,.886,.37],[-Math.PI/2,0,-.1],[-Math.PI/2,0,.15]);
 }
 return p;
}
