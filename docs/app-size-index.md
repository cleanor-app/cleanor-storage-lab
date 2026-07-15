# How big are the apps on your phone? A measured download-size index

**The median popular iOS app is around 400 MB to download, and 9 of 40 are over 500 MB — TikTok is 936 MB, Gmail 775 MB, and the payment apps Venmo (676 MB) and PayPal (525 MB) are bigger than Netflix or Spotify.** That is before a single cache, message or downloaded video is added. Measured from the App Store on the `measured_date` in [`data/app-size-index.csv`](../data/app-size-index.csv).

## The largest, as measured

Straight from [`data/app-size-index.csv`](../data/app-size-index.csv) (App Store download size, US):

| App | Category | Download size |
|---|---|---|
| TikTok | Entertainment | 936 MB |
| WeChat | Social Networking | 851 MB |
| Gmail | Productivity | 775 MB |
| Venmo | Finance | 676 MB |
| Instagram | Photo & Video | 593 MB |
| DoorDash | Food & Drink | 560 MB |
| PayPal | Finance | 525 MB |
| X (Twitter) | News | 517 MB |

The surprise is the categories: a payment app (Venmo) and an email app (Gmail) sit near the top, far above what their job requires. Modern apps bundle analytics SDKs, embedded browsers, video players and multiple ad networks, and it shows up as install size.

## Why this is only half the story

The App Store size is the **download**, not what the app grows to on your device. That is the missing piece behind "why does [app] take up so much storage": the download is a floor, and caches, message media and downloaded content pile on top — often several times the install size. This dataset measures the floor precisely; the cache growth is device-measured separately.

## Method

The App Store download size (`fileSizeBytes`) for 40 curated, well-known apps, pulled from the public **iTunes Lookup API** (`https://itunes.apple.com/lookup?id=...`). App Store IDs are pinned in [`benchmarks/app-size-index.mjs`](../benchmarks/app-size-index.mjs) so the dataset always measures the same official apps. **Sizes change with every app update**, so each row is stamped with its `measured_date`; re-run `node benchmarks/app-size-index.mjs` monthly to track the trend. iOS download sizes are used (Android's Play Store does not expose an exact size, often reporting "varies with device").
