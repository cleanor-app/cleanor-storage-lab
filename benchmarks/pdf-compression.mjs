#!/usr/bin/env node
// PDF compression benchmark: how much smaller a PDF gets with Ghostscript (lossy — it
// downsamples and recompresses images) at three quality presets, versus qpdf (lossless — it
// only recompresses the file structure, never the images). Text is checked before/after so a
// "smaller" file that mangled the text is caught.
//
//   data/pdf-compression.csv
//   node pdf-compression.mjs [--corpus corpus-pdf]
//
// Needs: gs (ghostscript), qpdf, pdftotext + pdfinfo + pdfimages (poppler).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const CORPUS = path.resolve(ROOT, opt('--corpus', 'corpus-pdf'));
const OUT = path.resolve(ROOT, 'data/pdf-compression.csv');
const WORK = path.join(ROOT, '.work-pdf');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const sh = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 });
const size = (p) => fs.statSync(p).size;

// pdftotext to a word list. We compare word MULTISET overlap, not byte-equality: Ghostscript
// re-encodes fonts, so pdftotext extracts equations and figure labels in a slightly different
// order even though the text is fully preserved and selectable. Byte-equality would falsely
// report "text lost"; word overlap reports the truth (typically 95-100% for gs, 100% for qpdf).
function wordsOf(pdf) {
  const r = sh('pdftotext', ['-q', '-enc', 'UTF-8', pdf, '-']);
  return (r.stdout || '').toLowerCase().match(/\S+/g) || [];
}
function wordOverlapPct(a, b) {
  const ca = new Map(), cb = new Map();
  for (const w of a) ca.set(w, (ca.get(w) || 0) + 1);
  for (const w of b) cb.set(w, (cb.get(w) || 0) + 1);
  let common = 0;
  for (const [w, n] of ca) common += Math.min(n, cb.get(w) || 0);
  const tot = Math.max(a.length, b.length) || 1;
  return (common / tot) * 100;
}
function pagesAndImages(pdf) {
  const info = sh('pdfinfo', [pdf]).stdout || '';
  const pages = Number((info.match(/Pages:\s*(\d+)/) || [])[1] || 0);
  const imgs = ((sh('pdfimages', ['-list', pdf]).stdout || '').trim().split('\n').length - 2);
  return { pages, imgs: Math.max(0, imgs) };
}

const METHODS = [
  { name: 'gs /screen (72dpi)', lossy: true, run: (i, o) => sh('gs', ['-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.5', '-dPDFSETTINGS=/screen', '-dNOPAUSE', '-dBATCH', '-dQUIET', `-sOutputFile=${o}`, i]) },
  { name: 'gs /ebook (150dpi)', lossy: true, run: (i, o) => sh('gs', ['-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.5', '-dPDFSETTINGS=/ebook', '-dNOPAUSE', '-dBATCH', '-dQUIET', `-sOutputFile=${o}`, i]) },
  { name: 'gs /printer (300dpi)', lossy: true, run: (i, o) => sh('gs', ['-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.5', '-dPDFSETTINGS=/printer', '-dNOPAUSE', '-dBATCH', '-dQUIET', `-sOutputFile=${o}`, i]) },
  { name: 'qpdf lossless', lossy: false, run: (i, o) => sh('qpdf', ['--linearize', '--object-streams=generate', '--recompress-flate', '--compression-level=9', i, o]) },
];

const q = (v) => { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const rows = [['pdf', 'pages', 'raster_images', 'original_kb', 'method', 'lossy', 'output_kb', 'pct_saved', 'text_word_overlap_pct']];

const files = fs.readdirSync(CORPUS).filter((f) => f.toLowerCase().endsWith('.pdf')).sort();
if (!files.length) { console.error(`No PDFs in ${CORPUS}`); process.exit(1); }

for (const f of files) {
  const src = path.join(CORPUS, f);
  const orig = size(src);
  const { pages, imgs } = pagesAndImages(src);
  const srcWords = wordsOf(src);
  console.log(`▸ ${f}  ${(orig / 1024).toFixed(0)}KB, ${pages}p, ${imgs} imgs`);
  for (const m of METHODS) {
    const out = path.join(WORK, `${f}.${m.name.replace(/\W+/g, '_')}.pdf`);
    m.run(src, out);
    if (!fs.existsSync(out) || size(out) === 0) { console.log(`   x ${m.name} FAILED`); continue; }
    const o = size(out);
    const overlap = wordOverlapPct(srcWords, wordsOf(out));
    rows.push([f, pages, imgs, (orig / 1024).toFixed(0), m.name, m.lossy ? 'lossy' : 'lossless', (o / 1024).toFixed(0), (((orig - o) / orig) * 100).toFixed(1), overlap.toFixed(1)]);
    console.log(`   ${m.name.padEnd(22)} ${(o / 1024).toFixed(0)}KB  -${(((orig - o) / orig) * 100).toFixed(0)}%  text ${overlap.toFixed(0)}%`);
    fs.rmSync(out, { force: true });
  }
}

fs.writeFileSync(OUT, rows.map((r) => r.map(q).join(',')).join('\n') + '\n');

// Headline: mean % saved per method, and how often text survived.
const by = {};
for (const r of rows.slice(1)) (by[r[4]] ??= []).push([Number(r[7]), Number(r[8])]);
console.log('\nMean % saved · mean text overlap:');
for (const m of METHODS.map((x) => x.name)) {
  if (!by[m]) continue;
  const xs = by[m];
  console.log(`  ${m.padEnd(22)} -${(xs.reduce((a, b) => a + b[0], 0) / xs.length).toFixed(0)}%  · text ${(xs.reduce((a,b)=>a+b[1],0)/xs.length).toFixed(0)}% preserved`);
}
console.log(`✓ ${rows.length - 1} rows → ${path.relative(ROOT, OUT)}`);
