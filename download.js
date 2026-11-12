/* Picks the installer for this computer from the latest public GitHub release.
   Draft releases are invisible here. Prereleases are included. */
(function () {
  var REPO = "echelonlabsresearch/ZCrypt";
  var RELEASES = "https://github.com/" + REPO + "/releases";
  var API = "https://api.github.com/repos/" + REPO + "/releases?per_page=10";

  var button = document.getElementById("dl-button");
  var hero = document.getElementById("hero-download");
  var status = document.getElementById("dl-status");
  var list = document.getElementById("dl-others");
  if (!button || !status || !list) return;

  var os = detect();
  var pretty = labelOs(os);

  status.textContent = "Looking up the latest public installers for " + pretty + ".";

  var releasesPromise = fetch(API, { headers: { Accept: "application/vnd.github+json" } })
    .then(function (res) {
      if (!res.ok) throw new Error("GitHub returned " + res.status);
      return res.json();
    });
  // Every Mac browser says "MacIntel". Ask which chip this machine is before picking a dmg.
  var chipPromise = os === "mac" ? macChip() : Promise.resolve("");

  Promise.all([releasesPromise, chipPromise])
    .then(function (pair) {
      var releases = pair[0];
      var chip = pair[1];
      var which = os === "mac" && chip ? "mac-" + chip : os;
      pretty = labelOs(which);
      if (!Array.isArray(releases)) throw new Error("unexpected release list");
      var release = releases.find(function (r) {
        return r && !r.draft && Array.isArray(r.assets) && r.assets.some(isInstaller);
      });
      if (!release) {
        unpublished();
        return;
      }
      var assets = release.assets.filter(function (a) { return a && a.name && a.browser_download_url; });
      var chosen = best(assets, which);
      render(release, assets, chosen, which === "mac");
    })
    .catch(function () {
      status.textContent = "GitHub could not be reached from this browser. The installers are published on the releases page.";
      button.hidden = true;
      list.innerHTML = "";
      addLink(RELEASES, "All releases", "GitHub");
    });

  function detect() {
    var ua = navigator.userAgent || "";
    var platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "";
    var blob = platform + " " + ua;
    if (/Win/i.test(blob)) return "windows";
    if (/Mac/i.test(blob)) return "mac";
    if (/Linux|X11|CrOS/i.test(blob) && !/Android/i.test(blob)) return "linux";
    return "other";
  }

  function labelOs(which) {
    return {
      "mac-arm": "macOS Apple Silicon",
      "mac-intel": "macOS Intel",
      mac: "macOS",
      windows: "Windows",
      linux: "Linux",
      other: "this computer"
    }[which] || "this computer";
  }

  // The GPU name is the Mac's chip. The browser's own architecture can be Intel
  // when Chrome is running under Rosetta on an Apple silicon Mac.
  function macChip() {
    var fromGpu = gpuChip();
    if (fromGpu) return Promise.resolve(fromGpu);
    var data = navigator.userAgentData;
    if (data && data.getHighEntropyValues) {
      return data.getHighEntropyValues(["architecture"]).then(function (ua) {
        var arch = (ua && ua.architecture) || "";
        if (arch === "arm") return "arm";
        if (arch === "x86") return "intel";
        return "";
      }).catch(function () { return ""; });
    }
    return Promise.resolve("");
  }

  function gpuChip() {
    try {
      var canvas = document.createElement("canvas");
      var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return "";
      var ext = gl.getExtension("WEBGL_debug_renderer_info");
      var renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "") : "";
      if (/Apple\s+(M\d|GPU)/i.test(renderer)) return "arm";
      if (/Intel|AMD|Radeon/i.test(renderer)) return "intel";
    } catch (e) {}
    return "";
  }

  function isInstaller(asset) {
    var name = (asset.name || "").toLowerCase();
    return name.endsWith(".dmg") || name.endsWith(".appimage") || name.endsWith(".deb") || name.endsWith("-setup.exe") || name.endsWith(".msi");
  }

  function rank(name, which) {
    var n = name.toLowerCase();
    if ((which === "mac-arm" || which === "mac-intel") && n.endsWith(".dmg")) {
      var arm = /aarch64|arm64/.test(n);
      var intel = /x64|x86_64|amd64|intel/.test(n);
      if (which === "mac-arm") return arm ? 3 : 0;
      return intel ? 3 : 0;
    }
    if (which === "windows" && (n.endsWith("-setup.exe") || n.endsWith(".msi"))) return 3;
    if (which === "linux" && n.endsWith(".appimage")) return 3;
    if (which === "linux" && n.endsWith(".deb")) return 2;
    return 0;
  }

  function best(assets, which) {
    var top = null;
    var score = 0;
    assets.forEach(function (asset) {
      var s = rank(asset.name, which);
      if (s > score) {
        score = s;
        top = asset;
      }
    });
    return top;
  }

  function unpublished() {
    button.hidden = false;
    button.href = RELEASES;
    button.textContent = "View releases";
    status.textContent = "The 0.1 alpha installers are not on a public release yet. When they are, this button downloads the file for " + pretty + ".";
    list.innerHTML = "";
    addLink(RELEASES, "Releases", "GitHub");
    addLink("https://github.com/" + REPO + "/actions/workflows/wallet-release.yml", "Wallet build", "Actions");
  }

  function render(release, assets, chosen, macChipUnknown) {
    var tag = release.tag_name || "release";
    if (chosen) {
      button.hidden = false;
      button.href = chosen.browser_download_url;
      button.textContent = "Download for " + pretty;
      if (hero) {
        hero.href = chosen.browser_download_url;
        hero.textContent = "Download for " + pretty;
      }
      status.textContent = tag + " · " + labelFor(chosen.name) + ". The file comes from the GitHub release.";
    } else if (macChipUnknown) {
      button.hidden = true;
      status.textContent = tag + " has an Apple Silicon disk image and an Intel disk image. This browser did not say which Mac this is, so pick one below.";
    } else {
      button.hidden = true;
      status.textContent = tag + " is public, and it does not yet include an installer for " + pretty + ". The files that are there are listed below.";
    }
    list.innerHTML = "";
    assets.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (asset) {
      if (!isInstaller(asset) && asset.name !== "SHA256SUMS") return;
      addLink(asset.browser_download_url, asset.name, chosen && asset.name === chosen.name ? "this computer" : kind(asset.name));
    });
    var sums = assets.find(function (a) { return a.name === "SHA256SUMS"; });
    if (!sums) addLink(release.html_url || RELEASES, "Release notes", tag);
  }

  function kind(name) {
    var n = name.toLowerCase();
    if (n.endsWith(".dmg")) return /aarch64|arm64/.test(n) ? "macOS Apple Silicon" : /x64|x86_64|intel/.test(n) ? "macOS Intel" : "macOS";
    if (n.endsWith(".appimage")) return "Linux AppImage";
    if (n.endsWith(".deb")) return "Linux deb";
    if (n.endsWith("-setup.exe") || n.endsWith(".msi")) return "Windows";
    if (n === "sha256sums") return "checksums";
    return "file";
  }

  function labelFor(name) {
    return kind(name) + " · " + name;
  }

  function addLink(href, name, note) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = href;
    a.textContent = name;
    var span = document.createElement("span");
    span.textContent = note;
    a.appendChild(span);
    li.appendChild(a);
    list.appendChild(li);
  }
})();
