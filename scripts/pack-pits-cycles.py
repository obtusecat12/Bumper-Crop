import pathlib,json,numpy as np
from scipy.ndimage import gaussian_filter
from PIL import Image
R=pathlib.Path(__file__).resolve().parents[1];S=R/'art-source/level0-pit-cycles';a=json.loads((S/'atlas.json').read_text());raw=np.fromfile(S/'irradiance.f32',dtype=np.float32).reshape(1024,1024,4)[:,:,:3];out=np.zeros_like(raw)
for variant in a['variants']:
 for x,y,w,h in [q['rect'] for q in variant['walls']]+[variant['floor']]:
  tile=gaussian_filter(raw[y:y+h,x:x+w],(.7,.7,0));out[y-3:y+h+3,x-3:x+w+3]=np.pad(tile,((3,3),(3,3),(0,0)),mode='edge')
pixels=np.rint(np.sqrt(np.clip(out/4,0,1))*255).astype(np.uint8)
Image.fromarray(np.flipud(pixels)).save(R/'dist/assets/level0-pit-cycles/irradiance.webp',quality=90,method=6)
(R/'dist/level0-pit-cycles-data.js').write_text('export const PIT_ATLAS='+json.dumps(a,separators=(',',':'))+';\n')
