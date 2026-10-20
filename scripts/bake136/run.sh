# V136 ATM lobby bake: sh bc/scripts/bake136/run.sh [spp]   (run from project root; ~minutes)
set -e;S=${1:-64};K=/workspace/work/v136a;BL=$(ls -d /workspace/.cache/blender-arm/blender-5.1.0-*/)blender
node bc/scripts/bake136/dump.mjs $K/raw.json
cd bc;python3 scripts/bake136/mkjson.py $K/raw.json $K/in.json
$BL -b --python scripts/bake134/bake134.py -- $K/in.json $K/out.bin scripts/bake136/atm_preset.py $S 2>&1 | grep -v "^Fra\|^Sample" | tail -5
python3 scripts/bake136/encode136.py $K/in.json $K/out.bin dist/assets/atm136/bake136.bin ${GAIN:-1}
