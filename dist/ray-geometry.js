import {architectureRayTint} from './architecture-batch.js?v=48';
import * as T from './vendor/three.module.min.js';
import {createGroundRayAlbedo} from './ground-ray-albedo.js?v=48';
import {ruralTextures} from './rural-textures.js?v=48';
import {periodOrigin,buildingSize,buildingLocal,pondMetrics,roadProfile,cropSample} from './world.js?v=48';
import {farmRoadWeight,farmFootprintDistance} from './farm-layout.js?v=48';
import {meadowEnvironment} from './meadow-layout.js?v=48';

// Runs in the existing generation worker, before its geometry is transferred.
// True ground/building/prop/branch/leaf triangles; no solid canopy/house proxies.
// Fine wheat and grass do not occlude this low-frequency indirect-light cache.
export function buildRayGeometry(root,f=null) {
  const groundAlbedo=createGroundRayAlbedo({ruralTextures,periodOrigin,meadowEnvironment,farmRoadWeight,farmFootprintDistance,buildingSize,buildingLocal,pondMetrics,roadProfile,cropSample});
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(), matrix = new T.Matrix4(), instance = new T.Matrix4();
  const draws=[], textureIds=new Map(), textures=[], averages=new WeakMap(); let total=0;
  function image(texture) {
    const im=texture?.image;
    if(im?.data)return im;
    if(im?.getContext)return {width:im.width,height:im.height,data:im.getContext('2d').getImageData(0,0,im.width,im.height).data};
    return null;
  }
  function textureColor(texture) {
    if(!texture)return [1,1,1];
    if(averages.has(texture))return averages.get(texture);
    const im=image(texture);if(!im)return [1,1,1];
    let r=0,g=0,b=0,weight=0;
    const step=Math.max(1,Math.floor(Math.sqrt(im.width*im.height/2048)));
    for(let y=0;y<im.height;y+=step)for(let x=0;x<im.width;x+=step){
      const i=(y*im.width+x)*4,a=im.data[i+3]/255;
      const linear=v=>texture.colorSpace===T.SRGBColorSpace?(v<=.04045?v/12.92:((v+.055)/1.055)**2.4):v;
      r+=linear(im.data[i]/255)*a;g+=linear(im.data[i+1]/255)*a;b+=linear(im.data[i+2]/255)*a;weight+=a;
    }
    const c=weight?[r/weight,g/weight,b/weight]:[1,1,1];averages.set(texture,c);return c;
  }
  function alphaTexture(mat) {
    if(!mat.map||!mat.alphaTest)return -1;
    const key=mat.map.uuid+':'+mat.alphaTest;if(textureIds.has(key))return textureIds.get(key);
    const im=image(mat.map);if(!im)return -1;
    const data=new Uint8Array(im.width*im.height);for(let i=0;i<data.length;i++)data[i]=im.data[i*4+3];
    const id=textures.length;textureIds.set(key,id);
    textures.push({width:im.width,height:im.height,data,threshold:mat.alphaTest,flipY:mat.map.flipY,wrapS:mat.map.wrapS,wrapT:mat.map.wrapT});
    mat.map.updateMatrix();return id;
  }
  root.traverse(o=>{
    if(o.userData.dynamicDoor||!o.isMesh||!o.geometry?.attributes.position||(!o.castShadow&&o.name!=='sculpted-ground-and-wheel-ruts'))return;
    const mat=o.material;if(Array.isArray(mat)||mat.transparent||mat.isShaderMaterial)return;
    const g=o.geometry,start=g.drawRange.start||0,count=Math.min((g.index?.count??g.attributes.position.count)-start,g.drawRange.count);
    if(!Number.isFinite(count)||count<3)return;
    const instances=o.isInstancedMesh?o.count:1,n=Math.floor(count/3)*instances;
    const name=o.name+' '+mat.name,thin=/foliage|leaves|leaf|sprays/i.test(name)?1:0;
    draws.push({o,g,mat,count:Math.floor(count/3)*3,start,instances,thin,alpha:alphaTexture(mat),tint:textureColor(mat.map)});total+=n;
  });
  const positions=new Float32Array(total*9),colors=new Float32Array(total*3),uvs=new Float32Array(total*6),ids=new Int16Array(total),thin=new Uint8Array(total),ground=new Uint8Array(total);
  ids.fill(-1);let at=0;
  for(const d of draws){
    const {o,g,mat}=d,p=g.attributes.position,c=g.attributes.color,uv=g.attributes.uv,index=g.index;
    const base=new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld),color=mat.color||new T.Color(1,1,1);
    for(let item=0;item<d.instances;item++){
      if(o.isInstancedMesh){o.getMatrixAt(item,instance);matrix.multiplyMatrices(base,instance);}else matrix.copy(base);
      const e=matrix.elements,ic=o.instanceColor;
      for(let t=d.start;t<d.start+d.count;t+=3){
        const tone=[0,0,0];
        for(let j=0;j<3;j++){
          const i=index?index.getX(t+j):t+j,x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=at*9+j*3;
          positions[k]=e[0]*x+e[4]*y+e[8]*z+e[12];positions[k+1]=e[1]*x+e[5]*y+e[9]*z+e[13];positions[k+2]=e[2]*x+e[6]*y+e[10]*z+e[14];
          tone[0]+=c&&mat.vertexColors?c.getX(i):1;tone[1]+=c&&mat.vertexColors?c.getY(i):1;tone[2]+=c&&mat.vertexColors?c.getZ(i):1;
          if(d.alpha>=0&&uv){const u=uv.getX(i),v=uv.getY(i),m=mat.map.matrix.elements;uvs[at*6+j*2]=m[0]*u+m[3]*v+m[6];uvs[at*6+j*2+1]=m[1]*u+m[4]*v+m[7];}
        }
        colors[at*3]=color.r*d.tint[0]*tone[0]/3*(ic?ic.getX(item):1);
        colors[at*3+1]=color.g*d.tint[1]*tone[1]/3*(ic?ic.getY(item):1);
        colors[at*3+2]=color.b*d.tint[2]*tone[2]/3*(ic?ic.getZ(item):1);
        if(g.attributes.surfaceParams){const tint=architectureRayTint(Math.round(g.attributes.surfaceParams.getX(index?index.getX(t):t)));for(let c=0;c<3;c++)colors[at*3+c]*=tint[c];}
        if(o.name==='sculpted-ground-and-wheel-ruts'){
          ground[at]=1;
          const k=at*9,x=(positions[k]+positions[k+3]+positions[k+6])/3,z=(positions[k+2]+positions[k+5]+positions[k+8])/3;
          let meadow=null;
          if(g.attributes.meadowData){const a=g.attributes.meadowData;meadow={cover:0,moisture:0,patchDensity:0};for(let j=0;j<3;j++){const i=index?index.getX(t+j):t+j;meadow.cover+=a.getX(i)/3;meadow.moisture+=a.getY(i)/3;meadow.patchDensity+=a.getW(i)/3;}}
          colors.set(f?groundAlbedo(f,x,z,undefined,meadow):groundAlbedo.means.soil.map((c,i)=>c*[.86,.80,.74][i]),at*3);
        }
        ids[at]=d.alpha;thin[at]=d.thin||(g.attributes.rayTwoSided?.getX(index?index.getX(t):t)>0?1:0);at++;
      }
    }
  }
  return {positions,colors,uvs,textureIds:ids,thin,ground,alphaTextures:textures};
}
export function rayGeometryBuffers(g) {
  return [g.positions,g.colors,g.uvs,g.textureIds,g.thin,g.ground,...g.alphaTextures.map(t=>t.data)].map(a=>a.buffer);
}
