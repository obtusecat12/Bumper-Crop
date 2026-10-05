"""Conservative offline texture optimization; originals remain in the base Git commit.

Keep URLs/formats, alpha coverage and small nearest-filtered character maps.
Photographic color uses high-quality WebP only when mip-scale error is small.
PBR data maps and Manila references are lossless, with no channel conversion.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ImageOps
import numpy as np
import io, json, hashlib, subprocess, math, re

ROOT=Path(__file__).resolve().parents[1]
BASE=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
OUT=ROOT/'art-source/texture-optimization-v93'; OUT.mkdir(parents=True,exist_ok=True)
FILES=[p for p in (ROOT/'dist').rglob('*') if p.suffix.lower() in ('.webp','.png','.jpg','.jpeg')]
DATA=re.compile(r'normal|rough|metal|height|displace|(?:^|[-_/])ao(?:[-_.]|$)|wetness|mask|depth|flow|noise',re.I)
SPECIAL=re.compile(r'labels|atlas|mural|notice|advertis|sign|menu|newspaper|poster|font|ui/|interface|hud|compass|manila',re.I)
def metric(a,b):
    # Compare at a generous 512px screen footprint; inspect final scene captures too.
    size=a.size
    if max(size)>512:
        size=tuple(max(1,round(v*512/max(size))) for v in size)
        a=a.resize(size,Image.Resampling.LANCZOS); b=b.resize(size,Image.Resampling.LANCZOS)
    x=np.asarray(a.convert('RGBA'),dtype=np.float32);y=np.asarray(b.convert('RGBA'),dtype=np.float32)
    alpha=x[:,:,3:4]/255.;error=((x[:,:,:3]-y[:,:,:3])*alpha)**2
    mse=float(error.mean());return 99. if mse<1e-8 else 10*math.log10(255**2/mse)
def work(p):
    original=p.read_bytes();im=Image.open(io.BytesIO(original));im.load();rel=p.relative_to(ROOT).as_posix()
    row={'path':rel,'before':len(original),'originalSize':list(im.size),'originalSha256':hashlib.sha256(original).hexdigest()}
    data=bool(DATA.search(rel));protected='manila/' in rel or 'level0-k92/chair-wood' in rel or 'level0-v2/furniture-walnut' in rel
    small=max(im.size)<=256; src=im.copy();mode='exact'
    # Do not touch pixel faces, loaded text atlases, photographic reference murals or data-map dimensions.
    if not(data or protected or small or SPECIAL.search(rel)) and max(src.size)>1024:
        size=tuple(max(1,round(v*1024/max(src.size))) for v in src.size)
        src=src.resize(size,Image.Resampling.LANCZOS); mode='screen-sized'
    best=original;quality='original';psnr=99.
    if p.suffix.lower()=='.webp':
        if data or protected or small:
            buf=io.BytesIO();src.save(buf,'WEBP',lossless=True,method=6,exact=True)
            if len(buf.getvalue())<len(best):best=buf.getvalue();quality='lossless'
        else:
            for q in ([95,98] if SPECIAL.search(rel) else [90,95,98]):
                buf=io.BytesIO();src.save(buf,'WEBP',quality=q,method=5,exact=True,alpha_quality=100)
                payload=buf.getvalue()
                if len(payload)>=len(best)*.97:continue
                dec=Image.open(io.BytesIO(payload)).convert(src.mode)
                # Lossy WebP's alpha is nevertheless stored losslessly at full resolution.
                if 'A' in src.getbands() and not np.array_equal(np.asarray(src.getchannel('A')),np.asarray(dec.getchannel('A'))):continue
                score=metric(src,dec)
                if score >= (43 if SPECIAL.search(rel) else 40):best=payload;quality=q;psnr=score;break
    elif p.suffix.lower()=='.png':
        buf=io.BytesIO();src.save(buf,'PNG',optimize=True,compress_level=9)
        if len(buf.getvalue())<len(best):best=buf.getvalue();quality='lossless'
    # Existing JPEGs are already lossy; avoid another generation of compression.
    if len(best)<len(original):
        tmp=p.with_suffix(p.suffix+'.v93tmp');tmp.write_bytes(best);tmp.replace(p)
    else:mode='exact';src=im
    row.update(after=len(best),size=list(src.size),encoding=quality,resize=mode,screenPSNR=round(psnr,2),sha256=hashlib.sha256(best).hexdigest())
    return row
rows=[]
with ThreadPoolExecutor(max_workers=4) as pool:
    for f in as_completed([pool.submit(work,p) for p in FILES]):
        rows.append(f.result())
        if len(rows)%100==0:print('processed',len(rows),'/',len(FILES),flush=True)
rows.sort(key=lambda r:r['path'])
summary={'baseCommit':BASE,'count':len(rows),'changed':sum(r['before']!=r['after'] for r in rows),'beforeBytes':sum(r['before'] for r in rows),'afterBytes':sum(r['after'] for r in rows),'estimatedAllImagesRGBAWithMipsBefore':round(sum(r['originalSize'][0]*r['originalSize'][1]*4*4/3 for r in rows)),'estimatedAllImagesRGBAWithMipsAfter':round(sum(r['size'][0]*r['size'][1]*4*4/3 for r in rows)),'note':'Library-wide pixel estimate, not simultaneous resident GPU memory or measured FPS. Manila and PBR maps retain decoded pixels; source originals remain in baseCommit.'}
(OUT/'manifest.json').write_text(json.dumps({'summary':summary,'files':rows},indent=2)+'\n')
print(json.dumps(summary),flush=True)
