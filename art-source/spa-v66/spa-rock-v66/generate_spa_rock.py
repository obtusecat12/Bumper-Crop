#!/usr/bin/env python3
"""Continuous fractured limestone architecture, metres; no scene or Site dependencies.
Requires numpy, scipy, vtk. Generates spa-rock-v66.mjs and JSON validation.
"""
from pathlib import Path
import base64, json, math
import numpy as np
from scipy.ndimage import map_coordinates
import vtk
from vtk.util.numpy_support import numpy_to_vtk, vtk_to_numpy

HERE = Path(__file__).resolve().parent
rng = np.random.default_rng(660731)
# Deterministic, non-periodic, anisotropic low-amplitude weathering.
WEATHER = rng.uniform(-1, 1, (37, 49, 35)).astype(np.float32)
PX = np.array([4.10,4.65,5.15,5.65,6.10,6.45,6.80,7.20,7.60,8.24])
# Each bed is a connected extruded polygon, embedded in a common back mass.
# Front offsets create substantial ledges and plumb fracture faces, never pebbles.
BEDS = [
 # bottom, top, right boundary, bevel, front polyline
 (-.28, .29,8.23,.035,[-3.145,-3.155,-3.17,-3.21,-3.37,-3.64,-3.96,-4.43,-4.75,-4.98]),
 (.23, .68,8.23,.042,[-3.14,-3.18,-3.21,-3.32,-3.51,-3.80,-4.19,-4.55,-4.82,-5.04]),
 (.59,1.18,8.23,.039,[-3.18,-3.25,-3.32,-3.51,-3.74,-4.04,-4.35,-4.66,-4.94,-4.98]),
 (1.08,1.65,7.02,.039,[-3.31,-3.48,-3.47,-3.82,-4.20,-5.18,-5.60,-5.65,-5.67,-5.68]),
 (1.54,2.05,6.79,.033,[-3.39,-3.59,-3.54,-4.02,-4.65,-5.42,-5.66,-5.67,-5.68,-5.69]),
 (1.96,2.48,6.57,.036,[-3.51,-3.73,-4.08,-4.13,-4.76,-5.53,-5.66,-5.68,-5.69,-5.70]),
 (2.37,2.86,6.31,.032,[-3.99,-3.98,-4.17,-4.29,-5.20,-5.61,-5.67,-5.68,-5.69,-5.70]),
 (2.77,3.205,6.03,.033,[-4.11,-4.25,-4.26,-4.76,-5.60,-5.65,-5.67,-5.68,-5.69,-5.70]),
]
# Non-periodic lithological offsets: large angular run-outs with smaller planar relief.
PROFILE_X = np.linspace(4.08,8.26,51)
PROFILES = []
for i in range(len(BEDS)):
 a = rng.uniform(-.034,.034,len(PROFILE_X))
 a = np.convolve(a,[.15,.70,.15],mode='same')
 PROFILES.append(a)


def round_intersection(parts, r):
    """Rounded convex intersection with broad flat faces and small weathered arrises."""
    q = [p+r for p in parts]
    m = np.maximum.reduce(np.broadcast_arrays(*q))
    ss = sum(np.maximum(p,0)**2 for p in q)
    return np.sqrt(ss) + np.minimum(m,0) - r


def shaped_box(x,y,z,xlo,xhi,ylo,yhi,zlo,zhi,r=.025):
    return round_intersection([xlo-x,x-xhi,ylo-y,y-yhi,zlo-z,z-zhi],r)


def noise3(x,y,z):
    # Long horizontal bedding grain, short vertical fissure detail. No sine skin.
    coords=np.array(np.broadcast_arrays((x-3.8)*5.1,(y+.6)*11.0,(z+6.0)*9.4))
    return map_coordinates(WEATHER,coords.reshape(3,-1),order=1,mode='nearest').reshape(np.broadcast_shapes(np.shape(x),np.shape(y),np.shape(z)))


BED_HEIGHT_OFFSETS = [
 [.00,.035,-.025,.015,-.025,0,0,0,0,0],
 [.025,-.055,.045,-.040,.025,0,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,0],
 [-.12,.13,.02,-.10,.11,.04,0,0,0,0],
 [.14,-.10,-.015,.16,-.055,.02,0,0,0,0],
 [.055,.10,-.11,.025,.115,-.05,0,0,0,0],
 [-.07,.05,.12,-.04,-.035,.02,0,0,0,0],
 [0,0,0,0,0,0,0,0,0,0],
]

