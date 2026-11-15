#!/usr/bin/env python3
"""由 CampusMapSVG.tsx 重繪印刷地圖 printables/campus-map.png（含任務編號針腳）。

當任務針腳座標（src/lib/seed-data.ts 的 mapX/mapY）或地圖藝術層變更後執行：
    python3 scripts/render-map.py
需要 node + sharp（npm install --no-save sharp）。
標籤中文字型：將霞鶩文楷 TTF 放入 ~/.fonts/ 後，librsvg 才能正確渲染中文。
"""
import re
import subprocess
import sys

src = open('src/components/CampusMapSVG.tsx', encoding='utf-8').read()
seed = open('src/lib/seed-data.ts', encoding='utf-8').read()
pins = [(int(n), int(x), int(y)) for n, x, y in re.findall(r'id: (\d),[\s\S]*?mapX: (\d+),\n    mapY: (\d+),', seed)]
assert len(pins) == 8, f'expect 8 pins, got {pins}'

defs = re.search(r'<defs>[\s\S]*?</defs>', src).group(0)
start = src.index('{/* Paper field + campus ground */}')
end = src.index('H610"')
end = src.index('strokeLinecap="round" />', end) + len('strokeLinecap="round" />')
art = src[start:end]


def rects(rows, cols, xexpr, yexpr, w, h, rx):
    out = []
    for r in rows:
        for c in (cols if cols is not None else [0]):
            x = eval(xexpr, {}, {"row": r, "col": c})
            y = eval(yexpr, {}, {"row": r, "col": c})
            out.append(f'<rect x="{x:g}" y="{y:g}" width="{w}" height="{h}" rx="{rx}" />')
    return "\n".join(out)


block_a = '''{[0, 1, 2, 3, 4].map((row) =>
                [0, 1].map((col) => (
                  <rect key={`c-${row}-${col}`} x={76 + col * 28} y={132 + row * 52} width="22" height="26" rx="3" />
                ))
              )}'''
block_b = '''{[0, 1].map((row) =>
                [0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
                  <rect key={`q-${row}-${col}`} x={290 + col * 28} y={88 + row * 32} width="20" height="22" rx="3" />
                ))
              )}'''
block_c = '''{[0, 1, 2, 3, 4].map((row) => (
                <rect key={`s-${row}`} x={572} y={92 + row * 56} width="34" height="26" rx="3" />
              ))}'''
block_d = '''{[0, 1, 2, 3].map((row) => (
                <rect key={`a-${row}`} x={572} y={616 + row * 52} width="34" height="24" rx="3" />
              ))}'''
for blk, exp in [
    (block_a, rects(range(5), range(2), '76 + col * 28', '132 + row * 52', 22, 26, 3)),
    (block_b, rects(range(2), range(8), '290 + col * 28', '88 + row * 32', 20, 22, 3)),
    (block_c, rects(range(5), None, '572', '92 + row * 56', 34, 26, 3)),
    (block_d, rects(range(4), None, '572', '616 + row * 52', 34, 24, 3)),
]:
    assert art.count(blk) == 1, f'JSX map block changed; update blocks in {__file__}'
    art = art.replace(blk, exp)

attr_map = {
    'strokeWidth': 'stroke-width', 'textAnchor': 'text-anchor', 'fontSize': 'font-size',
    'fontWeight': 'font-weight', 'letterSpacing': 'letter-spacing', 'writingMode': 'writing-mode',
    'strokeLinecap': 'stroke-linecap', 'floodColor': 'flood-color', 'floodOpacity': 'flood-opacity',
    'stopColor': 'stop-color',
}
for k, v in attr_map.items():
    art = art.replace(f'{k}=', f'{v}=')
    defs = defs.replace(f'{k}=', f'{v}=')
art = re.sub(r'\{/\*.*?\*/\}', '', art)

marks = ''.join(
    f'<g><circle cx="{x}" cy="{y}" r="23" fill="#F9CF00" stroke="#213155" stroke-width="3"/>'
    f'<text x="{x}" y="{y+9}" text-anchor="middle" font-size="24" font-weight="700" fill="#213155">{n}</text></g>'
    for n, x, y in pins)

svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 990" width="640" height="990">\n'
       + defs + '\n' + art + '\n' + marks + '\n</svg>')
open('/tmp/map-print.svg', 'w', encoding='utf-8').write(svg)

result = subprocess.run([
    'node', '-e',
    "const sharp=require('sharp');const fs=require('fs');"
    "sharp(Buffer.from(fs.readFileSync('/tmp/map-print.svg')),{density:300}).png()"
    ".toFile('printables/campus-map.png').then(i=>console.log('map png',i.width,i.height));",
])
sys.exit(result.returncode)
