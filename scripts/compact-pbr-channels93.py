"""Repack verified standard-material data maps, preserving every consumed sample exactly."""
from pathlib import Path
from PIL import Image
import numpy as np,json,re
root=Path(__file__).resolve().parents[1];records=[]
for version in ['tiki-v76','tiki-v77','tiki-v78']:
 for file in (root/'dist/textures'/version).rglob('*'):
  if file.suffix not in ['.png','.webp']:continue
  stem=file.stem;match=re.search(r'(?:^|-)(roughness|ao|height|metalness|metallic|normal)$',stem)
  if not match:continue
  kind=match[1];channel={'roughness':1,'ao':0,'height':0,'metalness':2,'metallic':2}.get(kind)
  im=Image.open(file).convert('RGB');a=np.asarray(im);old=file.stat().st_size
  target=file.with_suffix('.webp')
  if target!=file and target.exists():raise RuntimeError('existing runtime target '+str(target))
  output=im if channel is None else Image.fromarray(a[...,channel],'L')
  import io
  bio=io.BytesIO();output.save(bio,format='WEBP',lossless=True,method=6,exact=True)
  decoded=np.asarray(Image.open(io.BytesIO(bio.getvalue())).convert('RGB'))
  assert np.array_equal(a,decoded) if channel is None else np.array_equal(a[...,channel],decoded[...,channel])
  if target==file and len(bio.getvalue())>=old:continue
  target.write_bytes(bio.getvalue())
  if target!=file:file.unlink()
  records.append({'from':str(file.relative_to(root)),'to':str(target.relative_to(root)),'oldBytes':old,'newBytes':len(bio.getvalue()),'samplePreserved':'RGB' if channel is None else 'RGB'[channel],'dimensions':im.size})
p=root/'dist/tiki-materials-v77.js';s=p.read_text().replace("path+(color?'.webp':'.png')","path+'.webp'");p.write_text(s)
p=root/'dist/textures/tiki-v78/manifest.json';data=json.loads(p.read_text())
for item in data['assets'].values():
 if item['file'].endswith('.png') and (p.parent/item['file'].replace('.png','.webp')).exists():item['file']=item['file'].replace('.png','.webp')
p.write_text(json.dumps(data,indent=2))
report={'note':'Verified consumers are MeshStandard/Physical roughness G, metallic B, AO/displacement R; tangent normals retain RGB. No dimensional, quantization, or sampled-channel change. PNG data becomes lossless WebP; original pixels retained in base Git commit.','count':len(records),'beforeBytes':sum(r['oldBytes'] for r in records),'afterBytes':sum(r['newBytes'] for r in records),'files':records}
(root/'art-source/texture-optimization-v93/pbr-channel-repack.json').write_text(json.dumps(report,indent=2));print({k:v for k,v in report.items() if k!='files'})
