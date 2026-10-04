/**
 * Detailed, self-contained Level 10 refuge architecture.
 * Coordinates: metres; local ground y=0; entry/front faces +Z.
 * All texture-bearing geometry is UV mapped. Source mats are never mutated.
 */
export function createCampStructures(THREE, mats = {}) {
  const material = (key, color, extra = {}) => {
    const m = mats[key] ? mats[key].clone() : new THREE.MeshStandardMaterial({ color });
    Object.assign(m, extra);
    return m;
  };
  const M = {
    wood: material('wood', 0x625241, { roughness: 0.95 }),
    metal: material('metal', 0x51514a, { roughness: 0.73, metalness: 0.62 }),
    rust: material('rust', 0x785442, { roughness: 0.91, metalness: 0.33, side: THREE.DoubleSide }),
    canvas: material('canvas', 0xb99a42, { roughness: 0.98, side: THREE.DoubleSide }),
    olive: material('olive', 0x555d38, { roughness: 0.98, side: THREE.DoubleSide }),
    container: material('container', 0x747f71, { roughness: 0.87, metalness: 0.35, side: THREE.DoubleSide }),
    rubber: material('rubber', 0x232522, { roughness: 0.98 }),
    brass: material('brass', 0x9b8958, { roughness: 0.61, metalness: 0.6 }),
    ceramic: material('ceramic', 0x777366, { roughness: 0.99 }),
    rope: new THREE.MeshStandardMaterial({ color: 0x7c7454, roughness: 1 }),
    stitch: new THREE.MeshStandardMaterial({ color: 0x706139, roughness: 1 }),
    window: new THREE.MeshStandardMaterial({ color: 0x617877, roughness: 0.26, metalness: 0.15, transparent: true, opacity: 0.30, side: THREE.DoubleSide }),
    inside: new THREE.MeshStandardMaterial({ color: 0x777263, roughness: 1, side: THREE.DoubleSide }),
  };
  const geos = new Map();
  const vector = (a) => new THREE.Vector3(...a);
  const geoBox = (w, h, d) => {
    const key = `box:${w}:${h}:${d}`;
    if (!geos.has(key)) geos.set(key, new THREE.BoxGeometry(w, h, d));
    return geos.get(key);
  };
  const box = (parent, w, h, d, x, y, z, mat, rz = 0) => {
    const mesh = new THREE.Mesh(geoBox(w, h, d), mat);
    mesh.position.set(x, y, z); mesh.rotation.z = rz;
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    return mesh;
  };
  const cylinderGeo = (r, segments = 7, topR = r) => {
    const key = `cyl:${r}:${segments}:${topR}`;
    if (!geos.has(key)) geos.set(key, new THREE.CylinderGeometry(topR, r, 1, segments));
    return geos.get(key);
  };
  const rod = (parent, a, b, r, mat, segments = 7) => {
    const start = vector(a), end = vector(b), delta = end.clone().sub(start);
    const mesh = new THREE.Mesh(cylinderGeo(r, segments), mat);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
    mesh.scale.y = delta.length(); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  };
  const timber = (parent, a, b, w = 0.12, d = w, mat = M.wood) => {
    const start = vector(a), end = vector(b), delta = end.clone().sub(start);
    const mesh = new THREE.Mesh(geoBox(w, 1, d), mat);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
    mesh.scale.y = delta.length(); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  };
  const meshFrom = (parent, vertices, indices, uvs, mat) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  };
  function grid(parent, nx, ny, point, uv, mat, skip = null) {
    const positions = [], uvs = [], indices = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      positions.push(...point(i / nx, j / ny)); uvs.push(...uv(i / nx, j / ny));
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      if (skip && skip((i + 0.5) / nx, (j + 0.5) / ny)) continue;
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
    return meshFrom(parent, positions, indices, uvs, mat);
  }
  function patch(parent, poly, z, mat, uvScale = 2.5) {
    const shape = new THREE.Shape(); shape.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) shape.lineTo(poly[i][0], poly[i][1]);
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / uvScale, uv.getY(i) / uvScale);
    const mesh = new THREE.Mesh(geo, mat); mesh.position.z = z;
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function ring(parent, x, y, z, radius, mat = M.metal, rotation = [0,0,0]) {
    const key = `ring:${radius}`;
    if (!geos.has(key)) geos.set(key, new THREE.TorusGeometry(radius, radius * 0.21, 4, 9));
    const m = new THREE.Mesh(geos.get(key), mat); m.position.set(x,y,z); m.rotation.set(...rotation);
    parent.add(m); return m;
  }
  function bolt(parent, x, y, z, mat = M.metal, facing = 'z') {
    const b = new THREE.Mesh(cylinderGeo(0.026, 6), mat); b.scale.y = 0.018;
    if (facing === 'z') b.rotation.x = Math.PI / 2;
    if (facing === 'x') b.rotation.z = Math.PI / 2;
    b.position.set(x,y,z); parent.add(b); return b;
  }
  function corrugated(parent, x0, x1, y0, y1, planeZ, mat, period = 0.17, amplitude = 0.023) {
    return grid(parent, Math.ceil((x1-x0) / period * 6), 2,
      (u,v) => { const x=x0+(x1-x0)*u; return [x,y0+(y1-y0)*v,planeZ + amplitude * Math.cos(x * Math.PI*2 / period)]; },
      (u,v) => [(x0+(x1-x0)*u)/3,(y0+(y1-y0)*v)/3], mat);
  }
  function sagRope(parent, a, b, radius = 0.013, sag = 0.04, mat = M.rope) {
    let previous = a;
    for (let k = 1; k <= 5; k++) {
      const t=k/5; const current=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sag*4*t*(1-t),a[2]+(b[2]-a[2])*t];
      rod(parent,previous,current,radius,mat,5); previous=current;
    }
  }
  function addGuy(parent, a, b, mat) {
    sagRope(parent,a,b,0.012,0.03);
    rod(parent,[b[0]-0.03,b[1]-0.03,b[2]],[b[0]+0.10,b[1]+0.17,b[2]-0.025],0.022,M.metal,5);
    ring(parent,...a,0.039,M.metal);
    // Reinforced stitched triangular cloth at every tension point.
    const s=a[0]<0?-1:1;
    meshFrom(parent,[a[0],a[1]+0.01,a[2],a[0]-s*0.28,a[1]+0.13,a[2]-0.15,a[0]-s*0.28,a[1]+0.13,a[2]+0.15],[0,1,2],[0,0,0.5,1,1,0],mat);
  }
  function makeTent(w,d,eave,peak,doorW,doorH,mat,large,variant) {
    const root=new THREE.Group(); root.name=large?`MEG-yellow-field-tent-${variant+1}`:`olive-sleeping-tent-${variant+1}`;
    const hw=w/2, hd=d/2, roofDrop=peak-eave, uvScale=large?3:2;
    const frameZ=large?[-hd+0.09,-hd/2,0,hd/2,hd-0.09]:[-hd+0.07,0,hd-0.07];
    const poleRadius=large?0.037:0.027;
    // Real paired sloping roof sheets with visible catenary pockets between ribs.
    for(const side of [-1,1]){
      grid(root,20,large?40:24,(u,v)=>{
        const z=-hd+d*v, x=side*hw*u;
        const span=Math.sin(Math.PI*((v* (frameZ.length-1))%1));
        const sag=(large?0.095:0.055)*Math.sin(Math.PI*u)*span*span;
        const fold=0.021*Math.sin(z*7.7+u*5.2+variant)*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
        return[x,peak-roofDrop*u-sag+fold,z];
      },(u,v)=>[u*Math.hypot(hw,roofDrop)/uvScale,v*d/uvScale],mat);
      // Sagged eaves / broad rain skirt, not paper-thin straight cut-outs.
      grid(root,1,large?40:24,(u,v)=>[side*(hw+0.025+0.04*Math.sin(v*39)),eave-0.17*u-0.025*Math.sin(v*31)**2,-hd+d*v],(u,v)=>[v*d/uvScale,u*0.2],mat);
      rod(root,[side*(hw-0.05),eave-0.07,-hd+0.06],[side*(hw-0.05),eave-0.07,hd-0.06],poleRadius,M.metal);
      // Continuous side wall: window opening is omitted in its geometry.
      const windowCenters=large?[-2.25,2.25]:[0];
      const windowW=large?1.0:0.8, windowBottom=large?1.2:0.57, windowTop=large?1.95:1.10;
      const nx=large?80:48, ny=large?49:26;
      grid(root,nx,ny,(u,v)=>{
        const z=-hd+d*u; const y=eave*v;
        const bulge=0.045*Math.sin(v*Math.PI)*Math.sin(u*Math.PI)*Math.cos(z*1.8);
        const crease=0.016*Math.sin(z*22+v*2.8)*Math.sin(v*Math.PI);
        return[side*(hw+bulge+crease),y,z];
      },(u,v)=>[u*d/uvScale,v*eave/uvScale],mat,(u,v)=>{
        const z=-hd+d*u,y=eave*v;
        return windowCenters.some(c=>Math.abs(z-c)<windowW/2&&y>windowBottom&&y<windowTop);
      });
      // Translucent mesh inserts and rolled canvas storm covers.
      for(const cz of windowCenters){
        const x=side*(hw+0.075), wy=(windowBottom+windowTop)/2, wh=windowTop-windowBottom;
        const insert=new THREE.Mesh(geoBox(0.012,wh,windowW),M.window); insert.position.set(x,wy,cz); root.add(insert);
        for(const yy of [windowBottom,windowTop]) box(root,0.025,0.044,windowW+0.09,x+side*0.01,yy,cz,mat);
        for(const zz of [cz-windowW/2,cz+windowW/2]) box(root,0.025,wh,0.045,x+side*0.01,wy,zz,mat);
        for(let q=1;q<4;q++) rod(root,[x,windowBottom,cz-windowW/2+windowW*q/4],[x,windowTop,cz-windowW/2+windowW*q/4],0.0055,M.rope,4);
        rod(root,[x,wy,cz-windowW/2],[x,wy,cz+windowW/2],0.0055,M.rope,4);
        const roll=rod(root,[x+side*0.03,windowTop+0.08,cz-windowW/2-0.07],[x+side*0.03,windowTop+0.08,cz+windowW/2+0.07],large?0.08:0.058,mat,9);
        roll.name='rolled-up-canvas-window-cover';
        for(const zz of [cz-windowW*0.30,cz+windowW*0.30]){
          rod(root,[x+side*0.113,windowTop+0.15,zz],[x+side*0.113,windowTop-0.09,zz],0.013,M.rope,5);
        }
      }
      // Uneven storm flap weighted onto the ground along both sides.
      grid(root,large?40:24,2,(u,v)=>[side*(hw+v*0.22),0.045+(1-v)*0.09+Math.sin(u*52+variant)*0.025,-hd+d*u],(u,v)=>[u*d/uvScale,v*.2],mat);
    }
    for(const z of frameZ){
      for(const side of [-1,1]){
        rod(root,[side*(hw-0.055),0.06,z],[side*(hw-0.055),eave-0.08,z],poleRadius,M.metal);
        rod(root,[side*(hw-0.055),eave-0.08,z],[0,peak-0.05,z],poleRadius,M.metal);
        // Small angled knee braces fixed to the actual posts and rafters.
        const bx=side*(hw-0.055-0.49);
        rod(root,[side*(hw-0.055),eave-0.52,z],[bx,eave+roofDrop*0.49/hw-0.08,z],poleRadius*.70,M.metal);
        box(root,0.13,0.04,0.15,side*(hw-0.055),0.02,z,M.metal);
      }
    }
    rod(root,[0,peak-0.055,-hd-0.16],[0,peak-0.055,hd+0.16],poleRadius*1.2,M.metal);
    // Ridge reinforcement; matching roof-seam tapes at each load-bearing frame.
    box(root,0.1,0.027,d+0.035,0,peak+0.012,0,mat);
    for(const z of frameZ){
      for(const side of [-1,1]) rod(root,[0,peak+0.019,z],[side*hw,eave+0.017,z],0.013,M.stitch,4);
    }
    const halfDoor=doorW/2;
    for(const end of [-1,1]){
      const z=end*(hd+0.006);
      // Lower central notch forms a genuinely walkable opening on both ends.
      patch(root,[[-hw,0],[-halfDoor,0],[-halfDoor,doorH],[halfDoor,doorH],[halfDoor,0],[hw,0],[hw,eave],[0,peak],[-hw,eave]],z,mat,uvScale);
      for(const side of [-1,1]){
        rod(root,[side*(halfDoor+0.03),0.06,z-end*0.055],[side*(halfDoor+0.03),doorH+0.03,z-end*0.055],poleRadius*.85,M.metal);
        // Tied-back door fabric folds; both sides retain their draping cloth edges.
        grid(root,6,18,(u,v)=>{
          const y=doorH*v;
          const pin=Math.sin(Math.PI*v);
          const x=side*(halfDoor+0.095+0.20*u+0.09*Math.cos(v*6.1));
          return[x,y,z+end*(0.036+0.045*Math.sin(u*15+v*3)+pin*.055)];
        },(u,v)=>[u*.38/uvScale,v*doorH/uvScale],mat);
        rod(root,[side*(halfDoor+0.04),doorH*.44,z+end*.13],[side*(halfDoor+.34),doorH*.44,z+end*.13],.016,M.rope,5);
      }
      rod(root,[-halfDoor-.03,doorH+.03,z-end*.055],[halfDoor+.03,doorH+.03,z-end*.055],poleRadius*.85,M.metal);
      // Gable stitching and rain hood track the triangular construction.
      for(const side of [-1,1]) rod(root,[0,peak+.01,z+end*.013],[side*hw,eave+.01,z+end*.013],.012,M.stitch,4);
      const peakAnchor=[hw*.72*(variant%2?-1:1),0.05,end*(hd+1.15)];
      addGuy(root,[0,peak+.02,z],[peakAnchor[0],peakAnchor[1],peakAnchor[2]],mat);
    }
    const guyZ=large?[-hd+.22,-hd/2,hd/2,hd-.22]:[-hd+.15,0,hd-.15];
    for(const side of [-1,1]) for(const z of guyZ) addGuy(root,[side*hw,eave-.025,z],[side*(hw+(large?1.05:.75)),.06,z+(z>0?.2:-.2)],mat);
    if(large && mats.insignia){
      const insigniaMat=mats.insignia.clone(); insigniaMat.side=THREE.DoubleSide;
      const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.05,0.8),insigniaMat);
      sign.position.set(-2.42,1.57,hd+.047); sign.name='generated-MEG-field-unit-insignia'; root.add(sign);
    }
    // Individual duckboards form practical threshold crossings.
    for(const z of [-hd,hd]) for(let q=0;q<4;q++) box(root,doorW+.28,.045,.15,0,.034,z+(q-1.5)*.18,M.wood);
    root.userData={width:w,depth:d,height:peak,doorWidth:doorW,doorHeight:doorH,footprintWithRopes:[w+(large?2.2:1.6),d+2.5],entryDirection:'+z',interiorBounds:{min:[-hw+.12,0,-hd+.15],max:[hw-.12,eave-.12,hd-.15]}};
    return root;
  }
  function makeContainer(){
    const root=new THREE.Group(); root.name='weathered-open-container-headquarters';
    const w=7,d=3.2,h=3,hw=w/2,hd=d/2;
    // Corner castings and edge rails establish a coherent shipping-container shell.
    for(const x of [-hw,hw]) for(const z of [-hd,hd]){
      box(root,.145,h,.145,x,h/2,z,M.container);
      for(const y of [.085,h-.085]){
        box(root,.235,.17,.235,x,y,z,M.metal);
        box(root,.085,.055,.013,x,y,z+(z<0?-.122:.122),M.rubber);
      }
    }
    for(const z of [-hd,hd]) for(const y of [.12,h-.065]) box(root,w,.13,.11,0,y,z,M.container);
    for(const x of [-hw,hw]) for(const y of [.12,h-.065]) box(root,.11,.13,d,x,y,0,M.container);
    const rear=corrugated(root,-hw+.1,hw-.1,.2,h-.12,-hd,M.container); rear.name='corrugated-rear-wall';
    for(const side of [-1,1]){
      const sideWall=new THREE.Group(); root.add(sideWall); sideWall.position.x=side*hw; sideWall.rotation.y=side*Math.PI/2;
      corrugated(sideWall,-hd+.09,hd-.09,.2,h-.12,0,M.container);
    }
    const windowLeft=-2.8,windowRight=-1.15,windowBottom=1.13,windowTop=2.12;
    const doorLeft=1.52,doorRight=2.88,doorTop=2.35;
    // Front wall broken around the real door and window apertures.
    for(const [left,right,bottom,top] of [
      [-hw+.1,windowLeft,.2,h-.12],[windowLeft,windowRight,.2,windowBottom],[windowLeft,windowRight,windowTop,h-.12],
      [windowRight,doorLeft,.2,h-.12],[doorLeft,doorRight,doorTop,h-.12],[doorRight,hw-.1,.2,h-.12]
    ]) corrugated(root,left,right,bottom,top,hd,M.container);
    // Floor is visibly inset and high enough to clear soil without sealing the doorway.
    box(root,w-.19,.13,d-.15,0,.13,0,M.metal);
    for(let q=0;q<17;q++) box(root,.395,.035,d-.22,-3.27+q*.407,.211,0,M.wood);
    // Corrugated roof with slight longitudinal camber; under-roof beams visible inside.
    grid(root,84,12,(u,v)=>{const x=-hw+w*u,z=-hd+d*v; return[x,h+.024*Math.cos(x*37)+.028*Math.sin(v*Math.PI),z];},(u,v)=>[u*w/3,v*d/3],M.container);
    for(const x of [-2.8,-1.4,0,1.4,2.8]) box(root,.045,.09,d-.12,x,h-.095,0,M.metal);
    for(const x of [-3.0,-1.5,0,1.5,3.0]) box(root,.045,h-.45,.05,x,h/2+.03,-hd+.06,M.inside);
    // Deep window opening, black seal, dirty translucent glass and welded security bars.
    const wx=(windowLeft+windowRight)/2,wy=(windowBottom+windowTop)/2,ww=windowRight-windowLeft,wh=windowTop-windowBottom;
    for(const x of [windowLeft,windowRight]) box(root,.09,wh+.16,.17,x,wy,hd-.015,M.metal);
    for(const y of [windowBottom,windowTop]) box(root,ww+.16,.09,.17,wx,y,hd-.015,M.metal);
    box(root,ww-.09,wh-.09,.018,wx,wy,hd+.019,M.window);
    box(root,.04,wh,.055,wx,wy,hd+.075,M.metal);
    box(root,ww,.04,.055,wx,wy-.07,hd+.075,M.metal);
    box(root,ww+.25,.045,.30,wx,windowBottom-.035,hd+.07,M.rust);
    for(let k=1;k<5;k++) rod(root,[windowLeft+ww*k/5,windowBottom,hd+.14],[windowLeft+ww*k/5,windowTop,hd+.14],.012,M.metal,5);
    // Entry frame, fixed outward-open leaf, realistic hinge knuckles and two lock bars.
    for(const x of [doorLeft,doorRight]) box(root,.10,doorTop-.13,.16,x,(doorTop+.13)/2,hd,M.metal);
    box(root,doorRight-doorLeft+.14,.1,.17,(doorLeft+doorRight)/2,doorTop,hd,M.metal);
    const leaf=new THREE.Group(); leaf.position.set(doorRight,0,hd+.085); leaf.rotation.y=.93; leaf.name='outward-open-container-door'; root.add(leaf);
    const doorW=doorRight-doorLeft-.06;
    corrugated(leaf,-doorW,0,.20,doorTop-.055,0,M.container,.17,.020);
    for(const x of [-doorW,0]) box(leaf,.064,doorTop-.25,.075,x,(doorTop+.15)/2,0,M.metal);
    for(const y of [.22,doorTop-.07]) box(leaf,doorW,.064,.075,-doorW/2,y,0,M.metal);
    for(const x of [-doorW*.76,-doorW*.24]){
      rod(leaf,[x,.31,.07],[x,doorTop-.12,.07],.018,M.metal,6);
      for(const y of [.5,1.28,2.09]) box(leaf,.085,.055,.06,x,y,.083,M.metal);
      rod(leaf,[x,1.19,.105],[x-.15,1.19,.17],.018,M.metal,6);
      box(leaf,.15,.075,.024,x-.17,1.19,.168,M.brass);
    }
    for(const y of [.46,1.23,2.07]){
      rod(root,[doorRight+.035,y-.095,hd+.078],[doorRight+.035,y+.095,hd+.078],.032,M.metal,7);
      box(leaf,.16,.07,.036,-.08,y,.06,M.metal);
    }
    // Two low salvage steps bridge the container floor height.
    box(root,1.45,.10,.32,(doorLeft+doorRight)/2,.05,hd+.42,M.wood);
    box(root,1.44,.11,.25,(doorLeft+doorRight)/2,.11,hd+.17,M.metal);
    // Diagonal patched rain visor above the entrance, with its actual brackets.
    const visor=box(root,1.74,.045,.62,(doorLeft+doorRight)/2,2.61,hd+.26,M.rust); visor.rotation.x=.13;
    for(const x of [doorLeft-.08,doorRight+.08]) rod(root,[x,2.35,hd+.04],[x,2.57,hd+.56],.018,M.metal,5);
    if(mats.insignia){
      const sign=new THREE.Mesh(new THREE.PlaneGeometry(.82,.64),mats.insignia); sign.position.set(.10,1.65,hd+.052); root.add(sign);
    }
    root.userData={width:w,depth:d,height:h,entryDirection:'+z',doorCenter:[2.2,.22,1.6],interiorBounds:{min:[-3.35,.23,-1.46],max:[3.35,2.85,1.44]}};
    return root;
  }
  function makeShelter(){
    const root=new THREE.Group();root.name='salvage-corrugated-open-fire-shelter';
    const roofY=(x,z)=>3.15+x*.037-z*.061;
    const corners=[[-3.25,-2.7],[3.25,-2.7],[-3.25,2.7],[3.25,2.7]];
    for(const [x,z] of corners){
      box(root,.32,.075,.32,x,.038,z,M.ceramic);
      rod(root,[x,.075,z],[x,roofY(x,z)-.08,z],.115,M.wood,8);
      for(const dx of [-1,1]) if(Math.abs(x+dx*.65)<3.26) timber(root,[x,roofY(x,z)-.77,z],[x+dx*.65,roofY(x+dx*.65,z)-.16,z],.075,.08);
      for(const dz of [-1,1]) if(Math.abs(z+dz*.65)<2.71) timber(root,[x,roofY(x,z)-.80,z],[x,roofY(x,z+dz*.65)-.16,z+dz*.65],.075,.08);
      box(root,.22,.32,.024,x,roofY(x,z)-.28,z+.119,M.rust);
      bolt(root,x,roofY(x,z)-.24,z+.136);
    }
    for(const z of [-2.7,2.7]) timber(root,[-3.41,roofY(-3.41,z)-.16,z],[3.41,roofY(3.41,z)-.16,z],.16,.18);
    for(const x of [-3.25,3.25]) timber(root,[x,roofY(x,-2.89)-.16,-2.89],[x,roofY(x,2.89)-.16,2.89],.16,.16);
    for(const z of [-2.7,-1.35,0,1.35,2.7]) timber(root,[-3.55,roofY(-3.55,z)-.065,z],[3.55,roofY(3.55,z)-.065,z],.07,.085);
    // Separately overlapped sheets with corrugations, buckled edges and visible fasteners.
    for(let s=0;s<6;s++){
      const x0=-3.65+s*1.22,x1=x0+1.29;
      grid(root,36,16,(u,v)=>{
        const x=x0+(x1-x0)*u,z=-3.1+6.2*v;
        const wave=.035*Math.cos(x*2*Math.PI/.18);
        const edge=(Math.sin(v*Math.PI)**12)*.018*Math.sin(u*13+s);
        return[x,roofY(x,z)+wave+s*.002+edge,z];
      },(u,v)=>[u*1.29/2.5,v*6.2/2.5],M.rust);
      for(const z of [-2.7,0,2.7]) for(const u of [.08,.91]){
        const x=x0+1.29*u; bolt(root,x,roofY(x,z)+.05,z,M.metal,'y');
      }
    }
    root.userData={width:7.4,depth:6.2,height:3.55,postCenters:corners,clearHeight:2.78,fireCenter:[0,0,0]}; return root;
  }
  const animatedGates=[];
  function makeGate(index){
    const root=new THREE.Group();root.name=`salvage-double-gate-${index+1}`;
    const half=2.4,leafW=2.30;
    for(const side of [-1,1]){
      rod(root,[side*half,0,0],[side*(half+.025),2.62,0],.135,M.wood,8);
      box(root,.27,.12,.29,side*half,.065,0,M.rust);
      // Braces reach the ground behind each fixed hinge post.
      rod(root,[side*(half+.05),1.47,-.02],[side*(half+.70),.05,-.70],.073,M.wood,7);
    }
    const pivots=[];
    for(const side of [-1,1]){
      const pivot=new THREE.Group(); pivot.position.set(side*half,0,.022);root.add(pivot);pivots.push(pivot);
      const direction=-side,center=direction*leafW/2;
      for(const y of [.38,1.88]) box(pivot,leafW,.135,.105,center,y,0,M.wood);
      timber(pivot,[direction*.06,.38,-.073],[direction*(leafW-.04),1.87,-.073],.105,.09);
      const count=11;
      for(let q=0;q<count;q++){
        const x=direction*(.095+q*(leafW-.15)/(count-1));
        const ph=2.0+.15*Math.sin(q*2.53+index*3+side),py=.14+ph/2;
        const plank=box(pivot,.17+.021*Math.sin(q*1.4),ph,.067,x,py,.05+.025*Math.sin(q*3.71),M.wood,.014*Math.sin(q*5+index));
        plank.name='uneven-reclaimed-gate-plank';
        for(const y of [.38,1.88]) bolt(pivot,x,y,.096+.025*Math.sin(q*3.71),M.metal);
      }
      // Rusted patches do not completely hide the underlying irregular timber boards.
      const p=new THREE.Group(); pivot.add(p);p.position.set(center+(side<0?.32:-.22),.68,.107);p.rotation.z=(side<0?-.065:.045);
      corrugated(p,-.53,.53,0,.95,0,M.rust,.15,.023);
      for(const xx of [-.48,.48]) for(const yy of [.055,.89]) bolt(p,xx,yy,.034);
      for(const y of [.51,1.70]){
        box(pivot,.32,.085,.023,direction*.15,y,.11,M.rust);
        rod(root,[side*half,y-.09,.055],[side*half,y+.09,.055],.045,M.metal,7);
      }
      box(pivot,.27,.10,.055,direction*(leafW-.10),1.08,.14,M.metal);
      ring(pivot,direction*(leafW-.19),1.075,.205,.065,M.metal);
    }
    // Left leaf's latch spans the center seam when closed.
    box(pivots[0],.43,.045,.056,leafW-.05,1.12,.18,M.metal);
    const state={root,pivots,open:index===1,angle:index===1?1.05:0};
    pivots[0].rotation.y=-state.angle;pivots[1].rotation.y=state.angle;
    root.userData={width:4.8,depth:1,height:2.62,gateIndex:index,isOpen:state.open,gatePivots:pivots,interactionType:'camp-gate'};
    animatedGates.push(state);return root;
  }
  const container=makeContainer();
  const largeTents=[makeTent(8,10,2.45,4.1,2.0,2.32,M.canvas,true,0),makeTent(8,10,2.45,4.1,2.0,2.32,M.canvas,true,1)];
  const smallTents=Array.from({length:4},(_,i)=>makeTent(3.8,4.8,1.3,2.5,1.3,1.95,M.olive,false,i));
  const restShelter=makeShelter();
  const gates=[makeGate(0),makeGate(1)];
  return {
    container,largeTents,smallTents,restShelter,gates,
    dynamicRoots: animatedGates.flatMap(gate => gate.pivots),
    toggleGate(i){const gate=animatedGates[i];if(!gate)return false;gate.open=!gate.open;gate.root.userData.isOpen=gate.open;return gate.open;},
    update(time,dt=1/60){
      const blend=1-Math.exp(-Math.min(Math.max(dt,0),.08)*3.1);
      for(const gate of animatedGates){gate.angle+=((gate.open?1.28:0)-gate.angle)*blend;gate.pivots[0].rotation.y=-gate.angle;gate.pivots[1].rotation.y=gate.angle;}
    },
  };
}
