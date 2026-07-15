#!/usr/bin/env node
// Font format weight benchmark: how much a font shrinks as TTF -> WOFF -> WOFF2, and again when
// subset to Latin. WOFF2 (Brotli) is the format to serve on the web; subsetting to the glyphs a
// page actually uses is usually the bigger win. Lossless — the glyph outlines are unchanged.
//
//   data/font-format-weight.csv
//   node font-format-weight.mjs [--corpus corpus-fonts]
//
// Needs: fonttools + brotli (pip install fonttools brotli), and pyftsubset (ships with fonttools).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const CORPUS = path.resolve(ROOT, opt('--corpus', 'corpus-fonts'));
const OUT = path.resolve(ROOT, 'data/font-format-weight.csv');
const WORK = path.join(ROOT, '.work-fonts');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const py = (code) => spawnSync('python3', ['-c', code], { encoding: 'utf8' });
const size = (p) => fs.statSync(p).size;
const convert = (input, output, flavor) =>
  py(`from fontTools.ttLib import TTFont; f=TTFont(${JSON.stringify(input)}); f.flavor=${JSON.stringify(flavor)}; f.save(${JSON.stringify(output)})`);
const subset = (input, output) =>
  spawnSync('pyftsubset', [input, '--unicodes=U+0000-00FF,U+2000-206F', '--layout-features=*', '--flavor=woff2', `--output-file=${output}`], { encoding: 'utf8' });

const q = (v) => { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const rows = [['font', 'variant', 'bytes', 'kb', 'pct_of_ttf']];

const fonts = fs.readdirSync(CORPUS).filter((f) => f.toLowerCase().endsWith('.ttf')).sort();
if (!fonts.length) { console.error(`No .ttf in ${CORPUS}`); process.exit(1); }

for (const font of fonts) {
  const name = path.basename(font, '.ttf');
  const src = path.join(CORPUS, font);
  const ttf = size(src);
  const variants = [['ttf', src, ttf]];

  const woff = path.join(WORK, `${name}.woff`);
  if (convert(src, woff, 'woff').status === 0) variants.push(['woff', woff, size(woff)]);

  const woff2 = path.join(WORK, `${name}.woff2`);
  if (convert(src, woff2, 'woff2').status === 0) variants.push(['woff2', woff2, size(woff2)]);

  const sub = path.join(WORK, `${name}.latin.woff2`);
  if (subset(src, sub).status === 0 && fs.existsSync(sub)) variants.push(['woff2-latin-subset', sub, size(sub)]);

  for (const [variant, , bytes] of variants) {
    rows.push([name, variant, bytes, (bytes / 1024).toFixed(1), ((bytes / ttf) * 100).toFixed(1)]);
  }
  for (const [, p] of variants) if (p !== src) fs.rmSync(p, { force: true });
}

fs.writeFileSync(OUT, rows.map((r) => r.map(q).join(',')).join('\n') + '\n');

// Headline: mean % of TTF for each variant.
const byVariant = {};
for (const r of rows.slice(1)) (byVariant[r[1]] ??= []).push(Number(r[4]));
console.log('Mean size as % of the original TTF:');
for (const v of ['ttf', 'woff', 'woff2', 'woff2-latin-subset']) {
  if (byVariant[v]) console.log(`  ${v.padEnd(20)} ${(byVariant[v].reduce((a, b) => a + b, 0) / byVariant[v].length).toFixed(1)}%`);
}
console.log(`✓ ${rows.length - 1} rows → ${path.relative(ROOT, OUT)}`);
