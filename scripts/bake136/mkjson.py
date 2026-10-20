# V136-atm-lobby: raw.json (node dump of atm136-geo.js) -> bake134.py input (targets = lit surfaces, occ = glass/emitters)
import json,sys,base64,array,os
from PIL import Image
RAW,OUT=sys.argv[1:3];TEX='dist/assets/atm136'
d=json.load(open(RAW))
def avg(n):
    im=Image.open(f'{TEX}/{n}.webp').convert('RGB').resize((1,1),Image.BOX);return [(c/255)**2.2 for c in im.getpixel((0,0))]
ALB={'marble':avg('marble'),'inlay':avg('inlay'),'marble2':avg('marble2'),'wall':avg('wall'),'column':avg('column'),'pebble':avg('pebble'),'ceil':avg('ceil'),'metal':[(0x9c/255)**2.2,(0x96/255)**2.2,(0x8a/255)**2.2]}
ROUGH={'marble':.25,'inlay':.25,'marble2':.3,'metal':.4}
EMIT={'cove':[1.0,.82,.55],'skylight':[1,.98,.94],'lamp':[1,.88,.7],'sky':[1,.86,.74],'street':[.85,.9,1]}
b64=lambda a,t:base64.b64encode(array.array(t,a).tobytes()).decode()
meshes,occ=[],[]
for k,p in d['parts'].items():
    m=dict(key=k,name=k,mname='atm136:'+k,P=b64(p['P'],'f'),N=b64(p['N'],'f'),I=b64(p['I'],'I'),count=p['count'],hasN=True,rough=ROUGH.get(k,.85),metal=0,opacity=1)
    if k in ALB:m.update(albedo=ALB[k],emit=[0,0,0]);meshes.append(m)
    else:
        e=EMIT.get(k,[0,0,0]);m.update(albedo=[.8,.8,.8] if k not in EMIT else [0,0,0],emit=e,opacity=.2 if k in('glass','door') else 1);occ.append(m)
json.dump(dict(meshes=meshes,occ=occ,lights=d['lights'],order=list(d['parts'].keys()),counts={k:p['count'] for k,p in d['parts'].items()}),open(OUT,'w'))
print('targets',[m['key'] for m in meshes],'occ',[m['key'] for m in occ],ALB)
