from pathlib import Path
from PIL import Image
import json, shutil, hashlib
root=Path("/workspace/scratch/85111d38430a/assets-garden-v85/album-a")
entries=[{"id":"photo-01","source":"/workspace/scratch/85111d38430a/generated_images/exec-cf17bb4f-f575-49f0-a596-93b87a948cdd.png"},{"id":"photo-02","source":"/workspace/scratch/85111d38430a/generated_images/exec-2e9d8ed2-3b55-4fc8-b538-014e9d184be8.png"},{"id":"photo-03","source":"/workspace/scratch/85111d38430a/generated_images/exec-a9a5c824-6e82-4680-bada-08a2f55b4b69.png"},{"id":"photo-04","source":"/workspace/scratch/85111d38430a/generated_images/exec-cc1d2f75-71e6-4d39-95be-d7a5be8df6b6.png"},{"id":"photo-05","source":"/workspace/scratch/85111d38430a/generated_images/exec-c11bd937-9681-4941-b577-9c852d404696.png"}]
for e in entries:
    source=Path(e["source"])
    target=root/"originals"/(e["id"]+".png")
    shutil.copy2(source,target)
    im=Image.open(target).convert("RGB")
    runtime=root/(e["id"]+".webp")
    im.resize((960,720),Image.Resampling.LANCZOS).save(runtime,"WEBP",quality=85,method=6)
    e.update({"original":str(target),"original_dimensions":list(im.size),"runtime":str(runtime),"runtime_dimensions":[960,720],"runtime_bytes":runtime.stat().st_size,"prompt":str(root/"prompts"/(e["id"]+".txt")),"sha256":hashlib.sha256(target.read_bytes()).hexdigest(),"inspection":"No people, distinct indoor American Tiki water feature, period consumer-camera framing and ordinary lighting."})
manifest={"description":"Five independently generated 4:3 Tiki water-garden loading slideshow photos","generator":"built-in image_gen","generation_calls":5,"runtime_format":"WebP","runtime_quality":85,"entries":entries}
(root/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({"runtime":[{"path":e["runtime"],"bytes":e["runtime_bytes"]} for e in entries],"manifest":str(root/"manifest.json")},indent=2))

