"""Pack the 100 generated originals and 72 designed signs without baking scene lighting.
Usage: python scripts/urban-v52/pack-assets.py /absolute/path/urban-assets-v52
"""
from pathlib import Path
from PIL import Image
import json, hashlib, re, sys
source=Path(sys.argv[1]); root=Path(__file__).resolve().parents[2]
out=root/'dist/textures/urban-v52'; out.mkdir(parents=True,exist_ok=True)
metadata=[]
for folder in sorted(source.glob('windows-*')):
    m=json.loads((folder/'manifest.json').read_text())
    for item in m.get('assets',[]) if isinstance(m,dict) else m:
        ident=item.get('number',item.get('id'))
        n=int(re.findall(r'\d+',str(ident))[-1])
        metadata.append((n,item))
metadata.sort()
assert [n for n,m in metadata]==list(range(1,101)), f'Need every original 001–100, have {len(metadata)}'
rules=[
 ('dentist',r'dental|dentist'),('optician',r'optician|optical|eyeglass'),('pharmacy',r'pharma'),('laboratory',r'lab|specimen'),('clinic',r'clinic|medical|dermato|doctor'),
 ('dry-cleaner',r'dry.clean'),('laundromat',r'laundry|laundromat|washer'),('shoe-shop',r'shoe|boot'),('record-shop',r'record|vhs|cassette|music'),('auto-parts',r'auto|tire|car part'),('bakery',r'bakery|pastry|pastel|doughnut|donut|bread'),
 ('produce',r'produce|fruit|vegetable'),('butcher',r'butcher|meat'),('grocery',r'grocery|convenience|gourmet'),('cafe',r'cafe|coffee|ice.cream|cafeteria'),('restaurant',r'diner|pizza|sandwich|takeout|restaurant|food'),
 ('barber',r'barber'),('clothing',r'salon|tailor|clothing|fabric|menswear|beauty'),('bookshop',r'book|comic|stationery|art.supply'),('photo',r'photo|camera|film'),('florist',r'florist|flower'),('jeweler',r'jewel|clock|watch'),
 ('travel',r'travel'),('insurance',r'insurance|tax|legal|account|employment|office|consult|frosted|computer|architect|draft|conference'),('bank',r'bank|exchange'),('real-estate',r'real.estate|leasing|rental'),('hotel',r'lobby|hotel|apartment'),
 ('electronics',r'electronic|radio|television|tv|crt|appliance'),('hardware',r'hardware|industrial|warehouse|wholesale'),('locksmith',r'lock|key'),('copy-shop',r'print|copy'),('furniture',r'furniture'),('variety',r'.*')]
def business(category):
 for key,pattern in rules:
  if re.search(pattern,category,re.I): return key
BUSINESS_BY_ID=['grocery', 'grocery', 'produce', 'pharmacy', 'butcher', 'bakery', 'bakery', 'laundromat', 'dry-cleaner', 'laundromat', 'travel', 'photo', 'photo', 'hardware', 'auto-parts', 'shoe-shop', 'florist', 'variety', 'record-shop', 'record-shop', 'dentist', 'clinic', 'laboratory', 'optician', 'pharmacy', 'clinic', 'clinic', 'insurance', 'insurance', 'insurance', 'real-estate', 'insurance', 'insurance', 'bank', 'bank', 'travel', 'real-estate', 'dentist', 'optician', 'real-estate', 'restaurant', 'cafe', 'restaurant', 'restaurant', 'bakery', 'cafe', 'restaurant', 'barber', 'barber', 'clothing', 'shoe-shop', 'clothing', 'bookshop', 'bookshop', 'record-shop', 'electronics', 'electronics', 'furniture', 'variety', 'variety', 'bank', 'bank', 'real-estate', 'hotel', 'real-estate', 'real-estate', 'insurance', 'real-estate', 'real-estate', 'insurance', 'clothing', 'electrical', 'variety', 'locksmith', 'hardware', 'variety', 'copy-shop', 'jeweler', 'electronics', 'electronics', 'taqueria', 'bakery', 'travel', 'pharmacy', 'electronics', 'clothing', 'jeweler', 'variety', 'bookshop', 'bookshop', 'record-shop', 'variety', 'variety', 'barber', 'photo', 'shoe-shop', 'cafe', 'insurance', 'insurance', 'real-estate']
windows=[]; provenance=[]; hashes=set()
for n,m in metadata:
 paths=list(source.glob(f'windows-*/window-{n:03d}.png'));assert len(paths)==1,(n,paths)
 src=paths[0]; sha=hashlib.sha256(src.read_bytes()).hexdigest();assert sha not in hashes;hashes.add(sha)
 im=Image.open(src).convert('RGB');assert im.width/im.height==1.5,(src,im.size)
 filename=f'window-{n:03d}.webp';im.resize((960,640),Image.Resampling.LANCZOS).save(out/filename,'WEBP',quality=86,method=6)
 category=m.get('category',m.get('business_category',''))
 windows.append({'index':n-1,'file':filename,'category':category,'business':BUSINESS_BY_ID[n-1],'originalSha256':sha})
 provenance.append({'id':n,'category':category,'prompt':m['prompt'],'originalSha256':sha,'originalDimensions':list(im.size),'inspection':m.get('inspection',m.get('visual_notes',m.get('notes',''))),'file':filename})
signs=[]
for s in json.loads((source/'signs/sign-catalog.json').read_text()):
 im=Image.open(source/'signs'/s['filename']).convert('RGB');filename=f'sign-{s["index"]:03d}.webp';im.save(out/filename,'WEBP',quality=92,method=6)
 signs.append({**{k:s[k] for k in ['index','category','aspect','style','displayName','pixelWidth','pixelHeight']},'kind':{'vertical':'banner','plaque':'small','decal':'small','roofsign':'billboard'}.get(s['kind'],s['kind']),'originalKind':s['kind'],'file':filename})
assert len(signs)==72 and len(set(s['style'] for s in signs))==72
(out/'catalog.json').write_text(json.dumps({'version':52,'windows':windows,'signs':signs},ensure_ascii=False,indent=2)+'\n')
(root/'scripts/urban-v52/asset-provenance.json').write_text(json.dumps({'imageMethod':'100 separately generated, full-bleed storefront photographs; no recolors or atlas cells counted as originals.','promptSkill':'https://raw.githubusercontent.com/UzenUPozitiv4ik/gpt-image-2-skill/main/gpt_image_2_prompt_skill.md','windows':provenance,'signs':signs},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'windows':len(windows),'uniqueOriginals':len(hashes),'signs':len(signs),'packedMiB':round(sum(p.stat().st_size for p in out.glob('*.webp'))/1048576,2)}))
