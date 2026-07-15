# How much smaller can a PNG or JPEG get with no quality loss?

**A PNG shrinks by about 10% and a JPEG by up to ~6% with zero quality loss — same pixels, smaller file — just from better entropy coding and stripped metadata.** Measured with oxipng and jpegtran (mozjpeg) in [`data/lossless-recompression.csv`](../data/lossless-recompression.csv). Every output was verified bit-identical to the source image (SSIM 1.000000; JPEG decodes pixel-for-pixel the same).

## The savings

Mean across the corpus (`data/lossless-recompression.csv`):

| Format | Method | Mean saved | Lossless? |
|---|---|---|---|
| PNG | oxipng `-o max --strip safe` | **10.5%** | yes (identical pixels) |
| JPEG | jpegtran `-progressive -optimize` | **6.4%** | yes (same DCT coefficients) |
| JPEG | jpegtran `-optimize` (baseline) | 2.9% | yes |

## Why it is free

None of this re-encodes the image:

- **oxipng** tries harder zlib/Zopfli strategies and a better filter per scanline than the encoder that first wrote the PNG bothered to, and drops non-image metadata. The pixels are untouched.
- **jpegtran** rebuilds the Huffman tables optimally and can switch the file to **progressive** scan order — both lossless transforms of the *same* DCT coefficients. Converting to progressive is the bigger win and also makes the image load top-to-blurry-to-sharp instead of top-to-bottom.

## An honest note on the JPEG corpus

The JPEGs here were written with **baseline Huffman tables** (the standard tables cameras and most apps use), which is where jpegtran's ~6% progressive win comes from. A JPEG that was *already* saved with optimized/progressive Huffman (some export pipelines do this) has little left to give — jpegtran would save under 1%. So treat 6% as a typical camera/app JPEG, not a guarantee. The PNG 10% is representative of encoder-default PNGs.

## Method

Corpus: photographic frames at 800 px. PNG recompressed with `oxipng -o max --strip safe`; JPEG with `jpegtran -optimize` and `jpegtran -progressive -optimize` (both `-copy none`). Losslessness checked by decoding both files and comparing (SSIM 1.0 for PNG; identical PPM for JPEG). Generator: [`benchmarks/lossless-recompression.mjs`](../benchmarks/lossless-recompression.mjs).
