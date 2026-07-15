#!/usr/bin/env node
// Lossless recompression benchmark: how much smaller a PNG or JPEG gets with NO quality loss,
// just better entropy coding and stripped metadata. oxipng for PNG, jpegtran (mozjpeg) for JPEG.
// Every output is bit-for-bit the same image — only the file is smaller.
//
//   data/lossless-recompression.csv
//   node lossless-recompression.mjs [--corpus corpus-img]
//
// Needs: oxipng, jpegtran (brew install oxipng mozjpeg).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const CORPUS = path.resolve(ROOT, opt('--corpus', 'corpus-img'));
const OUT = path.resolve(ROOT, 'data/lossless-recompression.csv');
const WORK = path.join(ROOT, '.work-lossless');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const sh = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
const size = (p) => fs.statSync(p).size;

const q = (v) => { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const rows = [['file', 'format', 'method', 'original_bytes', 'recompressed_bytes', 'pct_saved']];

const files = fs.readdirSync(CORPUS).sort();
for (const f of files) {
  const src = path.join(CORPUS, f);
  const ext = path.extname(f).toLowerCase();

  if (ext === '.png') {
    const out = path.join(WORK, f);
    fs.copyFileSync(src, out);
    // -o max: exhaustive lossless recompression; --strip safe removes non-image metadata.
    sh('oxipng', ['-o', 'max', '--strip', 'safe', '-q', out]);
    const orig = size(src), rec = size(out);
    rows.push([f, 'png', 'oxipng -o max --strip safe', orig, rec, (((orig - rec) / orig) * 100).toFixed(1)]);
    fs.rmSync(out, { force: true });
  } else if (ext === '.jpg' || ext === '.jpeg') {
    for (const [method, args] of [
      ['jpegtran -optimize', ['-optimize', '-copy', 'none']],
      ['jpegtran -progressive', ['-optimize', '-progressive', '-copy', 'none']],
    ]) {
      const out = path.join(WORK, `${f}.${method.includes('progressive') ? 'p' : 'o'}.jpg`);
      const r = sh('jpegtran', [...args, src]);
      fs.writeFileSync(out, r.stdout ? Buffer.from(r.stdout, 'binary') : Buffer.alloc(0));
      // jpegtran writes binary to stdout; capture reliably via -outfile instead.
      sh('jpegtran', [...args, '-outfile', out, src]);
      const orig = size(src), rec = size(out);
      rows.push([f, 'jpeg', method, orig, rec, (((orig - rec) / orig) * 100).toFixed(1)]);
      fs.rmSync(out, { force: true });
    }
  }
}

fs.writeFileSync(OUT, rows.map((r) => r.map(q).join(',')).join('\n') + '\n');

// Headline: mean % saved per format+method.
const byMethod = {};
for (const r of rows.slice(1)) ((byMethod[r[2]] ??= []).push(Number(r[5])));
console.log('Lossless recompression, mean % saved:');
for (const [m, xs] of Object.entries(byMethod)) console.log(`  ${m.padEnd(24)} ${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)}%  (n=${xs.length})`);
console.log(`✓ ${rows.length - 1} rows → ${path.relative(ROOT, OUT)}`);
