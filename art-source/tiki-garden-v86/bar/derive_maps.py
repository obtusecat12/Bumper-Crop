"""Copy generated bar surfaces and derive low-impact runtime maps in staging only.

Maps are appearance estimates from diffuse images, not measured scans. Normals use
OpenGL/+Y tangent convention; basecolor files keep generated pixels except resize.
"""
from pathlib import Path
import hashlib
import json
import shutil

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parent
GENERATED = ROOT.parents[1] / "generated_images"
REFERENCE = ROOT.parents[1] / "upload" / "QQ20261004-202218(1).png"
SOURCES = {
    "shutter": "exec-e925c26c-1280-47be-9472-c4dce052dfff.png",
    "lauhala": "exec-dc552002-1822-43c5-913f-a1e40834f119.png",
    "reed": "exec-aeba7a31-0aa8-4ade-a6b1-7eabb70f4ea7.png",
    "notice": "exec-e1c2fd5f-8a8b-435c-ab0d-9407eaeefda9.png",
}
ROUGHNESS = {"shutter": 0.83, "lauhala": 0.92, "reed": 0.86}
NORMAL_SLOPE = {"shutter": 0.42, "lauhala": 0.24, "reed": 0.32}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def gray_save(values, path):
    Image.fromarray(np.uint8(np.clip(values, 0, 1) * 255), "L").save(path)


def derive_surface(rgb, name):
    small = rgb.resize((512, 512), Image.Resampling.LANCZOS)
    values = np.asarray(small).astype(np.float32) / 255.0
    lum = values @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    smooth = gaussian_filter(lum, 0.65, mode="wrap")
    if name == "shutter":
        # Keep long horizontal louvres continuous; retain a little surface wear.
        smooth = 0.82 * smooth.mean(axis=1, keepdims=True) + 0.18 * smooth
    low, high = np.percentile(smooth, [5, 95])
    height = np.clip((smooth - low) / max(high - low, 0.001), 0, 1)
    dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 0.5
    dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 0.5
    gradient95 = max(np.percentile(np.sqrt(dx * dx + dy * dy), 95), 0.005)
    amount = NORMAL_SLOPE[name] / gradient95
    # Raster y points down; +Y tangent normals require green = +d(height)/dy.
    normal = np.stack((-dx * amount, dy * amount, np.ones_like(dx)), axis=2)
    normal /= np.linalg.norm(normal, axis=2, keepdims=True)
    Image.fromarray(np.uint8(np.clip(normal * 0.5 + 0.5, 0, 1) * 255), "RGB").save(
        ROOT / "runtime" / f"{name}-normal-plus-y-512.png"
    )
    detail = lum - gaussian_filter(lum, 4.0, mode="wrap")
    rough = ROUGHNESS[name] + np.clip(-detail * 0.22, -0.045, 0.045)
    gray_save(rough, ROOT / "runtime" / f"{name}-roughness-512.png")
    cavity = np.clip(gaussian_filter(height, 2.0, mode="wrap") - height, 0, 0.6)
    ao = 1.0 - cavity * 0.22
    gray_save(ao, ROOT / "runtime" / f"{name}-ao-512.png")


def main():
    entries = {}
    for name, filename in SOURCES.items():
        source = GENERATED / filename
        native = ROOT / "native" / f"{name}-native.png"
        shutil.copy2(source, native)
        rgb = Image.open(native).convert("RGB")
        size = (256, 512) if name == "notice" else (1024, 1024)
        base_path = ROOT / "runtime" / f"{name}-basecolor-{512 if name == 'notice' else 1024}.png"
        rgb.resize(size, Image.Resampling.LANCZOS).save(base_path)
        if name != "notice":
            derive_surface(rgb, name)
        entries[name] = {
            "native_path": str(native),
            "native_pixels": list(rgb.size),
            "native_sha256": digest(native),
            "builtin_source_path": str(source),
            "prompt_path": str(ROOT / "prompts" / f"{name}.txt"),
            "prompt_sha256": digest(ROOT / "prompts" / f"{name}.txt"),
            "basecolor_path": str(base_path),
            "basecolor_pixels": list(size),
            "maps": [] if name == "notice" else [
                str(ROOT / "runtime" / f"{name}-normal-plus-y-512.png"),
                str(ROOT / "runtime" / f"{name}-roughness-512.png"),
                str(ROOT / "runtime" / f"{name}-ao-512.png"),
            ],
        }
    manifest = {
        "created_utc": "2026-10-04",
        "generation_mode": "builtin image_gen.imagegen; four separate reference-guided calls",
        "reference_path": str(REFERENCE),
        "reference_sha256": digest(REFERENCE),
        "notes": [
            "Every prompt starts with the exact prefix required by the supplied prompt skill.",
            "Generated native images are preserved. Runtime basecolor only resizes them.",
            "All 3 surface prompts requested seamless repeat in both axes; no generated guarantee of mathematical edge equality.",
            "Normal, roughness and AO are estimates derived from diffuse appearance, not physical material scans.",
            "Normals are tangent-space OpenGL/+Y, 512x512 RGB; roughness and AO are 512x512 linear grayscale.",
            "Notice is 1:2, 256x512 (512-pixel long edge), no frame. Print is kept in basecolor only.",
            "Basecolor uses sRGB source values; all derived maps should be sampled with linear/no-color-space settings.",
        ],
        "assets": entries,
    }
    (ROOT / "provenance.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(entries, indent=2))


if __name__ == "__main__":
    main()
