#!/bin/sh
# r.sh KEY OUT scale spp rotz rotx strength
B=$(ls -d /workspace/.cache/blender-arm/blender-5.1.0-*/)blender
$B -b -P /workspace/projects/536c6175-2b91-4d1e-8d3d-28210d8dbdd7/bc/scripts/ui142/bake_shell142.py -- /workspace/work/v142u2 "$@" 2>&1 | grep -E "WROTE|Error|aniso" 
