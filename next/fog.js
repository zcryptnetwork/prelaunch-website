// Shared by the content pages: the slow fog behind the page, the top bar's scrolled
// state, and the live block number. The landing page draws its own scene.
(function () {
  var top = document.getElementById("top");
  function stuck() { if (top) top.classList.toggle("stuck", scrollY > 30); }
  addEventListener("scroll", stuck, { passive: true }); stuck();

  var live = document.getElementById("nx-live"), hEl = document.getElementById("nx-height");
  function poll() {
    fetch("https://explorer.zcrypt.network/api/overview").then(function (r) { return r.json(); }).then(function (j) {
      var h = j && j.height;
      if (h && live) { hEl.textContent = Number(h).toLocaleString("en-US"); live.hidden = false; }
    }).catch(function () {});
  }
  if (live) { poll(); setInterval(poll, 5000); }

  var canvas = document.getElementById("fog");
  if (!canvas) return;
  var gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) { canvas.style.display = "none"; return; }
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function sh(t, src) { var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  var p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, "attribute vec2 aP; void main() { gl_Position = vec4(aP, 0.0, 1.0); }"));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, [
    "precision highp float;",
    "uniform vec2 uRes; uniform float uTime, uScroll;",
    "float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
    "float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }",
    "float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }",
    "void main() {",
    "  vec2 uv = gl_FragCoord.xy / uRes;",
    "  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);",
    "  vec2 q = p * 1.25 + vec2(uTime * 0.018, -uScroll * 0.22);",
    "  float w = fbm(q + 1.6 * vec2(fbm(q * 1.4 + uTime * 0.03), fbm(q * 1.4 - uTime * 0.025 + 4.0)));",
    "  float v = fbm(q * 0.7 + 9.0 + uTime * 0.012);",
    "  vec3 col = vec3(0.024, 0.031, 0.059);",
    "  col += vec3(0.10, 0.62, 0.85) * pow(w, 3.2) * 0.62;",
    "  col += vec3(0.33, 0.30, 0.95) * pow(v, 3.0) * 0.46;",
    "  col *= 1.0 - 0.55 * dot(p, p);",
    "  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.028;",
    "  gl_FragColor = vec4(max(col, 0.0), 1.0);",
    "}"].join("\n")));
  gl.linkProgram(p); gl.useProgram(p);
  var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(p, "aP"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uRes = gl.getUniformLocation(p, "uRes"), uTime = gl.getUniformLocation(p, "uTime"), uScroll = gl.getUniformLocation(p, "uScroll");
  function resize() {
    // Half resolution: it is fog, and the page above it should stay smooth.
    canvas.width = Math.round(canvas.clientWidth * 0.5); canvas.height = Math.round(canvas.clientHeight * 0.5);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener("resize", resize); resize();
  var t0 = performance.now();
  (function frame(now) {
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduced ? 0 : (now - t0) / 1000);
    gl.uniform1f(uScroll, scrollY / innerHeight);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduced) requestAnimationFrame(frame);
  })(t0);
})();
