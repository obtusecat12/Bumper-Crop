"""Keep replaced art in source, outside the deployed 256 MiB static bundle.

Current garden uses materials-v86, and current spring uses npcs-v69. These
explicit retired assets have no live loader; do not generalize this into a
filename/version-based deletion rule. Run idempotently from the repo root.
"""
from pathlib import Path
import hashlib
import json
import shutil

root = Path(__file__).resolve().parents[1]
archive = root / 'art-source/retired-runtime-v86'
garden = 'textures/tiki-garden-v85/'
files = [garden + f'walls/rainforest-0{i}.webp' for i in range(1, 5)]
files += [garden + 'walls/lava-rock-height.webp']
files += [garden + 'plants/runtime/' + name + '-1024.webp' for name in (
    'banana-leaf-clump', 'red-cordyline', 'split-leaf-philodendron',
    'split-leaf-philodendron-v2')]
files += [f'models/spring-v{v}/spa-man-{role}.glb'
          for v in (67, 68) for role in ('a', 'b')]
manifest = []
for relative in files:
    source = root / 'dist' / relative
    destination = archive / relative
    if source.exists():
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists():
            assert source.read_bytes() == destination.read_bytes()
            source.unlink()
        else:
            shutil.move(source, destination)
    payload = destination.read_bytes()
    manifest.append({'previous_runtime_path': relative, 'bytes': len(payload),
                     'sha256': hashlib.sha256(payload).hexdigest()})
archive.mkdir(parents=True, exist_ok=True)
(archive / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
total = sum(p.stat().st_size for p in (root / 'dist').rglob('*') if p.is_file())
print(json.dumps({'archived_bytes': sum(x['bytes'] for x in manifest),
                  'static_bytes': total, 'limit_bytes': 256 * 1024 * 1024}))
assert total < 256 * 1024 * 1024 - 1024 * 1024, 'Keep a minimum 1 MiB margin'
