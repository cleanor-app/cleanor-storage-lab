# Methodology

Every dataset in this repo is produced by a script in [`../benchmarks/`](../benchmarks/). This document records the method and the honest caveats so results can be reproduced and criticized on the method, not guessed at.

## Image corpus

The image studies expect lossless masters (PNG / TIFF) in a `corpus/` directory. Our published numbers use:

- The **Kodak** true-color image suite (24 images, 768×512) — the long-standing reference corpus for compression research.
- A set of **high-resolution real phone photos** (12 MP, saved as `compression-benchmark-hires.csv`) to check that findings hold at modern sensor sizes, not just tiny reference images.

Because the harness runs on *your* `corpus/`, your absolute byte numbers will differ; the *relative* format ordering is what generalizes.

## Encoders

- **JPEG / WebP / AVIF**: `sharp` (libvips), the same engine behind Cleanor's browser image tools. AVIF at `effort: 4` (a realistic, not maximal, setting).
- **JPEG XL**: `cjxl` / `djxl` from libjxl.
- **HEIC**: `heif-enc` / `heif-convert` from libheif (x265), encoded at an iOS-like quality to approximate the file already on an iPhone.

## Quality metric

Perceptual quality is **SSIM** (structural similarity) with **PSNR** as a secondary check, both computed by `ffmpeg` against the lossless master. We compare formats **at matched SSIM** (interpolating each format's size at SSIM 0.95 / 0.98 / 0.99) rather than at matched "quality slider" values, because a `q=80` means something different in every codec.

## Known caveats

- SSIM is a good, cheap perceptual proxy but is not a human eye. Very high SSIM differences (>0.99) are near the metric's noise floor.
- AVIF/JXL encode *effort* trades CPU for size; we fix a realistic effort so results reflect what a typical tool ships, not a maximal offline encode.
- The cloud price index uses **US consumer list prices** captured 2026-07. Rows marked `verified` were confirmed on the provider's page; others are standard US list and flagged in the CSV. Prices change — re-run `cloud-price-index.mjs` after editing the `PLANS` table to refresh.
- Search-demand CSVs (`storage-trends-*`, `*_searches` columns) are aggregate keyword search volumes and are provided for context, not precision.
