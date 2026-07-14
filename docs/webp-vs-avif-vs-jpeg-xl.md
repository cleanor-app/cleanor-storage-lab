# WebP vs AVIF vs JPEG XL: which format is actually smallest?

**AVIF, at every quality tier we measured, on both corpora.** At SSIM 0.95, an image needs **640,546 bytes as AVIF against 1,077,997 bytes as JPEG, 40.6% smaller** on the 12 MP photo corpus (`data/compression-benchmark-summary.csv`, metric `iso_ssim_mean_bytes`), and AVIF is the smallest of the four formats for **24 of 24** images on the Kodak corpus (`data/nextgen-formats-benchmark.csv`).

The more useful finding is the one that contradicts the folklore: **WebP is not always smaller than JPEG.** Above roughly SSIM 0.98 it loses, and at SSIM 0.99 it needs **57.1% more bytes than JPEG** (`data/compression-benchmark-summary.csv`).

Everything below is measured at **matched perceptual quality (SSIM)**, not at matched "quality slider" values, because `q=80` means something different in every codec.

## Result 1: bytes needed to hit the same SSIM (12 MP photo corpus)

Mean bytes per image, interpolated at each SSIM target. Source: `data/compression-benchmark-summary.csv`, rows where `metric = iso_ssim_mean_bytes`. Corpus: 8 real phone photos at 4032x3024 (`data/compression-benchmark-hires.csv`).

| Target quality | JPEG | WebP | AVIF | AVIF vs JPEG | WebP vs JPEG |
|---|---|---|---|---|---|
| SSIM 0.95 ("good") | 1,077,997 B | 938,691 B | **640,546 B** | **-40.6%** | -12.9% |
| SSIM 0.98 ("high") | 1,418,698 B | 1,776,876 B | **1,008,420 B** | **-28.9%** | **+25.2%** |
| SSIM 0.99 ("visually lossless") | 1,545,096 B | 2,426,853 B | **1,211,313 B** | **-21.6%** | **+57.1%** |

AVIF's lead shrinks as quality rises (40.6% to 21.6%), which is the expected behaviour: at near-lossless targets every codec converges on the entropy of the image itself. WebP crosses over and becomes the *worst* choice of the three.

## Result 2: adding JPEG XL (Kodak, 24 images)

Total bytes across the whole corpus at each SSIM target. Source: `data/nextgen-formats-benchmark.csv` (columns `*_ssim95_bytes`, `*_ssim98_bytes`).

| Target | JPEG | WebP | AVIF | JPEG XL | Smallest |
|---|---|---|---|---|---|
| SSIM 0.95 | 1,854,023 B | 1,451,069 B | **1,170,077 B** | 1,513,169 B | AVIF (-36.9% vs JPEG) |
| SSIM 0.98 | 3,128,058 B | 2,936,658 B | **2,568,121 B** | 2,919,919 B | AVIF (-17.9% vs JPEG) |

Per-image win counts from the same file: AVIF is smallest for **24 of 24** images at SSIM 0.95, and for **21 of 24** at SSIM 0.98, where plain JPEG takes the remaining 3. At SSIM 0.95, WebP saves 21.7% against JPEG and JPEG XL saves 18.4%; at SSIM 0.98 those savings collapse to 6.1% and 6.7% respectively.

Note the corpus dependence, which is why we publish both: on the 768x512 Kodak images WebP still beats JPEG at SSIM 0.98 (-6.1%), while on the 12 MP photos it loses badly (+25.2%). The WebP crossover point is real, but where it sits depends on your images. AVIF's win does not depend on the corpus.

## Result 3: JPEG XL's actual killer feature

JPEG XL can **losslessly recompress an existing JPEG**, bit-exact and fully reversible back to the original JPEG. Across the Kodak corpus, a set of q90 JPEGs shrank from **2,258,640 bytes to 2,071,974 bytes, a saving of 8.3%** (`data/nextgen-formats-benchmark.csv`, `jpeg_q90_bytes` vs `jxl_lossless_bytes`). Every one of the 24 images got smaller, by **6.1% to 10.6%** (median 8.4%).

That is a smaller number than the marketing suggests, but it is free: no quality loss, no decision, and the original JPEG can be reconstructed byte for byte. For an archive of legacy JPEGs that must stay JPEGs, it is the only lossless option on this list.

As a lossy encoder in this benchmark, JPEG XL did not beat AVIF at either quality target.

## Method

Every image is encoded across a full quality ladder, each output is scored with **SSIM** (and PSNR as a secondary check) against the lossless master using `ffmpeg`, and the byte count at each SSIM target is interpolated from that ladder. JPEG, WebP and AVIF are encoded with libvips/sharp (AVIF at `effort: 4`, a realistic rather than maximal setting); JPEG XL with `cjxl`/`djxl` from libjxl. Harnesses: `benchmarks/compression-benchmark.mjs` and `benchmarks/nextgen-formats-benchmark.mjs`. Full method and caveats, including the fact that SSIM is a proxy and not a human eye: [`methodology.md`](methodology.md).

## Practical takeaways

- **Serving images on the web:** AVIF, with a JPEG fallback. It wins at every tier tested, by 40.6% at SSIM 0.95 on 12 MP photos.
- **Do not use WebP for high-quality photography.** Above SSIM 0.98 it is bigger than the JPEG it replaced (`data/compression-benchmark-summary.csv`).
- **Archiving existing JPEGs:** JPEG XL lossless recompression, for a free 8.3% with byte-exact reversibility.
- **Converting from HEIC?** Read [`heic-to-jpg-size-tax.md`](heic-to-jpg-size-tax.md) first: HEIC to JPG grew every image in the corpus, by a median of 1.75x to 4.65x.

## Reproduce it

```bash
git clone https://github.com/cleanor-app/cleanor-storage-lab.git
cd cleanor-storage-lab && npm install
mkdir -p corpus && cp /path/to/your/masters/*.png corpus/
node benchmarks/compression-benchmark.mjs        # needs ffmpeg
node benchmarks/nextgen-formats-benchmark.mjs    # needs ffmpeg + libjxl
```

## Read more

- Data: [`../data/compression-benchmark-summary.csv`](../data/compression-benchmark-summary.csv), [`../data/nextgen-formats-benchmark.csv`](../data/nextgen-formats-benchmark.csv), [`../data/compression-benchmark-hires.csv`](../data/compression-benchmark-hires.csv)
- Write-ups with charts: [cleanor.app/research](https://cleanor.app/research)
- Cite: [10.5281/zenodo.21217372](https://doi.org/10.5281/zenodo.21217372)
