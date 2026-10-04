// Reusable metre-scale commercial fittings, merged by finish for instance batching.
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
export function createLevel0DetailAssets(T){
 const make=fn=>{const pools={};const put=(material,g,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);(pools[material]??=[]).push(g.toNonIndexed?g.index?g.toNonIndexed():g:g);};
 const box=(m,x,y,z,w,h,d,rx=0,ry=0,rz=0)=>put(m,new T.BoxGeometry(w,h,d),x,y,z,rx,ry,rz);
 const ring=(m,size,y,depth=.035)=>{box(m,0,y,-size/2,size,depth,.024);box(m,0,y,size/2,size,depth,.024);box(m,-size/2,y,0,.024,depth,size);box(m,size/2,y,0,.024,depth,size);};fn({put,box,ring});return Object.entries(pools).map(([material,geos])=>{const geometry=mergeGeometries(geos,false);for(const g of geos)g.dispose();return{geometry,material,matrix:new T.Matrix4(),castShadow:true};});};
 const vents=[];
 vents.push(make(({box,ring})=>{box('dark',0,.06,0,.60,.04,.60);ring('metal',.61,0,.025);for(let i=0;i<5;i++)ring('metal',.51-i*.088,.014+i*.018,.027);box('metal',0,.104,0,.11,.022,.11);}));
 vents.push(make(({box})=>{box('dark',0,.02,0,1.16,.04,.17);box('metal',0,0,0,1.20,.027,.025);for(const z of[-.095,.095])box('metal',0,0,z,1.20,.025,.035);for(const x of[-.588,.588])box('metal',x,0,0,.024,.025,.19);for(const z of[-.047,.047])box('metal',0,.035,z,1.12,.017,.016);}));
 vents.push(make(({put})=>{put('dark',new T.CylinderGeometry(.285,.285,.025,32),0,.075,0);for(let i=0;i<5;i++)put('metal',new T.TorusGeometry(.285-i*.047,.014,4,36),0,i*.019,0,Math.PI/2);put('metal',new T.CylinderGeometry(.055,.06,.024,24),0,.089,0);}));
 vents.push(make(({box,ring})=>{box('dark',0,.065,0,.59,.02,.59);ring('metal',.61,0,.028);for(let i=0;i<=14;i++){const p=-.28+i*.04;box('metal',p,.028,0,.009,.051,.56);box('metal',0,.028,p,.56,.051,.009);}}));
 const cavity=make(({put,box})=>{box('dark',0,.49,0,1.21,.06,.61);for(const x of[-.609,.609]){box('metal',x,.005,0,.023,.065,.62);box('wood',x,.30,0,.075,.17,.68);}for(const z of[-.308,.308])box('metal',0,0,z,1.23,.022,.027);
 for(let j=0;j<2;j++){const g=new T.PlaneGeometry(.49,.51,12,9),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getY(i),u=(z+.255)/.51;p.setXYZ(i,x,.12-.42*Math.pow(Math.sin(u*Math.PI),1.6)+Math.sin(x*17+z*11)*.028,z);}g.computeVertexNormals();put(j?'pink':'insulation',g,j?-.24:.23,.03,0);const back=g.clone();back.rotateX(Math.PI);put(j?'pink':'insulation',back,j?-.24:.23,.036,0);}
 const curve=new T.CatmullRomCurve3([new T.Vector3(-.75,.31,.09),new T.Vector3(0,.35,.09),new T.Vector3(.75,.26,.09)]);put('metal',new T.TubeGeometry(curve,24,.12,10,false));for(let i=0;i<24;i++){const p=curve.getPoint(i/23);put('metal',new T.TorusGeometry(.123,.009,3,12),p.x,p.y,p.z,0,Math.PI/2);}});
 const cables=make(({put})=>{for(let i=0;i<4;i++){const x=i*.026-.04,curve=new T.CatmullRomCurve3([new T.Vector3(x,.05,0),new T.Vector3(x+.035,-.24,.01),new T.Vector3(x+.12,-.73,.08),new T.Vector3(x+.065,-1.15-i*.07,.14)]);put('dark',new T.TubeGeometry(curve,20,.009,5,false));const e=curve.getPoint(1);put('copper',new T.CylinderGeometry(.004,.004,.052,5),e.x,e.y-.024,e.z);if(i%2===0)put('orange',new T.CylinderGeometry(.010,.018,.038,6),e.x,e.y-.057,e.z);}});
 const fallenTile=make(({put,box})=>{box('ceiling',0,-.23,.01,1.16,.032,.57,50*Math.PI/180);put('dark',new T.TubeGeometry(new T.LineCurve3(new T.Vector3(-.49,.01,-.25),new T.Vector3(-.49,-.25,.17)),1,.003,3,false));});
 return{vents,cavity,cables,fallenTile};
}
