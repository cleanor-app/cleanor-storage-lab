#!/usr/bin/env node
// Cleanor Storage Lab — "State of Next-Gen Image Formats" benchmark.
//
// Extends the JPEG/WebP/AVIF work with JPEG XL. For each master image, encodes
// JPEG / WebP / AVIF / JXL across a quality ladder, measures SSIM vs the lossless
// master (ffmpeg), and interpolates each format's size at a matched perceptual
// quality (SSIM 0.95 "good" and 0.98 "high"). Also measures JXL's lossless
// recompression of an existing JPEG (bit-exact, the JXL killer feature).
//
//   node nextgen-formats-benchmark.mjs            # corpus corpus
//
// Needs: sharp (repo dep), cjxl/djxl (brew install jpeg-xl), ffmpeg (brew).

import sharp from 'sharp';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : d;
};
const CORPUS = path.resolve(ROOT, opt('--corpus', 'corpus'));
const OUT = path.resolve(ROOT, opt('--out', 'data/nextgen-formats-benchmark.csv'));
const WORK = path.join(ROOT, '.work/nextgen');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const Q = [40, 50, 60, 70, 80, 90, 95];
const bytes = (p) => fs.statSync(p).size;
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0)
    throw new Error(`${cmd} ${args.join(' ')} -> ${(r.stderr || '').slice(0, 200)}`);
};
function ssim(refPng, candPng) {
  const r = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-i', candPng, '-i', refPng, '-lavfi', 'ssim', '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  const m = (r.stderr || '').match(/All:([0-9.]+)/);
  return m ? parseFloat(m[1]) : null;
}
// encode master(png) -> format at quality q, return {bytes, ssim}
async function encodeMeasure(masterPng, refPng, fmt, q, base) {
  let file, decoded;
  if (fmt === 'jpeg') {
    file = `${base}.q${q}.jpg`;
    await sharp(masterPng).jpeg({ quality: q, mozjpeg: true }).toFile(file);
    decoded = `${base}.q${q}.jpg.png`;
    await sharp(file).png().toFile(decoded);
  } else if (fmt === 'webp') {
    file = `${base}.q${q}.webp`;
    await sharp(masterPng).webp({ quality: q }).toFile(file);
    decoded = `${base}.q${q}.webp.png`;
    await sharp(file).png().toFile(decoded);
  } else if (fmt === 'avif') {
    file = `${base}.q${q}.avif`;
    await sharp(masterPng).avif({ quality: q, effort: 4 }).toFile(file);
    decoded = `${base}.q${q}.avif.png`;
    await sharp(file).png().toFile(decoded);
  } else if (fmt === 'jxl') {
    file = `${base}.q${q}.jxl`;
    run('cjxl', [masterPng, file, '-q', String(q), '-e', '7', '--quiet']);
    decoded = `${base}.q${q}.jxl.png`;
    run('djxl', [file, decoded, '--quiet']);
  }
  return { bytes: bytes(file), ssim: ssim(refPng, decoded) };
}
// size (bytes) interpolated at target SSIM from a format's (ssim,bytes) ladder
function bytesAtSsim(points, target) {
  const pts = points.filter((p) => p.ssim != null).sort((a, b) => a.ssim - b.ssim);
  if (!pts.length) return null;
  if (target <= pts[0].ssim) return pts[0].bytes;
  if (target >= pts[pts.length - 1].ssim) return pts[pts.length - 1].bytes;
  for (let k = 1; k < pts.length; k++) {
    if (target <= pts[k].ssim) {
      const a = pts[k - 1],
        b = pts[k];
      const t = (target - a.ssim) / (b.ssim - a.ssim || 1);
      return a.bytes + t * (b.bytes - a.bytes);
    }
  }
  return pts[pts.length - 1].bytes;
}

const masters = fs
  .readdirSync(CORPUS)
  .filter((f) => /\.png$/i.test(f))
  .sort();