def field(x,y,z):
    x,y,z = np.broadcast_arrays(np.asarray(x),np.asarray(y),np.asarray(z))
    d=np.full(x.shape,1e4,dtype=np.float32)
    for i,(lo,hi,xhi,bev,front) in enumerate(BEDS):
        # Rock beds dip gently east. The hero bench has a resolved level contact plane.
        dip = np.interp(x,PX,BED_HEIGHT_OFFSETS[i])
        base_dip = np.interp(x,PX,BED_HEIGHT_OFFSETS[max(i-1,0)]) if i else np.zeros_like(x)
        front = np.interp(x,PX,front)+np.interp(x,PROFILE_X,PROFILES[i])
        # Slightly raked vertical faces, different joint direction in adjacent beds.
        front += (y-(lo+hi)/2) * ([.07,-.10,.04,-.045][i%4])
        weather = noise3(x,y,z)*.015
        # Restrict weathering to the exposed face; preserve broad bedding planes.
        front += weather
        bed=round_intersection([4.16-x,x-xhi,lo+base_dip-y,y-hi-dip,-5.72-z,z-front],bev)
        # Open, shallow vertical fractures crossing bed faces. All terminate in solid rock.
        for j,(xc,slant,depth) in enumerate([(4.63,.071,.16),(5.26,-.085,.17),(5.93,.095,.12),(6.41,-.061,.14),(7.12,.11,.085),(7.79,-.072,.06)]):
            if (i+j*3)%7==2: continue
            xc += [.025,-.044,.0,.018,-.03,.041,0,-.025][i]
            plane = x-xc-slant*y-(z+4.7)*(.075 if j%2 else -.065)
            halfwidth = .021 + .013*(i%3==j%3) + .007*np.clip((y-lo)/(hi-lo),0,1)
            crack=np.maximum(np.abs(plane)-halfwidth,front-depth-z)
            # Ends have slanted broken edges instead of a uniform saw cut.
            crack=np.maximum(crack,(lo+base_dip+.023)-y + .035*(x-xc))
            crack=np.maximum(crack,y-(hi+dip-.038)+.025*(x-xc))
            bed=np.maximum(bed,-crack)
        d=np.minimum(d,bed)
    # Broad monolithic geological landing: two full statue contacts blended into body.
    p1=shaped_box(x,y,z,6.455,7.305,.695,1.18,-5.255,-4.315,.055)
    p2=shaped_box(x,y,z,7.445,8.242,.755,1.18,-5.72,-4.755,.047)
    d=np.minimum(d,np.minimum(p1,p2))
    # The outlet projects from a bed at y=1.02; its rooted back sits inside the cliff.
    # Front slopes back underneath, making a geological cantilever rather than a loose slab.
    bracket_front=-4.43 - np.maximum(1.02-y,0)*.77
    bracket=round_intersection([6.935-x,x-8.145,.705-y,y-1.02,-5.22-z,z-bracket_front],.020)
    # Clipped distal edges give a believable broken limestone end under the acrylic lip.
    bracket=np.maximum(bracket,(x-7.93)*.62+(z+4.52)*.70-.15)
    bracket=np.maximum(bracket,(7.075-x)*.48+(z+4.53)*.60-.13)
    d=np.minimum(d,bracket)
    # Keep all stone below y=.82 outside pool clearance radius. The small 22mm margin
    # compensates for grid interpolation and decimation; overhang ramps above .82.
    radius=np.sqrt((x-8.9)**2+(z+2.65)**2)
    clearance = 2.452-np.maximum(y-.82,0)*1.22
    d=np.maximum(d,clearance-radius)
    # Rear/left are embedded beyond their finish planes; domain is watertight.
    d=np.maximum(d,y-3.185)
    d=np.maximum(d,-5.72-z)
    d=np.maximum(d,z+3.11)
    return d.astype(np.float32)


