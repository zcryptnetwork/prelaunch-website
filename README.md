# zcrypt.network

Static site for [zcrypt.network](https://zcrypt.network). Plain HTML, CSS, and one
small script. No build step.

```
index.html          Landing page
site.css            Landing page styles (Inter Tight, Instrument Serif, JetBrains Mono)
scene.js            Scroll-driven WebGL particle scene (Three.js from jsDelivr, ES module)
download.js         Detects the OS and downloads the matching public GitHub release
docs/index.html     How to use the live chain, run a local node, and join as a validator
style.css           Styles for docs/ (same tokens as the explorer)
favicon.svg         Tab icon
```

The landing page has no build step either. `scene.js` draws one particle field in which
every point is a coin; as the reader scrolls through the six chapters the same points
re-form into the pool, the commitment tree, a bearer file, two interlocked escrows, a
lattice, and the seven-check program. It respects `prefers-reduced-motion`, drops to a
lighter particle count under 860px, and the page reads fine if WebGL is unavailable.
The chain strip polls `rpc.zcrypt.network/status` and `/validators` every five seconds
and shows a dash when the RPC does not answer or does not allow cross-origin reads.

The homepage tells the same story as the protocol README. The reference network is
chain id `zcrypt-1`. The explorer is https://explorer.zcrypt.network and the RPC is
https://rpc.zcrypt.network.

Wallet downloads come from the latest public release of
[echelonlabsresearch/ZCrypt](https://github.com/echelonlabsresearch/ZCrypt/releases),
including prereleases. Draft releases are invisible to the script. macOS resolves to
the Apple Silicon disk image, Linux to the AppImage (the deb stays in the list), and
Windows to the NSIS setup.

## Preview

```bash
python3 -m http.server 8000
# http://127.0.0.1:8000
```

## Deploy

The domain is served from this repository. Pushing `main` updates the site.
