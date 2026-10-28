from pathlib import Path
import json,hashlib
p=Path(__file__).parent
m=json.loads((p/'manifest.json').read_text())
data=b''.join((p/q['file']).read_bytes() for q in m['parts'])
assert hashlib.sha256(data).hexdigest()==m['sha256']
(p.parent/m['output']).write_bytes(data)
print('Restored',m['output'],len(data))
