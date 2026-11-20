#!/usr/bin/env python3
"""Assemble the redesigned pages in this folder.

Each content page takes its <main> from the live page one level up, word for word, and
gets the new top bar, footer and background. Run from anywhere: python3 next/build.py
"""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GH = "https://github.com/echelonlabsresearch/ZCrypt"

NAV = [("how.html", "How it works"), ("security.html", "Security"), ("tokenomics.html", "Tokenomics"), ("docs.html", "Docs"),
       ("whitepaper.pdf", "Whitepaper"), ("https://explorer.zcrypt.network", "Explorer"), (GH, "GitHub")]
MARK = '<svg width="22" height="22" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M9 10h22L9 30h22" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def top(here):
    links = "".join(f'\n      <a class="t{" here" if h == here else ""}" href="{h}">{t}</a>' for h, t in NAV)
    return f'''  <header class="nx-top" id="top">
    <a class="nx-brand" href="index.html" aria-label="ZCrypt home">{MARK}<span>ZCrypt</span></a>
    <nav class="nx-nav" aria-label="Main">{links}
      <a class="nx-get" href="wallet.html">Get the wallet</a>
      <details class="nx-menu"><summary aria-label="Menu"><i></i></summary><div>{links}
      <a class="t" href="privacy-model.html">Privacy model</a></div></details>
    </nav>
  </header>'''

FOOT = f'''  <footer class="nx-foot">
    <div class="cta">
      <p>Send money <em>like a photo.</em></p>
      <a class="nx-get big" href="wallet.html">Get the wallet <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
    </div>
    <div class="cols">
      <div><b>Use it</b><a href="wallet.html">Get the wallet</a><a href="how.html">How it works</a><a href="tokenomics.html">Tokenomics</a><a href="trade.html">Trading</a><a href="make-a-coin.html">Make a coin</a><a href="bitcoin.html">Bitcoin in and out</a><a href="https://explorer.zcrypt.network">Explorer</a><a href="https://apps.apple.com/app/id6826877444">iPhone app</a></div>
      <div><b>Trust it</b><a href="security.html">Security and proofs</a><a href="privacy-model.html">Privacy model</a><a href="post-quantum.html">Post-quantum</a><a href="whitepaper.pdf">Whitepaper</a><a href="security.html#bounty">Bug bounty</a></div>
      <div><b>Build on it</b><a href="docs.html">Developer docs</a><a href="protocol.html">Protocol</a><a href="vm.html">The VM</a><a href="{GH}">Source code</a></div>
      <div><b>ZCrypt</b><a href="brand.html">Brand</a><a href="privacy.html">Wallet privacy policy</a><a href="https://x.com/zcryptnetwork">X</a><a href="mailto:security@zcrypt.network">security@zcrypt.network</a></div>
    </div>
    <div class="base"><span class="by">ZCrypt · private digital cash · built by Echelon Labs LLC · open source, MIT</span><span class="nx-live" id="nx-live" hidden><i></i><span>zcrypt-1 live · block <b id="nx-height"></b></span></span></div>
  </footer>'''

PAGES = {"index.html": "how.html", "security.html": "security.html", "brand.html": "brand.html", "privacy.html": "privacy.html", "docs/": "docs.html", "docs/index.html": "docs.html", "": "index.html"}

def fix_url(u, page):
    if re.match(r"(https?:|mailto:|data:|#)", u): return u
    u = re.sub(r"^(\.\./)+", "", u.lstrip("/")) if not u.startswith("#") else u
    path, _, frag = u.partition("#")
    if frag == "wallet" and path in ("", "index.html"): return "wallet.html"
    if path == "" and not frag: return "index.html"
    if path in PAGES and (path or frag):
        dest = PAGES[path]
        return dest + ("#" + frag if frag else "")
    return "../" + u

def fix_urls(html, page):
    return re.sub(r'\b(href|src|poster)="([^"]*)"', lambda m: f'{m.group(1)}="{fix_url(m.group(2), page)}"', html)

def shell(title, desc, body_class, here, main, extra_head="", scripts=""):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#06080f">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
  <link rel="stylesheet" href="../brand/fonts.css">
  <link rel="stylesheet" href="../brand/tokens.css">
  <link rel="stylesheet" href="../site.css?v=13">
  <link rel="stylesheet" href="next.css">{extra_head}
</head>
<body class="nx {body_class}">
  <canvas id="fog" aria-hidden="true"></canvas>
{top(here)}
{main}
{FOOT}
  <script src="fog.js"></script>
  <script src="demo.js"></script>{scripts}
