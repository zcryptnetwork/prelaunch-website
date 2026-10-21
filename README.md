# zcrypt.network

Static site for [zcrypt.network](https://zcrypt.network). Plain HTML, CSS, and one
small script. No build step.

```
index.html          Landing page
download.js         Detects the OS and downloads the matching public GitHub release
docs/index.html     How to use the live chain, run a local node, and join as a validator
style.css           Black and teal
favicon.svg         Tab icon
```

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
