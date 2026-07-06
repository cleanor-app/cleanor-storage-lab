#!/usr/bin/env node
// Cleanor Storage Lab — Study A2: Photo "Compression Reality" benchmark.
//
// For a fixed image corpus, encodes every image to JPEG / WebP / AVIF across a quality
// ladder (sharp / libvips — the same engine behind Cleanor's image tools), then measures
// perceptual quality (SSIM + PSNR via ffmpeg) against the lossless original. Produces a
// reproducible "how much space does compressing a photo really save, and at what quality
// cost" dataset.
//
//   node compression-benchmark.mjs                 # corpus corpus
//   node compression-benchmark.mjs --corpus DIR --out data/x.csv
//
// Needs: sharp (repo dep), ffmpeg (brew). Writes data/compression-benchmark.csv

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
const OUT = path.resolve(ROOT, opt('--out', 'data/compression-benchmark.csv'));
const WORK = path.join(ROOT, '.work');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const QUALITIES = [40, 50, 60, 70, 80, 90, 95, 98];
const FORMATS = [
  { name: 'jpeg', ext: 'jpg', enc: (img, q) => img.jpeg({ quality: q }) }, // libjpeg-turbo, standard
  { name: 'webp', ext: 'webp', enc: (img, q) => img.webp({ quality: q }) },
  { name: 'avif', ext: 'avif', enc: (img, q) => img.avif({ quality: q, effort: 4 }) },
];

// SSIM (All) + PSNR (average) of candidate vs original, via ffmpeg.
// ffmpeg writes filter metrics to stderr, so read stderr regardless of exit code.
function ffStderr(filter, orig, cand) {
  const r = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-i', orig, '-i', cand, '-lavfi', filter, '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  return String(r.stderr || '');
}
function quality(orig, cand) {
  const ssim = parseFloat((ffStderr('ssim', orig, cand).match(/All:([0-9.]+)/) || [])[1]);
  const pm = ffStderr('psnr', orig, cand).match(/average:([0-9.a-z]+)/);
  const psnr = pm ? (pm[1] === 'inf' ? Infinity : parseFloat(pm[1])) : NaN;
  return { ssim, psnr };
}

const images = fs
  .readdirSync(CORPUS)
  .filter((f) => /\.(png|tif|tiff|ppm|bmp|jpe?g)$/i.test(f))
  .sort();
if (!images.length) {
  console.error(`No source images in ${CORPUS}`);
  process.exit(1);
}

console.log(`\nCleanor Storage Lab · A2 photo compression benchmark`);
console.log(
  `${images.length} images × ${FORMATS.length} formats × ${QUALITIES.length} qualities = ${images.length * FORMATS.length * QUALITIES.length} encodes\n`,
);

const rows = [];
let done = 0;
const total = images.length * FORMATS.length * QUALITIES.length;

for (const file of images) {
  const src = path.join(CORPUS, file);
  const meta = await sharp(src).metadata();
  const pixels = meta.width * meta.height;
  for (const fmt of FORMATS) {
    for (const q of QUALITIES) {
      const cand = path.join(WORK, `c.${fmt.ext}`);
      const buf = await fmt.enc(sharp(src), q).toBuffer();
      fs.writeFileSync(cand, buf);
      const { ssim, psnr } = quality(src, cand);
      rows.push({
        image: file,
        w: meta.width,
        h: meta.height,
        pixels,
        format: fmt.name,
        quality: q,
        bytes: buf.length,
        bpp: +((buf.length * 8) / pixels).toFixed(4),
        ssim: +ssim.toFixed(5),
        psnr: psnr === Infinity ? 'inf' : +psnr.toFixed(3),
      });
      done++;
      process.stdout.write(
        `\r  ${done}/${total} · ${file} ${fmt.name} q${q} → ${(buf.length / 1024).toFixed(0)}KB ssim ${ssim.toFixed(4)}   `,
      );
    }
  }
}
console.log('\n');

const header = 'image,width,height,pixels,format,quality,bytes,bpp,ssim,psnr';
const csv = [header].concat(
  rows.map(
    (r) =>
      `${r.image},${r.w},${r.h},${r.pixels},${r.format},${r.quality},${r.bytes},${r.bpp},${r.ssim},${r.psnr}`,
  ),
);
fs.writeFileSync(OUT, csv.join('\n'));
console.log(`✓ ${rows.length} rows → ${path.relative(ROOT, OUT)}\n`);