</body>
</html>
'''

def read(p): return open(os.path.join(ROOT, p), encoding="utf-8").read()
def meta(src):
    t = re.search(r"<title>(.*?)</title>", src, re.S).group(1).replace(" — ", ": ")
    d = re.search(r'<meta name="description" content="([^"]*)"', src)
    return t, (d.group(1) if d else "")
def main_of(src):
    m = re.search(r"<main[^>]*>[\s\S]*?</main>", src); assert m
    return m.group(0)
def body_class(src):
    m = re.search(r'<body class="([^"]*)"', src); return m.group(1) if m else ""
# ---- chain numbers, read from the explorer's public API at build time; the pages refresh them live from the same API
import json, base64, urllib.request, datetime
def _get(path):
    with urllib.request.urlopen(urllib.request.Request("https://explorer.zcrypt.network/api/" + path, headers={"User-Agent": "site-build"}), timeout=10) as r: return json.load(r)
CHAIN_FILE = os.path.join(HERE, "chain.json")
try:
    ov = _get("overview"); stakes = [v["stake"] + v["delegated"] for v in _get("validators")["validators"]]
    CHAIN = {"height": ov["height"], "issued": ov["supply_issued"], "vals": len(stakes), "staked": sum(stakes) // 1_000_000, "top": round(100 * max(stakes) / sum(stakes)),
             "commits": ov["commitments"], "asof": datetime.datetime.fromisoformat(ov["block_time"][:10]).strftime("%-d %b %Y")}
    json.dump(CHAIN, open(CHAIN_FILE, "w"))
except Exception as e:
    print("chain numbers: using the saved copy (" + str(e)[:60] + ")"); CHAIN = json.load(open(CHAIN_FILE))
STAMP = datetime.datetime.now().strftime('%m%d%H%M')
NUMBERS = {"<!--HEIGHT-->": f"{CHAIN['height']:,}", "<!--ISSUED-->": f"{CHAIN['issued'] // 1_000_000:,}", "<!--PCT-->": f"{CHAIN['issued'] / 21_000_000e6 * 100:.1f}",
           "<!--VALS-->": {1: "one", 2: "two", 3: "three", 4: "four", 5: "five"}.get(CHAIN["vals"], str(CHAIN["vals"])), "<!--TOPSHARE-->": str(CHAIN["top"]), "<!--VALSN-->": str(CHAIN["vals"]), "<!--COMMITS-->": f"{CHAIN['commits']:,}", "<!--STAKED-->": f"{CHAIN['staked']:,}", "<!--ASOF-->": CHAIN["asof"]}

# ---- link previews: every page carries Open Graph and X card tags and has its own 1200x630 card image (og/<page>.png)
SITE = "https://zcrypt.network/"   # where these pages are published; page and image addresses in the tags are built from it
CARDS = {}
BUILT = []
def social(name, html):
    key = name[:-5]
    title = re.sub(r"\s+", " ", re.search(r"<title>(.*?)</title>", html, re.S).group(1)).strip()
    d = re.search(r'<meta name="description" content="([^"]*)"', html); desc = d.group(1) if d else ""
    h = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.S)
    h1 = re.sub(r"\s+", " ", re.sub(r"<(?!/?em\b)[^>]*>", " ", h.group(1))).strip() if h else title
    t = re.search(r'<p class="(?:tag|section-label)">(.*?)</p>', html, re.S)
    CARDS[key] = {"h1": CARD_H1.get(key, h1), "tag": re.sub(r"<[^>]*>", "", t.group(1)).strip() if t else ""}
    url = SITE + ("" if name == "index.html" else name); img = SITE + "og/" + key + ".png"
    tags = f'''  <link rel="canonical" href="{url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="ZCrypt">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{img}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="{title}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@zcryptnetwork">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="{img}">
