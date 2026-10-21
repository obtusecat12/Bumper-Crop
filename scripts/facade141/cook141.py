# V141 F1: cook the Blender bake of one SoHo facade (build141.py OUTDIR) into runtime assets + a geometry module, and generate
# the procedural PBR textures of the separate fire-escape / awning geometry (generated large, then reduced to PS1 low-fi).
#   python3 bc/scripts/facade141/cook141.py a0 /workspace/work/v141/a0      (run from the project root; needs numpy + pillow)
import sys,os,json,numpy as np
from PIL import Image,ImageFilter
key,src=sys.argv[1],sys.argv[2];OUT='bc/dist/assets/l11-v141';os.makedirs(OUT,exist_ok=True)
L=lambda f:np.asarray(Image.open(os.path.join(src,f+'.png')).convert('RGB')).astype(np.float32)/255
alb,ao,ro,nr=L('alb'),L('ao')[...,:1],L('rough')[...,:1],L('nrm')
RW,RH=512,1024
def low(a):  # 5-bit quantize like the other SoHo atlases
 return Image.fromarray((np.clip(a,0,1)*255//8*8+4).clip(0,255).astype(np.uint8))
col=alb*(.42+.58*ao)
low(np.asarray(Image.fromarray((col*255).astype(np.uint8)).resize((RW,RH),Image.LANCZOS)).astype(np.float32)/255).save(f'{OUT}/{key}-alb.webp',quality=90)
Image.fromarray((nr*255).astype(np.uint8)).resize((RW,RH),Image.LANCZOS).save(f'{OUT}/{key}-nrm.webp',quality=92)
orm=np.dstack([ao[...,0],ro[...,0],np.zeros_like(ro[...,0])])
Image.fromarray((orm*255).astype(np.uint8)).resize((RW,RH),Image.LANCZOS).save(f'{OUT}/{key}-orm.webp',quality=90)
g=json.load(open(os.path.join(src,'low.json')))
with open(f'bc/dist/soho141-{key}.js','w') as f:
 f.write(f'// V141 F1 low-poly of SoHo facade {key} (bc/scripts/facade141/build141.py -> cook141.py). Local lot frame: x along the street,\n// y up, z out of the wall (front plane z=0). Baked maps: assets/l11-v141/{key}-alb/-nrm/-orm.webp (orm: r=AO g=roughness).\n')
 f.write('export const GEO={pos:'+json.dumps(g['pos'],separators=(',',':'))+',\nuv:'+json.dumps(g['uv'],separators=(',',':'))+',\nnrm:'+json.dumps(g['nrm'],separators=(',',':'))+'};\n')
# ---- shared runtime textures (only once) ----
rng=np.random.default_rng(141)
def blur(a,r):return np.asarray(Image.fromarray(np.clip(a,0,255).astype(np.uint8),'L').filter(ImageFilter.GaussianBlur(r))).astype(np.float32)
def noise(n,r):return blur(rng.random((n,n)).astype(np.float32)*255,r)/255
def nmap(h,k):
 dx=np.zeros_like(h);dy=np.zeros_like(h);dx[:,1:-1]=h[:,2:]-h[:,:-2];dy[1:-1]=h[2:]-h[:-2];n=np.dstack([-dx*k,dy*k,np.ones_like(h)]);n/=np.linalg.norm(n,axis=2,keepdims=True)
 return Image.fromarray(((n*.5+.5)*255).astype(np.uint8))
def save(a,name,size,mode='RGB'):Image.fromarray(np.clip(a*255,0,255).astype(np.uint8),mode).resize((size,size),Image.LANCZOS).save(f'{OUT}/{name}.webp',quality=90)
if not os.path.exists(f'{OUT}/grate-alb.webp'):
 N=1024
 # bar grating (platforms + stair treads): bearing bars every 32 px, cross rods every 128 px, black paint with rust bloom
 y,x=np.mgrid[0:N,0:N];bar=((x%32)<7)|((y%128)<6);rust=noise(N,6)*.6+noise(N,1.5)*.4
 base=np.dstack([.09+.10*rust,.085+.06*rust,.08+.03*rust]);a=np.where(bar,255,0).astype(np.uint8)
 rgba=np.dstack([(np.clip(base,0,1)*255).astype(np.uint8),a]);Image.fromarray(rgba,'RGBA').resize((256,256),Image.NEAREST).save(f'{OUT}/grate-alb.webp',quality=92,lossless=True)
 h=bar.astype(np.float32)*.6+rust*.25;nmap(blur(h*255,1)/255,3).resize((256,256),Image.LANCZOS).save(f'{OUT}/grate-nrm.webp',quality=92)
 # painted black iron (rails, stringers, brackets, awning arms): chipped paint over rust
 chip=(noise(N,3)>.53).astype(np.float32);r=noise(N,8)
 iron=np.dstack([.07+.25*chip*r+.02*r,.07+.12*chip*r,.075+.04*chip]);save(iron,'iron-alb',256)
 nmap(blur((chip*.5+noise(N,1)*.3)*255,1.2)/255,2.5).resize((256,256),Image.LANCZOS).save(f'{OUT}/iron-nrm.webp',quality=92)
 save(np.dstack([np.ones((N,N)),.45+.4*chip,.55-.45*chip]),'iron-orm',256)
 # awning canvas: bottle-green duck canvas, weave, cream piping at the hem, sun fade + soot streaks; top 3/4 slope, bottom 1/4 valance
 wv=(np.sin(x*np.pi/3)*np.sin(y*np.pi/3))*.5+.5;fade=np.linspace(1.15,.85,N)[:,None]*np.ones((1,N));soot=blur((rng.random((1,N))>.97).astype(np.float32).repeat(N,0)*255,4)/255*np.linspace(0,1,N)[:,None]
 c=np.dstack([.09*fade,.27*fade,.17*fade])*(0.85+.15*wv[...,None])*(1-.35*soot[...,None])*(0.9+.2*noise(N,10)[...,None])
 hem=(y>N*.75)&(y<N*.75+18);c[hem]=[.78,.74,.62];c[y>N-14]=[.78,.74,.62]
 save(c,'awning-alb',512);nmap(blur((wv*.4+noise(N,2)*.6)*255,1)/255,1.5).resize((512,512),Image.LANCZOS).save(f'{OUT}/awning-nrm.webp',quality=92)
print('cooked',key,len(g['pos'])//9,'tris')
