#!/usr/bin/env node
// Animated format size benchmark: the same short clip as GIF, APNG, MP4 and WebM.
//
// Answers "why is my GIF so huge, and how much smaller is an MP4". Each source clip is reduced
// to a canonical animated clip (3 s, 480 px wide, 15 fps) and encoded five ways; the GIF is the
// baseline. The GIF is not only the biggest, it is also the lowest quality (256 colours), so the
// ratio understates the real trade-off. Needs ffmpeg. Corpus reused from the video benchmark.
//
//   data/gif-format-benchmark.csv
//   node gif-format-benchmark.mjs [--corpus corpus-video]

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const CORPUS = path.resolve(ROOT, opt('--corpus', 'corpus-video'));
const OUT = path.resolve(ROOT, 'data/gif-format-benchmark.csv');
const WORK = path.join(ROOT, '.work-gif');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// Canonical animated clip: 3 s, 480 wide, 15 fps — a realistic "meme GIF" shape.
const TRIM = ['-t', '3', '-an'];
const SCALE = 'scale=480:-2:flags=lanczos,fps=15';
const ff = (args) => spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });

function makeGif(src, out) {
  // Two-pass palette for the best GIF a real tool would produce (else the baseline is unfairly bad).
  const pal = out + '.png';
  ff(['-i', src, ...TRIM, '-vf', `${SCALE},palettegen=stats_mode=diff`, pal]);
  ff(['-i', src, ...TRIM, '-i', pal, '-lavfi', `${SCALE}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`, out]);
  fs.rmSync(pal, { force: true });
}

const FORMATS = [
  { name: 'gif', ext: 'gif', make: (src, out) => makeGif(src, out) },
  { name: 'apng', ext: 'apng', make: (src, out) => ff(['-i', src, ...TRIM, '-vf', SCALE, '-f', 'apng', '-plays', '0', out]) },
  { name: 'mp4_h264', ext: 'mp4', make: (src, out) => ff(['-i', src, ...TRIM, '-vf', SCALE, '-c:v', 'libx264', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out]) },
  { name: 'webm_vp9', ext: 'webm', make: (src, out) => ff(['-i', src, ...TRIM, '-vf', SCALE, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-deadline', 'good', '-cpu-used', '4', out]) },
];

const clips = fs.readdirSync(CORPUS).filter((f) => /\.(mp4|mov|mkv|webm)$/i.test(f)).sort();
if (!clips.length) { console.error(`No clips in ${CORPUS}`); process.exit(1); }

const q = (v) => { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const rows = [['clip', 'format', 'bytes', 'kb', 'vs_gif_ratio', 'width', 'fps', 'seconds']];
console.log(`Animated format benchmark · ${clips.length} clips (3s, 480w, 15fps)\n`);
for (const clip of clips) {
  const src = path.join(CORPUS, clip);
  const sizes = {};
  for (const f of FORMATS) {
    const out = path.join(WORK, `${clip}.${f.ext}`);
    f.make(src, out);
    if (!fs.existsSync(out)) { console.log(`   x ${f.name} FAILED`); continue; }
    sizes[f.name] = fs.statSync(out).size;
    fs.rmSync(out, { force: true });
  }
  const gif = sizes.gif;
  for (const f of FORMATS) {
    const b = sizes[f.name];
    if (b == null) continue;
    rows.push([clip, f.name, b, (b / 1024).toFixed(1), gif ? (b / gif).toFixed(3) : '', 480, 15, 3]);
  }
  console.log(`▸ ${clip}  gif ${(gif / 1024).toFixed(0)}KB  mp4 ${(sizes.mp4_h264 / 1024).toFixed(0)}KB  (mp4 is ${(gif / sizes.mp4_h264).toFixed(1)}x smaller)`);
}
fs.writeFileSync(OUT, rows.map((r) => r.map(q).join(',')).join('\n') + '\n');
console.log(`\n✓ ${rows.length - 1} rows → ${path.relative(ROOT, OUT)}`);