'''
    return html.replace("</head>", tags + "</head>", 1)
CARD_H1 = {"index": "Send money like a <em>photo.</em>", "explorer": "Every block. <em>Nothing private.</em>"}

def write(name, html):
    for f in ('next.css', 'fog.js', 'demo.js', 'trade.js'): html = html.replace(f + '"', f + '?v=' + STAMP + '"')
    for k, v in NUMBERS.items(): html = html.replace(k, v)
    html = social(name, html)
    BUILT.append(name)
    open(os.path.join(HERE, name), "w", encoding="utf-8").write(html); print("wrote", name, len(html))

def head(tag, h1, lede):
    return f'''    <section class="nx-head">
      <p class="section-label"><span>{tag}</span></p>
      <h1>{h1}</h1>
      <p class="lede">{lede}</p>
    </section>'''

# ---- the front page: hand-written source plus the shared top bar and footer
src = open(os.path.join(HERE, "index.src.html"), encoding="utf-8").read()
write("index.html", src.replace("<!--TOP-->", top("index.html").replace(' id="top"', "")).replace("<!--FOOT-->", FOOT))

# ---- hand-written pages: new copy, shared chrome
COPY_JS = """
  <script>
  document.querySelectorAll("pre").forEach(function (pre) {
    var b = document.createElement("button"); b.className = "copy"; b.type = "button"; b.textContent = "Copy";
    b.addEventListener("click", function () {
      var t = pre.querySelector("code").innerText.split("\\n").map(function (l) { return l.replace(/\\s+#.*$/, ""); }).filter(function (l) { return l.trim() && !/^#/.test(l.trim()); }).join("\\n");
      navigator.clipboard.writeText(t).then(function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1400); });
    });
    pre.appendChild(b);
  });
  </script>"""
for name, extra in [("how.html", COPY_JS), ("privacy-model.html", COPY_JS), ("security.html", COPY_JS), ("docs.html", COPY_JS), ("tokenomics.html", ""), ("post-quantum.html", COPY_JS), ("make-a-coin.html", ""), ("bitcoin.html", ""), ("brand.html", ""), ("trade.html", '\n  <script src="trade.js"></script>'), ("wallet.html", '\n  <script src="../download.js?v=appstore1"></script>')]:
    src = open(os.path.join(HERE, name.replace(".html", ".src.html")), encoding="utf-8").read()
    mm = re.match(r'<!--META title="([^"]*)" desc="([^"]*)"-->\n', src); assert mm, name
    page = shell(mm.group(1), mm.group(2), "nxp", name, src[mm.end():].rstrip(), "", extra)
    page = page.replace('\n  <link rel="stylesheet" href="../site.css?v=13">', "").replace('<body class="nx nxp">', '<body class="nxp">')
    write(name, page)

# ---- pages restyled as they are (the legal text keeps its wording)
for source, name in [("privacy.html", "privacy.html")]:
    s = read(source).replace("reveals no sender, recipient, amount or asset.", "reveals no sender, recipient or amount, and of the asset only whether it is ZCRYPT or another coin."); t, d = meta(s)
    write(name, shell(t, d, body_class(s), name, fix_urls(main_of(s), name)))

# ---- reference pages converted from the protocol repository's markdown (copies in content/)
LINKS = {"privacy.md": "privacy-model.html", "security.md": "security.html", "vm.md": "vm.html", "protocol.md": "protocol.html",
         "whitepaper/whitepaper.pdf": "whitepaper.pdf", "running.md": "docs.html"}
def esc(t): return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
def inline(t):
    out, parts = [], re.split(r"(`[^`]+`)", t)
    for part in parts:
        if part.startswith("`") and part.endswith("`") and len(part) > 1:
            out.append("<code>" + esc(part[1:-1]) + "</code>"); continue
        part = esc(part)
        part = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", lambda m: '<a href="%s">%s</a>' % (LINKS.get(m.group(2), m.group(2) if re.match(r"https?:", m.group(2)) else GH + "/blob/HEAD/" + m.group(2)), m.group(1)), part)
        part = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", part)
        part = re.sub(r"(?<![\w*])\*([^*\s][^*]*)\*(?![\w*])", r"<i>\1</i>", part)
        out.append(part)
    return "".join(out)
def slug(t): return re.sub(r"[^a-z0-9]+", "-", re.sub(r"`", "", t).lower()).strip("-")
def md(text):
    lines, html, toc, i, title, lede = text.split("\n"), [], [], 0, "", ""
    def para(buf):
        if buf: html.append("<p>" + inline(" ".join(x.strip() for x in buf)) + "</p>")
    buf = []
    while i < len(lines):
        l = lines[i]
        if l.startswith("```"):
            para(buf); buf = []; i += 1; code = []
            while i < len(lines) and not lines[i].startswith("```"): code.append(lines[i]); i += 1
            html.append("<pre><code>" + esc("\n".join(code)) + "</code></pre>"); i += 1; continue
        m = re.match(r"(#{1,3}) (.*)", l)
        if m:
            para(buf); buf = []
            if len(m.group(1)) == 1: title = m.group(2)
            elif len(m.group(1)) == 2:
                if len(toc): html.append("</section>")
                toc.append((slug(m.group(2)), re.sub(r"`", "", m.group(2))))
                html.append('<section id="%s"><h2>%s</h2>' % (slug(m.group(2)), inline(m.group(2))))
            else: html.append("<h3>%s</h3>" % inline(m.group(2)))
            i += 1; continue
        if l.startswith("|"):
            para(buf); buf = []; rows = []
            while i < len(lines) and lines[i].startswith("|"): rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
            body = "".join("<tr>" + "".join(("<th>%s</th>" if n == 0 else "<td>%s</td>") % inline(c) for c in r) + "</tr>" for n, r in enumerate(rows) if not all(re.match(r":?-+:?$", c) for c in r))
            html.append('<div class="scroll"><table>' + body + "</table></div>"); continue
        m = re.match(r"(\*|-|\d+\.) (.*)", l)
        if m:
            para(buf); buf = []; tag = "ol" if m.group(1)[0].isdigit() else "ul"; items = []
            while i < len(lines):
                mm = re.match(r"(\*|-|\d+\.) (.*)", lines[i])
                if mm: items.append([mm.group(2)])
                elif lines[i].startswith("  ") and lines[i].strip() and items: items[-1].append(lines[i].strip())
                elif not lines[i].strip() and i + 1 < len(lines) and (re.match(r"(\*|-|\d+\.) ", lines[i + 1]) or lines[i + 1].startswith("  ")): pass
                else: break
                i += 1
            html.append("<%s>" % tag + "".join("<li>%s</li>" % inline(" ".join(x)) for x in items) + "</%s>" % tag); continue
        if not l.strip():
            if buf and not toc and not lede: lede = inline(" ".join(x.strip() for x in buf)); buf = []
            para(buf); buf = []
        else: buf.append(l)
        i += 1
    para(buf)
    if toc: html.append("</section>")
    return title, lede, toc, "\n".join(html)

for source, name, tag in [("protocol.md", "protocol.html", "Protocol reference"), ("vm.md", "vm.html", "The rules, readable")]:
    title, lede, toc, body = md(open(os.path.join(HERE, "content", source), encoding="utf-8").read())
    nav = "".join('\n      <a href="#%s">%s</a>' % t for t in toc)
    main = f"""<main id="content">
  <div class="w ph">
    <p class="tag">{tag}</p>
    <h1 class="long">{inline(title)}</h1>
    <p class="lede">{lede}</p>
  </div>
  <div class="w docs">
    <nav class="toc" aria-label="On this page"><b>On this page</b>{nav}
    </nav>
    <div class="doc body">
{body}
    </div>
  </div>
</main>"""
    page = shell("ZCrypt: " + title, re.sub(r"<[^>]+>", "", lede), "nxp", name, main, "", COPY_JS)
    page = page.replace('\n  <link rel="stylesheet" href="../site.css?v=13">', "").replace('<body class="nx nxp">', '<body class="nxp">')
    write(name, page)

# ---- card images: "python3 build.py cards" renders og/<page>.png with headless Chrome from og/card.html
import sys, subprocess
CARDS["explorer"] = {"h1": CARD_H1["explorer"], "tag": "Explorer"}
os.makedirs(os.path.join(HERE, "og"), exist_ok=True)
open(os.path.join(HERE, "og", "pages.js"), "w", encoding="utf-8").write("var PAGES = " + json.dumps(CARDS, ensure_ascii=False, indent=1) + ";\n")
if "cards" in sys.argv:
    chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    for key in CARDS:
        subprocess.run([chrome, "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1200,630", "--virtual-time-budget=4000", "--allow-file-access-from-files",
                        "--screenshot=" + os.path.join(HERE, "og", key + ".png"), "file://" + os.path.join(HERE, "og", "card.html") + "?p=" + key], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("rendered", len(CARDS), "cards")

# ---- going live: "python3 build.py publish" copies the built pages and their files to the site root, one level up,
# where the domain serves them. Paths that climb out of this folder ("../brand/…") become root paths.
if "publish" in sys.argv:
    import shutil
    for name in BUILT:
        open(os.path.join(ROOT, name), "w", encoding="utf-8").write(open(os.path.join(HERE, name), encoding="utf-8").read().replace('"../', '"'))
    for f in ("next.css", "fog.js", "demo.js", "trade.js", "whitepaper.pdf"): shutil.copy2(os.path.join(HERE, f), os.path.join(ROOT, f))
    for d in ("demo", "mint", "btc", "og"): shutil.copytree(os.path.join(HERE, d), os.path.join(ROOT, d), dirs_exist_ok=True)
    card = os.path.join(ROOT, "og", "card.html"); open(card, "w").write(open(card).read().replace("../../brand/", "../brand/"))
    open(os.path.join(ROOT, "docs", "index.html"), "w").write('<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><title>ZCrypt docs</title><link rel="canonical" href="' + SITE + 'docs.html"><meta http-equiv="refresh" content="0; url=../docs.html"></head><body><a href="../docs.html">The docs moved here.</a></body></html>\n')
    print("published", len(BUILT), "pages to", ROOT)
