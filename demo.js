/* payment demo: cycle the wallet screens while the phone is on screen */
(function () {
  document.querySelectorAll("[data-demo]").forEach(function (d) {
    var frames = d.querySelectorAll(".f"), cap = d.querySelector("figcaption b"), dots = d.querySelector(".dots");
    var i = 0, timer = null, still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function show(n) {
      i = (n + frames.length) % frames.length;
      frames.forEach(function (f, k) { f.classList.toggle("on", k === i); });
      dots.querySelectorAll("button").forEach(function (b, k) { b.classList.toggle("on", k === i); });
      cap.textContent = frames[i].getAttribute("data-cap");
    }
    frames.forEach(function (f, k) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Step " + (k + 1));
      b.addEventListener("click", function () { stop(); show(k); });
      dots.appendChild(b);
    });
    function start() { if (!timer && !still) timer = setInterval(function () { show(i + 1); }, 2400); }
    function stop() { clearInterval(timer); timer = null; }
    show(0);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }, { threshold: 0.4 }).observe(d);
    else start();
  });
})();

/* the installer for this machine is labelled in lower case by the download script */
(function () {
  var l = document.getElementById("dl-others"); if (!l || !("MutationObserver" in window)) return;
  new MutationObserver(function () { l.querySelectorAll("span").forEach(function (s) { if (s.textContent === "this computer") s.textContent = "This computer"; }); }).observe(l, { childList: true, subtree: true });
})();

/* live chain numbers, from the explorer's public API; the numbers baked in at build time stay if it cannot be reached */
(function () {
  var els = document.querySelectorAll("[data-live]"); if (!els.length) return;
  function n(x) { return Math.floor(x).toLocaleString("en-US"); }
  var W = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  function put(v) { els.forEach(function (e) { var k = e.getAttribute("data-live"); if (v[k] !== undefined) e.textContent = v[k]; }); }
  function get(p) { return fetch("https://explorer.zcrypt.network/api/" + p).then(function (r) { return r.json(); }); }
  function load() {
    get("overview").then(function (j) {
      if (!j || !j.supply_issued || !j.height) return;
      put({ issued: n(j.supply_issued / 1e6), pct: (j.supply_issued / 21e12 * 100).toFixed(1), height: n(j.height), asof: ", read live from the chain", vals: String(j.validators), valsword: W[j.validators] || String(j.validators), fclaimed: n(j.foundation_claimed / 1e6), commits: n(j.commitments) });
    }).catch(function () {});
    get("validators").then(function (j) {
      var s = (j.validators || []).map(function (v) { return v.stake + v.delegated; }), t = s.reduce(function (a, b) { return a + b; }, 0);
      if (t) put({ staked: n(t / 1e6), topstake: String(Math.round(100 * Math.max.apply(null, s) / t)) });
    }).catch(function () {});
  }
  load(); setInterval(load, 15000);
})();
