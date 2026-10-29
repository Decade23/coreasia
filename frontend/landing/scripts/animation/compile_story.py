#!/usr/bin/env python3
"""Kompilasi storyboard SVG + fungsi gerak (motion.mjs) menjadi Lottie vektor native.

Turunan compiler animasi Afra Training (build_afra_story_v3.py), dijadikan umum supaya
dipakai ulang di landing lain. Huruf diubah menjadi outline memakai HarfBuzz, jadi JSON
tidak membutuhkan font, gambar, ekspresi, mask, atau filter.

Aturan sumber:
- Elemen hanya svg, g, rect, circle, ellipse, path, text. Warna hex.
- Transform statis hanya translate dan scale.
- Elemen yang bergerak punya id, tanpa atribut transform. Pivot lewat style transform-origin.
- poseStyles(detik) mengembalikan {id: {opacity?, transform?}} dengan satu fungsi transform:
  translateY, translate, rotate, atau scaleX.

Contoh:
  python compile_story.py --source hero-story/desktop --name coreasia-hero-desktop \
    --seconds 12 --out ../../public/animations --font fonts/plus-jakarta-sans-latin-variable-v1.woff2 \
    --markers Cerita,Rancang,Bangun,Uji,Tayang,Dirawat --poster 9.8 --background '#f7f9fc'
"""
import argparse
import gzip
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from io import BytesIO
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.basePen import BasePen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont

R = lambda n: round(float(n), 2)
R1 = lambda n: round(float(n), 1)
prop = lambda v: {'a': 0, 'k': v}
POSES = []
FACE = GLYPH_ORDER = GLYPH_SETS = None


def color(value):
    value = {'white': '#ffffff', 'black': '#000000'}.get(value, value)
    if re.fullmatch(r'#[0-9a-fA-F]{3}', value): value = '#' + ''.join(c * 2 for c in value[1:])
    if not re.fullmatch(r'#[0-9a-fA-F]{6}', value): raise ValueError('Warna tidak didukung: ' + value)
    return [R(int(value[i:i + 2], 16) / 255) for i in (1, 3, 5)] + [1]


class Contours(BasePen):
    def __init__(self, glyphs=None):
        super().__init__(glyphs)
        self.paths, self.current = [], None

    def _moveTo(self, p):
        if self.current: self._finish(False)
        self.current = {'v': [list(p)], 'i': [[0, 0]], 'o': [[0, 0]], 'c': False}

    def _lineTo(self, p):
        self.current['v'].append(list(p)); self.current['i'].append([0, 0]); self.current['o'].append([0, 0])

    def _curveToOne(self, c1, c2, p):
        previous = self.current['v'][-1]
        self.current['o'][-1] = [c1[i] - previous[i] for i in (0, 1)]
        self.current['v'].append(list(p)); self.current['i'].append([c2[i] - p[i] for i in (0, 1)]); self.current['o'].append([0, 0])

    def _qCurveToOne(self, control, p):
        previous = self.current['v'][-1]
        self._curveToOne(tuple(previous[i] + 2 / 3 * (control[i] - previous[i]) for i in (0, 1)),
                         tuple(p[i] + 2 / 3 * (control[i] - p[i]) for i in (0, 1)), p)

    def _finish(self, closed):
        path = self.current
        if path and len(path['v']) > 1:
            if closed and path['v'][0] == path['v'][-1]:
                path['i'][0] = path['i'].pop(); path['v'].pop(); path['o'].pop()
            path['c'] = closed
            self.paths.append(path)
        self.current = None

    def _closePath(self): self._finish(True)
    def _endPath(self): self._finish(False)


def load_font(path):
    global FACE, GLYPH_ORDER, GLYPH_SETS
    font = TTFont(path)
    font.flavor = None
    data = BytesIO(); font.save(data)
    FACE = hb.Face(data.getvalue())
    GLYPH_ORDER = font.getGlyphOrder()
    GLYPH_SETS = {weight: font.getGlyphSet(location={'wght': weight}) for weight in [550, 750]}


