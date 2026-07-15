#!/usr/bin/env bash
# Fetch a deliberately mixed SVG corpus: clean single-path icons (little to minify) and detailed
# multi-path emoji (lots to minify), so the benchmark shows the real spread. Not redistributed;
# the published data is our measurements.
set -euo pipefail
cd "$(dirname "$0")/.." && mkdir -p corpus-svg && cd corpus-svg
for n in github google react vuedotjs nodedotjs python docker figma slack notion; do
  curl -fsSL --max-time 20 -o "si-$n.svg" "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/$n.svg" || true
done
for c in 1f680 1f60d 1f44d 2764 1f389 1f4a9 1f981 1f333; do
  curl -fsSL --max-time 20 -o "twemoji-$c.svg" "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/$c.svg" || true
done
for c in 1F680 1F4A1 1F30D 1F984; do
  curl -fsSL --max-time 20 -o "openmoji-$c.svg" "https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/$c.svg" || true
done
echo "SVG corpus ready — run: node benchmarks/svg-minify.mjs"
