# ZCrypt — Pre-launch Holding Page

Static landing page for [zcrypt.network](https://zcrypt.network) shown before
mainnet launch. Plain HTML + CSS + SVG, no build step, no JavaScript framework.

## Layout

```
index.html              Single-page holding site
style.css               Cyberpunk-terminal palette (cyan #00ffff on near-black #0a0e1a)
favicon.svg             Master vector favicon
favicon-16x16.png       Browser tab fallback
favicon-32x32.png       Browser tab fallback (Retina)
apple-touch-icon.png    iOS home-screen icon (180×180)
icon-192.png            Android home-screen icon
icon-512.png            PWA / OG fallback
```

## Local preview

```bash
open index.html
```

Or serve over HTTP if you need the right MIME types for icons:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Deployment

Static site — any static host works. Suggested:

### GitHub Pages

1. Repo → Settings → Pages → Source: `main`, folder: `/ (root)`
2. Custom domain: `zcrypt.network` (set the CNAME in DNS to
   `zcryptnetwork.github.io`)
3. Enforce HTTPS

### Cloudflare Pages

```bash
# wrangler pages deploy . --project-name zcrypt-prelaunch
```

### Netlify

Drag the folder onto netlify.com, point your domain at the generated URL.

## Style

Palette matches the desktop wallet exactly:

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0a0e1a` | Background |
| `--cyan` | `#00ffff` | Primary accent |
| `--green` | `#00ff88` | "Next" status indicator |
| `--text` | `#e0e0e0` | Body text |
| `--text-dim` | `#8892a8` | Muted text |

Typeface: Inter (sans) + JetBrains Mono (mono), loaded from Google Fonts.

## What to update before launch

When testnet actually goes live, change the roadmap entry from "Next" to
"Live" (revive the `.live` class — same styling as `.next`, slightly different
copy "now running" / "join the network").

Hero badge: change "Pre-launch · Coming soon" to "Testnet live · Mainnet
soon".

Add a CTA: "Run a validator →" linking to the validator setup docs.