def make_mesh():
    step=.030
    xs=np.arange(4.015,8.335+step*.5,step,dtype=np.float32)
    ys=np.arange(-.375,3.315+step*.5,step,dtype=np.float32)
    zs=np.arange(-5.865,-2.895+step*.5,step,dtype=np.float32)
    print('Sampling',len(xs),len(ys),len(zs),flush=True)
    # VTK scalars: x varies fastest.
    F=np.empty((len(zs),len(ys),len(xs)),dtype=np.float32)
    for k,z in enumerate(zs):
        F[k]=field(xs[None,:],ys[:,None],z)
    image=vtk.vtkImageData();image.SetDimensions(len(xs),len(ys),len(zs));image.SetOrigin(float(xs[0]),float(ys[0]),float(zs[0]));image.SetSpacing(step,step,step)
    image.GetPointData().SetScalars(numpy_to_vtk(F.ravel(),deep=True))
    contour=vtk.vtkFlyingEdges3D();contour.SetInputData(image);contour.SetValue(0,0);contour.ComputeNormalsOff();contour.Update()
    poly=contour.GetOutput()
    initial=poly.GetNumberOfCells()
    # Reduce redundant planar tessellation while keeping substantial angular relief.
    if initial>49000:
        simplify=vtk.vtkQuadricDecimation();simplify.SetInputData(poly);simplify.SetTargetReduction(1-49000/initial);simplify.VolumePreservationOn();simplify.Update();poly=simplify.GetOutput()
    # Discard any sub-grid chip isolated by a fissure; the asset is strictly one mass.
    connected=vtk.vtkPolyDataConnectivityFilter();connected.SetInputData(poly);connected.SetExtractionModeToLargestRegion();connected.Update()
    clean=vtk.vtkCleanPolyData();clean.SetInputData(connected.GetOutput());clean.PointMergingOn();clean.Update();poly=clean.GetOutput()
    V=vtk_to_numpy(poly.GetPoints().GetData()).copy().astype(np.float64)
    F=vtk_to_numpy(poly.GetPolys().GetData()).reshape(-1,4)[:,1:].copy().astype(np.int32)
    # Decimation retains planes to machine precision; make the hero contacts exact.
    onflat=(abs(V[:,1]-1.18)<.002)
    V[onflat,1]=1.18
    positive_y=(field(V[:,0],V[:,1]+.004,V[:,2])-field(V[:,0],V[:,1]-.004,V[:,2]))>0
    bracket_top=(V[:,1]>1.005)&(V[:,1]<1.022)&positive_y&(V[:,0]>6.95)&(V[:,0]<8.13)&(V[:,2]>-4.70)&(V[:,2]<-4.443)
    V[bracket_top,1]=1.02
    # Exact-gradient normals retain small bevels and avoid globally lumpy shading.
    eps=.006
    grads=[]
    for axis in range(3):
        shift=np.zeros(3);shift[axis]=eps
        grads.append((field(*(V+shift).T)-field(*(V-shift).T))/(2*eps))
    N=np.stack(grads,axis=1).astype(np.float64)
    N/=np.maximum(np.linalg.norm(N,axis=1)[:,None],1e-12)
    # FlyingEdges winding depends on scalar convention. Match outward field gradients.
    fn=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]])
    rev=np.einsum('ij,ij->i',fn,N[F].mean(axis=1))<0
    F[rev]=F[rev][:,[0,2,1]]
    return V,F,N,initial


def contacts(V,F,x,z):
    # Vertical downray/triangle intersection in xz with barycentrics.
    a,b,c=V[F[:,0]],V[F[:,1]],V[F[:,2]]
    den=(b[:,2]-c[:,2])*(a[:,0]-c[:,0])+(c[:,0]-b[:,0])*(a[:,2]-c[:,2])
    good=np.abs(den)>1e-10
    u=np.zeros(len(F));v=np.zeros(len(F))
    u[good]=((b[good,2]-c[good,2])*(x-c[good,0])+(c[good,0]-b[good,0])*(z-c[good,2]))/den[good]
    v[good]=((c[good,2]-a[good,2])*(x-c[good,0])+(a[good,0]-c[good,0])*(z-c[good,2]))/den[good]
    good&=(u>=-1e-6)&(v>=-1e-6)&(u+v<=1+1e-6)
    ys=u[good]*a[good,1]+v[good]*b[good,1]+(1-u[good]-v[good])*c[good,1]
    return sorted(set(np.round(ys,6).tolist()))


