#!/usr/bin/env node
// SVG minification benchmark: how much SVGO shrinks an SVG, and how much smaller it is again
// after gzip (which is how it goes over the wire). Savings vary enormously by source — a clean
// icon has little to remove, a detailed emoji or a design-tool export has a lot — so the dataset
// reports the spread, not a single number.
//
//   data/svg-minify.csv
//   node svg-minify.mjs [--corpus corpus-svg]
//
// Needs: svgo (devDependency). Corpus fetched by fetch-svg-corpus.sh.

import { optimize } from 'svgo';
import { gzipSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const CORPUS = path.resolve(ROOT, opt('--corpus', 'corpus-svg'));
const OUT = path.resolve(ROOT, 'data/svg-minify.csv');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const kind = (f) => (f.startsWith('si-') ? 'icon (clean)' : f.startsWith('twemoji') || f.startsWith('openmoji') ? 'emoji (detailed)' : 'other');

const q = (v) => { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const rows = [['file', 'category', 'original_bytes', 'minified_bytes', 'minified_gzip_bytes', 'minify_pct_saved', 'gzip_pct_of_original']];

const files = fs.readdirSync(CORPUS).filter((f) => f.toLowerCase().endsWith('.svg')).sort();
if (!files.length) { console.error(`No .svg in ${CORPUS}`); process.exit(1); }

for (const f of files) {
  const src = fs.readFileSync(path.join(CORPUS, f), 'utf8');
  const orig = Buffer.byteLength(src);
  let min;
  try {
    min = optimize(src, { multipass: true }).data;
  } catch (e) {
    console.log(`   x ${f}: ${e.message}`);
    continue;
  }
  const minBytes = Buffer.byteLength(min);
  const gz = gzipSync(Buffer.from(min), { level: 9 }).length;
  rows.push([f, kind(f), orig, minBytes, gz, (((orig - minBytes) / orig) * 100).toFixed(1), ((gz / orig) * 100).toFixed(1)]);
}

fs.writeFileSync(OUT, rows.map((r) => r.map(q).join(',')).join('\n') + '\n');

// Headline: mean minify saving per category, and gzip-of-original.
const by = {};
for (const r of rows.slice(1)) (by[r[1]] ??= []).push([Number(r[5]), Number(r[6])]);
console.log('SVGO minification:');
for (const [cat, xs] of Object.entries(by)) {
  const m = (i) => (xs.reduce((a, b) => a + b[i], 0) / xs.length).toFixed(1);
  console.log(`  ${cat.padEnd(18)} minify ${m(0)}% smaller · then gzip → ${m(1)}% of original  (n=${xs.length})`);
}
console.log(`✓ ${rows.length - 1} rows → ${path.relative(ROOT, OUT)}`);
