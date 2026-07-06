# The HEIC Conversion Tax: Quantifying the File-Size Cost of Converting iPhone HEIC Photos to JPEG and PNG at Matched Perceptual Quality

**Author:** Cleanor Labs (ORCID: [0009-0005-4623-961X](https://orcid.org/0009-0005-4623-961X)), Cleanor Research Labs

**Correspondence:** hello@cleanor.app

**Preprint version:** 1.0 — 2026-07-06

**Keywords:** HEIC, HEIF, JPEG, image conversion, image compression, SSIM, perceptual quality, mobile photography

---

## Abstract

Converting Apple HEIC photographs to JPEG is one of the most common image
operations performed by consumers: the query "heic to jpg" attracts on the order
of 246,000 searches per month. Yet the file-size consequence of this conversion
is rarely quantified. We benchmark a corpus of photographs encoded to HEIC at
several iOS-like quality levels and then converted, as typical online tools do,
to JPEG (across a quality ladder) and to lossless PNG. For each output we measure
the structural similarity index (SSIM) against the lossless master, allowing a
comparison of file size *at matched perceptual quality*. Converting HEIC to JPEG
inflates the corpus by a median factor of **1.75× to 4.65×**, and to PNG by
**3.87× to 13.60×**, with no gain in perceptual quality. We conclude that the
conversion is a pure storage cost imposed by ecosystem compatibility rather than
any quality benefit, and we release the full dataset and reproducible harness.

## 1. Introduction

Since iOS 11 (2017), Apple devices capture photographs by default in the High
Efficiency Image File Format (HEIF) with HEVC-coded image items, commonly seen
by users through the `.heic` extension [2]. HEIF/HEVC intra-coding is
markedly more efficient than baseline JPEG. However, HEIC is not universally
supported by web platforms, editing software, and third-party services, so users
routinely convert their photos to JPEG (or, less advisedly, PNG) for
compatibility.

The performance of HEVC intra-coding relative to JPEG is well studied in the
coding literature, but consumers experience the conversion as a black box: they
know they *must* convert, but not what it costs. This paper measures that cost
directly on a photographic corpus and expresses it at matched perceptual quality
so that size differences cannot be attributed to a quality change.

## 2. Method

**Corpus.** We use a set of lossless photographic masters (PNG). For each master
we produce a HEIC file at iOS-like quality settings using `heif-enc` (libheif,
x265 backend) at four quality points, approximating "the file already on the
phone."

**Conversions.** From each HEIC we generate the outputs a typical converter
produces: JPEG at quality {80, 90, 95, 100} using the same imaging engine that
backs the authors' browser tools (libvips/sharp), and lossless PNG.

**Quality metric.** For the HEIC and every JPEG output we compute the structural
similarity index, SSIM [1], against the lossless master using
`ffmpeg`. PNG is lossless by construction. Reporting size at matched SSIM ensures
that a smaller file is not merely a lower-quality file.

**Measure of the "tax."** For each master and HEIC quality level we compute the
ratio of the converted file size to the source HEIC size, and report the median
ratio across the corpus (the "size tax"), alongside the mean SSIM of the HEIC
relative to the master.

The complete harness (`benchmarks/heic-tax-benchmark.mjs`) and the resulting
per-image and summary CSVs are released with this preprint (Section 6).

## 3. Results

Table 1 reports, for each iOS-like HEIC quality point, the mean SSIM of the HEIC
relative to the lossless master and the median size multiplier incurred by
converting to JPEG (at matched perceptual quality) and to PNG.

**Table 1.** HEIC-to-JPEG and HEIC-to-PNG size tax at matched perceptual quality.

| HEIC quality | Mean SSIM (HEIC vs master) | JPEG size tax (median) | PNG size tax (median) |
|---|---|---|---|
| Lower (q40)  | 0.931 | 4.65× | 13.60× |
| (q50)        | 0.961 | 3.47× | 8.46×  |
| (q60)        | 0.978 | 2.51× | 5.50×  |
| Higher (q70) | 0.987 | 1.75× | 3.87×  |

Two patterns are consistent across the corpus. First, at every quality level the
JPEG that matches the HEIC's perceptual quality is substantially larger than the
HEIC — from 1.75× at high quality to 4.65× at lower quality — confirming that the
conversion buys no quality and only costs space. Second, converting to PNG, a
choice many users make believing it to be "safer" or "higher quality," inflates
photographic content enormously (up to 13.6×) because lossless entropy coding is
ill-suited to natural-image data.

## 4. Discussion

The results reframe a mundane task as a measurable, ecosystem-imposed storage
cost. For an individual photo the difference is invisible; aggregated across a
photo library, a device, or a content pipeline, the multiplier is the difference
between, for example, a 2 GB and a 6–9 GB export.

Two practical recommendations follow. (1) When JPEG is required for
compatibility, quality ~90 is sufficient to match HEIC perceptually for most
images; higher settings mostly add bytes. (2) PNG should not be used as a
"convert-for-safety" target for photographs; it is appropriate for graphics and
screenshots, not camera images. Where the destination platform supports it,
converting to AVIF or WebP rather than JPEG recovers most of the efficiency lost
by leaving HEIC.

**Limitations.** SSIM is a widely used perceptual proxy but not a substitute for
subjective testing; differences above SSIM 0.99 approach the metric's noise
floor. Absolute sizes depend on the corpus; the reported multipliers are the
generalizable quantity and will vary with image content and encoder settings,
which is precisely why the harness is released for re-running on any corpus.

## 5. Conclusion

Converting iPhone HEIC photographs to JPEG or PNG, an operation performed at
massive scale, imposes a median 1.75×–4.65× (JPEG) or 3.87×–13.60× (PNG)
file-size penalty at matched perceptual quality, with no quality benefit. The
"HEIC tax" is a cost of compatibility, and it is avoidable wherever modern
formats are accepted downstream.

## 6. Data and code availability

The full per-image dataset (`heic-tax-benchmark.csv`), the summary
(`heic-tax-summary.csv`), and the reproducible harness
(`heic-tax-benchmark.mjs`) are openly available under CC BY 4.0 (data) and MIT
(code) at <https://github.com/cleanor-app/cleanor-storage-lab>. A versioned,
DOI-assigned archive is deposited on Zenodo. A human-readable write-up with
interactive charts is at
<https://cleanor.app/blog/heic-to-jpg-conversion-file-size-tax-benchmark>.

## References

1. Wang, Z., Bovik, A. C., Sheikh, H. R., & Simoncelli, E. P. (2004). Image
   quality assessment: from error visibility to structural similarity. *IEEE
   Transactions on Image Processing*, 13(4), 600–612.
   https://doi.org/10.1109/TIP.2003.819861
2. ISO/IEC 23008-12:2017, *Information technology — High efficiency coding and
   media delivery in heterogeneous environments — Part 12: Image File Format*
   (HEIF).
3. Cleanor Labs (2026). *Storage Lab: Open Image-Compression & Cloud-Storage
   Datasets.* https://github.com/cleanor-app/cleanor-storage-lab
