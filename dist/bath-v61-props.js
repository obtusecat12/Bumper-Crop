/* Procedural, metre-scale PS2-era bathroom props. Front faces +Z; floor is y=0.
 * Only the caller's THREE namespace is used. All surface materials inherit the
 * supplied texture maps; no network, loaders, fonts, or addon dependencies.
 */

function surface(THREE, mats, key, color, options = {}) {
  const source = mats[key] || mats.plastic || mats.stone || Object.values(mats).find(m => m?.isMaterial);
  const material = source ? source.clone() : new THREE.MeshStandardMaterial();
  if (color !== undefined && material.color) material.color.set(color);
  Object.assign(material, options);
  return material;
}

function object(THREE, group, name, geometry, material, x=0, y=0, z=0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name; mesh.position.set(x,y,z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  group.add(mesh); return mesh;
}

// A solid extrusion with rounded face corners and genuinely beveled front/rear edges.
function roundedBox(THREE, w, h, d, radius=0.012) {
  const r = Math.min(radius,w*.24,h*.24,d*.45);
  const b = Math.min(r*.42,d*.18);
  const x = w/2-b, y = h/2-b, c = Math.max(.001,r-b);
  const s = new THREE.Shape();
  s.moveTo(-x+c,-y); s.lineTo(x-c,-y); s.quadraticCurveTo(x,-y,x,-y+c);
  s.lineTo(x,y-c); s.quadraticCurveTo(x,y,x-c,y);
  s.lineTo(-x+c,y); s.quadraticCurveTo(-x,y,-x,y-c);
  s.lineTo(-x,-y+c); s.quadraticCurveTo(-x,-y,-x+c,-y);
  const g = new THREE.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelSize:b,
    bevelThickness:b,bevelSegments:1,steps:1,curveSegments:3});
  g.translate(0,0,-d/2+b); return g;
}

function tube(THREE, group, name, points, radius, material, segments=20, radial=6) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return object(THREE,group,name,new THREE.TubeGeometry(curve,segments,radius,radial,false),material);
}

function beam(THREE,group,name,a,b,topRadius,bottomRadius,material,sides=6) {
  const av=new THREE.Vector3(...a), bv=new THREE.Vector3(...b), delta=bv.clone().sub(av);
  const m=object(THREE,group,name,new THREE.CylinderGeometry(topRadius,bottomRadius,delta.length(),sides),material);
  m.position.copy(av.add(bv).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  return m;
}

function lathe(THREE, profile, segments=24) {
  return new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),segments);
}

function metadata(group, dimensions, description) {
  group.userData.prop = {units:'metres',front:'+Z',groundY:0,dimensions,description};
  return group;
}

function ground(THREE, group) {
  const bounds=new THREE.Box3().setFromObject(group);
  for(const child of group.children) child.position.y-=bounds.min.y;
  return group;
}

