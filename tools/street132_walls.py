# V132-street: CC0 ambientCG (ambientcg.com, CC0 1.0) wall tiles for the formerly flat-colour L11 building keys (white / metal / dark)
# plus one extra stucco. Source /workspace/work/v132st/acg/<id>/<id>_1K-JPG_{Color,NormalGL}.jpg (ambientcg.com/get?file=<id>_1K-JPG.zip).
# Luminance-recoloured toward the old palette colour (keeps the city's colour balance), box-downsampled, 5-bit quantised, + half-res normal.
import os,numpy as np
from PIL import Image
SRC='/workspace/work/v132st/acg';OUT='/workspace/projects/536c6175-2b91-4d1e-8d3d-28210d8dbdd7/bc/dist/assets/l11-v132st';os.makedirs(OUT,exist_ok=True)
def lofi(im,n=128,bits=5):
    im=im.resize((n,n),Image.BOX);a=np.asarray(im).astype(np.float32);q=2**(8-bits)
    rng=np.random.default_rng(11);a=a+rng.uniform(-q/2,q/2,a.shape)*.6;a=np.clip(np.round(a/q)*q,0,255).astype(np.uint8);return Image.fromarray(a)
def recolor(im,rgb,contrast=1.0,mix=1.0):
    a=np.asarray(im).astype(np.float32)/255;l=(a*[.3,.59,.11]).sum(2,keepdims=True);m=l.mean();l=np.clip(.5+(l-m)*contrast,0,1)
    c=np.array(rgb)/255;o=c*(.55+.9*l);o=o*mix+a*(1-mix)*(c.mean()/max(a.mean(),1e-3));return Image.fromarray((np.clip(o,0,1)*255).astype(np.uint8))
H=lambda h:[(h>>16)&255,(h>>8)&255,h&255]
JOBS=[('wallWhite0','Plaster001',0xe3e2d7,1.3),('wallWhite1','Plaster003',0xdcd8c8,1.2),('wallWhite2','PaintedPlaster017',0xe6e4dc,1.0),
      ('wallMetal0','PaintedMetal004',0x5a6260,.8),('wallMetal1','Metal029',0x4e5452,1.0),
      ('wallDark0','PaintedMetal006',0x232d30,.6),('wallDark1','PaintedMetal013',0x1e2629,1.1),
      ('wallStucco1','Plaster007',0xcfc2a8,1.2)]
for name,i,col,ct in JOBS:
    c=Image.open(f'{SRC}/{i}/{i}_1K-JPG_Color.jpg').convert('RGB');n=Image.open(f'{SRC}/{i}/{i}_1K-JPG_NormalGL.jpg').convert('RGB')
    lofi(recolor(c,H(col),ct),128).save(f'{OUT}/{name}.webp',quality=85);n.resize((64,64),Image.BOX).save(f'{OUT}/{name}-n.webp',quality=85)
print('ok')
