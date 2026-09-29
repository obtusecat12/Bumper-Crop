import {shoreGrassCover} from './world.js?v=57';
import {pondHabitat} from './lake-shape.js?v=57';
/* Low-frequency CPU counterpart of ground.js's material, for diffuse rays.
 * Use initialized texture means in linear RGB. Spatial masks, macro noise,
 * meadow mix, yards, and shore colors follow the actual visible shader.
 * Sub-centimetre grain and derivative normal detail average away in irradiance.
 */
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const fract=x=>x-Math.floor(x),mod=(x,n)=>(x%n+n)%n;
const blend=(a,b,t,out=a)=>{for(let i=0;i<3;i++)out[i]=mix(a[i],b[i],t);return out};
const scale=(a,s,out=a)=>{for(let i=0;i<3;i++)out[i]=a[i]*s;return out};
function hash(x,z){
 x=mod(x,2048);z=mod(z,2048);let a=fract(x*.1031),b=fract(z*.1031),c=a;
 const d=a*(b+33.33)+b*(c+33.33)+c*(a+33.33);a+=d;b+=d;c+=d;return fract((a+b)*c);
}
function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=fract(x),fz=fract(z),u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);return mix(mix(hash(ix,iz),hash(ix+1,iz),u),mix(hash(ix,iz+1),hash(ix+1,iz+1),u),v)}
const meanCache=new WeakMap();
export function linearTextureMean(texture){
 const im=texture.image,old=meanCache.get(texture);if(old?.image===im)return old.color;
 if(!im?.data)return [.15,.12,.08];
 const sRGB=texture.colorSpace==='srgb',linear=x=>sRGB?(x<=.04045?x/12.92:((x+.055)/1.055)**2.4):x;
 const color=[0,0,0],step=Math.max(1,Math.floor(Math.sqrt(im.width*im.height/4096)));let weight=0;
 for(let y=0;y<im.height;y+=step)for(let x=0;x<im.width;x+=step){const i=(y*im.width+x)*4,w=im.data[i+3]/255;for(let c=0;c<3;c++)color[c]+=linear(im.data[i+c]/255)*w;weight+=w}
 for(let c=0;c<3;c++)color[c]/=Math.max(weight,1e-9);meanCache.set(texture,{image:im,color});return color;
}

