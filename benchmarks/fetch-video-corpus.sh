#!/usr/bin/env bash
# Fetch the source clips for the video codec benchmark into corpus-video/.
#
# We do NOT redistribute the clips (they stay out of git); the published dataset is the CSV of
# MEASUREMENTS, which is our own derived data under CC BY 4.0. The clips are only inputs, and
# they are fetched fresh so the benchmark is reproducible.
#
# Three clips of deliberately different character, so a codec cannot win on one content type
# alone:
#   bbb-720        Big Buck Bunny — flat-shaded 3D animation, easy to compress (Blender
#                  Foundation, CC BY 3.0). https://peach.blender.org/
#   sintel-720     Sintel — cinematic 3D with grain and gradients (Blender Foundation,
#                  CC BY 3.0). https://durian.blender.org/
#   jellyfish-720  high-detail, high-motion live footage — the hard case for any codec.
#
# Mirror: test-videos.co.uk (720p, 10s, ~5 MB each).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p corpus-video && cd corpus-video

fetch() { # url  dest
  if [ -f "$2" ]; then echo "  have $2"; else echo "  fetch $2"; curl -fsSL --max-time 120 -o "$2" "$1"; fi
}

fetch "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4" bbb-720.mp4
fetch "https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_5MB.mp4" sintel-720.mp4
fetch "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4" jellyfish-720.mp4

echo "corpus ready in corpus-video/ — now run: node benchmarks/video-codec-benchmark.mjs"
