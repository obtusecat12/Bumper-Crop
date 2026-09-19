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
export function createGroundRayAlbedo({landmarkTextures,barnHarvest,ruralTextures,periodOrigin,meadowEnvironment,farmRoadWeight,farmFootprintDistance,buildingSize,buildingLocal,pondMetrics}){
 const soil=linearTextureMean(ruralTextures.soil),path=linearTextureMean(ruralTextures.path),turf=linearTextureMean(ruralTextures.turf);
 const stubble=landmarkTextures?linearTextureMean(landmarkTextures.stubble):soil;
 const env={};
 function lanes(f,x,z){
  const info=[10000,0,0,0],roadWeight=farmRoadWeight(x,z,f);
  function add(d,t,weight){if(weight<=0)return;info[0]=Math.min(info[0],d+(1-weight)*2.6);if(d>2.65)return;
   const phase=t*.0981747704,offset=.77+.020*Math.sin(phase*5)+.012*Math.sin(phase*11),width=.235+.022*Math.sin(phase*3)+.012*Math.sin(phase*7);
   const wheel=(1-smooth(width*.42,width+.075,Math.abs(d-offset)))*weight;info[1]=Math.max(info[1],wheel);
   const cover=(1-smooth(.86,1.80,d))*weight;if(cover>info[2]){info[3]=info[2];info[2]=cover}else info[3]=Math.max(info[3],cover);
  }
  for(let i=0;i<f.roads.length;i++){const l=f.roads[i];if(!l.enabled)continue;const t=i<2?z:x,c=l.edge+l.amplitude*Math.sin(t*.0490873852)+l.harmonic*Math.sin(t*.0981747704);add(Math.abs((i<2?x:z)-c),t,roadWeight)}
  if(f.driveway){const d=f.driveway,ax=x-d.x1,az=z-d.z1,vx=d.x2-d.x1,vz=d.z2-d.z1,len=Math.max(Math.hypot(vx,vz),.01),t=(ax*vx+az*vz)/len,across=Math.abs(ax*vz-az*vx)/len;
   const corridor=smooth(-4.6,-2.2,t)*(1-smooth(len-.04,len+.72,t)),boundary=smooth(0,.24,Math.min(x,z,64-x,64-z));info[0]=Math.min(info[0],across+(1-corridor)*3.8);add(across,t,corridor*boundary*smooth(-1.6,3.4,t));
  }return [info[0],info[1],info[3]];
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
  const field=soil.map((c,i)=>c*[.86,.80,.74][i]*(.91+broad*.14+(soilPatch-.5)*.08));
  blend(grass,field,smooth(1.42,2.32,rd+(soilPatch-.5)*.63),out);
  if(f.meadow){const m=meadow||meadowEnvironment(x,z,f.meadow,env),mg=grass.map((c,i)=>mix(c*[1.05,.96,.83][i],c*[.88,1.06,.91][i],m.moisture));scale(mg,.91+m.patchDensity*.15);
   const litter=smooth(.32,.70,1-m.patchDensity)*(.20+clods*.35);blend(mg,soil.map((c,i)=>c*[.80,.73,.57][i]),litter);blend(out,mg,smooth(.06,.76,m.cover));
  }
  // Keep lane crossing and broad wheel coverage; the sub-metre scuff mask is
  // sampled at the triangle centre because its duty cycle is not fifty percent.
  let scuff=(1-smooth(.30,1.45,rd))*smooth(.57,.80,noise(qx*1.8,qz*1.8))*.36;scuff=Math.max(scuff,tracks[2]*(.54+soilPatch*.35));blend(out,dirt,scuff);blend(out,dirt,rut);
  if(f.type==='building'){
   const local=buildingLocal(x,z,f),size=buildingSize(f),hx=size[0]/2,hz=size[1]/2,a=Math.abs(local.x)-hx,b=Math.abs(local.z)-hz,e=Math.hypot(Math.max(a,0),Math.max(b,0))+Math.min(Math.max(a,b),0);
   const edge=(soilPatch-.5)*1.60+(broad-.5)*1.20+Math.sin(local.x*.43+local.z*.27)*.20,yard=1-smooth(.65,3.35,e+edge),yd=scale(dirt.slice(),.94+soilPatch*.08);
   const longSide=1-smooth(hz-.25,hz+.42,Math.abs(local.z)),drip=(1-smooth(.11,.48,Math.abs(Math.abs(local.x)-hx-.39)))*longSide*(.16+.16*smooth(.28,.72,clods));scale(yd,1-drip);
   const dry=smooth(.50,.82,soilPatch)*(1-smooth(.15,2.45,e));for(let i=0;i<3;i++)yd[i]+=dry*[.014,.012,.008][i];blend(out,yd,yard);
  }
  if(f.type==='pond'){
   const outside=Array.from(out),m=pondMetrics(x,z,f),silt=blend([.105,.099,.077],[.205,.199,.157],soilTone),loam=blend([.34,.313,.228],[.47,.433,.321],soilTone),drygrass=blend([.12,.141,.067],[.245,.252,.134],.26+broad*.44+soilPatch*.18);
   blend(silt,loam,smooth(-.22,.55,m.metres),out);blend(out,drygrass,smooth(.11,.40,m.bank));blend(out,outside,smooth(.65,1.12,m.bank));
  }
  if(f.farm){const e=farmFootprintDistance(x,z,f),edge=(soilPatch-.5)*1.7+(broad-.5)*1.1,yard=1-smooth(.35,3.4,e+edge);blend(out,scale(dirt.slice(),.94+soilPatch*.08),yard)}
  if(f.barn&&barnHarvest){const x0=x+f.barn.x,z0=z+f.barn.z,footprint=Math.max(Math.abs(x0)-12,Math.abs(z0)-5.8),threshold=(1-smooth(0,2.5,Math.abs(x0-3.1)))*(1-smooth(6,13,z0)),rows=.93+.07*Math.sin(z0*2.45+Math.sin(x0*.05)*.4),cut=stubble.map(c=>c*1.1*rows);blend(cut,dirt,Math.max(1-smooth(0,1,footprint),threshold)*.8);blend(out,cut,barnHarvest(x,z,f)*smooth(1.65,2.65,rd));}
  for(let i=0;i<3;i++)out[i]=clamp(out[i],.005,.9);return out;
 }
 sample.means={soil,path,turf};return sample;
}
