#!/usr/bin/env node
// Cleanor Storage Lab — Study A3: Video codec "size at matched quality" benchmark.
//
// For a fixed clip corpus, encodes every clip with five codecs across a quality ladder and
// measures perceptual quality (SSIM via ffmpeg) against the source. Produces a reproducible
// "how much space does each video codec really save, at the same visual quality" dataset —
// the video analogue of the image compression benchmark, and the data behind the Xvid/DivX
// question the site already ranks for.
//
//   node video-codec-benchmark.mjs                       # corpus-video/*.mp4
//   node video-codec-benchmark.mjs --corpus DIR --out data/video-codec-benchmark.csv
//
// Codecs: mpeg4 (MPEG-4 ASP — the Xvid/DivX family), H.264 (libx264), HEVC (libx265),
// AV1 (libSVT-AV1), VP9 (libvpx). Needs: ffmpeg (brew). Writes the long-format CSV; the
// matched-SSIM summary is computed by analyze-video-codec.mjs.

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
const CORPUS = path.resolve(ROOT, opt('--corpus', 'corpus-video'));
const OUT = path.resolve(ROOT, opt('--out', 'data/video-codec-benchmark.csv'));
const WORK = path.join(ROOT, '.work-video');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// Each codec sweeps its own quality control across a comparable SSIM range. mpeg4 uses qscale
// (lower = better); the modern codecs use CRF (lower = better). The matched-SSIM comparison is
// done in analysis by interpolating bytes at a target SSIM, so the raw ladders only need to
// bracket the same quality band, not line up point-for-point.
const CODECS = [
  {
    name: 'mpeg4',
    label: 'MPEG-4 ASP (Xvid/DivX)',
    param: 'qscale',
    values: [2, 4, 6, 9, 13, 18, 24, 30],
    args: (q) => ['-c:v', 'mpeg4', '-q:v', String(q)],
  },
  {
    name: 'h264',
    label: 'H.264 (libx264)',
    param: 'crf',
    values: [16, 20, 24, 28, 32, 36, 40, 44],
    args: (q) => ['-c:v', 'libx264', '-preset', 'medium', '-crf', String(q)],
  },
  {
    name: 'h265',
    label: 'HEVC (libx265)',
    param: 'crf',
    values: [18, 22, 26, 30, 34, 38, 42, 46],
    args: (q) => ['-c:v', 'libx265', '-preset', 'medium', '-x265-params', 'log-level=error', '-crf', String(q)],
  },
  {
    name: 'av1',
    label: 'AV1 (SVT-AV1)',
    param: 'crf',
    values: [20, 26, 32, 38, 44, 50, 56, 62],
    args: (q) => ['-c:v', 'libsvtav1', '-preset', '6', '-crf', String(q)],
  },
  {
    name: 'vp9',
    label: 'VP9 (libvpx)',
    param: 'crf',
    values: [20, 26, 32, 38, 44, 50, 56, 62],
    args: (q) => ['-c:v', 'libvpx-vp9', '-b:v', '0', '-deadline', 'good', '-cpu-used', '4', '-crf', String(q)],
  },
];

function run(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-y', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });
  return r;
}

// SSIM (All) of an encoded file vs the source, via ffmpeg's ssim filter.
//
// Both inputs are forced to the source frame rate and yuv420p BEFORE the compare. Without this,
// a VP9/webm output carries a different timebase and the ssim filter pairs frames by timestamp,
// not by index — which silently pinned VP9's SSIM near a constant while its bitrate swung 5x.
// Normalising fps+format pairs frame-for-frame and leaves the already-correct MP4 codecs
// unchanged. Verified: VP9 crf32/52 went from a flat 0.965/0.958 to a correct 0.991/0.979.
function ssim(encoded, source, fps) {
  const chain = `fps=${fps},format=yuv420p`;
  const r = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-i', encoded, '-i', source, '-lavfi', `[0:v]${chain}[a];[1:v]${chain}[b];[a][b]ssim`, '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 1 << 26 },
  );
  const m = (r.stderr || '').match(/All:([0-9.]+)/);
  return m ? Number(m[1]) : null;
}

function probe(file) {
  const r = spawnSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,duration,avg_frame_rate', '-of', 'json', file],
    { encoding: 'utf8' },
  );
  const s = JSON.parse(r.stdout).streams[0];
  const [fn, fd] = (s.avg_frame_rate || '30/1').split('/').map(Number);
  return { width: +s.width, height: +s.height, frames: +s.nb_frames || null, duration: +s.duration || null, fps: fd ? fn / fd : 30 };
}

const clips = fs
  .readdirSync(CORPUS)
  .filter((f) => /\.(mp4|mov|mkv|webm|y4m)$/i.test(f))
  .sort();
if (!clips.length) {
  console.error(`No clips in ${CORPUS}. Put source clips there first.`);
  process.exit(1);
}

const rows = [];
const header = 'clip,width,height,frames,codec,codec_label,quality_param,quality_value,bytes,kbps,ssim,encode_seconds';
console.log(`Video codec benchmark · ${clips.length} clips × ${CODECS.length} codecs\n`);

for (const clip of clips) {
  const src = path.join(CORPUS, clip);
  const meta = probe(src);
  const seconds = meta.duration || (meta.frames ? meta.frames / 30 : 10);
  console.log(`▸ ${clip}  ${meta.width}×${meta.height}, ${meta.frames ?? '?'} frames`);

  for (const codec of CODECS) {
    for (const q of codec.values) {
      const ext = codec.name === 'vp9' ? 'webm' : codec.name === 'av1' ? 'mp4' : 'mp4';
      const out = path.join(WORK, `${clip}.${codec.name}.${q}.${ext}`);
      const t0 = Date.now();
      // -an: video only, so bytes measure the picture, not the audio track.
      const enc = run(['-i', src, '-an', ...codec.args(q), out]);
      const secs = (Date.now() - t0) / 1000;
      if (enc.status !== 0 || !fs.existsSync(out)) {
        console.log(`   x ${codec.name} ${codec.param}=${q} FAILED`);
        continue;
      }
      const bytes = fs.statSync(out).size;
      const s = ssim(out, src, meta.fps.toFixed(3));
      const kbps = (bytes * 8) / seconds / 1000;
      rows.push(
        [clip, meta.width, meta.height, meta.frames ?? '', codec.name, `"${codec.label}"`, codec.param, q, bytes, kbps.toFixed(1), s?.toFixed(5) ?? '', secs.toFixed(1)].join(','),
      );
      fs.rmSync(out, { force: true });
      process.stdout.write(`   ${codec.name} ${codec.param}=${String(q).padEnd(3)} ${(bytes / 1024).toFixed(0)}KB SSIM ${s?.toFixed(4)} (${secs.toFixed(1)}s)\n`);
    }
  }
}

fs.writeFileSync(OUT, header + '\n' + rows.join('\n') + '\n');
console.log(`\n✓ ${rows.length} encodes → ${path.relative(ROOT, OUT)}`);