def validate(V,F,N,initial):
    edge=np.sort(np.concatenate([F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]),axis=1)
    edges,counts=np.unique(edge,axis=0,return_counts=True)
    # Component search on triangle edges.
    parent=np.arange(len(V))
    def find(a):
        while parent[a]!=a:
            parent[a]=parent[parent[a]];a=parent[a]
        return a
    for a,b in edges:
        a,b=find(a),find(b)
        if a!=b:parent[a]=b
    components=len(set(find(i) for i in range(len(V))))
    reports=[]
    for name,x,z in [('seated',6.88,-4.73),('kneeling',7.88,-5.18)]:
        samples=[]
        for dx in [-.35,-.25,0,.25,.35]:
            for dz in [-.35,-.25,0,.25,.35]:
                hits=contacts(V,F,x+dx,z+dz)
                top=max(hits) if hits else None
                samples.append({'offset':[dx,dz],'top':top,'onPlane':top is not None and abs(top-1.18)<.004})
        reports.append({'name':name,'origin':[x,1.18,z],'centerHits':contacts(V,F,x,z),'samples':samples,'onPlane':sum(s['onPlane'] for s in samples),'count':len(samples)})
    low=V[V[:,1]<=.820001]
    radial=np.sqrt((low[:,0]-8.9)**2+(low[:,2]+2.65)**2)
    # Sample triangle edges AND interiors so vertex-only validation cannot hide crossings.
    sample=[]
    for i in range(7):
        for j in range(7-i):
            a=i/6;b=j/6
            pts=V[F[:,0]]*a+V[F[:,1]]*b+V[F[:,2]]*(1-a-b)
            pts=pts[pts[:,1]<=.82]
            sample.append(float(np.min(np.sqrt((pts[:,0]-8.9)**2+(pts[:,2]+2.65)**2))))
    flowhits=contacts(V,F,7.57,-4.21)
    bracket=contacts(V,F,7.57,-4.46)
    report={'name':'spa-rock-v66','units':'metres','seed':660731,'vertices':len(V),'triangles':len(F),'beforeDecimationTriangles':initial,'components':components,'watertight':bool(np.all(counts==2)),'boundaryEdges':int(np.sum(counts==1)),'nonmanifoldEdges':int(np.sum(counts>2)),'bounds':{'min':V.min(axis=0).tolist(),'max':V.max(axis=0).tolist()},'statueContacts':reports,'poolClearance':{'requiredRadiusBelowY082':2.43,'minVertexRadius':float(radial.min()),'minSampledTriangleRadius':min(sample),'pass':min(sample)>=2.43},'fallLine':{'x':7.57,'z':-4.21,'verticalTriangleHits':flowhits,'pass':len(flowhits)==0},'spillwaySupport':{'x':7.57,'z':-4.46,'verticalTriangleHits':bracket,'topTarget':1.02},'normalsFinite':bool(np.all(np.isfinite(N))),'minNormalLength':float(np.linalg.norm(N,axis=1).min()),'minimumTriangleArea':float((np.linalg.norm(np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]),axis=1)/2).min()),'degenerateFaces':int((np.linalg.norm(np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]),axis=1)<2e-12).sum()),'notes':['A single closed mass embedded behind wall planes x=4.24, z=-5.60.','Top support plane y=1.18; first pad complete at ±0.35m, second front/east corner can be beveled/clipped.','Low rock is clipped to r=2.452m for interpolation safety; allowance tapers only above y=.82.','No rock intersects the waterfall line x=7.57,z=-4.21.','World x,z UV fallback; owner should use triplanar material.']}
    return report


