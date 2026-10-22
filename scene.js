// Scroll-driven particle scene. Every point is a coin in the pool. As the page
// scrolls, the same points re-form into the chapter being read: pool, Merkle
// tree, bearer file, interlocked escrows, lattice, and the seven-check program.
import * as THREE from "three";

const canvas = document.getElementById("scene");
if (!canvas) throw new Error("no canvas");

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = matchMedia("(max-width: 860px)").matches;
const COUNT = narrow ? 22000 : 64000;
const FORMATIONS = 6;

// Deterministic randomness so the scene looks the same on every load.
let seed = 0x9e3779b9;
function rand() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function gauss() { return (rand() + rand() + rand() - 1.5) * 0.8; }
function unit(out, o) {
  const z = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - z * z);
  out[o] = r * Math.cos(a); out[o + 1] = r * Math.sin(a); out[o + 2] = z;
}
function rotate(arr, rx, ry) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
  for (let i = 0; i < arr.length; i += 3) {
    let x = arr[i], y = arr[i + 1], z = arr[i + 2];
    let y1 = y * cx - z * sx, z1 = y * sx + z * cx;
    let x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
    arr[i] = x2; arr[i + 1] = y1; arr[i + 2] = z2;
  }
}

// 0. The pool: one sphere, every coin indistinguishable.
function pool() {
  const a = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    unit(a, i * 3);
    const u = rand();
    const r = u < 0.7 ? 1.55 + gauss() * 0.05 : 1.55 * Math.cbrt(rand());
    a[i * 3] *= r; a[i * 3 + 1] *= r; a[i * 3 + 2] *= r;
  }
  return a;
}

// 1. The commitment tree: a radial binary tree, root at the centre.
function merkle() {
  const a = new Float32Array(COUNT * 3);
  const D = 8, STEP = 0.27;
  const node = (L, idx, out, o) => {
    const r = L * STEP, ang = ((idx + 0.5) / Math.pow(2, L)) * Math.PI * 2;
    out[o] = Math.cos(ang) * r; out[o + 1] = Math.sin(ang) * r; out[o + 2] = 0;
  };
  const tmpA = new Float32Array(3), tmpB = new Float32Array(3);
  const nodeShare = Math.floor(COUNT * 0.5);
  for (let i = 0; i < COUNT; i++) {
    const L = Math.min(D, Math.floor(Math.log2(1 + rand() * (Math.pow(2, D + 1) - 1))));
    const idx = Math.floor(rand() * Math.pow(2, L));
    if (i < nodeShare || L === 0) {
      node(L, idx, a, i * 3);
      const j = 0.034 * (1 - L / (D + 2)); a[i * 3] += gauss() * j; a[i * 3 + 1] += gauss() * j; a[i * 3 + 2] += gauss() * j;
    } else {
      node(L, idx, tmpA, 0); node(L - 1, Math.floor(idx / 2), tmpB, 0);
      const t = rand();
      a[i * 3] = tmpB[0] + (tmpA[0] - tmpB[0]) * t;
      a[i * 3 + 1] = tmpB[1] + (tmpA[1] - tmpB[1]) * t;
      a[i * 3 + 2] = gauss() * 0.006;
    }
  }
  rotate(a, -0.55, 0.2);
  return a;
}

// 2. The bearer file: a sheet of text. Header line, coin line, gas line.
function file() {
  const a = new Float32Array(COUNT * 3);
  const W = 2.3, H = 3.1, top = H / 2 - 0.32, gap = 0.165;
  const lines = [];
  for (let k = 0; k < 15; k++) lines.push(k === 0 ? 0.42 : k === 2 || k === 3 ? 0.92 : 0.45 + rand() * 0.5);
  const lineShare = Math.floor(COUNT * 0.68);
  for (let i = 0; i < COUNT; i++) {
    if (i < lineShare) {
      const k = Math.floor(rand() * lines.length);
      const len = lines[k] * (W - 0.5);
      a[i * 3] = -W / 2 + 0.25 + rand() * len;
      a[i * 3 + 1] = top - k * gap + gauss() * 0.012;
      a[i * 3 + 2] = gauss() * 0.01;
    } else {
      // the paper itself, mostly on its edges
      const e = rand();
      if (e < 0.5) { a[i * 3] = (rand() < 0.5 ? -1 : 1) * W / 2; a[i * 3 + 1] = (rand() - 0.5) * H; }
      else if (e < 0.8) { a[i * 3] = (rand() - 0.5) * W; a[i * 3 + 1] = (rand() < 0.5 ? -1 : 1) * H / 2; }
      else { a[i * 3] = (rand() - 0.5) * W; a[i * 3 + 1] = (rand() - 0.5) * H; }
      a[i * 3 + 2] = gauss() * 0.01;
    }
  }
  rotate(a, 0.12, -0.42);
  return a;
}

