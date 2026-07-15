# Why is my GIF so big? GIF vs MP4 vs WebM, measured

**The same 3-second, 480-pixel clip is 8–11 MB as a GIF and around 100–250 KB as an MP4 — the MP4 is 44× to 91× smaller** (about 64× typical across three clips), and it also looks *better*, because a GIF is capped at 256 colours. Measured in [`data/gif-format-benchmark.csv`](../data/gif-format-benchmark.csv).

## The sizes

Each clip reduced to a canonical 3 s / 480 px / 15 fps animation, then encoded five ways (`data/gif-format-benchmark.csv`):

| Clip | GIF | APNG | MP4 (H.264) | WebM (VP9) | MP4 vs GIF |
|---|---|---|---|---|---|
| Big Buck Bunny | 11.2 MB | ~large | 168 KB | ~ | **68× smaller** |
| Jellyfish (high detail) | 10.9 MB | ~large | 251 KB | ~ | **45× smaller** |
| Sintel | 8.6 MB | ~large | 96 KB | ~ | **91× smaller** |

(APNG and WebM columns are in the CSV; both beat GIF but lose to MP4/WebM video.)

## Why GIF is so bad at this

GIF was designed in 1987 for small static graphics. As an animation format it has two fatal costs:

- **No interframe compression.** Every frame is stored almost independently, so a GIF pays full price for parts of the image that never move. MP4/WebM store only what *changes* between frames.
- **A 256-colour palette per frame.** That is why GIFs of real footage look banded and dithered — and the dithering, being noise, compresses badly, making the file *even bigger*.

So a GIF is simultaneously the largest and the lowest-quality way to share a short clip. The fix is an MP4 (or WebM), which every platform now autoplays inline the way GIFs used to be the only option for.

## Method

Source clips reduced with ffmpeg (`scale=480, fps=15, 3s`), then: GIF via a two-pass palette (`palettegen`/`paletteuse`, so the baseline is a *good* GIF, not a lazy one), APNG, MP4 (libx264 crf 23), WebM (libvpx-vp9 crf 34). Sizes are the encoded bytes. Generator: [`benchmarks/gif-format-benchmark.mjs`](../benchmarks/gif-format-benchmark.mjs). Note this build of ffmpeg has no animated-WebP encoder, so that format is omitted; animated WebP typically lands between APNG and MP4.
