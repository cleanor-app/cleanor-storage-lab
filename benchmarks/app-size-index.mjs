#!/usr/bin/env node
// App size index — how big popular iOS apps are to download, measured, not device-dependent.
//
// Pulls the App Store download size (fileSizeBytes) for a curated set of well-known apps via the
// public iTunes Lookup API. No device, no login. Sizes change with every app update, so each row
// is stamped with the date it was measured — re-run monthly to track the trend.
//
//   data/app-size-index.csv
//   node benchmarks/app-size-index.mjs
//
// This rides the "why does <app> take up so much storage" question people actually search; the
// answer starts with the download size, before the caches pile on.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'app-size-index.csv');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// Curated App Store IDs, resolved once via the iTunes Search API and pinned here so the dataset
// always measures the same official apps (search-by-name could drift to a clone).
const APPS = {
  Instagram: 389801252, 'WhatsApp Messenger': 310633997, Facebook: 284882215, Messenger: 454638411,
  TikTok: 835599320, Snapchat: 447188370, YouTube: 544007664, Spotify: 324684580, Netflix: 363590051,
  Gmail: 422689480, 'Google Chrome': 535886823, Uber: 368677368, 'Telegram Messenger': 686449807,
  X: 333903271, Threads: 6446901002, Pinterest: 429047995, Reddit: 1064216828, LinkedIn: 288429040,
  'Amazon Shopping': 297606951, 'Google Maps': 585027354, Waze: 323229106, Discord: 985746746,
  Twitch: 460177396, 'Microsoft Outlook': 951937596, Zoom: 546505307, 'Google Drive': 507874739,
  Dropbox: 327630330, PayPal: 283646709, 'Cash App': 711923939, Venmo: 351727428, Duolingo: 570060128,
  'Google Photos': 962194608, WeChat: 414478124, Shazam: 284993459, SoundCloud: 336353151,
  'Booking.com': 367003839, Airbnb: 401626263, DoorDash: 719972451, 'Uber Eats': 1058959277, Roblox: 431946152,
};

const ids = [...new Set(Object.values(APPS))];
const today = new Date().toISOString().slice(0, 10);

async function lookup(batch) {
  const url = `https://itunes.apple.com/lookup?id=${batch.join(',')}&country=us`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`lookup ${res.status}`);
  return (await res.json()).results;
}

// Lookup allows many ids per call; batch by 20 to be polite.
const byId = new Map();
for (let i = 0; i < ids.length; i += 20) {
  const results = await lookup(ids.slice(i, i + 20));
  for (const r of results) byId.set(r.trackId, r);
}

const q = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const rows = [['app', 'category', 'app_store_id', 'size_mb', 'version', 'min_ios', 'last_updated', 'price_usd', 'measured_date']];
const missing = [];
for (const [name, id] of Object.entries(APPS)) {
  const r = byId.get(id);
  if (!r) { missing.push(name); continue; }
  rows.push([
    name, r.primaryGenreName, id, (r.fileSizeBytes / 1e6).toFixed(1), r.version,
    r.minimumOsVersion, (r.currentVersionReleaseDate || '').slice(0, 10), r.price ?? 0, today,
  ]);
}
// Sort by size descending (the interesting order), keeping the header first.
const body = rows.slice(1).sort((a, b) => Number(b[3]) - Number(a[3]));
fs.writeFileSync(OUT, [rows[0], ...body].map((r) => r.map(q).join(',')).join('\n') + '\n');

const sizes = body.map((r) => Number(r[3]));
const median = sizes.slice().sort((a, b) => a - b)[Math.floor(sizes.length / 2)];
console.log(`✓ data/app-size-index.csv (${body.length} apps, measured ${today})`);
console.log(`  biggest: ${body[0][0]} ${body[0][3]} MB · median ${median.toFixed(0)} MB · over 500 MB: ${sizes.filter((s) => s > 500).length}`);
if (missing.length) console.log(`  missing (lookup returned nothing): ${missing.join(', ')}`);