// 3. The exchange: two escrows, two rings locked through each other.
function swap() {
  const a = new Float32Array(COUNT * 3);
  const R = 1.05, r = 0.035, off = 0.47;
  for (let i = 0; i < COUNT; i++) {
    const u = rand() * Math.PI * 2, v = rand() * Math.PI * 2;
    const rr = r * Math.sqrt(rand());
    const px = (R + rr * Math.cos(v)) * Math.cos(u);
    const py = (R + rr * Math.cos(v)) * Math.sin(u);
    const pz = rr * Math.sin(v);
    if (i % 2 === 0) { a[i * 3] = px - off; a[i * 3 + 1] = py; a[i * 3 + 2] = pz; }
    else { a[i * 3] = off + pz; a[i * 3 + 1] = py; a[i * 3 + 2] = px; }
  }
  rotate(a, 0.35, 0.55);
  return a;
}

// 4. The lattice: the structure under the encryption.
function lattice() {
  const a = new Float32Array(COUNT * 3);
  const N = 11, S = 0.26, half = (N - 1) * S / 2;
  const nodeShare = Math.floor(COUNT * 0.7);
  for (let i = 0; i < COUNT; i++) {
    const gx = Math.floor(rand() * N), gy = Math.floor(rand() * N), gz = Math.floor(rand() * N);
    let x = gx * S - half, y = gy * S - half, z = gz * S - half;
    if (i < nodeShare) { x += gauss() * 0.018; y += gauss() * 0.018; z += gauss() * 0.018; }
    else {
      const axis = Math.floor(rand() * 3), t = rand() * S;
      if (axis === 0 && gx < N - 1) x += t; else if (axis === 1 && gy < N - 1) y += t; else if (gz < N - 1) z += t;
    }
    a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z;
  }
  rotate(a, 0.5, 0.7);
  return a;
}

// 5. The program: seven checks, then halt.
function program() {
  const a = new Float32Array(COUNT * 3);
  const lens = [0.78, 0.9, 1.0, 0.84, 0.94, 0.72, 0.16];
  const W = 2.7, gap = 0.4, top = (lens.length - 1) * gap / 2;
  for (let i = 0; i < COUNT; i++) {
    const k = i % lens.length;
    a[i * 3] = -W / 2 + rand() * lens[k] * W;
    a[i * 3 + 1] = top - k * gap + gauss() * 0.014;
    a[i * 3 + 2] = gauss() * 0.03;
  }
  rotate(a, 0.08, -0.3);
  return a;
}

const sets = [pool(), merkle(), file(), swap(), lattice(), program()];
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(sets[0], 3));
for (let k = 1; k < FORMATIONS; k++) geo.setAttribute("aP" + k, new THREE.BufferAttribute(sets[k], 3));
const rnd = new Float32Array(COUNT), dir = new Float32Array(COUNT * 3);
for (let i = 0; i < COUNT; i++) { rnd[i] = rand(); unit(dir, i * 3); }
geo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));
geo.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));

const uniforms = {
  uFrom: { value: 0 },
  uTo: { value: 0 },
  uMix: { value: 0 },
  uTime: { value: 0 },
  uSize: { value: narrow ? 2.4 : 2.1 },
  uDpr: { value: Math.min(devicePixelRatio || 1, 2) },
  uColA: { value: new THREE.Color("#2dd4e8") },
  uColB: { value: new THREE.Color("#e9fbfd") },
  uFade: { value: 1 },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: `
    attribute vec3 aP1, aP2, aP3, aP4, aP5, aDir;
    attribute float aRand;
    uniform float uFrom, uTo, uMix, uTime, uSize, uDpr;
    varying float vR, vA;
    vec3 pick(float i) {
      if (i < 0.5) return position;
      if (i < 1.5) return aP1;
      if (i < 2.5) return aP2;
      if (i < 3.5) return aP3;
      if (i < 4.5) return aP4;
      return aP5;
    }
    void main() {
      vec3 a = pick(uFrom);
      vec3 b = pick(uTo);
      float f = uMix;
      float t = smoothstep(0.0, 1.0, clamp((f - aRand * 0.3) / 0.7, 0.0, 1.0));
      vec3 pos = mix(a, b, t) + aDir * sin(t * 3.14159) * (0.3 + 0.6 * aRand);
      pos += 0.018 * vec3(
        sin(uTime * 0.7 + aRand * 31.0),
        cos(uTime * 0.5 + aRand * 17.0),
        sin(uTime * 0.6 + aRand * 11.0));
      vec4 mv = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * (0.45 + aRand) * uDpr * (3.4 / -mv.z);
      vR = aRand;
      vA = smoothstep(11.0, 3.5, -mv.z) * (0.7 + 0.5 * sin(t * 3.14159));
    }`,
  fragmentShader: `
    uniform vec3 uColA, uColB;
    uniform float uFade;
    varying float vR, vA;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);
      if (d > 0.5) discard;
      float a = smoothstep(0.5, 0.05, d);
      a *= a;
      vec3 col = mix(uColA, uColB, vR * vR * vR);
      gl_FragColor = vec4(col, a * vA * 1.0 * uFade);
    }`,
});