def text_paths(element):
    text = ''.join(element.itertext())
    cls = element.get('class', '')
    size, weight, spacing = (11, 750, 1.2) if cls == 'svg-eyebrow' else (11.5, 550, 0) if cls == 'svg-small' else (13, 750, 0)
    size = float(element.get('font-size', size))
    font = hb.Font(FACE); font.scale = (FACE.upem, FACE.upem); font.set_variations({'wght': weight})
    buffer = hb.Buffer(); buffer.add_str(text); buffer.guess_segment_properties(); hb.shape(font, buffer)
    shaped = list(zip(buffer.glyph_infos, buffer.glyph_positions))
    scale = size / FACE.upem
    width = sum(p.x_advance for _, p in shaped) * scale + spacing * max(0, len(shaped) - 1)
    x, y = float(element.get('x', 0)), float(element.get('y', 0))
    if element.get('text-anchor') == 'middle': x -= width / 2
    elif element.get('text-anchor') == 'end': x -= width
    paths = []
    for info, position in shaped:
        name = GLYPH_ORDER[info.codepoint]
        if name == '.notdef': raise ValueError('Glyph tidak ada di font: ' + text)
        pen = Contours(GLYPH_SETS[weight]); GLYPH_SETS[weight][name].draw(pen)
        ox, oy = x + position.x_offset * scale, y - position.y_offset * scale
        for path in pen.paths:
            # Presisi 0,1 px cukup untuk huruf 11 sampai 16 px dan memangkas ukuran JSON hampir separuh.
            path['v'] = [[R1(ox + vx * scale), R1(oy - vy * scale)] for vx, vy in path['v']]
            for key in ['i', 'o']: path[key] = [[R1(vx * scale), R1(-vy * scale)] for vx, vy in path[key]]
            paths.append(path)
        x += position.x_advance * scale + spacing
    return paths


def simplify(samples, tolerance):
    """Batasi galat keyframe linear terhadap setiap sampel sumber."""
    def error(a, b, sample):
        ratio = (sample[0] - a[0]) / (b[0] - a[0])
        return max(abs(sample[1][i] - (a[1][i] + ratio * (b[1][i] - a[1][i]))) for i in range(len(a[1])))
    keep = {0, len(samples) - 1}
    def split(left, right):
        if right - left < 2: return
        distance, index = max((error(samples[left], samples[right], samples[i]), i) for i in range(left + 1, right))
        if distance > tolerance: keep.add(index); split(left, index); split(index, right)
    split(0, len(samples) - 1)
    return [samples[i] for i in sorted(keep)]


def track(values, tolerance=.02):
    samples = [(i, list(v) if isinstance(v, (list, tuple)) else [v]) for i, v in enumerate(values)]
    if all(v == samples[0][1] for _, v in samples): return prop(values[0])
    samples = simplify(samples, tolerance)
    frames = []
    for i, (time, value) in enumerate(samples):
        key = {'t': time, 's': [R(v) for v in value]}
        if i < len(samples) - 1:
            n = len(value); key.update({'o': {'x': [.333] * n, 'y': [.333] * n}, 'i': {'x': [.667] * n, 'y': [.667] * n}})
        frames.append(key)
    return {'a': 1, 'k': frames}


def css_numbers(value): return [float(n) for n in re.findall(r'[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?', value)]


def transform(element):
    tx, ty, sx, sy, rotation = 0., 0., 1., 1., 0.
    for op, args in re.findall(r'(\w+)\(([^)]+)\)', element.get('transform', '')):
        v = css_numbers(args)
        if op == 'translate': tx += v[0] * sx; ty += (v[1] if len(v) > 1 else 0) * sy
        elif op == 'scale': sx *= v[0]; sy *= v[1] if len(v) > 1 else v[0]
        else: raise ValueError('Transform statis tidak didukung: ' + op)
    anchor = [0., 0.]
    if 'transform-origin:' in element.get('style', ''):
        anchor = css_numbers(element.get('style').split('transform-origin:')[1].split(';')[0])
    base = [tx + anchor[0] * sx, ty + anchor[1] * sy]
    result = {'a': prop(anchor), 'p': prop(base), 's': prop([sx * 100, sy * 100]), 'r': prop(rotation),
              'o': prop(float(element.get('opacity', 1)) * 100), 'sk': prop(0), 'sa': prop(0)}
    id = element.get('id')
    if id in POSES[0]:
        if 'opacity' in POSES[0][id]: result['o'] = track([p[id]['opacity'] * 100 for p in POSES], .8)
        if 'transform' in POSES[0][id]:
            op = POSES[0][id]['transform'].split('(')[0]
            values = [css_numbers(p[id]['transform']) for p in POSES]
            if op == 'translateY': result['p'] = track([[base[0], base[1] + v[0]] for v in values], .06)
            elif op == 'translate': result['p'] = track([[base[0] + v[0], base[1] + v[1]] for v in values], .06)
            elif op == 'rotate': result['r'] = track([v[0] for v in values], .08)
            elif op == 'scaleX': result['s'] = track([[sx * 100 * v[0], sy * 100] for v in values], .3)
            else: raise ValueError('Gerak tidak didukung: ' + op)
    return {'ty': 'tr', **result}