def export(V,F,N,report):
    # Vertex colors are gently tinted multipliers; pool-side stone darkens when wet.
    x,y,z=V.T
    wet=np.exp(-np.maximum(y+.03,0)*2.0)
    outlet=np.exp(-((x-7.57)/.58)**2)*np.exp(-((z+4.62)/.55)**2)*np.clip((1.12-y)/.85,0,1)
    wet=np.maximum(wet,outlet*.86)
    mineral=noise3(x,y,z)*.025
    C=np.stack([.98-.23*wet+mineral,.97-.18*wet+mineral,.935-.155*wet+mineral],axis=1).clip(0,1).astype('<f4')
    UV=np.stack([x*.50,z*.50],axis=1).astype('<f4')
    arrays={'position':V.astype('<f4'),'normal':N.astype('<f4'),'uv':UV,'color':C,'index':F.reshape(-1).astype('<u4')}
    js=['/* Generated continuous fractured limestone cliff. Regenerate with generate_spa_rock.py. */','export const spaRockMetadata = '+json.dumps({k:report[k] for k in ['name','units','vertices','triangles','bounds','components','watertight']},separators=(',',':'))+';']
    for name,a in arrays.items():
        b64=base64.b64encode(a.tobytes()).decode()
        js.append('const '+name+'Base64 = "'+b64+'";')
    js.append('''function decode(b64, Type) {
  const raw = typeof atob === 'function' ? atob(b64) : globalThis.Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(raw.length);
  for (let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
  return new Type(bytes.buffer);
}
export function createSpaRock(T) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(decode(positionBase64, Float32Array),3));
  geometry.setAttribute('normal', new T.BufferAttribute(decode(normalBase64, Float32Array),3));
  geometry.setAttribute('uv', new T.BufferAttribute(decode(uvBase64, Float32Array),2));
  geometry.setAttribute('color', new T.BufferAttribute(decode(colorBase64, Float32Array),3));
  geometry.setIndex(new T.BufferAttribute(decode(indexBase64, Uint32Array),1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.name='ArchitecturalFracturedLimestoneV66';
  geometry.userData={...spaRockMetadata, supportPlane:1.18, poolClearanceRadius:2.43};
  return geometry;
}
export default createSpaRock;
''')
    (HERE/'spa-rock-v66.mjs').write_text('\n'.join(js))
    (HERE/'validation.json').write_text(json.dumps(report,indent=2))
    np.savez_compressed(HERE/'spa-rock-v66.npz',position=V,faces=F,normal=N,color=C)


def preview(V,F,N):
    import matplotlib;matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d.art3d import Poly3DCollection
    center=V[F].mean(axis=1)
    normals=N[F].mean(axis=1)
    light=np.array([-.32,.85,.51]);light/=np.linalg.norm(light)
    illum=np.clip(normals@light,.02,1)*.65+.34
    albedo=np.array([.71,.68,.56])
    colors=(albedo[None,:]*illum[:,None]).clip(0,1)
    fig=plt.figure(figsize=(13,10),facecolor='#c4c3bb')
    ax=fig.add_subplot(111,projection='3d',facecolor='#c4c3bb')
    # Matplotlib's z is vertical; remap world xyz -> xzy.
    surf=Poly3DCollection(V[F][:,:,[0,2,1]],facecolors=colors,edgecolors='none',zsort='average')
    ax.add_collection3d(surf)
    th=np.linspace(0,2*np.pi,160)
    ax.plot(8.9+2.43*np.cos(th),-2.65+2.43*np.sin(th),np.full(len(th),-.14),color='#359ca3',lw=2)
    for x,z in [(6.88,-4.73),(7.88,-5.18)]:
        ax.plot([x-.3,x+.3,x+.3,x-.3,x-.3],[z-.3,z-.3,z+.3,z+.3,z-.3],[1.184]*5,color='#d9ad3a',lw=2)
    ax.plot([7.57,7.57],[-4.21,-4.21],[-.14,1.067],color='#59dbe2',lw=3)
    ax.set_xlim(4.0,8.4);ax.set_ylim(-5.9,-2.9);ax.set_zlim(-.3,3.3)
    ax.set_box_aspect((4.4,3,3.6));ax.view_init(elev=21,azim=48)
    ax.set_xlabel('x');ax.set_ylabel('z');ax.set_zlabel('y')
    ax.set_title('One continuous fractured limestone mass · gold: statue contact pads',pad=15)
    fig.tight_layout();fig.savefig(HERE/'rock-preview.png',dpi=150);plt.close(fig)

if __name__=='__main__':
    V,F,N,initial=make_mesh()
    report=validate(V,F,N,initial)
    export(V,F,N,report)
    preview(V,F,N)
    print(json.dumps({k:v for k,v in report.items() if k!='statueContacts'},indent=2))
    print('Statue contacts:',[(r['name'],r['centerHits'],r['onPlane'],r['count']) for r in report['statueContacts']])