const points = new THREE.Points(geo, material);
const group = new THREE.Group();
group.add(points);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
camera.position.set(0, 0, 6.4);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
} catch (e) {
  canvas.remove();
  throw e;
}
renderer.setClearColor(0x000000, 0);
scene.add(group);

function layout() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const isNarrow = w < 860;
  // Desktop: centre the object in the empty right half of the viewport, whatever the aspect.
  const halfW = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect;
  group.position.x = isNarrow ? 0 : Math.min(2.9, halfW * 0.5);
  group.position.y = isNarrow ? 0.9 : 0;
  const s = isNarrow ? Math.min(1, w / 520) : Math.min(1.1, w / 1500);
  group.scale.setScalar(s);
}
layout();
addEventListener("resize", layout);

// Scroll drives the morph. Each chapter owns one formation.
const chapters = Array.from(document.querySelectorAll("[data-formation]"));
const sequence = [0].concat(chapters.map((c) => Number(c.dataset.formation)));
const state = { target: 0, current: 0, fadeTarget: 1, fade: 1, spin: 0 };

// A scalar position along the sequence: 0 is the hero, k is chapter k. Between two
// stops the field morphs during the last 60% of the gap.
function updateFromScroll() {
  const vh = innerHeight;
  const mid = vh * 0.5;
  let target = 0;
  const first = chapters[0] && chapters[0].getBoundingClientRect();
  if (!first) { state.target = 0; }
  else if (first.top > mid) {
    const k = Math.min(1, Math.max(0, (vh * 1.1 - first.top) / (vh * 0.6)));
    target = k;
  } else {
    target = chapters.length;
    for (let i = 0; i < chapters.length; i++) {
      const r = chapters[i].getBoundingClientRect();
      const next = chapters[i + 1];
      if (!next) { target = i + 1; break; }
      const rn = next.getBoundingClientRect();
      if (rn.top > mid) {
        const span = rn.top - r.top;
        const k = Math.min(1, Math.max(0, (mid - r.top) / span));
        target = i + 1 + Math.min(1, Math.max(0, (k - 0.4) / 0.6));
        break;
      }
    }
  }
  state.target = target;
  const end = document.getElementById("scene-end");
  if (end) {
    const r = end.getBoundingClientRect();
    state.fadeTarget = (r.top < vh ? Math.max(0.08, r.top / vh) : 1) * (innerWidth < 860 ? 0.7 : 1);
  }
}
addEventListener("scroll", updateFromScroll, { passive: true });
updateFromScroll();

let mx = 0, my = 0, tx = 0, ty = 0;
addEventListener("pointermove", (e) => {
  tx = (e.clientX / innerWidth - 0.5) * 2;
  ty = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });

const clock = new THREE.Clock();
let running = true;
document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) tick(); });

function tick() {
  if (!running) return;
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  state.current += (state.target - state.current) * Math.min(1, dt * 4.5);
  state.fade += (state.fadeTarget - state.fade) * Math.min(1, dt * 6);
  const idx = Math.min(sequence.length - 2, Math.floor(state.current));
  uniforms.uFrom.value = sequence[idx];
  uniforms.uTo.value = sequence[Math.min(sequence.length - 1, idx + 1)];
  uniforms.uMix.value = Math.min(1, Math.max(0, state.current - idx));
  uniforms.uFade.value = state.fade;
  uniforms.uTime.value = reduced ? 0 : t;
  mx += (tx - mx) * dt * 3; my += (ty - my) * dt * 3;
  // The pool turns continuously. Every later formation holds its designed angle and breathes.
  const showing = uniforms.uMix.value < 0.5 ? uniforms.uFrom.value : uniforms.uTo.value;
  const poolness = showing === 0 ? 1 : 0;
  state.spin += dt * 0.12 * poolness;
  if (poolness < 1) {
    const TAU = Math.PI * 2;
    const m = ((state.spin % TAU) + TAU) % TAU;
    state.spin = m + ((m > Math.PI ? TAU : 0) - m) * Math.min(1, dt * 2.5);
  }
  group.rotation.y = state.spin + (reduced ? 0 : Math.sin(t * 0.35) * 0.1) + mx * 0.12;
  group.rotation.x = my * 0.08 + Math.sin(state.current * 1.3) * 0.06;
  camera.position.x = mx * 0.15;
  camera.position.y = -my * 0.1;
  camera.lookAt(0, group.position.y * 0.5, 0);
  renderer.render(scene, camera);
}
tick();
canvas.classList.add("ready");
