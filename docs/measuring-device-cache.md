# What is eating my storage? Measure your own device (no data published)

This is the one topic in this repo where we deliberately publish **no dataset** — only the method. A disk breakdown is personal (it lists every app you run), and one device is not a representative sample. So run [`benchmarks/device-cache-scan.sh`](../benchmarks/device-cache-scan.sh) on your own machine; the numbers stay on your screen.

## macOS: where a Mac quietly fills up

```bash
du -sk ~/Library/"Application Support"/* ~/Library/Caches/* 2>/dev/null | sort -rn | head -20
```

- **`~/Library/Caches/<app>`** is regenerable and usually safe to delete (quit the app first). Browsers, package managers (`pip`, `npm`, Homebrew), and design tools are the usual top entries — often multiple GB each.
- **`~/Library/Application Support/<app>`** is persistent app data, frequently **not** safe to delete (it can hold your settings, projects, or local databases). Electron apps and anything with a local cache of documents live here.

The pattern nobody tells you: on a developer or creative Mac, a handful of app caches routinely add up to tens of gigabytes, and they come back after you clear them, because the apps refill them. Clearing buys time, not a fix.

## Android: clear cache vs clear data

Without root, Android does not expose per-app cache size to `adb` (`dumpsys storagestats <pkg>` returns nothing on Android 15). What you can read is the aggregate:

```bash
adb shell dumpsys diskstats | grep -iE "Data-Free|App Data Size"
```

To act on it, go to **Settings → Apps → <app> → Storage**, where Android shows the split:

- **Clear cache** removes regenerable files (thumbnails, downloaded media, temporary data). Safe. The app keeps your login and settings. This is what reclaims space with no downside, and the app slowly refills it.
- **Clear data** wipes the app back to a fresh install — you are logged out and local content is gone. Only do this to fix a broken app, not to save space.

So the answer to "clear cache vs clear data": **clear cache** for space, **clear data** only to reset. The messaging apps (WhatsApp, Telegram) and video apps (YouTube, TikTok) are where cache grows fastest, because they hoard downloaded media.

## Why no dataset

We measured on our own devices while building this and chose not to publish the numbers: one Mac's `~/Library` reveals its owner's entire software stack, and one phone's app list is equally personal, while N=1 tells you nothing general. If you want a representative version, the honest way is a controlled experiment on a clean emulator with a fixed set of apps — which is a different project. The script above lets you measure the only device whose data is yours to see: your own.
