#!/usr/bin/env bash
# Find what is eating your storage — run it on YOUR OWN machine and phone.
#
# This ships NO data. A person's disk breakdown is personal (it reveals every app they run), and
# a single device is not a representative dataset — so this repo publishes the METHOD, not one
# machine's numbers. Run it yourself; the output stays on your screen.
#
#   bash benchmarks/device-cache-scan.sh
#
# Answers the "why is my storage full / clear cache vs clear data" question with real numbers
# from your own device.

set -uo pipefail

echo "== macOS: top disk hogs in ~/Library (MB) =="
# Application Support holds persistent app data; Caches is safe-ish to clear. This is where a Mac
# quietly fills up — browser caches, Electron apps, package-manager caches.
du -sk ~/Library/"Application Support"/* ~/Library/Caches/* 2>/dev/null \
  | sort -rn | head -20 \
  | awk '{printf "  %7.0f MB  %s\n", $1/1024, substr($0, index($0,$2))}'

echo
echo "== Android (adb): aggregate app data + cache =="
if command -v adb >/dev/null && [ -n "$(adb devices | sed -n '2p')" ]; then
  # Non-root Android exposes only the aggregate (per-app cache needs root). This is one honest,
  # non-identifying number: how much of the phone is app data.
  adb shell dumpsys diskstats 2>/dev/null | grep -iE "Data-Free|App Data Size|Cache-Free"
  echo "  (per-app cache needs root; clear it per app in Settings > Apps > <app> > Storage)"
else
  echo "  no adb device connected — enable USB debugging and 'adb devices'"
fi

echo
echo "Note: nothing here is uploaded. To clear macOS caches, quit the app first;"
echo "~/Library/Caches/<app> is usually safe, ~/Library/Application Support/<app> often is not."
