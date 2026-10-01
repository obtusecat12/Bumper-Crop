/** Detailed late-1980s poolside furniture. Three is injected; no external imports.
 * All dimensions are metres. Texture coordinates: hard surfaces = metres,
 * terry cloth = 5 repeats/metre, foliage = complete 0..1 alpha leaf artwork.
 * Factory result is a THREE.Group; placement/contact data live in userData.
 */
export const SPA_FURNITURE_PLACEMENTS = [
  {name:'strap-chaise-west',position:[7.25,0,2.10],footEnd:'negative-z',width:.66,length:2.04},
  {name:'strap-chaise-east',position:[9.02,0,2.10],footEnd:'negative-z',width:.66,length:2.04},
  {name:'monstera-east',position:[11.62,0,.95],potRadius:.33,potHeight:.58},
  {name:'monstera-northwest',position:[6.75,0,3.72],potRadius:.31,potHeight:.58},
  {name:'wet-rubber-route-mat',position:[10.60,.012,1.20],width:.72,length:1.36,thickness:.024},
  ...[-2.77,-.20,2.34].map((z,i)=>({name:`wall-towel-${i+1}`,position:[12.15,1.65,z],wallX:12.29}))
];

export function createSpaFurniture(T, materials) {
  const group = new T.Group();
  group.name = 'late-1980s-spa-furniture';
  const contacts = [];
  const mat = {
    vinyl: materials.vinyl,
    chrome: materials.chrome,
    towel: materials.towel,
    leaf: materials.leaf.clone(),
    ceramic: materials.ceramic,
    soil: materials.soil,
    rubber: materials.rubber,
    brass: materials.brass,
    stem: materials.stem || new T.MeshStandardMaterial({name:'monstera-living-petioles',color:0x365e32,roughness:.56})
  };
  mat.leaf.name = 'monstera-alpha-double-sided';
  mat.leaf.side = T.DoubleSide;
  mat.leaf.alphaTest = .37;
  mat.leaf.transparent = false;
  mat.leaf.depthWrite = true;
  if ('roughness' in mat.leaf) mat.leaf.roughness = .53;
  if ('metalness' in mat.leaf) mat.leaf.metalness = 0;
  function mesh(geometry, material, name, parent=group) {
    const object = new T.Mesh(geometry,material);
    object.name=name; object.castShadow=true; object.receiveShadow=true;
    parent.add(object); return object;
  }
  const vec = p=>new T.Vector3(...p);
  function curveTube(points,radius,material,name,parent=group,segments=20,radial=7) {
    const curve = new T.CatmullRomCurve3(points.map(vec),false,'centripetal');
    const geometry = new T.TubeGeometry(curve,segments,radius,radial,false);
    const uv=geometry.attributes.uv, length=curve.getLength();
    const uvScale=/towel|terry/i.test(material.name||'')?5:1;
    for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*length*uvScale,uv.getY(i)*Math.PI*2*radius*uvScale);
    return mesh(geometry,material,name,parent);
  }
  function rod(a,b,radius,material,name,parent=group,radial=8) {
    const av=vec(a),bv=vec(b), delta=bv.clone().sub(av);
    const geo = new T.CylinderGeometry(radius,radius,delta.length(),radial,1,false);
    const uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*Math.PI*2*radius,uv.getY(i)*delta.length());
    const object=mesh(geo,material,name,parent);
    object.position.copy(av.add(bv).multiplyScalar(.5));
    object.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    return object;
  }
  function setPlanarMeterUV(geometry,axisA=0,axisB=2,scale=1) {
    const p=geometry.attributes.position,uv=[];
    for(let i=0;i<p.count;i++) uv.push(p.array[i*3+axisA]*scale,p.array[i*3+axisB]*scale);
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  }
  function surfaceGeometry(nx,ny,fn,uvfn,reverse=false) {
    const position=[],uv=[],indices=[];
    for(let j=0;j<=ny;j++) for(let i=0;i<=nx;i++) {
      position.push(...fn(i/nx,j/ny)); uv.push(...uvfn(i/nx,j/ny));
    }
    for(let j=0;j<ny;j++) for(let i=0;i<nx;i++) {
      const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;
      if(reverse) indices.push(a,d,b,a,c,d); else indices.push(a,b,d,a,d,c);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(position,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    geo.setIndex(indices); geo.computeVertexNormals(); return geo;
  }
  function solidBandAcross(profile,t,width,bandWidth,name,parent) {
    // Every independent strap wraps over the rails and sags under its own weight.
    const positions=[],uvs=[],indices=[],n=8;
    const dt=bandWidth/(profile.getLength()*2);
    for(let layer=0;layer<2;layer++) for(let edge=0;edge<2;edge++) for(let i=0;i<=n;i++) {
      const u=i/n,x=(u-.5)*width;
      const point=profile.getPointAt(Math.min(.9999,Math.max(.0001,t+(edge?dt:-dt))));
      const tangent=profile.getTangentAt(Math.min(.9999,Math.max(.0001,t+(edge?dt:-dt))));
      const sag=.019*Math.sin(Math.PI*u)**2;
      const normal=new T.Vector3(0,tangent.z,-tangent.y).normalize();
      point.addScaledVector(normal,.0215+(layer?-.003:.003)-sag);
      positions.push(x,point.y,point.z); uvs.push(x+.5*width,(t+(edge?dt:-dt))*profile.getLength());
    }
    const row=n+1;
    for(let i=0;i<n;i++) {
      indices.push(i,row+i+1,i+1,i,row+i,row+i+1);
      const a=2*row+i; indices.push(a,a+1,a+row+1,a,a+row+1,a+row);
      indices.push(i,2*row+i,2*row+i+1,i,2*row+i+1,i+1);
      const b=row+i; indices.push(b,b+1,b+2*row+1,b,b+2*row+1,b+2*row);
    }
    indices.push(0,row,3*row,0,3*row,2*row,n,2*row+n,3*row+n,n,3*row+n,row+n);
    const geo=new T.BufferGeometry();
    geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2)); geo.setIndex(indices);geo.computeVertexNormals();
    return mesh(geo,mat.vinyl,name,parent);
  }
  function chaise(x,z,backHeight,ordinal,withTowel) {
    const chaiseGroup=new T.Group();chaiseGroup.name=`strap-chaise-${ordinal}`;chaiseGroup.position.set(x,0,z);group.add(chaiseGroup);
    const points=[[-.965,.279],[-.845,.305],[-.52,.352],[-.04,.355],[.26,.394],[.44,.531],[.78,backHeight-.063],[.985,backHeight]];
    const profile=new T.CatmullRomCurve3(points.map(([pz,py])=>new T.Vector3(0,py,pz)),false,'centripetal');
    for(const side of [-1,1]) {
      const sideName=side<0?'left':'right',sx=side*.300;
      curveTube(points.map(([pz,py])=>[sx,py,pz]),.0245,mat.vinyl,`${sideName}-continuous-rounded-white-frame`,chaiseGroup,52,8);
      // Legs end on replaceable rubber feet. Both pairs are physically linked.
      for(const rear of [false,true]) {
        const footZ=rear?.626:-.726;
        const leg=rear?[[sx,.389,.202],[sx,.265,.351],[sx,.074,.527],[sx,.041,.626]]:
          [[sx,.350,-.464],[sx,.23,-.552],[sx,.07,-.651],[sx,.041,-.726]];
        curveTube(leg,.022,mat.vinyl,`${sideName}-${rear?'rear':'front'}-bent-leg`,chaiseGroup,12,7);
        const foot=mesh(new T.CapsuleGeometry(.026,.05,3,8),mat.rubber,`${sideName}-${rear?'rear':'front'}-floor-pad`,chaiseGroup);
        foot.rotation.x=Math.PI/2;foot.scale.y=1;foot.scale.z=.55;foot.position.set(sx,.0143,footZ);
        contacts.push({name:`${chaiseGroup.name}-${sideName}-${rear?'rear':'front'}-foot`,kind:'floor',point:[x+sx,0,z+footZ],radius:.026});
      }
      // Visible polished pivot hardware and a connected triangular reclining stay.
      rod([sx-.020,.408,.281],[sx+.020,.408,.281],.039,mat.chrome,`${sideName}-hinge-disc`,chaiseGroup,12);
      rod([sx-.023,.408,.281],[sx+.023,.408,.281],.020,mat.vinyl,`${sideName}-hinge-button`,chaiseGroup,12);
      const outside=side*.316;
      rod([outside,.343,.295],[outside,backHeight-.116,.729],.010,mat.chrome,`${sideName}-recliner-backstay`,chaiseGroup,7);
      rod([outside,.343,.295],[outside,.383,.502],.0105,mat.chrome,`${sideName}-adjustment-rack`,chaiseGroup,7);
      for(let tooth=0;tooth<3;tooth++) rod([outside,.355+tooth*.009,.355+tooth*.045],[outside,.371+tooth*.009,.347+tooth*.045],.006,mat.chrome,`${sideName}-rack-notch-${tooth}`,chaiseGroup,5);
      rod([outside-.011,backHeight-.116,.729],[outside+.011,backHeight-.116,.729],.023,mat.chrome,`${sideName}-stay-upper-rivet`,chaiseGroup,10);
    }
    for(const [pz,py] of [[-.965,.279],[.985,backHeight]]) {
      curveTube([[-.300,py,pz],[-.29,py,pz+(pz<0?-.019:.019)],[0,py,pz+(pz<0?-.027:.027)],[.29,py,pz+(pz<0?-.019:.019)],[.300,py,pz]],.0245,mat.vinyl,`${pz<0?'foot':'head'}-rounded-crossrail`,chaiseGroup,16,8);
    }
    for(const [py,pz] of [[.087,-.641],[.093,.509],[.326,-.304]]) rod([-.300,py,pz],[.300,py,pz],.0155,mat.vinyl,`transverse-underframe-${pz}`,chaiseGroup,7);
    const strapCount=27;
    for(let i=0;i<strapCount;i++) solidBandAcross(profile,.025+i*.95/(strapCount-1),.623,.057,`vinyl-strap-${String(i+1).padStart(2,'0')}`,chaiseGroup);
    if(withTowel) {
      // A folded towel rests across the high back and curls over its last rail.
      const towelMat=mat.towel.clone();towelMat.side=T.DoubleSide;towelMat.name='headrest-terry-cloth';
      const clothFn=(u,v)=>{
        const xx=(u-.5)*.482;
        if(v<.70) {
          const q=.804+v/.7*.187,p=profile.getPointAt(q),tangent=profile.getTangentAt(q),n=new T.Vector3(0,tangent.z,-tangent.y).normalize();
          const crease=.005*Math.cos(u*Math.PI*6+.4)*Math.sin(v*Math.PI)+.003*Math.sin(u*19+v*5);
          p.addScaledVector(n,.014+crease+.011*Math.abs(u-.5)+.021*Math.pow(v/.7,8));
          return [xx,p.y,p.z];
        }
        const tail=(v-.7)/.3;
        return [xx,backHeight+.033-.193*tail+.005*Math.sin(u*23+tail*6),.996+.023*Math.sin(Math.PI*tail*.7)+.015*tail];
      };
      const towel=mesh(surfaceGeometry(14,20,clothFn,(u,v)=>[u*.482*5,v*.431*5],true),towelMat,'casually-folded-headrest-towel',chaiseGroup);
      towel.userData.support='head crossrail and vinyl back straps';
      for(const side of [0,1]) {
        const path=[];for(let i=0;i<=20;i++)path.push(clothFn(side,i/20));
        curveTube(path,.0034,towelMat,`headrest-towel-stitched-side-${side}`,chaiseGroup,24,5);
      }
      for(const end of [0,1]) {
        const path=[];for(let i=0;i<=14;i++)path.push(clothFn(i/14,end));
        curveTube(path,.004,towelMat,`headrest-towel-folded-hem-${end}`,chaiseGroup,16,5);
      }
      const foldFn=(u,v)=>{const p=clothFn(u,v*.67);p[1]-=.008;p[2]-=.004;return p;};
      mesh(surfaceGeometry(12,12,foldFn,(u,v)=>[u*.482*5,v*.30*5],false),towelMat,'headrest-towel-visible-folded-underlayer',chaiseGroup);
    }
  }
  chaise(7.25,2.10,.862,'west',true);
  chaise(9.02,2.10,.891,'east',false);

  function planter(x,z,radius,ordinal,count) {
    const plant=new T.Group();plant.name=`monstera-${ordinal}`;plant.position.set(x,0,z);group.add(plant);
    const scale=radius/.33;
    const profile=[[0,.023],[.230,.023],[.264,.029],[.284,.054],[.292,.102],[.304,.278],[.324,.492],[.330,.551],[.327,.575],[.319,.582],[.307,.579],[.299,.564],[.298,.528],[.292,.485],[.275,.131],[.25,.065],[0,.065]].map(([r,y])=>new T.Vector2(r*scale,y));
    const potGeo=new T.LatheGeometry(profile,40,0,Math.PI*2);
    const puv=potGeo.attributes.uv,pp=potGeo.attributes.position;
    for(let i=0;i<puv.count;i++)puv.setXY(i,puv.getX(i)*2*Math.PI*radius,pp.getY(i));
    mesh(potGeo,mat.ceramic,'heavy-glazed-white-ceramic-vessel',plant);
    const foot=mesh(new T.CylinderGeometry(.254*scale,.247*scale,.030,32,1),mat.ceramic,'continuous-grounded-pot-foot',plant);foot.position.y=.015;
    const footUV=foot.geometry.attributes.uv;for(let i=0;i<footUV.count;i++)footUV.setXY(i,footUV.getX(i)*2*Math.PI*.254*scale,footUV.getY(i)*.03);
    const dirt=mesh(new T.CylinderGeometry(.292*scale,.286*scale,.022,32,1),mat.soil,'visible-rooted-potting-soil',plant);dirt.position.y=.531;
    setPlanarMeterUV(dirt.geometry);
    contacts.push({name:`${plant.name}-ceramic-foot`,kind:'floor',point:[x,0,z],radius:.247*scale});
    const foliage=new T.Group();foliage.name='rooted-monstera-canopy';plant.add(foliage);
    // This wall-side canopy is trained away from the clear walking route. Its
    // roots remain within the soil, while its leaves stay to the east of x11.3.
    foliage.scale.z=.965;
    if(ordinal==='east'){foliage.scale.x=.56;foliage.position.x=.13;}else{foliage.scale.x=.99;}
    // Petiole origins disappear into the actual soil surface; all foliage grows
    // from these visible stalks rather than floating on unconnected cards.
    for(let i=0;i<count;i++) {
      const angle=i*2.399963229728653+(ordinal==='east'?.16:.65);
      const tier=i%4;
      const length=.46+(i%3)*.035;
      const width=.34+(i%4)*.028;
      const elev=[.13,.45,.73,.28][tier]+.035*Math.sin(i*2);
      const petioleY=[.91,1.15,1.29,1.02][tier]+.055*Math.sin(i*1.7);
      const outward=[.215,.17,.10,.19][tier];
      const end=new T.Vector3(Math.sin(angle)*outward,petioleY,Math.cos(angle)*outward);
      const root=new T.Vector3(Math.sin(angle+.8)*.047,.526,Math.cos(angle+.8)*.047);
      const stemPoints=[root.toArray(),[root.x*.65,.66,root.z*.65],[end.x*.45,petioleY-.23,end.z*.45],end.toArray()];
      curveTube(stemPoints,.0085-(i%3)*.0007,mat.stem,`rooted-petiole-${i+1}`,foliage,10,5);
      const direction=new T.Vector3(Math.sin(angle)*Math.cos(elev),Math.sin(elev),Math.cos(angle)*Math.cos(elev));
      const lateral=new T.Vector3(Math.cos(angle),0,-Math.sin(angle));
      const normal=new T.Vector3().crossVectors(lateral,direction).normalize();
      const twist=.12*Math.sin(i*2.13);
      const leafFn=(u,v)=>{
        const s=u-.5;
        const arch=.059*Math.sin(Math.PI*v)-.052*v*v;
        const bowl=.027*Math.pow(Math.abs(2*s),1.7)*Math.sin(Math.PI*v)+.007*Math.sin(v*12+s*5+i)*v;
        const pos=end.clone().addScaledVector(direction,v*length).addScaledVector(lateral,s*width*(1+twist*v)).addScaledVector(normal,arch+bowl+s*twist*.11);
        return pos.toArray();
      };
      const leaf=mesh(surfaceGeometry(10,12,leafFn,(u,v)=>[u,v]),mat.leaf,`curved-fenestrated-monstera-leaf-${i+1}`,foliage);
      leaf.userData.alphaContour=true;leaf.userData.petioleEnd=end.toArray();
      // The subtle physical midrib catches glints close to the camera, while
      // finer venation and fenestrations are supplied by the photographed leaf.
      const rib=[];for(let k=0;k<=7;k++){const p=leafFn(.5,k/7*.89);p[1]+=.0018;rib.push(p);}
      curveTube(rib,.0029,mat.stem,`leaf-mid-rib-${i+1}`,foliage,9,5);
    }
    plant.userData.maxIntendedHeight=1.8;
    plant.userData.maxIntendedRadius=.75;
  }
  planter(11.62,.95,.33,'east',12);
  planter(6.75,3.72,.31,'northwest',11);

  function roundedRect(width,height,r) {
    const shape=new T.Shape(),a=-width/2,b=-height/2;
    shape.moveTo(a+r,b);shape.lineTo(a+width-r,b);shape.quadraticCurveTo(a+width,b,a+width,b+r);
    shape.lineTo(a+width,b+height-r);shape.quadraticCurveTo(a+width,b+height,a+width-r,b+height);
    shape.lineTo(a+r,b+height);shape.quadraticCurveTo(a,b+height,a,b+height-r);
    shape.lineTo(a,b+r);shape.quadraticCurveTo(a,b,a+r,b);return shape;
  }
  const matGroup=new T.Group();matGroup.name='wet-rubber-route-mat';matGroup.position.set(10.60,0,1.20);group.add(matGroup);
  const matShape=roundedRect(.706,1.346,.035);
  const matGeo=new T.ExtrudeGeometry(matShape,{depth:.01,bevelEnabled:true,bevelThickness:.007,bevelSize:.007,bevelSegments:3,steps:1,curveSegments:6});
  matGeo.rotateX(-Math.PI/2);matGeo.translate(0,.007,0);setPlanarMeterUV(matGeo);
  mesh(matGeo,mat.rubber,'beveled-heavy-wet-rubber-mat',matGroup);
  const rim=roundedRect(.664,1.304,.03).getPoints(36).map(p=>[p.x,.0243,-p.y]);
  rim.push(rim[0]);curveTube(rim,.0025,mat.rubber,'solid-raised-rubber-border',matGroup,100,5);
  contacts.push({name:'wet-rubber-route-mat',kind:'floor-area',point:[10.60,0,1.20],width:.72,length:1.36});

  contacts.push(...addHangingTowels(T,group,mat));

  let triangleCount=0,meshCount=0;
  group.traverse(object=>{if(object.isMesh){meshCount++;triangleCount+=(object.geometry.index?object.geometry.index.count:object.geometry.attributes.position.count)/3;}});
  group.userData.placements=SPA_FURNITURE_PLACEMENTS;
  group.userData.contacts=contacts;
  group.userData.triangleCount=triangleCount;
  group.userData.meshCount=meshCount;
  group.userData.units='metres';
  group.userData.uvConvention={hardSurfaces:'metres',towel:'5 repeats/metre',leaf:'full alpha artwork in 0..1'};
  return group;
}