export function makeDispenser(THREE, mats={}) {
  const g=new THREE.Group(); g.name='Water_Dispenser_1986';
  const abs=surface(THREE,mats,'plastic',0xd6ccac,{roughness:.76});
  const edge=surface(THREE,mats,'plastic',0xbeb9a3,{roughness:.8});
  const steel=surface(THREE,mats,'metal',0x9aa49f,{roughness:.34,metalness:.72});
  const dark=surface(THREE,mats,'dark',0x182526,{roughness:.91});
  const red=surface(THREE,mats,'plastic',0x983529,{roughness:.62});
  const blue=surface(THREE,mats,'plastic',0x326a78,{roughness:.62});
  const jug=surface(THREE,mats,'glass',0xadcbd0,{transparent:true,opacity:.28,roughness:.15,depthWrite:false,side:THREE.DoubleSide,map:mats.plastic?.map,normalMap:mats.plastic?.normalMap,normalScale:new THREE.Vector2(.06,.06)});
  const water=surface(THREE,mats,'water',0x718f95,{transparent:true,opacity:.39,roughness:.19,depthWrite:false});
  const label=surface(THREE,mats,'label',0xd1cdb3,{roughness:.89,side:THREE.DoubleSide});

  // Split housing leaves a real, deep open dispensing niche.
  object(THREE,g,'ABS_lower_reservoir',roundedBox(THREE,.424,.092,.366,.025),abs,0,.063,-.01);
  object(THREE,g,'ABS_left_cheek',roundedBox(THREE,.062,.357,.366,.019),abs,-.181,.273,-.01);
  object(THREE,g,'ABS_right_cheek',roundedBox(THREE,.062,.357,.366,.019),abs,.181,.273,-.01);
  object(THREE,g,'ABS_upper_fascia',roundedBox(THREE,.424,.094,.37,.022),abs,0,.451,-.008);
  object(THREE,g,'ABS_rear_panel',roundedBox(THREE,.32,.34,.038,.009),edge,0,.27,-.17);
  object(THREE,g,'Niche_stainless_back',roundedBox(THREE,.303,.26,.013,.004),steel,0,.258,-.14);
  object(THREE,g,'Niche_top_shadow',roundedBox(THREE,.309,.026,.286,.006),dark,0,.399,.011);
  for (let side of [-1,1]) {
    object(THREE,g,'Rubber_foot_'+side+'_front',roundedBox(THREE,.059,.019,.049,.005),dark,side*.151,.0095,.117);
    object(THREE,g,'Rubber_foot_'+side+'_rear',roundedBox(THREE,.059,.019,.049,.005),dark,side*.151,.0095,-.137);
  }
  // Upper face inset and a molded indicator window.
  object(THREE,g,'Front_brand_inset',roundedBox(THREE,.127,.029,.003,.004),label,0,.455,.179);
  object(THREE,g,'Power_indicator_bezel',roundedBox(THREE,.017,.010,.004,.002),dark,.158,.455,.182);
  object(THREE,g,'Power_indicator_lens',roundedBox(THREE,.008,.005,.003,.001),blue,.158,.455,.185);
  for (const [i,x] of [-.077,.077].entries()) {
    object(THREE,g,'Tap_mount_'+i,new THREE.CylinderGeometry(.018,.018,.024,10),steel,x,.374,.057).rotation.x=Math.PI/2;
    tube(THREE,g,'Bent_stainless_nozzle_'+i,[[x,.369,.054],[x,.37,.12],[x,.358,.168],[x,.335,.169]],.010,steel,14,8);
    object(THREE,g,'Nozzle_dark_bore_'+i,new THREE.CylinderGeometry(.0069,.0069,.002,10),dark,x,.324,.169);
    object(THREE,g,'Nozzle_lip_'+i,new THREE.TorusGeometry(.0082,.0016,4,10),steel,x,.325,.169).rotation.x=Math.PI/2;
    const lever=object(THREE,g,i===0?'Hot_red_lever':'Cold_blue_lever',roundedBox(THREE,.027,.044,.032,.005),i===0?red:blue,x,.378,.209);
    lever.rotation.x=-.22;
    object(THREE,g,'Lever_pivot_'+i,new THREE.CylinderGeometry(.006,.006,.034,8),steel,x,.389,.181).rotation.z=Math.PI/2;
  }
  // Separate tray rim, wet inner basin, and open steel grate.
  object(THREE,g,'Drip_tray_pan',roundedBox(THREE,.327,.028,.197,.019),steel,0,.107,.126);
  object(THREE,g,'Drip_tray_dark_recess',roundedBox(THREE,.292,.008,.16,.01),dark,0,.123,.126);
  object(THREE,g,'Wet_drain_basin',roundedBox(THREE,.285,.001,.153,.008),water,0,.128,.126);
  object(THREE,g,'Tray_front_lip',roundedBox(THREE,.31,.012,.011,.004),steel,0,.137,.218);
  object(THREE,g,'Tray_rear_lip',roundedBox(THREE,.31,.012,.011,.004),steel,0,.137,.035);
  const grateGeometry=roundedBox(THREE,.006,.006,.166,.002);
  for(let i=0;i<12;i++) object(THREE,g,'Drip_grate_bar_'+i,grateGeometry,steel,-.138+i*.0251,.137,.126);
  object(THREE,g,'Bottle_socket',new THREE.CylinderGeometry(.075,.08,.018,24),dark,0,.501,-.022);
  object(THREE,g,'Bottle_neck_collar',lathe(THREE,[[.047,.496],[.049,.526],[.048,.55]],20),blue,0,0,-.022);
  for(let i=0;i<3;i++) object(THREE,g,'Cap_thread_'+i,new THREE.TorusGeometry(.048,.002,4,20),blue,0,.512+i*.01,-.022).rotation.x=Math.PI/2;

  const profile=[[.041,.529],[.048,.552],[.082,.566],[.133,.585],[.168,.614],[.183,.642]];
  for(let i=0;i<6;i++) { const y=.65+i*.043; profile.push([.181,y],[.187,y+.004],[.188,y+.010],[.181,y+.015],[.18,y+.035]); }
  profile.push([.180,.913],[.185,.923],[.183,.936],[.164,.955],[.131,.969],[.061,.976],[0,.977]);
  object(THREE,g,'Inverted_ribbed_polycarbonate_jug',lathe(THREE,profile,32),jug,0,0,-.022);
  object(THREE,g,'Water_inside_jug',lathe(THREE,[[0,.54],[.038,.54],[.044,.551],[.079,.573],[.126,.592],[.163,.62],[.172,.645],[.173,.838],[0,.838]],28),water,0,0,-.022);
  const waterTop=surface(THREE,mats,'water',0x9eb5b3,{transparent:true,opacity:.53,roughness:.15,depthWrite:false,side:THREE.DoubleSide});
  object(THREE,g,'Visible_waterline',new THREE.CircleGeometry(.173,28),waterTop,0,.839,-.022).rotation.x=-Math.PI/2;
  // The label follows the rounded bottle face and has a visible thin edge.
  object(THREE,g,'Curved_vintage_bottle_label',new THREE.CylinderGeometry(.190,.190,.103,16,1,true,-.69,1.38),label,0,.744,-.022);
  tube(THREE,g,'Trailing_power_cord',[[.126,.069,-.199],[.139,.047,-.266],[.193,.014,-.335],[.244,.008,-.417],[.21,.008,-.498],[.276,.009,-.565]],.0048,dark,32,5);
  object(THREE,g,'Power_plug',roundedBox(THREE,.026,.018,.045,.005),dark,.276,.013,-.584);
  for(const x of [.269,.283]) object(THREE,g,'Plug_pin_'+x,roundedBox(THREE,.003,.005,.017,.001),steel,x,.013,-.611);
  return metadata(g,{width:.55,height:.98,depth:.85,housingWidth:.424,housingDepth:.37},'Countertop dispenser, open recess, metal taps and grate, partially filled ribbed jug, trailing cord.');
}

