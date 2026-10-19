# V135-capital: cut the fixed L11 fabric dump (dumpc.js -> city.json) into 112 m city cells.
# usage: python3 cut135.py city.json "ix,iz;ix,iz" out.json [margin_m]
# targets = meshes whose vertex centroid lies in the chosen cells (cross-cell meshes belong to their centroid cell);
# occluders = every other mesh / occ whose bbox touches the chosen cells grown by margin (default 45 m).
import json,math,base64,array,sys
SRC,CELLS,OUT=sys.argv[1:4];MARGIN=float(sys.argv[4]) if len(sys.argv)>4 else 45
OX,OZ,A,B=520.3172,552.7043,-0.07667245,112.0  # world -> city frame (same as plan site.py)
ca,sa=math.cos(A),math.sin(A)
def city(x,z):x-=OX;z-=OZ;return ca*x-sa*z,sa*x+ca*z
cells={tuple(int(v) for v in c.split(',')) for c in CELLS.split(';')}
d=json.load(open(SRC))
def stats(m):
  a=array.array('f');a.frombytes(base64.b64decode(m['P']));n=len(a)//3;xs=a[0::3];zs=a[2::3]
  cx,cz=city(sum(xs)/n,sum(zs)/n);pts=[city(xs[i],zs[i]) for i in range(0,n,max(1,n//400))]+[city(min(xs),min(zs)),city(max(xs),max(zs)),city(min(xs),max(zs)),city(max(xs),min(zs))]
  return (math.floor(cx/B),math.floor(cz/B)),(min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts))
lo=(min(c[0] for c in cells)*B-MARGIN,min(c[1] for c in cells)*B-MARGIN);hi=((max(c[0] for c in cells)+1)*B+MARGIN,(max(c[1] for c in cells)+1)*B+MARGIN)
def touches(bb):return not(bb[2]<lo[0] or bb[0]>hi[0] or bb[3]<lo[1] or bb[1]>hi[1])
out={'meshes':[],'occ':[],'lights':d['lights'],'cells':sorted(cells)};nv=0
for m in d['meshes']:
  c,bb=stats(m)
  if c in cells:m['cell']=list(c);out['meshes'].append(m);nv+=m['count']
  elif touches(bb):o=dict(m);o['name']=m['key'];o.setdefault('opacity',1);o.setdefault('mname','');out['occ'].append(o)
for m in d['occ']:
  c,bb=stats(m)
  if touches(bb):out['occ'].append(m)
json.dump(out,open(OUT,'w'));print('targets',len(out['meshes']),'verts',nv,'occ',len(out['occ']))
