#!/usr/bin/env node
// "How much data does streaming use?" — data-usage model.
// Video/call figures are documented (official where possible); audio MB/hour is
// computed exactly from bitrate (kbps x 3600 / 8 / 1000 = kbps x 0.45 MB/hr).
// Writes data/streaming-data-usage.csv.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mbFromKbps = (kbps) => +((kbps * 3600) / 8 / 1000).toFixed(0); // decimal MB/hour

const VIDEO = [
  // service, tier, GB/hr, status
  ['Netflix', 'Low (Data Saver)', 0.3, 'official'],
  ['Netflix', 'SD', 0.7, 'official'],
  ['Netflix', 'HD (720-1080p)', 3.0, 'official'],
  ['Netflix', '4K (UHD)', 7.0, 'official'],
  ['YouTube', '480p', 0.6, 'measured'],
  ['YouTube', '720p', 1.5, 'measured'],
  ['YouTube', '1080p', 3.0, 'measured'],
  ['YouTube', '1440p', 5.0, 'measured'],
  ['YouTube', '4K', 13.0, 'measured'],
  ['Amazon Prime Video', 'SD (Good)', 0.38, 'in-app'],
  ['Amazon Prime Video', 'HD (Better)', 1.4, 'in-app'],
  ['Amazon Prime Video', '4K (Best)', 6.8, 'estimate'],
  ['Disney+', 'Save Data', 0.6, 'reported'],
  ['Disney+', 'HD', 2.0, 'reported'],
  ['Disney+', '4K', 7.7, 'reported'],
  ['Max (HBO)', 'HD', 2.25, 'estimate'],
  ['Max (HBO)', '4K', 7.7, 'estimate'],
  ['TikTok', 'Default feed', 0.84, 'measured'],
  ['Instagram Reels', 'Full-screen', 1.1, 'measured'],
];
const AUDIO = [
  // service, tier, kbps (0 = documented MB), MB/hr override, status
  ['Spotify', 'Low', 24, null, 'official'],
  ['Spotify', 'Normal', 96, null, 'official'],
  ['Spotify', 'High', 160, null, 'official'],
  ['Spotify', 'Very High', 320, null, 'official'],
  ['Spotify', 'Lossless (FLAC)', 0, 900, 'official-est'],
  ['Apple Music', 'AAC 256', 256, null, 'official'],
  ['Apple Music', 'Lossless (ALAC)', 0, 720, 'estimate'],
  ['Apple Music', 'Hi-Res Lossless', 0, 2900, 'estimate'],
  ['YouTube Music', 'High (256)', 256, null, 'official-bitrate'],
  ['Amazon Music', 'HD (~850)', 850, null, 'official-bitrate'],
  ['Amazon Music', 'Ultra HD (~3730)', 3730, null, 'official-bitrate'],
];
const CALLS = [
  ['Zoom', '1:1 720p', 1.08, 'estimate'],
  ['Zoom', '1:1 1080p', 1.62, 'estimate'],
  ['Zoom', 'Group HD', 2.4, 'estimate'],
  ['Zoom', 'Audio only', 0.003, 'estimate'],
  ['FaceTime', 'Video', 0.25, 'estimate'],
  ['Google Meet', 'HD video', 0.8, 'estimate'],
];

const rows = [['category', 'service', 'tier', 'per_hour_mb', 'per_hour_gb', 'status']];
const push = (cat, s, t, mb, st) =>
  rows.push([cat, s, t, Math.round(mb), (mb / 1000).toFixed(3), st]);
for (const [s, t, gb, st] of VIDEO) push('video', s, t, gb * 1000, st);
console.log('AUDIO (exact from bitrate):');
for (const [s, t, kbps, ov, st] of AUDIO) {
  const mb = ov != null ? ov : mbFromKbps(kbps);
  if (kbps) console.log(`  ${s} ${t}: ${kbps} kbps = ${mb} MB/hr`);
  push('audio', s, t, mb, st);
}
for (const [s, t, gb, st] of CALLS) push('call', s, t, gb * 1000, st);

fs.writeFileSync(
  path.join(ROOT, 'data/streaming-data-usage.csv'),
  rows.map((r) => r.join(',')).join('\n'),
);

// ---- framing numbers ----
const v4k = 7,
  vhd = 3,
  tiktok = 0.84,
  spotifyVH = mbFromKbps(320) / 1000; // GB/hr
console.log('\nKey framing numbers:');
console.log(`  2-hour 4K movie: ${(v4k * 2).toFixed(0)} GB`);
console.log(`  4K video vs music (Very High): ${(v4k / spotifyVH).toFixed(0)}x more data`);
console.log(
  `  1 hour of 4K = ${((v4k * 1000) / mbFromKbps(320)).toFixed(0)} hours of Spotify Very High`,
);
const cap = 50; // GB plan
console.log(
  `  50 GB plan holds: 4K ${(cap / v4k).toFixed(1)}h · HD ${(cap / vhd).toFixed(1)}h · TikTok ${(cap / tiktok).toFixed(0)}h · Spotify ${(cap / spotifyVH).toFixed(0)}h`,
);
console.log('\n✓ data/streaming-data-usage.csv');