// Dependency injection avoids importing duplicate ?v=... module identities.
// Return fn(f, localX, localZ, outRGB?, meadowAtTriangleCenter?). The optional
// meadow value uses {cover,moisture,patchDensity}; pass barycentric-average
// meadowData for an exact match to the mesh's vertex interpolation when handy.
export function createGroundRayAlbedo({ruralTextures,periodOrigin,meadowEnvironment,farmRoadWeight,farmFootprintDistance,buildingSize,buildingLocal,pondMetrics,roadProfile,cropSample}){
 const soil=linearTextureMean(ruralTextures.soil),path=linearTextureMean(ruralTextures.path),turf=linearTextureMean(ruralTextures.turf);
 const shoreRock=linearTextureMean(ruralTextures.shoreRock),shoreSilt=linearTextureMean(ruralTextures.shoreSilt);
 const env={};
 function lanes(f,x,z){
  const p=roadProfile(x,z,f,{});return [p.distance,p.rut,p.junction];
 }
 function sample(f,x,z,out=new Float32Array(3),meadow=null){
  const gx=x+periodOrigin(f.x),gz=z+periodOrigin(f.z),qx=x+mod(periodOrigin(f.x),2048),qz=z+mod(periodOrigin(f.z),2048);
  const broad=noise(gx*.125,gz*.125),soilPatch=noise(gx*.5,gz*.5);
  // .2 m clods and tiny grain average to their mean over the probe footprint.
  const clods=.5,materialDetail=.30,tracks=lanes(f,x,z),rd=tracks[0],rut=smooth(.015,.97,tracks[1]);
  const soilTone=clamp(.43+broad*.22+(soilPatch-.5)*.26),dirt=blend([.114,.094,.065],[.237,.205,.147],soilTone),grass=blend([.082,.111,.041],[.166,.191,.079],.22+broad*.44+soilPatch*.26);
  scale(grass,.92+clods*.12);
  blend(dirt,scale(blend(soil.slice(),path,rut),.92+soilPatch*.16),.72*materialDetail);
  scale(grass,mix(1,clamp(.60+(turf[0]*.2126+turf[1]*.7152+turf[2]*.0722)*3,.65,1.38),materialDetail));blend(grass,turf,.22*materialDetail);
  let field=soil.map((c,i)=>c*[.86,.80,.74][i]*(.91+broad*.14+(soilPatch-.5)*.08));
  if(cropSample(x,z,f,{}).crop===2)field=soil.map((c,i)=>c*[.84,.77,.65][i]*(.84+soilPatch*.15));
  blend(grass,field,smooth(1.42,2.32,rd+(soilPatch-.5)*.63),out);
  if(f.meadow){const m=meadow||meadowEnvironment(x,z,f.meadow,env),mg=grass.map((c,i)=>mix(c*[1.05,.96,.83][i],c*[.88,1.06,.91][i],m.moisture));scale(mg,.91+m.patchDensity*.15);
   const litter=smooth(.32,.70,1-m.patchDensity)*(.20+clods*.35);blend(mg,soil.map((c,i)=>c*[.80,.73,.57][i]),litter);blend(out,mg,smooth(.06,.76,m.cover));
  }
  blend(out,grass.map((c,i)=>c*[.94,1.035,.96][i]),smooth(.04,.75,shoreGrassCover(x,z,f)));
  // Keep lane crossing and broad wheel coverage; the sub-metre scuff mask is
  // sampled at the triangle centre because its duty cycle is not fifty percent.
  let scuff=(1-smooth(.30,1.45,rd))*smooth(.57,.80,noise(qx*1.8,qz*1.8))*.36;scuff=Math.max(scuff,tracks[2]*(.54+soilPatch*.35));blend(out,dirt,scuff);blend(out,dirt,rut);
  blend(out,dirt.map((c,i)=>c*[.57,.56,.50][i]),(roadProfile(x,z,f,{}).mud||0)*(.75+soilPatch*.25));
  blend(out,dirt.map((c,i)=>c*[.76,.72,.66][i]),(roadProfile(x,z,f,{}).yard||0)*(.90+soilPatch*.10));
  if(f.type==='building'){
   const local=buildingLocal(x,z,f),size=buildingSize(f),hx=size[0]/2,hz=size[1]/2,a=Math.abs(local.x)-hx,b=Math.abs(local.z)-hz,e=Math.hypot(Math.max(a,0),Math.max(b,0))+Math.min(Math.max(a,b),0);
   const edge=(soilPatch-.5)*1.60+(broad-.5)*1.20+Math.sin(local.x*.43+local.z*.27)*.20,yard=1-smooth(.65,3.35,e+edge),yd=scale(dirt.slice(),.94+soilPatch*.08);
   const longSide=1-smooth(hz-.25,hz+.42,Math.abs(local.z)),drip=(1-smooth(.11,.48,Math.abs(Math.abs(local.x)-hx-.39)))*longSide*(.16+.16*smooth(.28,.72,clods));scale(yd,1-drip);
   const dry=smooth(.50,.82,soilPatch)*(1-smooth(.15,2.45,e));for(let i=0;i<3;i++)yd[i]+=dry*[.014,.012,.008][i];blend(out,yd,yard);
  }
  if(f.type==='pond'){
   const m=pondHabitat(x,z,f),gate=1-smooth(12,25,Math.max(0,m.metres));
   const sediment=shoreSilt.map(v=>v*(.83+soilPatch*.20)*(m.metres<0?.80:1)),rock=shoreRock.map(v=>v*(.82+soilPatch*.16));
   if(m.metres<0)blend(out,sediment,1);blend(out,sediment,m.beach*.94);
   blend(out,blend(sediment.slice(),turf,.60),m.wetland*.60);
   blend(out,rock,clamp(m.rock*.80+smooth(.23,.85,m.slope)*gate)*gate);

  }
  if(f.farm){const e=farmFootprintDistance(x,z,f),edge=(soilPatch-.5)*1.7+(broad-.5)*1.1,yard=1-smooth(.35,3.4,e+edge);blend(out,scale(dirt.slice(),.94+soilPatch*.08),yard)}
  for(let i=0;i<3;i++)out[i]=clamp(out[i],.005,.9);return out;
 }
 sample.means={soil,path,turf};return sample;
}
