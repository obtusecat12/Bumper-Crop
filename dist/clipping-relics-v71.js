/* Everyday park relics, metres. Pure Three.js asset factory; no DOM, loaders or
 * animation. The caller owns all supplied materials and the intentional burial.
 * Geometry uses real wall thickness, apertures and recesses throughout. */
export function createClippingRelics(T, {materials = {}} = {}) {
  const fallback = {
    steel: [0xaeb6b4, .36, .83], cream: [0xd8cfb3, .73, 0],
    rubber: [0x252a28, .95, 0], dark: [0x111916, .82, .08],
    crtScreen: [0x658ca2, .28, .04], led: [0x70b547, .43, 0],
  };
  const madeMaterials = [];
  const mats = {...materials};
  for (const [key, [color, roughness, metalness]] of Object.entries(fallback)) {
    if (!mats[key]) {
      mats[key] = new T.MeshStandardMaterial({name: `V71 relic ${key}`, color, roughness, metalness});
      madeMaterials.push(mats[key]);
    }
  }
  const craft = [], stats = {triangles: 0, draws: 0, parts: 0, props: {}};
  const up = new T.Vector3(0, 1, 0), pose = new T.Object3D();
  const ownGeometry = [];

  function geometry(pos, indices, uv) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setIndex(indices);
    if (uv) g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    if (!uv) worldUV(g);
    return g;
  }
  function worldUV(g, scale = .28) {
    const p = g.attributes.position, n = g.attributes.normal, uv = [];
    for (let i = 0; i < p.count; i++) {
      const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
      uv.push((nx > ny && nx > nz ? p.getZ(i) : p.getX(i)) / scale,
        (ny > nx && ny > nz ? p.getZ(i) : p.getY(i)) / scale);
    }
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    return g;
  }
  function reverse(g) {
    const ix = g.index.array;
    for (let i = 0; i < ix.length; i += 3) [ix[i + 1], ix[i + 2]] = [ix[i + 2], ix[i + 1]];
    const n = g.attributes.normal;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
    return g;
  }
  function merge(list) {
    const size = list.reduce((n, g) => n + g.attributes.position.count, 0);
    const pos = new Float32Array(size * 3), normal = new Float32Array(size * 3), uv = new Float32Array(size * 2);
    let offset = 0;
    for (const g of list) {
      pos.set(g.attributes.position.array, offset * 3);
      normal.set(g.attributes.normal.array, offset * 3);
      uv.set(g.attributes.uv.array, offset * 2);
      offset += g.attributes.position.count;
      g.dispose();
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.BufferAttribute(normal, 3));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    g.computeBoundingBox(); g.computeBoundingSphere(); ownGeometry.push(g);
    return g;
  }
  function roundedRectangle(w, h, r, steps = 3, flats = false) {
    r = Math.min(r, w * .24, h * .24);
    const out = [], hw = w / 2, hh = h / 2;
    const corners = [[hw-r, hh-r, 0], [-hw+r, hh-r, Math.PI/2], [-hw+r, -hh+r, Math.PI], [hw-r, -hh+r, Math.PI*1.5]];
    corners.forEach(([x, y, a], corner) => {
      for (let j = 0; j <= steps; j++) out.push([x + Math.cos(a + j * Math.PI / (2 * steps)) * r, y + Math.sin(a + j * Math.PI / (2 * steps)) * r]);
      if (flats && corner === 1) for (const t of [.7, .4, 0, -.4, -.7]) out.push([-hw, t * hh]);
      if (flats && corner === 3) for (const t of [-.7, -.4, 0, .4, .7]) out.push([hw, t * hh]);
    });
    return out;
  }
  // Closed ring loft around Y, in ordered outside-up / inside-down profile.
  // The explicit winding produces upward bowl normals and inward cavity normals.
  function ovalProfile(profile, sectors = 48) {
    const pos = [], uv = [], ix = [], count = profile.length;
    for (let j = 0; j < count; j++) for (let i = 0; i <= sectors; i++) {
      const t = i * Math.PI * 2 / sectors, [a, b, y] = profile[j];
      pos.push(Math.cos(t) * a, y, Math.sin(t) * b); uv.push(i / sectors, j / count);
    }
    for (let j = 0; j < count; j++) for (let i = 0; i < sectors; i++) {
      const a = j * (sectors + 1) + i, b = a + 1, c = ((j + 1) % count) * (sectors + 1) + i, d = c + 1;
      ix.push(a, c, b, b, c, d);
    }
    const g = geometry(pos, ix, uv), n = g.attributes.normal;
    for (let j = 0; j < count; j++) {
      const a = j * (sectors + 1), b = a + sectors;
      const v = new T.Vector3(n.getX(a)+n.getX(b), n.getY(a)+n.getY(b), n.getZ(a)+n.getZ(b)).normalize();
      n.setXYZ(a, v.x, v.y, v.z); n.setXYZ(b, v.x, v.y, v.z);
    }
    return worldUV(g);
  }
  function ring(outer, inner, h, sectors = 20) {
    return ovalProfile([[outer,outer,-h/2],[outer,outer,h/2],[inner,inner,h/2],[inner,inner,-h/2]], sectors);
  }
  function plate(w, h, d, r = .004) {
    const contour = roundedRectangle(w, h, r, 2), n = contour.length, pos = [], uv = [], ix = [];
    for (const z of [-d/2, d/2]) for (const [x, y] of contour) {pos.push(x,y,z); uv.push(x/w+.5,y/h+.5);}
    const back = pos.length/3; pos.push(0,0,-d/2); uv.push(.5,.5);
    const front = pos.length/3; pos.push(0,0,d/2); uv.push(.5,.5);
    for (let i=0;i<n;i++) {const j=(i+1)%n; ix.push(i,j,i+n,j,j+n,i+n,back,j,i,front,i+n,j+n);}
    return geometry(pos,ix,uv);
  }
  function chamferBox(w,h,d,r=.004) {
    const s = new T.Shape();
    r=Math.min(r,w*.2,h*.2,d*.2);
    s.moveTo(-w/2+r,-h/2+r); s.lineTo(w/2-r,-h/2+r); s.lineTo(w/2-r,h/2-r); s.lineTo(-w/2+r,h/2-r); s.closePath();
    const g=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:r,bevelThickness:r,curveSegments:1});
    g.translate(0,0,-d/2+r); g.computeVertexNormals(); return worldUV(g);
  }
  function builder(name) {
    const root=new T.Group(); root.name=name;
    const parts=new Map(); let triangles=0, componentCount=0;
    function add(g,key,x=0,y=0,z=0,rx=0,ry=0,rz=0) {
      const p=g.index?g.toNonIndexed():g.clone(); g.dispose();
      pose.position.set(x,y,z); pose.rotation.set(rx,ry,rz); pose.scale.set(1,1,1); pose.updateMatrix(); p.applyMatrix4(pose.matrix);
      if(!p.attributes.uv)worldUV(p);
      if(!parts.has(key))parts.set(key,[]); parts.get(key).push(p);
      triangles+=p.attributes.position.count/3; componentCount++;
    }
    const box=(key,x,y,z,w,h,d,r=.004,rx=0,ry=0,rz=0)=>add(chamferBox(w,h,d,r),key,x,y,z,rx,ry,rz);
    const cylinder=(key,x,y,z,r,h,rx=0,ry=0,rz=0,n=16)=>add(new T.CylinderGeometry(r,r,h,n,1),key,x,y,z,rx,ry,rz);
    function rod(key,a,b,r=.005,n=10) {
      const v=new T.Vector3(...b).sub(new T.Vector3(...a)), mid=new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5);
      const g=new T.CylinderGeometry(r,r,v.length(),n); g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,v.normalize())); add(g,key,mid.x,mid.y,mid.z);
    }
    function curvedPipe(key,points,r=.010,inner=.006,segments=20,sides=8) {
      const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');
      add(new T.TubeGeometry(curve,segments,r,sides,false),key);
      add(reverse(new T.TubeGeometry(curve,segments,inner,sides,false)),key);
      for(const t of [0,1]) {
        const p=curve.getPoint(t), tangent=curve.getTangent(t), g=ring(r,inner,.001,sides);
        g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,tangent)); add(g,key,p.x,p.y,p.z);
      }
      return curve;
    }
    function finish(id) {
      for(const [key,list] of parts) {
        const mesh=new T.Mesh(merge(list),mats[key]); mesh.name=`${name} / ${key}`;
        mesh.receiveShadow=true; mesh.castShadow=key!=='glass'&&key!=='crtScreen'&&key!=='led';
        mesh.userData.exitStatic=true; mesh.userData.materialKey=key; mesh.updateMatrix(); mesh.matrixAutoUpdate=false; root.add(mesh);
      }
      const bounds=new T.Box3().setFromObject(root), size=bounds.getSize(new T.Vector3());
      const record={triangles,draws:root.children.length,parts:componentCount,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},size:size.toArray()};
      root.userData.relicStats=record; root.userData.intentionalClipping=true;
      stats.props[id]=record; stats.triangles+=triangles; stats.draws+=record.draws; stats.parts+=componentCount;
      return root;
    }
    return {root,add,box,cylinder,rod,curvedPipe,finish};
  }

  // 2010 municipal stainless fountain. Basin is one closed, deep, oval shell
  // whose central drain remains open all the way through its physical throat.
  const F=builder('2010 park fountain');
  const basinProfile=[
    [.032,.031,.716],[.033,.032,.736],[.191,.143,.746],
    [.232,.179,.817],[.249,.198,.873],[.254,.204,.891],
    [.250,.200,.900],[.244,.193,.893],[.236,.187,.880],
    [.205,.163,.842],[.123,.099,.790],[.066,.052,.766],
    [.026,.025,.761],[.021,.020,.753],[.021,.020,.716],
  ];
  F.add(ovalProfile(basinProfile),'steel');
  // Hollow pedestal shell and flange. Every element is rooted at y=0.
  F.add(ovalProfile([[.144,.144,0],[.144,.144,.021],[.117,.117,.040],[.103,.103,.081],[.103,.103,.700],[.116,.116,.734],[.116,.116,.744],[.096,.096,.744],[.094,.094,.694],[.094,.094,.073],[.128,.128,.017],[.128,.128,0]],32),'steel');
  F.add(ring(.106,.102,.005,32),'rubber',0,.316,0);
  F.add(ring(.120,.114,.006,32),'steel',0,.733,0);
  // Front service hatch has raised stainless edges, a lower seam and real heads.
  function serviceHatch() {
    const pos=[],uv=[],ix=[],n=12,layer=2*(n+1),arc=.478;
    for(const r of [.103,.108])for(const y of [.278,.526])for(let i=0;i<=n;i++){const t=Math.PI/2-arc+2*arc*i/n;pos.push(Math.cos(t)*r,y,Math.sin(t)*r);uv.push(i/n,y/.28);}
    for(let i=0;i<n;i++){const a=i,b=i+1,c=i+n+1,d=c+1;ix.push(a,b,c,b,d,c,a+layer,c+layer,b+layer,b+layer,c+layer,d+layer,a,a+layer,b,b,a+layer,b+layer,c,d,c+layer,d,d+layer,c+layer);}
    for(const i of [0,n]){const a=i,b=i+n+1,c=a+layer,d=b+layer;if(i===0)ix.push(a,b,c,b,d,c);else ix.push(a,c,b,b,c,d);}
    return worldUV(geometry(pos,ix,uv));
  }
  F.add(serviceHatch(),'steel');
  F.box('dark',0,.278,.107,.083,.003,.002,.0005);
  for(const x of [-.032,.032])for(const y of [.303,.506]) {
    const z=Math.sqrt(.108**2-x**2);
    F.cylinder('steel',x,y,z+.002,.004,.006,Math.PI/2,0,0,8);
    F.box('dark',x,y,z+.005,.004,.0008,.001,.0002);
  }
  for(let i=0;i<4;i++) {
    const t=Math.PI/4+i*Math.PI/2,x=Math.cos(t)*.126,z=Math.sin(t)*.126;
    F.cylinder('steel',x,.025,z,.007,.009,0,0,0,6);
  }
  // The drain strainer has open slots between six spokes and a real annulus.
  F.add(ring(.0245,.0192,.003,32),'steel',0,.7585,0);
  F.cylinder('steel',0,.7585,0,.006,.003,0,0,0,12);
  for(let i=0;i<6;i++) {
    const t=i*Math.PI/3;
    F.box('steel',Math.cos(t)*.013,.7585,Math.sin(t)*.013,.022,.003,.003,.0005,0,-t,0);
  }
  F.add(ring(.0205,.0165,.044,24),'steel',0,.737,0);
  F.add(ring(.016,.006,.054,16),'steel',.107,.812,-.067);
  F.cylinder('rubber',.107,.842,-.067,.018,.009,0,0,0,16);
  F.curvedPipe('steel',[[.107,.839,-.067],[.128,.873,-.064],[.115,.886,-.048],[.079,.886,-.025],[.061,.863,-.012]],.010,.0054,22,10);
  F.cylinder('steel',.107,.850,-.067,.021,.012,0,0,0,16);
  // Side-mounted push button / retaining nut, attached to the basin side wall.
  F.cylinder('steel',.231,.849,.008,.019,.016,0,0,-Math.PI/2,12);
  F.cylinder('rubber',.241,.849,.008,.014,.009,0,0,-Math.PI/2,12);
  F.cylinder('steel',.247,.849,.008,.012,.010,0,0,-Math.PI/2,16);
  const fountain=F.finish('fountain');
  craft.push({kind:'fountain',height:.900,ovalRadii:[.250,.200],basinDepth:.139,shellThicknessMinimum:.005,drain:{radius:.020,slots:6,painted:false},support:'hollow pedestal and bolted foot flange',expectedBurialY:-.45,buriedRimY:.45,front:'+z'});

  // CRT outer shell: physical side ventilation apertures, with inner walls
  // and lip thickness. It tapers in several steps towards the rear, not a box.
  const M=builder('2004 beige CRT monitor');
  const caseLevels=[[-.200,.258,.231],[-.178,.275,.237],[-.140,.289,.246],[-.040,.320,.262],[.020,.344,.267],[.145,.371,.274],[.169,.376,.274]];
  const centerY=.201;
  function crtCase() {
    const rings=caseLevels.map(([z,w,h])=>({z,w,h,outer:roundedRectangle(w,h,.013,3,true),inner:roundedRectangle(w-.009,h-.009,.009,3,true)}));
    const n=rings[0].outer.length, rows=rings.length, layer=n*rows, pos=[],uv=[],ix=[],present=[];
    for(let side=0;side<2;side++)for(const row of rings)for(const [x,y] of side?row.inner:row.outer){pos.push(x,centerY+y,row.z);uv.push(row.z/.28,y/.28);}
    for(let j=0;j<rows-1;j++)for(let i=0;i<n;i++) {
      const next=(i+1)%n,a=j*n+i,b=j*n+next,c=(j+1)*n+i,d=(j+1)*n+next;
      const p=rings[j].outer[i],q=rings[j].outer[next],halfW=rings[j].w/2,halfH=rings[j].h/2;
      const flatSide=Math.abs(Math.abs(p[0])-halfW)<1e-6&&Math.abs(Math.abs(q[0])-halfW)<1e-6;
      const vent=flatSide&&Math.max(Math.abs(p[1]),Math.abs(q[1]))<=halfH*.401&&j===2;
      present[j*n+i]=!vent;
      if(!vent){ix.push(a,b,c,b,d,c,c+layer,b+layer,a+layer,c+layer,d+layer,b+layer);}
    }
    // Bridge all boundary edges from outer surface to inner surface, including
    // vent perimeters. The case is a watertight solid despite the vent openings.
    function wall(a,b){ix.push(a,a+layer,b,b,a+layer,b+layer);}
    for(let j=0;j<rows-1;j++)for(let i=0;i<n;i++) {
      if(!present[j*n+i])continue;
      const p=(i+n-1)%n,q=(i+1)%n,a=j*n+i,b=j*n+q,c=(j+1)*n+i,d=(j+1)*n+q;
      if(j===0||!present[(j-1)*n+i])wall(a,b);
      if(!present[j*n+q])wall(b,d);
      if(j===rows-2||!present[(j+1)*n+i])wall(d,c);
      if(!present[j*n+p])wall(c,a);
    }
    return geometry(pos,ix,uv);
  }
  M.add(crtCase(),'cream');
  M.add(plate(.251,.224,.006,.010),'cream',0,centerY,-.199);
  M.add(plate(.367,.265,.005,.010),'cream',0,centerY,.166);
  // Five real louvers span each opening; dark inner fins can be seen behind.
  for(const side of [-1,1])for(let i=0;i<5;i++) {
    const y=centerY-.043+i*.0215;
    M.box('cream',side*.153,y,-.089,.013,.007,.098,.0015,0,side*.15,0);
    M.box('dark',side*.143,y-.003,-.089,.004,.008,.087,.001,0,side*.15,0);
  }
  // Back grille, actual raised louvers over a recessed service/power panel.
  M.add(plate(.140,.076,.008,.004),'dark',0,.197,-.205);
  for(let i=0;i<6;i++)M.box('cream',0,.168+i*.012,-.211,.144,.005,.010,.001);
  for(const x of [-.103,.103])for(const y of [.114,.285])M.cylinder('steel',x,y,-.206,.003,.003,Math.PI/2,0,0,8);
  // Closed rounded bezel annulus. Its aperture slopes into the CRT glass well.
  function bezel() {
    const profiles=[{w:.373,h:.273,r:.012,z:.169},{w:.380,h:.278,r:.015,z:.199},
      {w:.296,h:.224,r:.012,z:.199},{w:.291,h:.219,r:.010,z:.173}];
    const rings=profiles.map(p=>roundedRectangle(p.w,p.h,p.r,4)),n=rings[0].length,pos=[],uv=[],ix=[];
    for(let j=0;j<profiles.length;j++)for(const [x,y]of rings[j]){pos.push(x,.201+y,profiles[j].z);uv.push(x/.28,y/.28);}
    for(let j=0;j<profiles.length;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=((j+1)%profiles.length)*n+i,d=((j+1)%profiles.length)*n+(i+1)%n;ix.push(a,b,c,b,d,c);}
    return geometry(pos,ix,uv);
  }
  M.add(bezel(),'cream');
  M.add(plate(.293,.221,.006,.012),'dark',0,.201,.170);
  // Rounded curved glass has a real 4 mm body. Screen image UVs are conventional
  // and independent of the caller's PBR maps. The perimeter is 26 mm recessed.
  function screen(zOffset=0,closed=true) {
    const w=.290,h=.218,edge=roundedRectangle(w,h,.010,6),n=edge.length,pos=[0,.201,.184+zOffset],uv=[.5,.5],ix=[];
    const rings=4;
    for(let j=1;j<=rings;j++)for(const [px,py]of edge){const s=j/rings,x=px*s,y=py*s,z=.173+.011*(1-(x/(w/2))**2)*(1-(y/(h/2))**2)+zOffset;pos.push(x,.201+y,z);uv.push(x/w+.5,y/h+.5);}
    for(let i=0;i<n;i++)ix.push(0,1+i,1+(i+1)%n);
    for(let j=0;j<rings-1;j++)for(let i=0;i<n;i++){const a=1+j*n+i,b=1+j*n+(i+1)%n,c=a+n,d=b+n;ix.push(a,c,b,b,c,d);}
    if(closed){const back=pos.length/3;for(const [x,y]of edge){pos.push(x,.201+y,.169+zOffset);uv.push(x/w+.5,y/h+.5);}const mid=pos.length/3;pos.push(0,.201,.169+zOffset);uv.push(.5,.5);for(let i=0;i<n;i++){const q=(i+1)%n,a=1+(rings-1)*n+i,b=1+(rings-1)*n+q,c=back+i,d=back+q;ix.push(a,c,b,b,c,d,mid,d,c);}}
    return geometry(pos,ix,uv);
  }
  M.add(screen(),'crtScreen');
  if(mats.glass)M.add(screen(.0007,false),'glass');
  // Physical control rail below the aperture, power button and LED lens.
  M.box('cream',0,.070,.200,.316,.019,.008,.003);
  M.cylinder('rubber',.126,.072,.204,.008,.008,Math.PI/2,0,0,16);
  M.cylinder('cream',.126,.072,.211,.0068,.007,Math.PI/2,0,0,16);
  M.cylinder('led',.103,.072,.207,.0022,.014,Math.PI/2,0,0,10);
  for(let i=0;i<4;i++)M.box('cream',-.012+i*.022,.072,.205,.014,.004,.007,.001);
  // Base has a low dish, a swivel seam and a short tilt cradle under the shell.
  M.add(plate(.218,.174,.030,.014),'cream',0,.015,-.022,Math.PI/2);
  M.cylinder('rubber',0,.027,-.027,.067,.006,0,0,0,24);
  M.cylinder('cream',0,.040,-.027,.062,.024,0,0,0,24);
  M.box('cream',0,.058,-.033,.126,.045,.091,.011);
  M.cylinder('steel',0,.062,-.033,.016,.139,0,0,Math.PI/2,16);
  for(const side of [-1,1])M.cylinder('cream',side*.074,.062,-.033,.019,.008,0,0,Math.PI/2,16);
  // Four flat rubber contacts are exactly on root ground y=0.
  for(const x of [-.079,.079])for(const z of [-.077,.040])M.box('rubber',x,.002,z,.028,.004,.022,.001);
  M.box('rubber',.051,.093,-.207,.040,.026,.013,.004);
  M.curvedPipe('rubber',[[.051,.094,-.213],[.060,.067,-.217],[.074,.020,-.207],[.048,.009,-.179],[-.027,.009,-.151]],.0045,.0024,18,7);
  const monitor=M.finish('monitor');
  craft.push({kind:'monitor',era:2004,bodyDimensions:[.380,.340,.400],screenSize:[.290,.218],screenRecessAtEdge:.026,front:'+z',rearZ:-.213,sideVents:'real apertures, wall thickness and five louvers per side',support:'swivel dish, tilt cradle and four floor contacts',suggestedLocalPosition:[40.2,0,18.49],suggestedYaw:-.15,wallZ:18.34,intentionalRearWallEmbedding:true});

  // One continuous molded seat/back shell, 16 mm normal thickness. Four broad,
  // rounded plastic legs merge visually into it and splay gently to flat feet.
  const C=builder('2010 cream stacking chair');
  function chairShell() {
    const sections=[[.240,.433,.430],[.173,.426,.428],[.025,.428,.414],[-.122,.461,.395],[-.196,.552,.382],[-.227,.672,.394],[-.212,.789,.408]];
    const cols=14,rows=sections.length,row=cols+1,layer=rows*row,pos=[],uv=[],ix=[];
    for(let side=0;side<2;side++)for(let j=0;j<rows;j++)for(let i=0;i<=cols;i++) {
      const u=i/cols,[z,y,w]=sections[j],p=sections[Math.max(j-1,0)],q=sections[Math.min(j+1,rows-1)],dy=q[1]-p[1],dz=q[0]-p[0],len=Math.hypot(dy,dz),ny=-dz/len,nz=dy/len,offset=side?-.008:.008;
      const edge=.008*Math.pow(Math.abs(u-.5)*2,3);
      pos.push((u-.5)*w,y+edge+ny*offset,z+nz*offset);uv.push(u,j/(rows-1));
    }
    for(let side=0;side<2;side++)for(let j=0;j<rows-1;j++)for(let i=0;i<cols;i++){const a=side*layer+j*row+i,b=a+1,c=a+row,d=c+1;if(side)ix.push(a,c,b,b,c,d);else ix.push(a,b,c,b,d,c);}
    for(let j=0;j<rows-1;j++)for(const i of [0,cols]){const a=j*row+i,b=a+row,c=a+layer,d=b+layer;if(i===0)ix.push(a,c,b,b,c,d);else ix.push(a,b,c,b,d,c);}
    for(const j of [0,rows-1])for(let i=0;i<cols;i++){const a=j*row+i,b=a+1,c=a+layer,d=b+layer;if(j===0)ix.push(a,b,c,b,d,c);else ix.push(a,c,b,b,c,d);}
    return worldUV(geometry(pos,ix,uv));
  }
  function plasticLeg(side,rear) {
    const points=rear?[[side*.190,0,-.214],[side*.187,.055,-.212],[side*.176,.235,-.183],[side*.163,.445,-.149]]:
      [[side*.187,0,.210],[side*.184,.053,.209],[side*.176,.233,.190],[side*.165,.425,.167]];
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal'),steps=8,pos=[],uv=[],ix=[];
    const n=roundedRectangle(.030,.036,.006,3).length;
    for(let j=0;j<=steps;j++){const t=j/steps,p=curve.getPoint(t),cross=roundedRectangle(.028+.011*t,.033+.014*t,.006,3);for(const[x,z]of cross){pos.push(p.x+x,p.y,p.z+z);uv.push(x/.28,(p.y+z)/.28);}}
    for(let j=0;j<steps;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=a+n,d=j*n+(i+1)%n+n;ix.push(a,c,b,b,c,d);}
    const bottom=pos.length/3;pos.push(...points[0]);uv.push(.5,.5);const top=pos.length/3;pos.push(...points[points.length-1]);uv.push(.5,.5);
    for(let i=0;i<n;i++){const q=(i+1)%n;ix.push(bottom,i,q,top,steps*n+q,steps*n+i);}
    return worldUV(geometry(pos,ix,uv));
  }
  C.add(chairShell(),'cream');
  for(const side of [-1,1])for(const rear of [false,true])C.add(plasticLeg(side,rear),'cream');
  C.box('cream',0,.399,.037,.331,.032,.292,.009);
  for(const side of [-1,1])C.box('cream',side*.158,.419,-.104,.031,.086,.123,.008,-.29,0,0);
  const chair=C.finish('chair');
  craft.push({kind:'chair',era:2010,dimensions:[.430,.800,.480],shellNormalThickness:.016,legs:'four continuous curved, splayed, rounded molded plastic legs',support:'four flat feet at root y=0',expectedBurialY:-.35,suggestedYaw:12*Math.PI/180,front:'+z'});

  if(stats.triangles>16000||stats.draws>12)throw new Error(`V71 relic budget exceeded: ${stats.triangles} triangles / ${stats.draws} draws`);
  function dispose() {for(const g of ownGeometry)g.dispose();for(const m of madeMaterials)m.dispose();}
  return {fountain,monitor,chair,craft,stats,dispose};
}
