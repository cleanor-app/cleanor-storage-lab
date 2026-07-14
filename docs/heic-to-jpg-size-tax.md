# Does converting HEIC to JPG make the file bigger?

**Yes. In this benchmark, converting HEIC to JPG at matched perceptual quality made the file bigger for every single image in the corpus, 24 out of 24, at every HEIC quality level tested.** The median photo grew **1.75x** when the source HEIC was high quality and **4.65x** when it was low quality (`data/heic-tax-summary.csv`, column `jpg_tax_x_median`). Converting to PNG instead is worse: a median of **3.87x to 13.60x** larger (same file, column `png_tax_x_median`).

This is the "HEIC tax": the storage cost of a conversion that buys compatibility, not quality. The query "heic to jpg" draws on the order of 246,000 searches per month (`benchmarks/heic-tax-benchmark.mjs`, script header; `docs/preprints/heic-conversion-file-size-tax.md`, abstract), so a lot of people pay it without being told the price.

## The numbers

Corpus totals and median per-image inflation, straight from `data/heic-tax-summary.csv`. `heic_q` is the quality the master was encoded to HEIC at, standing in for "the file already on your phone". `mean_ssim` is that HEIC's perceptual similarity to the lossless master.

| HEIC quality | Mean SSIM | Corpus as HEIC | Corpus as matched JPG | JPG tax (median) | Corpus as PNG | PNG tax (median) |
|---|---|---|---|---|---|---|
| 70 (highest tested) | 0.9866 | 3.613 MB | 6.250 MB (+73.0%) | **1.75x** | 14.080 MB | 3.87x |
| 60 | 0.9781 | 2.374 MB | 5.732 MB (+141.5%) | **2.51x** | 13.227 MB | 5.50x |
| 50 | 0.9608 | 1.439 MB | 4.884 MB (+239.5%) | **3.47x** | 12.022 MB | 8.46x |
| 40 (lowest tested) | 0.9314 | 0.828 MB | 3.807 MB (+359.8%) | **4.65x** | 10.867 MB | 13.60x |

Source: `data/heic-tax-summary.csv` (columns `corpus_heic_mb`, `corpus_matched_jpg_mb`, `jpg_tax_pct`, `jpg_tax_x_median`, `corpus_png_mb`, `png_tax_x_median`).

The spread across individual photos, computed from the per-image rows in `data/heic-tax-benchmark.csv` (`jpg_matched_bytes / heic_bytes`):

| HEIC quality | Smallest JPG tax | Median | Largest | Images that got bigger |
|---|---|---|---|---|
| 70 | 1.51x | 1.75x | 1.95x | 24 / 24 |
| 60 | 1.95x | 2.51x | 2.87x | 24 / 24 |
| 50 | 2.61x | 3.47x | 4.85x | 24 / 24 |
| 40 | 3.48x | 4.65x | 7.15x | 24 / 24 |

Not one photo in the corpus came out smaller. The worst single PNG conversion reached **23.19x** the HEIC size (`data/heic-tax-benchmark.csv`, `png_bytes / heic_bytes` at `heic_q=40`).

## Why the file grows

HEIC stores an image with HEVC intra-coding. JPEG is a 1992 DCT codec with no intra prediction, no large transform blocks, and no modern entropy coding. To reproduce what the HEVC encoder already achieved, the JPEG encoder simply has to spend more bytes. The conversion does not add information, so the extra bytes buy nothing.

PNG is worse for a different reason: it is lossless, so it faithfully preserves the compression artefacts of the HEIC it decodes from, at the byte cost of a lossless format. You pay to store the noise.

## Method, in one paragraph

Each lossless master is encoded to HEIC with `heif-enc` (libheif, x265 backend) at four quality points, then decoded and re-encoded to JPEG across a ladder of quality settings (80, 85, 90, 93, 95, 97, 98, 100) with libvips/sharp, and to lossless PNG. SSIM against the lossless master is measured with `ffmpeg` for the HEIC and for every JPEG. The "matched JPG" size is then **interpolated from the JPEG ladder at exactly the HEIC's own SSIM**, so the comparison is size at equal perceptual quality: a smaller JPEG cannot simply be a worse-looking JPEG. The harness is `benchmarks/heic-tax-benchmark.mjs`; the corpus for the published run is the 24-image Kodak suite, which is why the corpus totals above are in single-digit megabytes. Full method and caveats: [`methodology.md`](methodology.md).

## What to do instead

- **If you only need the photo to open somewhere**, converting to JPG is a real compatibility win, just budget for the size. Expect the file to roughly double at typical iPhone quality (1.75x median at `heic_q=70`, `data/heic-tax-summary.csv`).
- **Do not convert to PNG** for photographs. It is a lossless format applied to already-lossy data: 3.87x to 13.60x larger for zero perceptual gain (`data/heic-tax-summary.csv`).
- **Do not keep both copies.** The tax compounds: the original plus the converted file is the HEIC size plus the JPG size.
- **If the destination supports it, AVIF is smaller than JPEG at the same quality** by 40.6% at SSIM 0.95 on our 12 MP corpus. See [`webp-vs-avif-vs-jpeg-xl.md`](webp-vs-avif-vs-jpeg-xl.md).

## Reproduce it

```bash
git clone https://github.com/cleanor-app/cleanor-storage-lab.git
cd cleanor-storage-lab && npm install
mkdir -p corpus && cp /path/to/your/lossless/masters/*.png corpus/
node benchmarks/heic-tax-benchmark.mjs      # needs libheif + ffmpeg
```

Your absolute megabytes will differ with your corpus. The direction of the tax is what generalizes.

## Read more

- Data: [`../data/heic-tax-summary.csv`](../data/heic-tax-summary.csv), [`../data/heic-tax-benchmark.csv`](../data/heic-tax-benchmark.csv)
- Harness: [`../benchmarks/heic-tax-benchmark.mjs`](../benchmarks/heic-tax-benchmark.mjs)
- Preprint: [`preprints/heic-conversion-file-size-tax.md`](preprints/heic-conversion-file-size-tax.md)
- Write-up with charts: [cleanor.app/research](https://cleanor.app/research)
- Cite: [10.5281/zenodo.21217372](https://doi.org/10.5281/zenodo.21217372)