// Solid curved rectangular ribbon used for the chair's actual separate back slats.
function solidRibbon(THREE,path,width,thickness,segments=9) {
  const p=[],uv=[],ix=[];
  for(let i=0;i<=segments;i++) {
    const t=i/segments,[x,y,z]=path(t), w=typeof width==='function'?width(t):width;
    for(const [dx,dz] of [[-w/2,-thickness/2],[w/2,-thickness/2],[w/2,thickness/2],[-w/2,thickness/2]]) {p.push(x+dx,y,z+dz); uv.push(dx<0?0:1,t);}
  }
  for(let i=0;i<segments;i++) for(let j=0;j<4;j++) {const a=i*4+j,b=i*4+(j+1)%4,c=b+4,d=a+4;ix.push(a,b,d,b,c,d);}
  ix.push(0,3,1,1,3,2); const e=segments*4; ix.push(e,e+1,e+3,e+1,e+2,e+3);
  const geometry=new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(ix);geometry.computeVertexNormals();return geometry;
}

export function makePlasticChair(THREE,mats={}) {
  const g=new THREE.Group();g.name='Monobloc_Chair_1984';
  const plastic=surface(THREE,mats,'plastic',0xd7d7bd,{roughness:.84});
  const scuff=surface(THREE,mats,'plastic',0xb7bbaa,{roughness:.91});
  object(THREE,g,'Thick_rounded_seat',roundedBox(THREE,.458,.041,.434,.047),plastic,0,.43,.015);
  object(THREE,g,'Underside_front_apron',roundedBox(THREE,.391,.048,.025,.008),plastic,0,.403,.178);
  for(const s of [-1,1]) {
    object(THREE,g,'Underside_side_apron_'+s,roundedBox(THREE,.024,.039,.351,.007),plastic,s*.188,.406,.005);
    for(const z of [-1,1]) {
      const leg=beam(THREE,g,'Flared_leg_'+s+'_'+z,[s*.231,.023,z*.234],[s*.176,.423,z*.155],.035,.024,plastic,4);
      leg.geometry.rotateY(Math.PI/4);
      object(THREE,g,'Worn_foot_'+s+'_'+z,roundedBox(THREE,.036,.007,.04,.003),scuff,s*.231,.0035,z*.234);
    }
    object(THREE,g,'Back_outer_rail_'+s,solidRibbon(THREE,t=>[s*(.187+.034*t),.446+.382*t,-.174-.079*t],t=>.044-.008*t,.024),plastic);
  }
  for(let i=0;i<5;i++) {
    const x=(i-2)*.069;
    object(THREE,g,'Separate_back_slat_'+i,solidRibbon(THREE,t=>[x*(1+.12*t),.463+.344*t,-.179-.092*t+.031*Math.pow(x/.2,2)],t=>.044-.008*Math.sin(Math.PI*t),.019),plastic);
  }
  tube(THREE,g,'Curved_top_back_rail',[[-.22,.823,-.253],[-.15,.839,-.267],[0,.849,-.277],[.15,.839,-.267],[.22,.823,-.253]],.02,plastic,20,6);
  tube(THREE,g,'Lower_back_cross_rail',[[-.186,.475,-.17],[0,.475,-.187],[.186,.475,-.17]],.016,plastic,12,6);
  return metadata(g,{width:.51,height:.869,depth:.555,seatHeight:.45},'Solid white monobloc chair with five separate curved slats, open gaps, beveled seat, flared legs.');
}

