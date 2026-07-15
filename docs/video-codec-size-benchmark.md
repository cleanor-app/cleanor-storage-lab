# How much smaller is H.265 / AV1 than Xvid at the same quality?

**At matched perceptual quality (SSIM 0.97, measured on three 720p clips), the MPEG-4 ASP codec that Xvid and DivX are built on needs about 4x the bitrate of H.264, 5.7x that of HEVC, and 8.9x that of AV1.** Put the other way: re-encoding a Xvid/DivX video to AV1 at the same visual quality cuts it to roughly **11% of its bitrate**, and to HEVC, **18%**. Source: [`data/video-codec-summary.csv`](../data/video-codec-summary.csv), long-format ladder in [`data/video-codec-benchmark.csv`](../data/video-codec-benchmark.csv).

"xvid" is one of the most-searched terms this project's site ranks for, and "xvid vs divx" and "which video codec is smallest" are the questions behind it. This is the measured answer.

## The numbers

Bitrate each codec needs to reach the same SSIM, interpolated on each codec's quality ladder, then averaged across clips by geometric mean. A clip is only counted at a target if **all five codecs** reach that SSIM on it, so every column compares the same clips.

| Codec | SSIM 0.95 | SSIM 0.97 | SSIM 0.99 | Size vs Xvid (at 0.97) |
|---|---|---|---|---|
| **MPEG-4 ASP (Xvid/DivX)** | 4,398 kbps | 4,207 kbps | 5,576 kbps | 100% (baseline) |
| **H.264** | 1,016 | 1,039 | 2,303 | 25% (−75%) |
| **VP9** | 945 | 890 | 2,247 | 21% (−79%) |
| **HEVC (H.265)** | 769 | 739 | 1,765 | 18% (−82%) |
| **AV1** | 436 | 473 | 1,883 | 11% (−89%) |
| clips with full coverage | 2/3 | 3/3 | 2/3 | |

The gap is widest at everyday streaming quality (SSIM 0.95–0.97) and narrows toward visually-lossless (0.99), where every modern codec converges and even H.264 is within ~2.4x of Xvid. That is the honest shape: modern codecs earn their keep at the qualities people actually stream at, not at archival quality.

Per-clip spread at SSIM 0.97 (`data/video-codec-summary.csv`), showing how much content type matters — flat animation compresses far better than high-detail live footage:

| Clip | Character | Xvid ÷ H.264 | Xvid ÷ HEVC | Xvid ÷ AV1 |
|---|---|---|---|---|
| Big Buck Bunny 720p | flat-shaded animation | 7.3x | 8.4x | 14.5x |
| Sintel 720p | cinematic 3D, grain | 3.9x | 6.9x | 13.3x |
| Jellyfish 720p | high-detail live footage | 2.3x | 3.2x | 3.7x |

## Method, and the honest caveats

- **Encoders**: `mpeg4` (MPEG-4 Part 2 ASP, the family Xvid and DivX implement), `libx264`, `libx265`, `libsvtav1` (preset 6), `libvpx-vp9` — all via ffmpeg. Quality swept across a wide CRF/qscale ladder per codec; video only (`-an`).
- **Quality metric**: SSIM (All) computed by ffmpeg against the source, with both streams normalised to the source frame rate and `yuv420p` first, so frames are compared by index and not by timestamp. (Skipping that step silently pinned VP9's SSIM to a near-constant — a real bug we caught and fixed.)
- **Matched-quality, not matched-setting**: comparing codecs at the same CRF number is meaningless, because a CRF means different things to each codec. We interpolate the bitrate each codec needs to hit a fixed SSIM instead.
- **The source clips were already H.264-compressed masters** (720p, from the Blender open movies and a live-footage sample), not lossless. Absolute bitrates therefore sit against a compressed reference; the **relative** comparison between codecs — all encoding the same source, all scored against it — is what this dataset is for, and that holds. Fetch the corpus with [`benchmarks/fetch-video-corpus.sh`](../benchmarks/fetch-video-corpus.sh).
- **Three clips is a small corpus.** The per-clip table shows the spread is large (content type moves the Xvid/AV1 ratio from 3.7x to 14.5x), so read the geomean as an order-of-magnitude answer, not a precise constant. Re-run on your own clips: `node benchmarks/video-codec-benchmark.mjs --corpus your-dir`.

Full methodology for the whole lab: [`docs/methodology.md`](methodology.md). Human-readable write-up with charts: [cleanor.app/research](https://cleanor.app/research).
