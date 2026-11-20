# zcrypt.network

Static site for [zcrypt.network](https://zcrypt.network). Plain HTML, CSS and a few small
scripts. The pages at the root are generated: edit the sources in `next/` and publish.

```
next/*.src.html     Hand-written pages (front page, How it works, Security, Tokenomics, …)
next/content/*.md   Protocol and VM reference, copied from the protocol repository
next/build.py       Assembles every page with the shared top bar, footer and link preview tags
next/next.css       Styles     next/fog.js  background     next/demo.js  phone demo, live chain figures
next/og/            One 1200x630 link preview card per page, rendered from og/card.html
brand/              Mark, fonts and colour tokens
download.js         Detects the OS and downloads the matching public GitHub release
```

```bash
cd next
python3 build.py                  # rebuild the pages in next/
python3 build.py cards            # also re-render the link preview cards (needs Chrome)
python3 build.py cards publish    # also copy everything to the site root, which is what the domain serves
```

Chain figures on the pages are read from the explorer's public API
(https://explorer.zcrypt.network/api/) at build time and refreshed in the browser.
The reference network is chain id `zcrypt-1`.

Wallet downloads come from the latest public release of
[echelonlabsresearch/ZCrypt](https://github.com/echelonlabsresearch/ZCrypt/releases),
including prereleases. Draft releases are invisible to the script. A Mac resolves
to the Apple Silicon or Intel disk image for that machine. If the browser will not
say which chip it is, both files stay in the list and neither is chosen. Linux
resolves to the AppImage (the deb stays in the list), and Windows to the MSI.

## Preview

```bash
python3 -m http.server 8000
# http://127.0.0.1:8000
```

## Deploy

The domain is served from this repository. Pushing `main` updates the site.
