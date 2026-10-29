#!/usr/bin/env python3
"""Periksa satu folder adegan (scene.svg + motion.mjs) terhadap aturan compile_story.py.

Pakai sebelum kompilasi supaya kesalahan ketahuan lebih awal:
  python3 check_scene.py <folder-adegan> <detik>

Yang diperiksa: elemen dan warna yang didukung, transform statis, elemen bergerak tanpa atribut
transform, id ganda, ujung loop sama, semua id di motion ada di SVG, satu fungsi transform per
bagian, dan opacity di antara 0 sampai 1.
"""
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ALLOWED = {'svg', 'g', 'rect', 'circle', 'ellipse', 'path', 'text'}
NS = '{http://www.w3.org/2000/svg}'

CHECK_JS = r"""
const [file, dur, idsJson] = process.argv.slice(1);
globalThis.document = { querySelector: () => null };
const { poseStyles } = await import(file);
const ids = new Set(JSON.parse(idsJson));
const frames = Math.round(Number(dur) * 30);
const poses = Array.from({ length: frames + 1 }, (_, i) => poseStyles(i / 30));
const errors = [];
if (JSON.stringify(poses[0]) !== JSON.stringify(poses[frames])) errors.push('ujung loop tidak sama');
for (const id of Object.keys(poses[0])) if (!ids.has(id)) errors.push('id tidak ada di SVG: ' + id);
for (const pose of poses) for (const [id, v] of Object.entries(pose)) {
  if ('transform' in v) {
    const ops = v.transform.match(/\w+(?=\()/g) || [];
    if (ops.length !== 1 || !['translateY', 'translate', 'rotate', 'scaleX'].includes(ops[0])) errors.push(id + ' ' + v.transform);
  }
  if ('opacity' in v && (v.opacity < 0 || v.opacity > 1)) errors.push(id + ' opacity ' + v.opacity);
}
process.stdout.write(JSON.stringify({ errors: [...new Set(errors)].slice(0, 12), moving: Object.keys(poses[0]).length, frames }));
"""


def main():
    folder, seconds = Path(sys.argv[1]), sys.argv[2]
    svg = (folder / 'scene.svg').read_text()
    problems = []
    for el in ET.fromstring(svg).iter():
        tag = el.tag.replace(NS, '')
        if tag not in ALLOWED:
            problems.append(f'elemen {tag} tidak didukung')
        for key in ('fill', 'stroke'):
            v = el.get(key)
            if v and v not in ('none', 'white', 'black') and not re.fullmatch(r'#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}', v):
                problems.append(f'warna {v}')
        tr = el.get('transform', '')
        for op in re.findall(r'(\w+)\(', tr):
            if op not in ('translate', 'scale'):
                problems.append(f'transform statis {op}')
        style = el.get('style')
        if style and not re.fullmatch(r'transform-origin:[-\d.]+px [-\d.]+px', style):
            problems.append(f'style {style}')
        if el.get('id') and tr:
            problems.append(f'#{el.get("id")} bergerak tapi punya atribut transform')
    ids = re.findall(r'\sid="([^"]+)"', svg)
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        problems.append(f'id ganda {dup}')
    res = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', CHECK_JS,
                                              (folder / 'motion.mjs').resolve().as_uri(), seconds, json.dumps(ids)], text=True))
    problems += res['errors']
    print(f'{folder}: {res["moving"]} bagian bergerak, {res["frames"]} frame')
    if problems:
        print('\n'.join(sorted(set(problems))))
        sys.exit(1)
    print('lolos')


if __name__ == '__main__':
    main()