export function makeTelephone(THREE,mats={}) {
  const g=new THREE.Group();g.name='Pushbutton_Telephone_1982';
  const abs=surface(THREE,mats,'plastic',0xc7bb97,{roughness:.81});
  const keyMat=surface(THREE,mats,'plastic',0xc1c3ae,{roughness:.72});
  const dark=surface(THREE,mats,'dark',0x202b28,{roughness:.89});
  const label=surface(THREE,mats,'label',0xd9d3b3,{roughness:.87});
  const side=new THREE.Shape();side.moveTo(-.103,.009);side.lineTo(.103,.009);side.lineTo(.103,.078);side.lineTo(-.103,.043);side.closePath();
  const base=new THREE.ExtrudeGeometry(side,{depth:.249,bevelEnabled:true,bevelSegments:1,steps:1,bevelThickness:.008,bevelSize:.007});
  base.rotateY(Math.PI/2);base.translate(-.1245,0,0);
  object(THREE,g,'Inclined_ABS_phone_body',base,abs);
  object(THREE,g,'Phone_bottom_seam',roundedBox(THREE,.247,.012,.205,.012),dark,0,.009,0);
  for(const x of [-.092,.092]) for(const z of [-.073,.073]) object(THREE,g,'Telephone_rubber_foot_'+x+'_'+z,roundedBox(THREE,.035,.008,.027,.004),dark,x,.004,z);
  const plate=new THREE.Group();plate.name='Sloping_keypad';plate.position.set(0,.066,.026);plate.rotation.x=.168;g.add(plate);
  object(THREE,plate,'Keypad_surround',roundedBox(THREE,.139,.003,.124,.009),dark);
  const keyGeometry=roundedBox(THREE,.034,.01,.023,.003);
  const segments={a:[0,.007,0],b:[.005,.0035,1],c:[.005,-.0035,1],d:[0,-.007,0],e:[-.005,-.0035,1],f:[-.005,.0035,1],g:[0,0,0]};
  const glyphs=['bc','abged','abgcd','fgbc','afgcd','afgecd','abc','abcdefg','abfgcd','*','abcdef','#'];
  const horizontal=new THREE.BoxGeometry(.0078,.0007,.00125),vertical=new THREE.BoxGeometry(.00125,.0007,.0057);
  for(let r=0;r<4;r++) for(let c=0;c<3;c++) {
    const n=r*3+c, x=(c-1)*.041,z=(r-1.5)*.028;
    object(THREE,plate,'Pushbutton_'+['1','2','3','4','5','6','7','8','9','star','0','hash'][n],keyGeometry,keyMat,x,.006,z);
    if(n===9) {
      for(const rotation of [-.7,.7]) object(THREE,plate,'Star_mark_'+rotation,horizontal,dark,x,.0117,z).rotation.y=rotation;
    } else if(n===11) {
      for(const offset of [-.003,.003]) {object(THREE,plate,'Hash_horizontal_'+offset,horizontal,dark,x,.0117,z+offset);object(THREE,plate,'Hash_vertical_'+offset,vertical,dark,x+offset,.0117,z);}
    } else {
      for(const segment of glyphs[n]) {const [dx,dz,v]=segments[segment];object(THREE,plate,'Numeral_'+n+'_'+segment,v?vertical:horizontal,dark,x+dx,.0117,z-dz);}
    }
  }
  object(THREE,g,'Number_card',roundedBox(THREE,.073,.002,.018,.002),label,.006,.080,-.056).rotation.x=.168;
  for(const x of [-.102,.102]) {
    object(THREE,g,'Handset_cradle_'+x,roundedBox(THREE,.043,.038,.058,.008),abs,x,.098,-.071);
    object(THREE,g,'Cradle_switch_'+x,roundedBox(THREE,.007,.008,.015,.002),dark,x,.119,-.068);
    object(THREE,g,'Handset_earpiece_'+x,roundedBox(THREE,.068,.035,.074,.014),abs,x,.139,-.07);
    object(THREE,g,'Handset_earpiece_seam_'+x,roundedBox(THREE,.061,.006,.067,.012),dark,x,.122,-.07);
    for(let i=0;i<3;i++) object(THREE,g,'Receiver_vent_'+x+'_'+i,roundedBox(THREE,.023,.0015,.002,.0007),dark,x,.157,-.082+i*.009);
  }
  tube(THREE,g,'Curved_handset_grip',[[-.102,.143,-.07],[-.07,.16,-.074],[0,.168,-.078],[.07,.16,-.074],[.102,.143,-.07]],.0145,abs,22,8);
  const coils=[];
  coils.push([-.132,.131,-.068],[-.153,.089,-.076],[-.171,.036,-.083]);
  for(let i=0;i<=154;i++) {const t=i/154,theta=t*Math.PI*44;coils.push([-.167+.008*Math.cos(theta),.025+.007*Math.sin(theta),-.078+.163*t]);}
  coils.push([-.163,.024,.099],[-.14,.019,.118],[-.116,.022,.093]);
  tube(THREE,g,'Coiled_handset_cord',coils,.0025,dark,176,5);
  return metadata(g,{width:.311,height:.183,depth:.235},'Inclined pushbutton desk phone, raised readable numeral geometry, cradle, curved handset and coiled cord.');
}

