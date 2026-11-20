/* The sample trading screen: made-up orders that drift, any pair of coins, and a walk through the four settlement steps. */
(function () {
  var root = document.getElementById("tx"); if (!root) return;
  var $ = function (id) { return document.getElementById(id); };
  // sample values only, used to derive a sample price for any pair
  var COINS = [["ZCRYPT", 10, 1], ["zBTC", 100000, 1], ["zUSDT", 1], ["zETH", 3500], ["zSOL", 180], ["zBNB", 650], ["zTON", 5.2], ["zDAI", 1], ["zGOLD", 2700]];
  var QUICK = [["ZCRYPT", "zUSDT"], ["ZCRYPT", "zBTC"], ["ZCRYPT", "zGOLD"], ["zBTC", "zUSDT"], ["zGOLD", "zUSDT"], ["zETH", "zBTC"]];
  function val(n) { for (var i = 0; i < COINS.length; i++) if (COINS[i][0] === n) return COINS[i][1]; }
  function dec(x) { return Math.max(0, Math.min(8, 4 - Math.floor(Math.log10(x)))); }   // about five significant digits
  var Q = "zUSDT", m = {}, mid = 1, seed = 7, asks = [], bids = [], tape = [], busy = false;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function num(x, d) { return x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function px(p) { return num(p, m.d); }
  function amt() { return +(m.lot * (0.05 + rnd())).toFixed(m.ad) || +m.lot.toFixed(m.ad); }
  function fill() {
    asks = []; bids = []; var step = mid * 0.0004;
    for (var i = 1; i <= 7; i++) { asks.push({ p: mid + step * (i + rnd() * 0.4), a: amt() }); bids.push({ p: mid - step * (i + rnd() * 0.4), a: amt() }); }
  }
  function rows(list, el, rev) {
    var max = Math.max.apply(null, list.map(function (o) { return o.a; })), l = rev ? list.slice().reverse() : list;
    el.innerHTML = l.map(function (o) {
      return '<div><i style="width:' + Math.round(o.a / max * 100) + '%"></i><span class="p">' + px(o.p) + "</span><span>" + num(o.a, m.ad) + "</span><span>" + num(o.p * o.a, m.td) + "</span></div>";
    }).join("");
  }
  function drawTape() {
    $("tx-tape").innerHTML = tape.slice(0, 9).map(function (t) {
      return '<div class="' + t.s + '"><span class="p">' + px(t.p) + "</span><span>" + num(t.a, m.ad) + "</span><span>" + t.t + "</span></div>";
    }).join("");
  }
  function clock() { return new Date().toTimeString().slice(0, 8); }
  function trade(side, a, p) { tape.unshift({ s: side, a: a, p: p, t: clock() }); $("tx-last").textContent = px(p); drawTape(); }
  function ticket() {
    var a = Math.max(0, parseFloat($("tx-amt").value) || 0);
    $("tx-px").textContent = px(mid) + " " + Q; $("tx-tot").textContent = num(mid * a, m.td) + " " + Q; return a;
  }
  function draw() { rows(asks, $("tx-asks"), true); rows(bids, $("tx-bids"), false); ticket(); }
  var selB = $("tx-base"), selQ = $("tx-quote");
  function pick(b, q) {
    if (busy) return;
    if (b === q) q = b === "zUSDT" ? "ZCRYPT" : "zUSDT";
    Q = q; mid = val(b) / val(q);
    var lot = 40000 / val(b);
    m = { b: b, d: dec(mid), lot: lot, ad: dec(lot) > 4 ? 4 : Math.max(0, dec(lot) - 1), td: Math.max(0, Math.min(6, dec(40000 / val(q)) - 1)) };
    tape = []; fill();
    for (var k = 0; k < 9; k++) tape.push({ s: rnd() < 0.5 ? "buy" : "sell", a: amt(), p: mid * (1 + (rnd() - 0.5) * 0.002), t: clock() });
    selB.value = b; selQ.value = q;
    $("tx-pair").textContent = b + " / " + q; $("tx-last").textContent = px(mid);
    document.querySelectorAll("[data-base]").forEach(function (e) { e.textContent = b; });
    document.querySelectorAll("[data-quote]").forEach(function (e) { e.textContent = q; });
    $("tx-amt").value = +(lot / 4).toFixed(m.ad) || 1;
    $("tx-buy").textContent = "Buy " + b; $("tx-sell").textContent = "Sell " + b;
    Array.prototype.forEach.call($("tx-mk").children, function (x, n) { x.classList.toggle("on", QUICK[n][0] === b && QUICK[n][1] === q); });
    steps.forEach(function (s) { s.className = ""; }); $("tx-done").hidden = true;
    draw(); drawTape();
  }
  var steps = Array.prototype.slice.call($("tx-steps").children);
  var opts = COINS.map(function (c) { return '<option value="' + c[0] + '">' + c[0] + "</option>"; }).join("");
  selB.innerHTML = opts; selQ.innerHTML = opts;
  selB.addEventListener("change", function () { pick(selB.value, selB.value === Q ? m.b : Q); });
  selQ.addEventListener("change", function () { pick(selQ.value === m.b ? Q : m.b, selQ.value); });
  $("tx-flip").addEventListener("click", function () { pick(Q, m.b); });
  $("tx-mk").innerHTML = QUICK.map(function (k) { return '<button type="button">' + k[0] + " / " + k[1] + "</button>"; }).join("");
  Array.prototype.forEach.call($("tx-mk").children, function (x, n) { x.addEventListener("click", function () { pick(QUICK[n][0], QUICK[n][1]); }); });
  pick("ZCRYPT", "zUSDT");
  var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!still) setInterval(function () {
    if (busy || document.hidden) return;
    mid *= 1 + (rnd() - 0.5) * 0.0012; fill(); draw();
    if (rnd() < 0.6) trade(rnd() < 0.5 ? "buy" : "sell", amt(), mid * (1 + (rnd() - 0.5) * 0.0006));
  }, 1800);
  $("tx-amt").addEventListener("input", ticket);
  function run(side) {
    var a = ticket(); if (busy || !a) return; busy = true;
    var p = mid, done = $("tx-done"); done.hidden = true;
    steps.forEach(function (s) { s.className = ""; });
    root.classList.add("busy");
    steps.forEach(function (s, i) {
      setTimeout(function () {
        if (i) steps[i - 1].className = "ok";
        s.className = "on";
        if (i === steps.length - 1) setTimeout(function () {
          s.className = "ok"; trade(side, a, p);
          done.textContent = (side === "buy" ? "You bought " : "You sold ") + num(a, m.ad) + " " + m.b + " for " + num(p * a, m.td) + " " + Q + ". Settled on the chain, with nobody holding the money in between. (Sample: nothing was sent.)";
          done.hidden = false; root.classList.remove("busy"); busy = false;
        }, still ? 0 : 1000);
      }, still ? 0 : i * 1000);
    });
  }
  $("tx-buy").addEventListener("click", function () { run("buy"); });
  $("tx-sell").addEventListener("click", function () { run("sell"); });
})();
