// Metres. One authoritative inner profile feeds both optical ray containment
// and the once-baked volume tables used by the single inspected container.
export const ALMOND_PROFILES={
 glass:{index:0,bottom:.014,top:.250,fill:.199,wall:.0025,emboss:[.136,.159],inner:[[.02656,.014],[.02656,.155],[.01162,.190],[.008715,.218],[.008715,.250]]},
 ramune:{index:1,bottom:.012,top:.228,fill:.186,wall:.0023,emboss:[.095,.112],inner:[[.0238,.012],[.0252,.027],[.0248,.093],[.022,.109],[.015,.125],[.0078,.141],[.0095,.148],[.0159,.160],[.0171,.175],[.0156,.188],[.0105,.205],[.011,.228]]},
 cola:{index:2,bottom:.012,top:.248,fill:.207,wall:.0025,emboss:[.130,.147],inner:[[.0245,.012],[.0285,.031],[.027,.052],[.025,.069],[.0225,.093],[.023,.112],[.0256,.132],[.028,.150],[.025,.173],[.016,.194],[.0095,.216],[.010,.248]]},
 reagent:{index:3,bottom:.012,top:.180,fill:.143,wall:.0032,emboss:[.119,.135],inner:[[.031,.012],[.0348,.023],[.0355,.113],[.033,.129],[.026,.141],[.015,.154],[.015,.180]]}
};
export function almondProfile(kind){return ALMOND_PROFILES[kind]||ALMOND_PROFILES.glass;}
export function profileRadius(y,kind='glass'){
 const p=almondProfile(kind).inner;if(y<=p[0][1])return p[0][0];
 for(let i=1;i<p.length;i++)if(y<p[i][1]){const a=p[i-1],b=p[i],t=(y-a[1])/(b[1]-a[1]);return a[0]+(b[0]-a[0])*t;}
 return p[p.length-1][0];
}
export function liquidVolume(h,slope=0,kind='glass'){
 const p=almondProfile(kind),dy=(p.top-p.bottom)/320;let volume=0;
 for(let i=0;i<320;i++){const y=p.bottom+(i+.5)*dy,r=profileRadius(y,kind),s=slope>.00001?Math.max(-1,Math.min(1,(h-y)/(slope*r))):h>=y?1:-1;
  volume+=Math.PI*r*r*(.5+(Math.asin(s)+s*Math.sqrt(Math.max(0,1-s*s)))/Math.PI)*dy;
 }return volume;
}
const gl=n=>Number(n).toFixed(7);
export const almondProfileGLSL='float innerRadius(float y){\n'+Object.values(ALMOND_PROFILES).map((p,index)=>
 (index<3?'if(bottleProfile<'+gl(index+.5)+'){':'{')+
 'if(y<'+gl(p.inner[0][1])+')return '+gl(p.inner[0][0])+';'+
 p.inner.slice(1).map((b,i)=>{const a=p.inner[i];return 'if(y<'+gl(b[1])+')return mix('+gl(a[0])+','+gl(b[0])+',clamp((y-'+gl(a[1])+')/'+gl(b[1]-a[1])+',0.,1.));';}).join('')+
 'return '+gl(p.inner.at(-1)[0])+';}').join('\n')+'\n}';
