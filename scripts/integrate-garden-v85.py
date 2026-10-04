from pathlib import Path
import shutil,json
root=Path(__file__).resolve().parents[1]; art=root.parent/'assets-garden-v85'; target=root/'dist/textures/tiki-garden-v85'
for name in ['walls','plants','drinks','npc','album-a','album-b']:
 src=art/name
 if not src.exists():continue
 shutil.copytree(src,root/'art-source/tiki-garden-v85'/name,dirs_exist_ok=True)
 for f in src.rglob('*'):
  if not f.is_file() or f.suffix not in ['.webp','.png']:continue
  if 'originals' in f.parts or 'native' in f.parts or 'inspection' in f.parts or '-original' in f.name:continue
  rel=f.relative_to(src); dest=target/('album' if name.startswith('album-') else name)/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
for n in ['tiki-garden-v85.js','tiki-garden-mesh-v85.js','tiki-garden-water-v85.js']:
 p=root/'dist'/n;s=p.read_text();s=s.replace('tiki-garden-plan-v81.js','tiki-garden-plan-v85.js')
 if n=='tiki-garden-v85.js':s=s.replace('materials-v81','materials-v85').replace('mesh-v81','mesh-v85').replace('water-v81','water-v85')
 p.write_text(s)
p=root/'dist/tiki-garden-plan-v85.js';s=p.read_text().replace('ceiling:3.08','ceiling:6.93');p.write_text(s)
for n in ['preview.html','capture.mjs']:
 p=root/'tests/tiki-garden-v85'/n;s=p.read_text().replace('tiki-garden-v81','tiki-garden-v85').replace('tiki-garden-plan-v81','tiki-garden-plan-v85');p.write_text(s)
p=root/'dist/main.js';s=p.read_text().replace("from './tiki-garden-plan-v81.js'","from './tiki-garden-plan-v85.js'").replace("import('./tiki-garden-v81.js')","import('./tiki-garden-v85.js')").replace('低顶室内水景','高顶室内水景');a=s.index('const gardenTransition=');b=s.index('\n',a);s=s[:a]+s[a:b].replace('textures/tiki-v76/album/','textures/tiki-garden-v85/album/')+s[b:];p.write_text(s)