export function makeTowel(THREE,mats={}) {
  const g=new THREE.Group();g.name='Draped_Cotton_Towel';
  const cloth=surface(THREE,mats,'towel',0xc4bd91,{roughness:.98,side:THREE.DoubleSide});
  const metal=surface(THREE,mats,'metal',0x777d6b,{metalness:.5,roughness:.57});
  const cols=24,rows=42,p=[],uv=[],ix=[];
  for(let j=0;j<=rows;j++) {
    const s=j/rows;
    let y,z,fold;
    if(s<.70) {const t=s/.70;y=.012+t*.703;z=.035+.008*Math.sin(t*Math.PI);fold=1-.78*t;}
    else if(s<.84) {const a=(s-.70)/.14*Math.PI;y=.715+.034*Math.sin(a);z=.034*Math.cos(a);fold=.2;}
    else {const t=(s-.84)/.16;y=.715-t*.24;z=-.034-t*.005;fold=.22+.55*t;}
    for(let i=0;i<=cols;i++) {
      const u=i/cols, wave=Math.sin(u*Math.PI*10+.45*Math.sin(s*5));
      const x=(u-.5)*(.493+.009*Math.sin(s*5))+.003*Math.sin(s*9+u*4);
      const edgeSag=.004*Math.cos(u*Math.PI*6)*Math.pow(1-Math.min(s/.7,1),6);
      p.push(x,y+edgeSag,z+.015*wave*fold+.003*Math.sin(u*21+s*9)*fold);uv.push(u,s);
    }
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;ix.push(a,c,b,b,c,d);}
  const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geom.setIndex(ix);geom.computeVertexNormals();
  // Sew the front/back skins together: cloth has physical 2.2 mm thickness.
  const normals=geom.attributes.normal.array,skinP=[],skinUV=[],skinIX=[],count=p.length/3;
  for(const direction of [1,-1]) for(let i=0;i<count;i++) {skinP.push(p[i*3]+normals[i*3]*.0011*direction,p[i*3+1]+normals[i*3+1]*.0011*direction,p[i*3+2]+normals[i*3+2]*.0011*direction);skinUV.push(uv[i*2],uv[i*2+1]);}
  skinIX.push(...ix);for(let i=0;i<ix.length;i+=3)skinIX.push(ix[i]+count,ix[i+2]+count,ix[i+1]+count);
  const sew=(a,b)=>skinIX.push(a,b,a+count,b,b+count,a+count);
  for(let i=0;i<cols;i++){sew(i+1,i);sew(rows*(cols+1)+i,rows*(cols+1)+i+1);}
  for(let j=0;j<rows;j++){sew(j*(cols+1),(j+1)*(cols+1));sew((j+1)*(cols+1)+cols,j*(cols+1)+cols);}
  const solidCloth=new THREE.BufferGeometry();solidCloth.setAttribute('position',new THREE.Float32BufferAttribute(skinP,3));solidCloth.setAttribute('uv',new THREE.Float32BufferAttribute(skinUV,2));solidCloth.setIndex(skinIX);solidCloth.computeVertexNormals();geom.dispose();
  object(THREE,g,'Folded_woven_cloth',solidCloth,cloth);
  // A narrow folded hem adds real edge thickness along the hanging front.
  const hemPoints=[];for(let i=0;i<=24;i++){const u=i/24;hemPoints.push([(u-.5)*.493+.003*Math.sin(u*4),.012+.004*Math.cos(u*Math.PI*6),.035+.015*Math.sin(u*Math.PI*10)+.003*Math.sin(u*21)]);}
  tube(THREE,g,'Rolled_bottom_hem',hemPoints,.0028,cloth,48,4);
  beam(THREE,g,'Towel_rail',[-.299,.715,0],[.299,.715,0],.012,.012,metal,10);
  for(const s of [-1,1]) {
    beam(THREE,g,'Rail_wall_bracket_'+s,[s*.294,.715,-.107],[s*.294,.715,0],.008,.008,metal,8);
    object(THREE,g,'Rail_wall_rosette_'+s,new THREE.CylinderGeometry(.023,.023,.006,12),metal,s*.294,.715,-.11).rotation.x=Math.PI/2;
  }
  ground(THREE,g);
  return metadata(g,{width:.634,height:.744,depth:.168,clothWidth:.5,clothHeight:.744,railHeight:.7098},'UV-mapped naturally folded cotton towel, physical 2.2 mm thickness, solid wall-mounted rail, front hem and shorter back flap.');
}

