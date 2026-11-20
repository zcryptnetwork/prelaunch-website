/* payment demo: cycle the wallet screens while the phone is on screen */
(function () {
  var TAP = { "1.jpg": [50, 73.2], "2.jpg": [50, 93.6], "4.jpg": [33, 68.4] };   // where the finger lands on each wallet screen, in percent
  document.querySelectorAll("[data-demo]").forEach(function (d) {
    var frames = d.querySelectorAll(".f"), cap = d.querySelector("figcaption b"), dots = d.querySelector(".dots"), phone = d.querySelector(".phone");
    var i = 0, timer = null, tapTimer = null, running = false, still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var tap = document.createElement("i"); tap.className = "tap"; phone.appendChild(tap);
    var fx = document.createElement("div"); fx.className = "fx"; fx.setAttribute("aria-hidden", "true");
    var h = '<i class="halo"></i><i class="ring"></i><i class="ring r2"></i><b class="plus">+25 <small>ZCRYPT</small></b>';
    for (var k = 0; k < 16; k++) h += '<s style="--a:' + (k * 22.5 + (k % 2) * 9) + 'deg;--d:' + (0.66 + ((k * 37) % 34) / 100) + ';--t:' + (k % 4) * 0.05 + 's"></s>';
    fx.innerHTML = h; d.insertBefore(fx, d.firstChild);
    function again(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
    function file(f) { var m = /(\d+\.jpg)/.exec(f.getAttribute("src") || ""); return m ? m[1] : ""; }
    function ms(k) { return k === frames.length - 1 ? 2300 : frames[k].classList.contains("chat") ? 2000 : TAP[file(frames[k])] ? 1150 : 1050; }
    function show(n) {
      i = (n + frames.length) % frames.length;
      var f = frames[i], t = TAP[file(f)], last = i === frames.length - 1;
      frames.forEach(function (x, k) { x.classList.toggle("on", k === i); });
      dots.querySelectorAll("button").forEach(function (b, k) { b.classList.remove("on"); b.classList.toggle("done", k < i); b.style.setProperty("--ms", ms(k) + "ms"); if (k === i) again(b, "on"); });
      cap.textContent = f.getAttribute("data-cap"); again(cap, "in");
      d.classList.toggle("hold", !running);
      clearTimeout(tapTimer); tap.classList.remove("go");
      if (t && running) { tap.style.left = t[0] + "%"; tap.style.top = t[1] + "%"; tapTimer = setTimeout(function () { again(tap, "go"); }, ms(i) - 520); }
      d.classList.remove("win"); if (last && !still) again(d, "win");
      again(phone, "bump");
    }
    function next() { timer = setTimeout(function () { show(i + 1); next(); }, ms(i)); }
    frames.forEach(function (f, k) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Step " + (k + 1));
      b.addEventListener("click", function () { stop(); show(k); });
      dots.appendChild(b);
    });
    function start() { if (running || still) return; running = true; show(i); next(); }
    function stop() { running = false; clearTimeout(timer); clearTimeout(tapTimer); timer = null; }
    show(0);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }, { threshold: 0.15 }).observe(d);
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