const FMTS = ['jpeg', 'webp', 'avif', 'jxl'];
console.log(
  `Next-gen formats benchmark · ${masters.length} masters · ${FMTS.join('/')} · q=${Q.join('/')}\n`,
);

const rows = []; // per image: matched sizes + lossless-jpeg transcode
let i = 0;
for (const file of masters) {
  const name = path.parse(file).name;
  const master = path.join(CORPUS, file);
  const refPng = path.join(WORK, `${name}.ref.png`);
  await sharp(master).png({ compressionLevel: 6 }).toFile(refPng);

  const perFmt = {};
  for (const fmt of FMTS) {
    const pts = [];
    for (const q of Q) pts.push(await encodeMeasure(refPng, refPng, fmt, q, path.join(WORK, name)));
    perFmt[fmt] = pts;
  }
  // matched-quality sizes
  const m95 = {},
    m98 = {};
  for (const fmt of FMTS) {
    m95[fmt] = bytesAtSsim(perFmt[fmt], 0.95);
    m98[fmt] = bytesAtSsim(perFmt[fmt], 0.98);
  }
  // JXL lossless recompression of an existing JPEG (q90)
  const jpg = path.join(WORK, `${name}.src.jpg`);
  await sharp(refPng).jpeg({ quality: 90, mozjpeg: true }).toFile(jpg);
  const jxlLossless = path.join(WORK, `${name}.src.jxl`);
  run('cjxl', [jpg, jxlLossless, '--lossless_jpeg=1', '--quiet']);

  rows.push({ name, m95, m98, jpgBytes: bytes(jpg), jxlLosslessBytes: bytes(jxlLossless) });
  process.stdout.write(
    `\r  ${++i}/${masters.length} ${name}  avif95 ${(m95.avif / 1024).toFixed(0)}KB jxl95 ${(m95.jxl / 1024).toFixed(0)}KB   `,
  );
}
console.log('\n');

// ---- CSV ----
const header = [
  'image',
  ...FMTS.map((f) => `${f}_ssim95_bytes`),
  ...FMTS.map((f) => `${f}_ssim98_bytes`),
  'jpeg_q90_bytes',
  'jxl_lossless_bytes',
];
const lines = rows.map((r) =>
  [
    r.name,
    ...FMTS.map((f) => Math.round(r.m95[f])),
    ...FMTS.map((f) => Math.round(r.m98[f])),
    r.jpgBytes,
    r.jxlLosslessBytes,
  ].join(','),
);
fs.writeFileSync(OUT, [header.join(','), ...lines].join('\n'));
console.log(`✓ ${rows.length} images → ${path.relative(ROOT, OUT)}`);

// ---- aggregate ----
const sum = (f) => rows.reduce((a, r) => a + f(r), 0);
const pctVsJpeg = (fmt, band) => {
  const j = sum((r) => r[band].jpeg),
    x = sum((r) => r[band][fmt]);
  return (((x - j) / j) * 100).toFixed(1);
};
console.log('\nMatched-quality size vs JPEG (negative = smaller):');
for (const band of ['m95', 'm98']) {
  const label = band === 'm95' ? 'SSIM 0.95 (good)' : 'SSIM 0.98 (high)';
  console.log(
    `  ${label}:  WebP ${pctVsJpeg('webp', band)}%   AVIF ${pctVsJpeg('avif', band)}%   JXL ${pctVsJpeg('jxl', band)}%`,
  );
}
const jp = sum((r) => r.jpgBytes),
  jx = sum((r) => r.jxlLosslessBytes);
console.log(
  `\nJXL lossless recompression of existing JPEGs: ${(((jx - jp) / jp) * 100).toFixed(1)}% size change (bit-exact, reversible).`,
);
console.log(`  Corpus JPEG ${(jp / 1e6).toFixed(2)} MB -> JXL ${(jx / 1e6).toFixed(2)} MB`);
