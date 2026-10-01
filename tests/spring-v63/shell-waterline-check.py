#!/usr/bin/env python3
"""Read-only shell QA. Run: python shell-waterline-check.py [level10-directory].

Requires numpy/matplotlib. Reads current generated shell and imports current JS
survey through Node. Clips both polygon boundaries at their intersections and
integrates the intersection's oriented boundary: no area raster approximation.
This is numerical geometry QA, not a rendered/browser visibility assessment.
"""
import base64
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from collections import defaultdict

import numpy as np
from matplotlib.path import Path as PolygonPath

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
layout = root / 'dist/level27-layout.js'
shell = root / 'dist/level27-shell-data.js'
source = shell.read_text()
scale = float(re.search(r'scale:([0-9.]+)', source)[1])
def decode(key, dtype):
    return np.frombuffer(base64.b64decode(re.search(key + r":'([^']+)'", source)[1]), dtype=dtype)
vertices = decode('vertices', '<i2').reshape(-1, 3) / scale
indices = decode('indices', '<u4').reshape(-1, 3)
triangles = vertices[indices]
survey = np.array(json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    'const m=await import(' + json.dumps(layout.resolve().as_uri()) + ');console.log(JSON.stringify(m.CAVE_PLAN));'
], text=True)))

# Include quantized vertices lying exactly on y=0; excluding those opens chains.
segments = []
for tri in triangles[(triangles[:, :, 1].min(1) <= 0) & (triangles[:, :, 1].max(1) >= 0)]:
    hits = []
    for a, b in [(tri[0], tri[1]), (tri[1], tri[2]), (tri[2], tri[0])]:
        if a[1] * b[1] < 0:
            hits.append((a + (-a[1]) / (b[1] - a[1]) * (b - a))[[0, 2]])
        if a[1] == 0:
            hits.append(a[[0, 2]])
    hits = np.unique(np.round(np.array(hits), 8), axis=0)
    if len(hits) == 2:
        segments.append(tuple(sorted(map(tuple, hits))))
segments = np.array(list(set(segments)))
adj = defaultdict(list)
for a, b in segments:
    ak, bk = tuple(a), tuple(b)
    adj[ak].append(bk)
    adj[bk].append(ak)
bad = [(k, len(v)) for k, v in adj.items() if len(v) != 2]
if bad:
    raise RuntimeError(f'Waterline is not simple closed loops: {bad[:8]}')
unvisited = set(adj)
loops = []
while unvisited:
    start = next(iter(unvisited))
    curr, last, loop = start, None, []
    while True:
        loop.append(curr)
        unvisited.discard(curr)
        choices = adj[curr]
        nxt = choices[0] if choices[0] != last else choices[1]
        last, curr = curr, nxt
        if curr == start:
            break
    loops.append(np.array(loop))
if len(loops) != 1:
    raise RuntimeError(f'Expected one connected air section, found {len(loops)}; inspect nesting before computing area.')

def cross(a, b):
    return a[..., 0] * b[..., 1] - a[..., 1] * b[..., 0]
def area(poly):
    return cross(poly, np.roll(poly, -1, axis=0)).sum() / 2
def ccw(poly):
    return poly if area(poly) > 0 else poly[::-1]
survey, air = ccw(survey), ccw(loops[0])
survey_path, air_path = PolygonPath(survey), PolygonPath(air)
assert air_path.contains_point([0, 0]), 'Section orientation/nesting requires inspection.'

