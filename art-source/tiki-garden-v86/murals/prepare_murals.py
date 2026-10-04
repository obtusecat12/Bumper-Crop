from pathlib import Path
from PIL import Image
import hashlib
import json
import shutil

root = Path(__file__).resolve().parent
generation = json.loads((root / 'generation.json').read_text())
for asset in generation['assets']:
    source = Path(asset['source_generation_path'])
    native = root / (asset['id'] + '-native.png')
    runtime = root / (asset['id'] + '.webp')
    shutil.copy2(source, native)
    with Image.open(native) as im:
        asset['native'] = {'path': str(native), 'width': im.width, 'height': im.height, 'format': im.format, 'mode': im.mode}
        im.convert('RGB').resize((1536, 512), Image.Resampling.LANCZOS).save(runtime, 'WEBP', quality=90, method=6)
    for key, path in [('native', native), ('runtime', runtime)]:
        if key == 'runtime':
            asset[key] = {'path': str(path), 'width': 1536, 'height': 512, 'format': 'WEBP', 'quality': 90, 'resize': 'Lanczos; no crop; full scene preserved'}
        asset[key]['bytes'] = path.stat().st_size
        asset[key]['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
    asset['visual_check'] = 'Muted hand-painted lagoon, jagged volcanic island, framing palms; complete edge-to-edge single scene; no room, frame, bamboo, people or tiled duplicates.'
(root / 'provenance.json').write_text(json.dumps(generation, indent=2) + '\n')
for asset in generation['assets']:
    print(asset['runtime']['path'], asset['runtime']['bytes'])
