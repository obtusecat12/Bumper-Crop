from pathlib import Path
p=Path('dist/level0-world.js');s=p.read_text();s="import {createFurniture93} from './level0-furniture93.js';\n"+s;s=s.replace('...createKaneProps(T)},box=', '...createKaneProps(T),...createFurniture93(T)},box=');p.write_text(s)
p=Path('dist/level0-materials.js');s=p.read_text().replace("file.startsWith('level0-k92/')","file.startsWith('level0-k92/')||file.startsWith('level0-furniture93/')")
insert='''
 // Generated furniture finishes: matching micro-normal and independent roughness. Tuft AO is vertex color.
 const furnitureFinish=(file,options={})=>new T.MeshPhysicalMaterial({map:tex('level0-furniture93/'+file+'.webp',true),normalMap:tex('level0-furniture93/'+file+'-normal.webp'),roughnessMap:tex('level0-furniture93/'+file+'-roughness.webp'),normalScale:new T.Vector2(.40,.40),roughness:1,vertexColors:true,...options});
 mats.fMahogany=furnitureFinish('mahogany',{clearcoat:.17,clearcoatRoughness:.39});
 mats.fWalnut=furnitureFinish('walnut',{clearcoat:.12,clearcoatRoughness:.45});
 mats.fEbony=furnitureFinish('ebony',{clearcoat:.19,clearcoatRoughness:.37});
 mats.fCarve=furnitureFinish('carved');mats.fCarve.normalScale.set(.85,.85);
 mats.fBrass=furnitureFinish('brass',{metalness:.72});
 mats.fOxblood=furnitureFinish('oxblood',{clearcoat:.20,clearcoatRoughness:.42});
 mats.fTobacco=furnitureFinish('tobacco',{clearcoat:.15,clearcoatRoughness:.46});
 mats.fDamask=furnitureFinish('damask',{sheen:.55,sheenRoughness:.85,sheenColor:new T.Color(0xb0a37c)});
 mats.fLeatherEdge=furnitureFinish('oxblood',{color:0x927468,clearcoat:.14});
 mats.fShadow=plain(0x1c1814,.94);mats.fShadow.vertexColors=true;
'''
s=s.replace(' const cutGLSL=',insert+' const cutGLSL=');p.write_text(s)
p=Path('dist/level0-k-plan.js');s=p.read_text().replace('kCabinet:[1.16,1.12,.48]','kCabinet:[1.16,1.12,.80],kWalnutLow:[1.16,1.12,.80],kSupportBoard:[2.40,.046,.85],kMahoganyTall:[.9,1.88,.5],kEbonyTall:[.9,1.88,.5]').replace('kBookcase:[.64,1.20,.30]','kBookcase:[.78,1.60,.34]').replace('kArmchair:[.86,.91,.87]','kArmchair:[.96,.94,.94]').replace('kSofa:[1.74,.91,.87]','kSofa:[1.74,.94,.94]').replace('kWoodChair:[.47,.94,.50]','kWoodChair:[.50,.98,.54]')
a=s.index('// Film pile:');b=s.index('// Series-inspired',a)
s=s[:a]+'''// Stored furniture has actual load paths: sofa feet -> board -> two equal-height cabinets.
put('kCabinet',161.72,4.20);put('kWalnutLow',162.90,4.20);
put('kSupportBoard',162.31,4.20,1.12);
put('kSofa',162.31,4.20,1.166,0);
put('kBookcase',163.80,3.45,0,-.065);
put('kSideTable',160.54,4.12,0,.06);put('kCRT',160.54,4.12,.61,.06);
put('kBooks',162.10,3.70,0,.15);
put('kTorchiere',160.88,3.35,0);
put('kArmchair',164.16,5.14,0,-.24);
// An inverted chair rests on its four back/seat contact points on the carpet, beside a standing one.
put('kWoodChair',160.25,5.45,0,-.24);
put('kWoodChair',163.62,5.92,.98,.20,0,Math.PI);
// Loose chair trail stays grounded; a pair are carefully nested seat to seat in the recess.
put('kWoodChair',156.6,8.6,0,.26);put('kWoodChair',156.2,5.3,0,-.17);put('kWoodChair',156.8,2.1,0,.38);
put('kWoodChair',151.3,1.4,0,-.18);put('kWoodChair',152.02,1.40,0,.10);
put('kWoodChair',151.3,1.30,.982,-.18,0,Math.PI);
''' + s[b:]
s=s.replace("put('kTallCabinet',164.5+row*3.5", "put(['kMahoganyTall','kTallCabinet','kEbonyTall'][row],164.5+row*3.5")
p.write_text(s)
p=Path('dist/level0-layout.js');s=p.read_text().replace("'ovalChair','lamp'][Math.floor(l0Hash(mx+r.id,mz,702)*10)]","'ovalChair','lamp','settee','ebonyCabinet','mahoganyCabinet','walnutCabinet'][Math.floor(l0Hash(mx+r.id,mz,702)*14)]")
s=s.replace('const dimensions={sofa:', 'const dimensions={settee:[1.94,.94],ebonyCabinet:[.9,.5],mahoganyCabinet:[.9,.5],walnutCabinet:[.9,.5],sofa:')
s=s.replace('bureau:[1.32,.50]','bureau:[1.34,.54]').replace('diningChair:[.52,.57]','diningChair:[.50,.54]')
# Varied secondary furniture cluster is grounded and outside the original walking aisle.
s=s.replace("{kind:'lamp',x:78.25,z:10,y:.65,rotation:0}","{kind:'lamp',x:78.25,z:10,y:.65,rotation:0},{kind:'settee',x:81.15,z:7.7,rotation:-.40},{kind:'mahoganyCabinet',x:71.6,z:5.8,rotation:0},{kind:'ebonyCabinet',x:69.95,z:5.8,rotation:.03}")
p.write_text(s)
p=Path('tests/level0-furniture93/preview.html');s=p.read_text().replace("const poses={", "const poses={sofa:{at:[77.6,1.18,10.35],target:[76,.55,8],fov:52},furniture:{at:[78.4,1.65,12.7],target:[75.8,.95,7.6],fov:65},settee:{at:[82.7,1.3,10.8],target:[81.15,.55,7.7],fov:49},joinery:{at:[71.0,1.33,8.2],target:[71.4,1.0,5.8],fov:53},")
p.write_text(s)