def convert(element, inherited=None):
    tag = element.tag.split('}')[-1]
    style = {'fill': '#000000', 'stroke': 'none', 'stroke-width': '1', 'fill-opacity': '1', 'stroke-opacity': '1', **(inherited or {})}
    for key in style:
        if key in element.attrib: style[key] = element.attrib[key]
    name = element.get('id') or ('outline: ' + ''.join(element.itertext()) if tag == 'text' else tag)
    if tag in ['svg', 'g']:
        children = [convert(child, style) for child in element]
        return {'ty': 'gr', 'nm': name, 'it': list(reversed(children)) + [transform(element)]}
    geometry = []
    if tag == 'rect':
        x, y, w, h = [float(element.get(k, 0)) for k in ['x', 'y', 'width', 'height']]
        geometry = [{'ty': 'rc', 'd': 1, 'p': prop([x + w / 2, y + h / 2]), 's': prop([w, h]), 'r': prop(float(element.get('rx', 0)))}]
    elif tag in ['circle', 'ellipse']:
        x, y = [float(element.get(k, 0)) for k in ['cx', 'cy']]
        rx = float(element.get('r', element.get('rx', 0))); ry = float(element.get('r', element.get('ry', 0)))
        geometry = [{'ty': 'el', 'd': 1, 'p': prop([x, y]), 's': prop([rx * 2, ry * 2])}]
    elif tag in ['path', 'text']:
        if tag == 'text': paths = text_paths(element)
        else:
            pen = Contours(); parse_path(element.get('d'), pen)
            if pen.current: pen._endPath()
            paths = pen.paths
        geometry = [{'ty': 'sh', 'd': 1, 'ks': prop({k: [[R(c) for c in point] for point in v] if k != 'c' else v for k, v in path.items()})} for path in paths]
    else: raise ValueError('Elemen SVG tidak didukung: ' + tag)
    if style['fill'] != 'none': geometry.append({'ty': 'fl', 'c': prop(color(style['fill'])), 'o': prop(float(style['fill-opacity']) * 100), 'r': 1})
    if style['stroke'] != 'none': geometry.append({'ty': 'st', 'c': prop(color(style['stroke'])), 'o': prop(float(style['stroke-opacity']) * 100), 'w': prop(float(style['stroke-width'])), 'lc': 2, 'lj': 2, 'ml': 4})
    return {'ty': 'gr', 'nm': name, 'it': geometry + [transform(element)]}


def value(property, frame):
    if not property['a']: return property['k']
    keys = property['k']
    for a, b in zip(keys, keys[1:]):
        if frame <= b['t']:
            ratio = max(0, min(1, (frame - a['t']) / (b['t'] - a['t'])))
            values = [R(x + (y - x) * ratio) for x, y in zip(a['s'], b['s'])]
            return values[0] if len(values) == 1 else values
    result = keys[-1]['s']
    return result[0] if len(result) == 1 else result


def svg_group(group, frame):
    items, tr = group['it'][:-1], group['it'][-1]
    p, a, s, r, o = [value(tr[k], frame) for k in ['p', 'a', 's', 'r', 'o']]
    transform_attr = f'translate({p[0]} {p[1]}) rotate({r}) scale({s[0] / 100} {s[1] / 100}) translate({-a[0]} {-a[1]})'
    if items and all(i['ty'] == 'gr' for i in items): body = ''.join(svg_group(i, frame) for i in reversed(items))
    else:
        fill, stroke, width, fill_opacity, stroke_opacity = 'none', 'none', 0, 1, 1
        rgb = lambda c: '#' + ''.join(f'{round(v * 255):02x}' for v in c[:3])
        for item in items:
            if item['ty'] == 'fl': fill = rgb(value(item['c'], frame)); fill_opacity = value(item['o'], frame) / 100
            elif item['ty'] == 'st': stroke = rgb(value(item['c'], frame)); width = value(item['w'], frame); stroke_opacity = value(item['o'], frame) / 100
        paths, primitives = [], []
        for item in items:
            if item['ty'] == 'rc':
                x, y = value(item['p'], frame); w, h = value(item['s'], frame)
                primitives.append(f'<rect x="{x - w / 2}" y="{y - h / 2}" width="{w}" height="{h}" rx="{value(item["r"], frame)}"/>')
            elif item['ty'] == 'el':
                x, y = value(item['p'], frame); w, h = value(item['s'], frame)
                primitives.append(f'<ellipse cx="{x}" cy="{y}" rx="{w / 2}" ry="{h / 2}"/>')
            elif item['ty'] == 'sh':
                path = value(item['ks'], frame); v = path['v']; d = f'M{v[0][0]} {v[0][1]}'
                for n in range(1, len(v) + (1 if path['c'] else 0)):
                    left, right = (n - 1) % len(v), n % len(v); pt, nextpt = v[left], v[right]; out, inn = path['o'][left], path['i'][right]
                    if any(out + inn): d += f'C{R(pt[0] + out[0])} {R(pt[1] + out[1])} {R(nextpt[0] + inn[0])} {R(nextpt[1] + inn[1])} {nextpt[0]} {nextpt[1]}'
                    else: d += f'L{nextpt[0]} {nextpt[1]}'
                paths.append(d + ('Z' if path['c'] else ''))
        # Kontur huruf digabung dalam satu path supaya lubangnya tetap benar.
        if paths: primitives.append('<path d="' + ' '.join(paths) + '"/>')
        body = (f'<g fill="{fill}" fill-opacity="{fill_opacity}" stroke="{stroke}" stroke-opacity="{stroke_opacity}" '
                f'stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round">' + ''.join(primitives) + '</g>')
    return f'<g transform="{transform_attr}" opacity="{o / 100}">{body}</g>'


