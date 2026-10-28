// Stage 3 recoverable authored room. Not connected to gameplay until colliders and streaming ownership are integrated.
// Local metre coordinates. Based on the Capalaba equipment-room photograph linked by the Alpha article.
export const RADIO_FINISHES={enamel:'#30322f',rail:'#9da8ae',ivory:'#dedbc5',wood:'#735039',rubber:'#272825',brass:'#a79158',paper:'#e4ddbb',wall:'#e6dfb8',floor:'#b7ad88',glass:'#393c2e',red:'#a85842'};
export function radioParts150(){
 const p=[];const box=(mat,x,y,z,w,h,d,extra={})=>p.push({shape:'box',mat,x,y,z,w,h,d,...extra});
 const disc=(mat,x,y,z,r,depth,extra={})=>p.push({shape:'disc',mat,x,y,z,r,depth,...extra});
 const cable=(a,b,r=.009,mat='rubber')=>p.push({shape:'cable',mat,a,b,r});
 // Five open-backed, floor-supported receiving racks with distinct removable panels.
 for(let i=0;i<5;i++){const x=.64+i*.78,z=.62;
  for(const dx of [-.36,.36])for(const dz of [-.28,.28])box('rail',x+dx,1.14,z+dz,.045,2.28,.045);
  for(const y of [.045,2.25])box('rail',x,y,z,.76,.09,.62);
  for(const y of [.12,.64,1.24,1.84])box('rail',x,y,z-.28,.69,.03,.035);
  box('enamel',x,1.73,z+.29,.68,.96,.034);
  if(i===0||i===4)box('enamel',x,.69,z+.29,.68,1.08,.034);
  // Actual panel fasteners; blank/open bays remain genuinely open.
  for(const y of [.22,1.3,2.12])for(const dx of [-.32,.32])disc('brass',x+dx,y,z+.317,.012,.012);
  if(i===0||i===4){for(const dx of [-.18,.18]){box('rail',x+dx,1.98,z+.32,.27,.23,.05);disc('rubber',x+dx,1.98,z+.355,.096,.035);disc('glass',x+dx,1.98,z+.378,.068,.014);}}
  if(i===1){disc('rail',x,1.69,z+.32,.205,.025);disc('paper',x,1.69,z+.341,.181,.014);for(let n=0;n<12;n++){const a=n*Math.PI/6;box('enamel',x+Math.sin(a)*.15,1.69+Math.cos(a)*.15,z+.353,.012,.028,.005,{rz:-a});}box('enamel',x+.033,1.72,z+.361,.008,.12,.009,{rz:-.7});
   for(let row=0;row<3;row++)for(let k=0;k<5;k++){const xx=x-.23+k*.115,yy=1.32-row*.13;disc('brass',xx,yy,z+.33,.023,.024);disc('rubber',xx,yy,z+.35,.013,.024);}}
  if(i===2||i===3){box('ivory',x,1.97,z+.34,.57,.36,.13);box('brass',x+.07,1.94,z+.411,.36,.2,.018);box('glass',x+.07,1.97,z+.425,.29,.07,.008);disc('rubber',x+.19,1.87,z+.435,.021,.02);
   box('rail',x,.97,z+.26,.64,.29,.18);disc('ivory',x+.15,.97,z+.367,.065,.034);for(let n=0;n<3;n++)disc('rubber',x-.21+n*.09,.93,z+.367,.024,.026);
   // Hanging cables connect the back of the receiver to the lower patch rail.
   for(let j=0;j<5;j++){let a=[x-.22+j*.1,.9,z];for(let k=1;k<=8;k++){const b=[x-.22+j*.1+Math.sin(k*.65+j)*.055,.9-k*.09,z-.03+Math.sin(k*.6)*.07];cable(a,b,.007);a=b;}}}
  if(i===4){box('rail',x,.55,z+.32,.65,.45,.07);for(let row=0;row<3;row++)for(let j=0;j<6;j++)disc(j%3===0?'red':'rubber',x-.25+j*.1,.4+row*.12,z+.367,.018,.02);}
 }
 // Long working ledge, wood edge, drawers, grounded legs and chairs.
 box('ivory',2.22,.77,1.32,4.28,.055,.69);box('wood',2.22,.75,1.665,4.31,.075,.035);
 for(const x of [.24,2.14,4.18]){box('rail',x,.37,1.31,.07,.74,.55);box('rubber',x,.025,1.31,.17,.05,.6);}
 box('rail',3.94,.36,1.29,.4,.69,.55);for(let i=0;i<3;i++){box('rail',3.94,.15+i*.21,1.574,.38,.19,.018);box('rubber',3.94,.2+i*.21,1.59,.12,.025,.025);}
 for(const x of [1.05,2.8]){box('rubber',x,.47,2.04,.49,.10,.46);box('rubber',x,.84,2.29,.48,.48,.08);for(const dx of [-.2,.2]){cable([x+dx,.05,2.2],[x+dx,.46,1.85],.018,'rail');cable([x+dx,.05,1.83],[x+dx,.91,2.31],.018,'rail');}cable([x-.2,.22,2.18],[x+.2,.22,2.18],.014,'rail');}
 // Desk telephone, handset, notepad and cable; no graphic used as a substitute for hardware.
 box('enamel',.58,.85,1.39,.26,.11,.21);for(const x of [.49,.67])box('rubber',x,.94,1.39,.07,.055,.12);box('rubber',.58,.96,1.39,.24,.04,.055);
 for(let j=0;j<7;j++)cable([.7+j*.035,.82,1.4],[.72+j*.035,.81,1.44],.006);
 box('paper',1.83,.803,1.39,.27,.006,.22);box('brass',1.91,.814,1.39,.009,.012,.18);
 // Wall service pipes, twin ventilation grilles and functional floor skirting.
 for(const x of [.4,3.7]){cable([x,.25,.09],[x,2.85,.09],.018,'rail');box('ivory',x,1.06,.095,.11,.15,.075);}
 for(const x of [1.35,4.95]){box('ivory',x,2.63,.09,.34,.27,.08);for(let i=0;i<5;i++)box('rubber',x-.12+i*.06,2.63,.135,.021,.19,.008);}
 // Right rear doorway left open; shelves stand inside the visible adjoining store.
 for(const x of [5.5,6.55])box('ivory',x,1.23,.15,.1,2.46,.24);box('ivory',6.025,2.46,.15,1.15,.11,.24);
 for(const x of [5.58,6.48])for(const z of [-.55,-1.15])box('rail',x,1.05,z,.04,2.1,.04);
 for(const y of [.2,.72,1.24,1.76])box('enamel',6.03,y,-.86,.98,.035,.67);
 return p;
}
export const RADIO_COLLIDERS=[{x:2.2,z:.62,w:4.3,d:.64,h:2.3},{x:2.22,z:1.32,w:4.3,d:.7,h:.8},...[1.05,2.8].map(x=>({x,z:2.06,w:.55,d:.62,h:1.1}))];
export function createRadioModel150(T,appendBox){
 const group=new T.Group(),materials={};for(const [k,c] of Object.entries(RADIO_FINISHES))materials[k]=new T.MeshStandardMaterial({color:c,roughness:.84,metalness:k==='rail'?.35:.03});
 for(const p of radioParts150()){let g;if(p.shape==='box'){const a={position:[],normal:[],uv:[]};appendBox(a,{...p,x:0,y:0,z:0},.006);g=new T.BufferGeometry();for(const [k,n]of [['position',3],['normal',3],['uv',2]])g.setAttribute(k,new T.Float32BufferAttribute(a[k],n));}else if(p.shape==='disc'){g=new T.CylinderGeometry(p.r,p.r,p.depth,12);g.rotateX(Math.PI/2);}else{const a=new T.Vector3(...p.a),b=new T.Vector3(...p.b);g=new T.CylinderGeometry(p.r,p.r,a.distanceTo(b),6);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize()));g.translate(...a.add(b).multiplyScalar(.5).toArray());}
  const m=new T.Mesh(g,materials[p.mat]);if(p.shape!=='cable')m.position.set(p.x,p.y,p.z);m.rotation.z=p.rz||0;m.castShadow=m.receiveShadow=true;m.userData.finish=p.mat;group.add(m);
 }
 group.userData.dispose=()=>{group.traverse(o=>o.geometry?.dispose());Object.values(materials).forEach(m=>{m.map?.dispose();m.normalMap?.dispose();m.dispose();});};return group;
}