function addHangingTowels(T, parent, materials) {
  // Metres. A thin closed textile shell, a rounded top fold, and rolled hems.
  // All textile UVs are measured in metres / 0.20, including the hem tubes.
  const contacts = [];
  const centers = [-2.77, -0.20, 2.34];
  const NU = 14, NV = 20;
  const clothMaterial = materials.towel.clone();
  clothMaterial.name = 'Towel | white woven terry cloth';
  clothMaterial.side = T.DoubleSide;
  const V = (x, y, z) => new T.Vector3(x, y, z);

  function mesh(group, name, geometry, material) {
    const result = new T.Mesh(geometry, material);
    result.name = name;
    result.castShadow = true;
    result.receiveShadow = true;
    group.add(result);
    return result;
  }

  function textileGeometry(points, uvs, faces) {
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(points, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
    geo.setIndex(faces);
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
  }

  centers.forEach((zc, towelIndex) => {
    const group = new T.Group();
    group.name = `Spa towel ${towelIndex + 1} | wall hook and hanging cloth`;
    parent.add(group);
    const phase = towelIndex * 0.47;
    const points = [], uvs = [], faces = [];

    // Cloth gathers at the hook and opens under its own weight. Long pleats,
    // oblique cross-folds, and smaller puckers are geometry, not a normal map.
    function sample(u, t, side) {
      const halfWidth = 0.033 + 0.233 * (1 - Math.exp(-6.2 * t));
      const drape = Math.pow(t, 0.55);
      const primaryPleats = 0.018 * Math.sin(2.8 * Math.PI * u + 1.1 * t + phase);
      const finePleats = 0.006 * Math.sin(6 * Math.PI * u - 2.1 * t + phase);
      const crossFold = 0.007 * Math.sin(25 * t + 5.4 * u + phase)
        * Math.exp(-Math.pow((t - 0.39) / 0.27, 2));
      const lowFold = 0.0045 * Math.sin(36 * t - 7 * u)
        * Math.exp(-Math.pow((t - 0.78) / 0.15, 2));
      const xMid = 12.121 + 0.013 * Math.exp(-8 * t)
        + drape * (primaryPleats + finePleats + crossFold + lowFold);
      // At the crown the shell folds around the brass tip; below it the two
      // cloth faces settle to a tangible six-millimetre terry thickness.
      const halfThickness = 0.003 + 0.010 * Math.exp(-16 * t);
      const y = 1.690 - 0.897 * t
        - 0.022 * (1 - t) * Math.pow(Math.abs(u), 1.65)
        + 0.012 * Math.pow(t, 9) * (1 - u * u)
        + 0.004 * Math.sin(11 * Math.PI * t + 5 * u + phase)
          * Math.sin(Math.PI * t) * (1 - 0.45 * Math.abs(u));
      const z = zc + halfWidth * u
        + 0.005 * Math.sin(8 * t + phase) * Math.sin(Math.PI * t) * (1 - u * u);
      return V(xMid + side * halfThickness, y, z);
    }

    const front = [], back = [];
    [-1, 1].forEach((side, sheet) => {
      const start = points.length / 3;
      const rows = sheet === 0 ? front : back;
      for (let j = 0; j <= NV; j++) {
        const row = [];
        for (let i = 0; i <= NU; i++) {
          const p = sample(2 * i / NU - 1, j / NV, side);
          points.push(p.x, p.y, p.z);
          uvs.push((p.z - zc) / 0.20, (1.700 - p.y) / 0.20);
          row.push(p);
        }
        rows.push(row);
      }
      for (let j = 0; j < NV; j++) {
        for (let i = 0; i < NU; i++) {
          const a = start + j * (NU + 1) + i;
          const b = a + 1, c = a + NU + 1, d = c + 1;
          if (side < 0) faces.push(a, c, b, b, c, d);
          else faces.push(a, b, c, b, d, c);
        }
      }
    });

    // Close both selvages and the lower fabric edge: the towel has volume
    // even when seen obliquely from the glass corridor.
    function closeEdge(frontPath, backPath) {
      const start = points.length / 3;
      for (let k = 0; k < frontPath.length; k++) {
        for (const p of [frontPath[k], backPath[k]]) {
          points.push(p.x, p.y, p.z);
          uvs.push((p.z - zc) / 0.20, (1.700 - p.y) / 0.20);
        }
      }
      for (let k = 0; k < frontPath.length - 1; k++) {
        const a = start + 2 * k;
        faces.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    closeEdge(front.map(r => r[0]), back.map(r => r[0]));
    closeEdge(front.map(r => r[NU]), back.map(r => r[NU]));
    closeEdge(front[NV], back[NV]);

    // Four panels across the rounded fold; its exact crown is y = 1.700.
    const crownStart = points.length / 3;
    const crownSteps = 4;
    for (let k = 0; k <= crownSteps; k++) {
      const theta = Math.PI * k / crownSteps;
      for (let i = 0; i <= NU; i++) {
        const a = front[0][i], b = back[0][i];
        const x = (a.x + b.x) / 2 - (b.x - a.x) / 2 * Math.cos(theta);
        const y = a.y + 0.010 * Math.sin(theta);
        points.push(x, y, a.z);
        uvs.push((a.z - zc) / 0.20, -0.013 * theta / 0.20);
      }
    }
    for (let k = 0; k < crownSteps; k++) {
      for (let i = 0; i < NU; i++) {
        const a = crownStart + k * (NU + 1) + i;
        const b = a + 1, c = a + NU + 1, d = c + 1;
        faces.push(a, b, c, b, d, c);
      }
    }
    mesh(group, `Towel ${towelIndex + 1} | gathered terry shell and top fold`,
      textileGeometry(points, uvs, faces), clothMaterial);

    // Low-profile physical rolled hems follow every wrinkle in the boundary.
    function hem(name, path) {
      const curve = new T.CatmullRomCurve3(path.map(p => p.clone()), false, 'centripetal');
      const radius = 0.003;
      const geo = new T.TubeGeometry(curve, path.length - 1, radius, 4, false);
      const uv = geo.attributes.uv;
      const length = curve.getLength();
      for (let n = 0; n < uv.count; n++) {
        uv.setXY(n, uv.getX(n) * length / 0.20,
          uv.getY(n) * (Math.PI * 2 * radius) / 0.20);
      }
      mesh(group, `Towel ${towelIndex + 1} | ${name} rolled hem`, geo, clothMaterial);
    }
    hem('left', front.map(r => r[0]));
    hem('right', front.map(r => r[NU]));
    hem('bottom', front[NV]);

    const plate = mesh(group, `Towel hook ${towelIndex + 1} | round brass wall plate`,
      new T.CylinderGeometry(0.028, 0.028, 0.008, 12), materials.brass);
    plate.rotation.z = Math.PI / 2;
    plate.position.set(12.286, 1.650, zc);

    // The J grows out from the -X face of the plate, curves down, then rises
    // inside the gathered cloth crown; no floating hook or wall intersection.
    const hookCurve = new T.CatmullRomCurve3([
      V(12.282, 1.650, zc), V(12.235, 1.650, zc),
      V(12.188, 1.622, zc), V(12.153, 1.628, zc),
      V(12.133, 1.658, zc), V(12.134, 1.6905, zc)
    ], false, 'centripetal');
    mesh(group, `Towel hook ${towelIndex + 1} | curved brass J`,
      new T.TubeGeometry(hookCurve, 8, 0.009, 8, false), materials.brass);
    const tip = mesh(group, `Towel hook ${towelIndex + 1} | rounded brass tip`,
      new T.SphereGeometry(0.0095, 8, 4), materials.brass);
    tip.position.set(12.134, 1.6905, zc);

    let triangles = 0;
    group.traverse(o => {
      if (o.isMesh) triangles += o.geometry.index
        ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
    });
    group.userData = {
      type: 'hanging-towel', wallFace: '-X', uvRepeatMetres: 0.20,
      clothThicknessMetres: 0.006, triangleCount: triangles,
      hookSegments: 8, hookTubeRadius: 0.009
    };
    contacts.push({
      name: group.name,
      centerZ: zc,
      wallAnchor: [12.290, 1.650, zc],
      hookTip: [12.134, 1.6905, zc],
      clothContact: [12.134, 1.700, zc],
      clothTop: [12.134, 1.700, zc],
      clothMinY: 0.790,
      face: '-X',
      triangles
    });
  });
  return contacts;
}