def main():
    global POSES
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', required=True, help='folder berisi scene.svg dan motion.mjs')
    ap.add_argument('--name', required=True)
    ap.add_argument('--seconds', type=float, required=True)
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--out', required=True)
    ap.add_argument('--font', required=True, help='font variabel dengan sumbu wght (Plus Jakarta Sans)')
    ap.add_argument('--markers', default='', help='label adegan berurutan, dipisah koma, durasi sama')
    ap.add_argument('--poster', type=float, default=0, help='detik yang dipakai untuk poster')
    ap.add_argument('--background', default='#ffffff')
    ap.add_argument('--poster-scale', type=float, default=2, help='kelipatan resolusi poster WebP')
    ap.add_argument('--poster-quality', type=int, default=80)
    args = ap.parse_args()

    source, out = Path(args.source), Path(args.out)
    load_font(args.font)
    frames = round(args.seconds * args.fps)
    script = ('globalThis.document={querySelector:()=>null};const {poseStyles}=await import(' + json.dumps((source / 'motion.mjs').resolve().as_uri()) +
              f');process.stdout.write(JSON.stringify(Array.from({{length:{frames + 1}}},(_,i)=>poseStyles(i/{args.fps}))));')
    POSES = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', script], text=True))
    assert POSES[0] == POSES[-1], 'Ujung loop harus sama'

    scene = ET.fromstring((source / 'scene.svg').read_text())
    W, H = round(float(scene.get('width'))), round(float(scene.get('height')))
    converted = convert(scene)
    labels = [m for m in args.markers.split(',') if m]
    span = frames // max(1, len(labels))
    data = {'v': '5.13.0', 'fr': args.fps, 'ip': 0, 'op': frames, 'w': W, 'h': H, 'nm': args.name, 'ddd': 0, 'assets': [],
            'layers': [{'ty': 4, 'nm': args.name, 'ind': 1, 'sr': 1, 'ks': {'o': prop(100), 'r': prop(0), 'p': prop([0, 0, 0]), 'a': prop([0, 0, 0]), 's': prop([100, 100, 100])},
                        'shapes': [converted], 'ao': 0, 'ip': 0, 'op': frames, 'st': 0, 'bm': 0}],
            'markers': [{'tm': i * span, 'cm': label, 'dr': span} for i, label in enumerate(labels)],
            'meta': {'g': 'CoreAsia story compiler (turunan compiler Afra)', 'd': 'Vektor native, huruf Plus Jakarta Sans OFL sebagai outline.'}}
    out.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(data, separators=(',', ':'), ensure_ascii=False).encode()
    (out / f'{args.name}.json').write_bytes(raw)
    poster_frame = round(args.poster * args.fps) % frames
    poster = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">' + svg_group(converted, poster_frame) + '</svg>'
    # Poster SVG hanya untuk tinjauan, jadi disimpan di folder sumber, bukan di public.
    (source / 'poster.svg').write_text(poster)
    poster_bytes = None
    try:
        import cairosvg
        from PIL import Image
        png = cairosvg.svg2png(bytestring=poster.encode(), output_width=round(W * args.poster_scale), output_height=round(H * args.poster_scale), background_color=args.background)
        Image.open(BytesIO(png)).convert('RGB').save(out / f'{args.name}-poster.webp', format='WEBP', quality=args.poster_quality, method=6)
        poster_bytes = (out / f'{args.name}-poster.webp').stat().st_size
    except (ImportError, OSError) as error:
        print('Poster WebP dilewati:', error)
    summary = {'name': args.name, 'seconds': args.seconds, 'fps': args.fps, 'frames': frames, 'width': W, 'height': H,
               'jsonBytes': len(raw), 'gzipBytes': len(gzip.compress(raw, 9, mtime=0)), 'posterWebpBytes': poster_bytes,
               'posterFrame': poster_frame, 'markers': labels,
               'sceneSha256': hashlib.sha256((source / 'scene.svg').read_bytes()).hexdigest(),
               'motionSha256': hashlib.sha256((source / 'motion.mjs').read_bytes()).hexdigest(),
               'jsonSha256': hashlib.sha256(raw).hexdigest()}
    (source / 'generated-manifest.json').write_text(json.dumps(summary, indent=2) + '\n')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
