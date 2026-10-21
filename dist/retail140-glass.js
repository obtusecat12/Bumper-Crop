// V140 P2: cooler / freezer / beer-cave door glass = MeshPhysicalMaterial (transmission 1, IOR 1.5).
// Maps from bc/tools/retail140_p2_glass.py (assets/l11-v140/glass140*.webp, atlas 4 door variants x 3 kinds):
//  roughnessMap G = condensation (white fogged, black wiped / drop trails) and transmissionMap R (frost blocks light),
//  normalMap = run-down drop domes + frost crystal grain, map = tint (cold white frost), emissiveMap = frost / fog glow
//  (the doors are not in the store light bake). envMap = equirect store interior (troffer rows, shelf bands, floor),
//  PMREM-filtered by three.js -> moving highlight streaks. Material keys start r138g140 (retail138-bake skips their
//  light patch + occluder raster). ?glass140=0 -> old flat translucent glass.
import * as T from './vendor/three.module.min.js';
export const GLASS140=!(typeof location!=='undefined'&&/[?&]glass140=0\b/.test(location.search));
const A=new URL('./assets/l11-v140/',import.meta.url).href,V='140e';
function tex(n,srgb){const t=new T.TextureLoader().load(A+n+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
let maps=null;
export function addGlass140(m){
 if(!GLASS140||m.r138g140c)return m;
 if(!maps){const env=tex('glass140_env',true);env.mapping=T.EquirectangularReflectionMapping;
  maps={c:tex('glass140',true),r:tex('glass140_r'),n:tex('glass140_n'),e:tex('glass140_e',true),env};}
 const mk=(o={})=>new T.MeshPhysicalMaterial({color:0xffffff,map:maps.c,transmission:1,transmissionMap:maps.r,ior:1.5,thickness:.008,
  roughness:1,roughnessMap:maps.r,metalness:0,normalMap:maps.n,normalScale:new T.Vector2(o.ns??.55,o.ns??.55),envMap:maps.env,envMapIntensity:o.env??2.2,
  specularIntensity:1,emissive:o.e??0x8ea6b2,emissiveMap:maps.e,emissiveIntensity:o.ei??.35,
  attenuationColor:new T.Color(o.att??0xdfeff4),attenuationDistance:.3,
  ...(o.sheen?{sheen:o.sheen,sheenColor:new T.Color(0xcfe6ff),sheenRoughness:.6}:{}),side:T.FrontSide,vertexColors:true});
 m.r138g140c=mk();                                         // reach-in cooler
 m.r138g140f=mk({sheen:.6,e:0xc4d8e6,ei:.9,att:0xcfe4ff}); // freezer: frost glints (sheen ~ crystal SSS shimmer)
 m.r138g140b=mk({env:2.6,ei:.25,ns:.28});                         // beer cave heated glass
 return m;
}
/** door glass pane facing +z, centred at x,y,z; kind 0 cooler / 1 freezer / 2 beer cave, variant 0..3 (no mirroring: it would flip the normal map). */
export function glassPane140(b,kind,variant,x,y,z,w,h){
 const key=['r138g140c','r138g140f','r138g140b'][kind],c=variant&3,g=new T.PlaneGeometry(w,h),uv=g.attributes.uv,e=.5/1024;
 const u0=c/4+e,u1=(c+1)/4-e,v0=1-(kind+1)/3+e,v1=1-kind/3-e;
 for(let i=0;i<uv.count;i++){uv.setXY(i,u0+(u1-u0)*uv.getX(i),v0+(v1-v0)*uv.getY(i));}
 b.add(g,key,x,y,z);g.dispose();
}