export function makeRockPlanter(THREE,mats={}) {
  const g=new THREE.Group();g.name='Limestone_Bowl_Planter';
  const stone=surface(THREE,mats,'stone',0x898b72,{roughness:1});
  const soil=surface(THREE,mats,'dark',0x37372a,{roughness:1});
  const foliage=surface(THREE,mats,'foliage',0x68764a,{roughness:.97,side:THREE.DoubleSide,alphaTest:.38});
  const leafDark=surface(THREE,mats,'foliage',0x465c35,{roughness:.97,side:THREE.DoubleSide,alphaTest:.38});
  const stem=surface(THREE,mats,'foliage',0x6b7150,{roughness:.98});
  const rings=[[.183,.006],[.228,.029],[.289,.081],[.323,.187],[.316,.264],[.298,.299],[.262,.299],[.268,.258],[.242,.198],[.188,.137],[0,.129]];
  const n=28,p=[],uv=[],ix=[];
  for(let r=0;r<rings.length;r++)for(let i=0;i<=n;i++) {
    const a=i/n*Math.PI*2,[radius,y]=rings[r];
    const noise=radius===0?0:(.006*Math.sin(a*5+.4)+.004*Math.sin(a*9+r*.67)+.003*Math.cos(a*3-r*.5));
    const yn=r===0?0:.006*Math.sin(a*6+r*.53);
    p.push((radius+noise)*Math.cos(a),Math.max(0,y+yn),(radius+noise)*Math.sin(a));uv.push(i/n*2,r/(rings.length-1));
  }
  for(let r=0;r<rings.length-1;r++)for(let i=0;i<n;i++){const a=r*(n+1)+i,b=a+1,c=a+n+1,d=c+1;ix.push(a,c,b,b,c,d);}
  const bowl=new THREE.BufferGeometry();bowl.setAttribute('position',new THREE.Float32BufferAttribute(p,3));bowl.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));bowl.setIndex(ix);bowl.computeVertexNormals();
  object(THREE,g,'Hollow_rough_limestone_bowl',bowl,stone);
  object(THREE,g,'Recessed_dark_soil',new THREE.CylinderGeometry(.243,.236,.035,28),soil,0,.206,0);
  const pebbleGeo=new THREE.IcosahedronGeometry(.022,0);
  for(let i=0;i<11;i++){const a=i*2.4,r=.08+.12*((i*7)%11)/11,m=object(THREE,g,'Soil_pebble_'+i,pebbleGeo,stone,Math.cos(a)*r,.227,Math.sin(a)*r);m.scale.set(.7+(i%3)*.17,.45,1);m.rotation.set(i*.7,i*.9,i*.3);}
  // Each leaf is a tapered curved alpha card, with a real silhouette even if the
  // caller uses a foliage texture without an alpha channel.
  for(let i=0;i<19;i++) {
    const angle=i*2.39996, length=.29+(i%5)*.057,reach=.15+(i%4)*.038;
    const root=[Math.cos(angle)*.048,.223,Math.sin(angle)*.048], positions=[],uvs=[],indices=[];
    const steps=9;
    for(let j=0;j<=steps;j++) {
      const t=j/steps, r=reach*Math.pow(t,1.3),y=.223+length*(Math.sin(t*Math.PI*.66)*.88+t*.10);
      const w=(.018+(i%3)*.008)*Math.pow(Math.sin(t*Math.PI),.7)+.0005;
      const cx=root[0]+Math.cos(angle)*r,cz=root[2]+Math.sin(angle)*r;
      for(const s of [-1,1]) {positions.push(cx+Math.cos(angle+Math.PI/2)*w*s,y-.012*Math.sin(t*Math.PI),cz+Math.sin(angle+Math.PI/2)*w*s);uvs.push(s<0?0:1,t);}
    }
    for(let j=0;j<steps;j++){const a=j*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    const leaf=new THREE.BufferGeometry();leaf.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));leaf.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));leaf.setIndex(indices);leaf.computeVertexNormals();
    object(THREE,g,'Curved_foliage_alpha_card_'+i,leaf,i%3===0?leafDark:foliage);
    const mid=[root[0]+Math.cos(angle)*reach*.36,.223+length*.63,root[2]+Math.sin(angle)*reach*.36];
    beam(THREE,g,'Leaf_stem_'+i,root,mid,.0016,.0027,stem,4);
  }
  object(THREE,g,'Stone_bowl_flat_bottom',new THREE.CircleGeometry(.184,28),stone,0,.006,0).rotation.x=Math.PI/2;
  ground(THREE,g);
  return metadata(g,{width:.65,height:.705,depth:.646,bowlHeight:.3},'Hollow irregular limestone planter with thick rim, inset soil, scattered stones, stems and nineteen curved foliage alpha cards.');
}
