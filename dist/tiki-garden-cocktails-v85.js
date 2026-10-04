import * as T from './vendor/three.module.min.js';
import {TikiKit} from './tiki-geometry-v76.js';
import {createTikiOptics} from './tiki-optics-v78.js';
import {gardenDrinkTexture85 as tx} from './tiki-garden-drinks-v85.js';
import {GARDEN_DECOR85} from './tiki-garden-dressing-v85.js';
export function createGardenCocktails85(scene,base,normal,spray){const {x,z}=GARDEN_DECOR85.table,m={wood:new T.MeshStandardMaterial({map:tx('table-basecolor'),normalMap:tx('table-normal'),roughnessMap:tx('table-roughness'),normalScale:new T.Vector2(.55,.55),roughness:.65}),metal:base.dark.clone(),white:new T.MeshStandardMaterial({color:0xeee5c9,roughness:.5}),amber:new T.MeshPhysicalMaterial({color:0xfdb32e,roughness:.16,metalness:0,ior:1.335,clearcoat:1,clearcoatRoughness:.07}),gold:new T.MeshPhysicalMaterial({color:0xf8cf52,roughness:.18,metalness:0,ior:1.335,clearcoat:.9}),pith:new T.MeshStandardMaterial({color:0xffd791,roughness:.67})};
 const optics=createTikiOptics(m,k=>k==='moai/normal'?normal:spray);
 for(const a of optics.materials){const u=a.uniforms;u.lampPos.value=[new T.Vector3(x,4.2,z),new T.Vector3(4.75,.9,1.4),new T.Vector3(0,5,5),new T.Vector3(7,5,-3),new T.Vector3(-3,5,0),new T.Vector3(0,6,-6),new T.Vector3(0,6,0),new T.Vector3(-4,6,4)];u.lampColor.value=u.lampPos.value.map((p,i)=>new T.Color(i===1?0x65dfff:0xf1e8c7).multiplyScalar(i===0?5:2));}
 m.clearGlass.fragmentShader=m.clearGlass.fragmentShader.replace('.22+silhouette*.42','.025+silhouette*.08');m.clearGlass.uniforms.thickness.value=.006;m.clearGlass.uniforms.roughness.value=.035;
 for(const n of ['orange_wheel','cherry_strawberry','mint_leaf','parasol_pink_top','parasol_lime_top'])m[n]=new T.MeshStandardMaterial({map:tx(n+'-basecolor'),alphaTest:.08,side:T.DoubleSide,roughness:n.includes('parasol')?.78:.51,metalness:0});
 const k=new TikiKit(m),h=.78;
 // Elliptical slab has a real end-grain edge, pedestal and grounded splayed feet.
 const slab=new T.CylinderGeometry(.78,.79,.064,64,1);slab.scale(1,1,.65);const uv=slab.attributes.uv,p=slab.attributes.position;for(let i=0;i<uv.count;i++)if(Math.abs(slab.attributes.normal.getY(i))>.5)uv.setXY(i,p.getX(i)/1.6+.5,p.getZ(i)/1.04+.5);k.add(slab,'wood',x,h-.032,z);k.cyl('metal',x,.355,z,.044,.056,.71,16);k.cyl('metal',x,.065,z,.13,.15,.13,16);for(let j=0;j<4;j++){const a=j*Math.PI/2+.35;k.beam('metal',[x,.17,z],[x+Math.cos(a)*.45,.035,z+Math.sin(a)*.45],.031,10);}
 function lathe(key,rows,gx,gz){const g=new T.LatheGeometry(rows.map(p=>new T.Vector2(...p)),40);k.add(g,key,gx,h,gz);}
 for(const [i,q]of[[-.40,-.015],[.035,.13],[.41,-.095]].entries()){const gx=x+q[0],gz=z+q[1],sc=1;
  lathe('clearGlass',[[0,0],[.054,0],[.059,.004],[.059,.009],[.042,.014],[.013,.018],[.008,.027],[.008,.080],[.018,.092],[.040,.11],[.057,.145],[.062,.18],[.057,.227],[.045,.265],[.042,.300],[.049,.331],[.052,.34],[.049,.342],[.046,.333],[.039,.300],[.042,.265],[.053,.225],[.058,.18],[.053,.147],[.035,.118],[.012,.098]],gx,gz);
  lathe(i===1?'gold':'amber',[[0,.099],[.032,.119],[.052,.149],[.057,.18],[.052,.224],[.040,.269],[.039,.294],[0,.294]],gx,gz);
  k.add(new T.TorusGeometry(.040,.0014,5,40),i===1?'gold':'amber',gx,h+.294,gz,[Math.PI/2,0,0]);
  const rim=[gx-.027,h+.326,gz+.019];k.add(new T.CylinderGeometry(.043,.043,.006,28), 'pith',...rim,[Math.PI/2+.19,.18+i*.28,0]);
  k.plane('orange_wheel',rim[0],rim[1],rim[2]+.004,.092,.092,[.19,.18+i*.28,.28]);
  k.plane('cherry_strawberry',gx+.027,h+.336,gz+.035,.067,.084,[0,-.1+i*.16,-.16]);
  k.plane('mint_leaf',gx-.042,h+.313,gz-.021,.037,.066,[.25,.7,.36]);
  k.beam('white',[gx-.017,h+.24,gz-.01],[gx-.037,h+.408,gz-.034],.0022,7);
  const pole=[gx+.046,h+.415,gz-.014];k.beam('wood',[gx+.012,h+.232,gz-.024],pole,.0015,6);
  const umbrella=new T.ConeGeometry(.101,.036,24,1,true),u=umbrella.attributes.uv,pp=umbrella.attributes.position;for(let v=0;v<u.count;v++)u.setXY(v,pp.getX(v)/.204+.5,pp.getZ(v)/.204+.5);
  k.add(umbrella,i===2?'parasol_lime_top':'parasol_pink_top',pole[0],pole[1],pole[2],[.15,0,-.28+i*.09]);k.sphere('wood',pole[0],pole[1]+.019,pole[2],.0024);
  for(let n=0;n<5;n++)k.add(new T.DodecahedronGeometry(.010+n*.0006,0),'ice',gx+Math.cos(n*2.4)*.020,h+.292+Math.sin(n)*.003,gz+Math.sin(n*2.4)*.018,[n*.7,.3,n*.5]);
 }
 const root=k.finish('Fountain table / three distinct hurricane cocktails');root.traverse(o=>{if(o.isMesh&&o.material.userData.optical){o.layers.set(3);o.renderOrder=o.material.userData.order||2;o.castShadow=false;}});scene.add(root);
 const glow=new T.PointLight(0xffe0a3,2.4,3.2,2);glow.position.set(x,2.8,z);scene.add(glow);
 return{root,optics,materials:Object.values(m),dispose(){optics.dispose();root.traverse(o=>o.geometry?.dispose());Object.values(m).forEach(m=>m.dispose());root.removeFromParent();glow.removeFromParent();}};
}