def inside_boundary_integral(a, b):
    r, s = np.roll(a, -1, axis=0) - a, np.roll(b, -1, axis=0) - b
    d = b[None, :, :] - a[:, None, :]
    den = cross(r[:, None, :], s[None, :, :])
    with np.errstate(invalid='ignore', divide='ignore'):
        ts, us = cross(d, s[None, :, :]) / den, cross(d, r[:, None, :]) / den
    hits = (ts > 0) & (ts < 1) & (us >= 0) & (us <= 1)
    starts, ends = [], []
    for i in range(len(a)):
        cuts = np.unique(np.r_[0, ts[i, hits[i]], 1])
        starts.extend(a[i] + cuts[:-1, None] * r[i])
        ends.extend(a[i] + cuts[1:, None] * r[i])
    starts, ends = np.array(starts), np.array(ends)
    inside = PolygonPath(b).contains_points((starts + ends) / 2)
    return float(cross(starts[inside], ends[inside]).sum() / 2)

intersection_area = inside_boundary_integral(survey, air) + inside_boundary_integral(air, survey)
def inward_vertex_depth(points):
    points = points[survey_path.contains_points(points)]
    if not len(points):
        return None
    edges = np.roll(survey, -1, axis=0) - survey
    d = points[:, None, :] - survey[None, :, :]
    q = np.clip((d * edges[None, :, :]).sum(2) / (edges * edges).sum(1)[None, :], 0, 1)
    dist = np.linalg.norm(d - q[:, :, None] * edges[None, :, :], axis=2).min(1)
    i = dist.argmax()
    return {'x': float(points[i, 0]), 'z': float(points[i, 1]), 'depth_m': float(dist[i])}

face_normals = np.cross(triangles[:, 1] - triangles[:, 0], triangles[:, 2] - triangles[:, 0])
normal_y = face_normals[:, 1] / np.maximum(np.linalg.norm(face_normals, axis=1), 1e-30)
def ray(x, z):
    a = triangles[:, 0][:, [0, 2]]
    uvec = triangles[:, 1][:, [0, 2]] - a
    vvec = triangles[:, 2][:, [0, 2]] - a
    d, den = np.array([x, z]) - a, cross(uvec, vvec)
    with np.errstate(invalid='ignore', divide='ignore'):
        u, v = cross(d, vvec) / den, cross(uvec, d) / den
        y = triangles[:, 0, 1] + u * (triangles[:, 1, 1] - triangles[:, 0, 1]) + v * (triangles[:, 2, 1] - triangles[:, 0, 1])
        hits = np.flatnonzero((u >= -1e-9) & (v >= -1e-9) & (u + v <= 1 + 1e-9) & np.isfinite(y) & (y < 1))
    return [{'triangle': int(j), 'y': round(float(y[j]), 7), 'normal_y': round(float(normal_y[j]), 5)} for j in hits]

samples = []
for x, z in [(-2.115568100, -1.054441811), (1.554431900, -1.824441811), (2.40, 0), (2.46, .50), (1.705, 1.575)]:
    samples.append({'x': x, 'z': z, 'in_survey': bool(survey_path.contains_point([x, z])),
                    'air_at_y0': bool(air_path.contains_point([x, z])), 'shell_hits_below_1m': ray(x, z)})
loss = float(area(survey) - intersection_area)
print(json.dumps({
    'method': 'Decoded mesh; y=0 triangle intersection; polygon boundary integration, endpoints rounded to 1e-8m.',
    'layout_sha256': hashlib.sha256(layout.read_bytes()).hexdigest(),
    'shell_sha256': hashlib.sha256(shell.read_bytes()).hexdigest(),
    'vertices': len(vertices), 'triangles': len(indices), 'waterline_segments': len(segments),
    'survey_area_m2': float(area(survey)), 'air_intersection_area_m2': intersection_area,
    'solid_stone_inside_survey_at_y0_m2': loss, 'loss_percent': loss / area(survey) * 100,
    'maximum_tested_contour_vertex_intrusion': inward_vertex_depth(air),
    'east_x_gt_1p5_maximum_tested_contour_vertex_intrusion': inward_vertex_depth(air[air[:, 0] > 1.5]),
    'samples': samples,
    'caveat': 'Geometry only. Overhead walls/ledges are not automatically shoreline failures. Full planar area assumes one simple air loop with the origin inside; regeneration that changes this is rejected.'
}, indent=2))
