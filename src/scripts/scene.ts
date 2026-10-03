/**
 * Escena de partículas: miles de puntos que toman la forma de cada parte de MyNeg.
 * 0 · el logo M   1 · el recibo con su QR   2 · las cajas del inventario
 * 3 · las sucursales conectadas   4 · las ventas subiendo
 * Todas las formas viven en la GPU; el scroll solo mueve `progress` entre 0 y 4.
 */
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const SHAPES = 5;

type Vec = [number, number, number];

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Muestra `count` puntos repartidos por la superficie de varias geometrías. */
function sampleSurface(geos: THREE.BufferGeometry[], count: number): Float32Array {
  const merged = mergeGeometries(
    geos.map((g) => {
      const ng = g.index ? g.toNonIndexed() : g;
      for (const name of Object.keys(ng.attributes)) if (name !== 'position') ng.deleteAttribute(name);
      return ng;
    }),
  );
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
  const out = new Float32Array(count * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(p);
    out.set([p.x, p.y, p.z], i * 3);
  }
  return out;
}

/** El ícono de MyNeg: la M dentro de su cuadro redondeado. */
function logoShape(count: number): Float32Array {
  const s = 0.1; // el SVG mide 64; lo llevamos a ~6.4 unidades
  const pts = [
    [17, 44],
    [17, 22],
    [32, 34],
    [47, 22],
    [47, 44],
  ].map(([x, y]) => new THREE.Vector3((x - 32) * s, (32 - y) * s, 0));
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  const tube = new THREE.TubeGeometry(path, 200, 0.3, 14, false);
  const caps = [pts[0], pts[pts.length - 1]].map((v) => new THREE.SphereGeometry(0.3, 14, 10).translate(v.x, v.y, v.z));
  const mCount = Math.floor(count * 0.62);
  const m = sampleSurface([tube, ...caps], mCount);

  // Marco: cuadro redondeado, como el ícono de la app
  const out = new Float32Array(count * 3);
  out.set(m);
  const half = 3.2;
  const r = 1.4;
  const frame = new THREE.Shape();
  frame.moveTo(-half + r, -half);
  frame.lineTo(half - r, -half);
  frame.quadraticCurveTo(half, -half, half, -half + r);
  frame.lineTo(half, half - r);
  frame.quadraticCurveTo(half, half, half - r, half);
  frame.lineTo(-half + r, half);
  frame.quadraticCurveTo(-half, half, -half, half - r);
  frame.lineTo(-half, -half + r);
  frame.quadraticCurveTo(-half, -half, -half + r, -half);
  const outline = frame.getSpacedPoints(400);
  for (let i = mCount; i < count; i++) {
    const t = Math.random();
    const a = outline[Math.floor(t * (outline.length - 1))];
    const spread = Math.random() < 0.8 ? 0.05 : 0.35;
    out.set([a.x + rand(-spread, spread), a.y + rand(-spread, spread), rand(-0.25, 0.25)], i * 3);
  }
  return out;
}

/** Recibo térmico que se curva, con renglones de texto y el QR de la DGII. */
function receiptShape(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  const w = 2.6;
  const h = 6.2;
  const rows = [
    // [y, ancho relativo, alineado al centro]
    [2.75, 0.55, 1],
    [2.45, 0.8, 1],
    [2.2, 0.6, 1],
    [1.75, 0.95, 0],
    [1.45, 0.7, 0],
    [1.15, 0.9, 0],
    [0.85, 0.6, 0],
    [0.55, 0.85, 0],
    [0.15, 0.95, 0],
    [-0.15, 0.5, 0],
    [-0.45, 0.75, 0],
  ] as const;
  const qr = Array.from({ length: 81 }, () => Math.random() < 0.52);
  const curl = (y: number) => 0.35 * Math.sin((y + h / 2) * 0.55) - 0.6 * Math.max(0, (y - 2.6) * 0.8) ** 2;
  for (let i = 0; i < count; i++) {
    const k = Math.random();
    let x: number;
    let y: number;
    if (k < 0.24) {
      // papel: borde y relleno muy suave
      if (Math.random() < 0.55) {
        const t = Math.random() * 2 * (w + h);
        if (t < w) [x, y] = [-w / 2 + t, -h / 2];
        else if (t < w + h) [x, y] = [w / 2, -h / 2 + (t - w)];
        else if (t < 2 * w + h) [x, y] = [w / 2 - (t - w - h), h / 2];
        else [x, y] = [-w / 2, h / 2 - (t - 2 * w - h)];
        // borde inferior en zigzag de papel rasgado
        if (y <= -h / 2 + 0.001) y += Math.abs(((x * 6) % 1) - 0.5) * 0.25;
      } else {
        [x, y] = [rand(-w / 2, w / 2), rand(-h / 2, h / 2)];
      }
    } else if (k < 0.74) {
      const row = rows[Math.floor(Math.random() * rows.length)];
      const len = row[1] * (w - 0.5);
      const start = row[2] ? -len / 2 : -w / 2 + 0.25;
      x = start + Math.random() * len;
      y = row[0] + rand(-0.05, 0.05);
      // los montos van a la derecha
      if (!row[2] && Math.random() < 0.3) x = w / 2 - 0.25 - Math.random() * 0.6;
    } else {
      // QR 9x9
      let cell: number;
      do cell = Math.floor(Math.random() * 81);
      while (!qr[cell] && Math.random() < 0.97);
      const size = 1.5;
      const cx = (cell % 9) / 9;
      const cy = Math.floor(cell / 9) / 9;
      x = -size / 2 + (cx + Math.random() / 9) * size;
      y = -1.0 - (cy + Math.random() / 9) * size;
    }
    out.set([x, y, curl(y) + rand(-0.03, 0.03)], i * 3);
  }
  return out;
}

/** Inventario: cajas apiladas en un estante. */
function boxesShape(count: number): Float32Array {
  const geos: THREE.BufferGeometry[] = [];
  const layout: [number, number, number, number][] = [
    // x, y, z, tamaño
    [-1.9, -1.6, 0, 1.5],
    [0, -1.6, 0.1, 1.5],
    [1.9, -1.6, -0.1, 1.5],
    [-0.95, 0.0, 0.05, 1.45],
    [0.95, 0.0, -0.05, 1.45],
    [0, 1.55, 0, 1.35],
  ];
  for (const [x, y, z, s] of layout) {
    const g = new THREE.BoxGeometry(s, s, s, 6, 6, 6);
    g.rotateY(rand(-0.25, 0.25));
    g.translate(x, y, z);
    geos.push(g);
  }
  // estante
  geos.push(new THREE.BoxGeometry(6.4, 0.12, 1.8).translate(0, -2.45, 0));
  return sampleSurface(geos, count);
}

/** Sucursales conectadas: nodos y rutas en arco entre ellos. */
function networkShape(count: number): Float32Array {
  const nodes: Vec[] = [
    [0, 0, 0],
    [-2.8, 1.4, -0.5],
    [2.6, 1.8, 0.4],
    [-2.2, -2.0, 0.6],
    [2.4, -1.7, -0.6],
    [0.2, 3.0, -0.2],
  ];
  const out = new Float32Array(count * 3);
  const nodeCount = Math.floor(count * 0.42);
  const v = new THREE.Vector3();
  for (let i = 0; i < nodeCount; i++) {
    const n = nodes[i % nodes.length];
    const r = i % nodes.length === 0 ? 0.75 : 0.42;
    v.randomDirection().multiplyScalar(r * (0.92 + Math.random() * 0.08));
    out.set([n[0] + v.x, n[1] + v.y, n[2] + v.z], i * 3);
  }
  const links: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 5],
    [2, 4],
    [3, 1],
  ];
  for (let i = nodeCount; i < count; i++) {
    const [a, b] = links[i % links.length];
    const t = Math.random();
    const A = new THREE.Vector3(...nodes[a]);
    const B = new THREE.Vector3(...nodes[b]);
    const mid = A.clone()
      .lerp(B, 0.5)
      .add(new THREE.Vector3(0, 0, 1.1));
    const p = new THREE.QuadraticBezierCurve3(A, mid, B).getPoint(t);
    out.set([p.x + rand(-0.03, 0.03), p.y + rand(-0.03, 0.03), p.z + rand(-0.03, 0.03)], i * 3);
  }
  return out;
}

/** Reportes: barras que suben y la línea de tendencia encima. */
function chartShape(count: number): Float32Array {
  const heights = [1.2, 1.9, 1.6, 2.7, 3.1, 4.0, 4.9];
  const geos = heights.map((hgt, i) =>
    new THREE.BoxGeometry(0.62, hgt, 0.62, 2, 8, 2).translate(-2.7 + i * 0.9, -2.6 + hgt / 2, 0),
  );
  const barsCount = Math.floor(count * 0.8);
  const bars = sampleSurface(geos, barsCount);
  const out = new Float32Array(count * 3);
  out.set(bars);
  const line = new THREE.CatmullRomCurve3(
    heights.map((hgt, i) => new THREE.Vector3(-2.7 + i * 0.9, -2.6 + hgt + 0.55, 0.4)),
  );
  for (let i = barsCount; i < count; i++) {
    const p = line.getPoint(Math.random());
    out.set([p.x + rand(-0.04, 0.04), p.y + rand(-0.04, 0.04), p.z + rand(-0.04, 0.04)], i * 3);
  }
  return out;
}

const vertex = /* glsl */ `
  attribute vec3 aS0;
  attribute vec3 aS1;
  attribute vec3 aS2;
  attribute vec3 aS3;
  attribute vec3 aS4;
  attribute vec4 aRand;
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uC4;
  varying vec3 vColor;
  varying float vAlpha;

  float w(float p, float i) { return max(0.0, 1.0 - abs(p - i)); }

  void main() {
    // cada partícula sale un poco antes o después, pero todas llegan al terminar el tramo
    float base = min(floor(uProgress), 3.0);
    float f = clamp(uProgress - base, 0.0, 1.0);
    float delay = aRand.x * 0.35;
    float lf = clamp((f - delay) / 0.65, 0.0, 1.0);
    float e = lf * lf * (3.0 - 2.0 * lf);
    float pe = base + e;
    f = lf;

    vec3 pos = aS0 * w(pe, 0.0) + aS1 * w(pe, 1.0) + aS2 * w(pe, 2.0) + aS3 * w(pe, 3.0) + aS4 * w(pe, 4.0);
    vColor = uC0 * w(pe, 0.0) + uC1 * w(pe, 1.0) + uC2 * w(pe, 2.0) + uC3 * w(pe, 3.0) + uC4 * w(pe, 4.0);

    // en medio de la transición se dispersan en un remolino
    float mid = sin(f * 3.14159);
    float a = aRand.y * 6.2831 + uTime * 0.6;
    pos += vec3(cos(a), sin(a * 1.3), sin(a)) * mid * (0.9 + aRand.z * 1.8);
    // respiración constante
    pos += vec3(
      sin(uTime * 0.9 + aRand.y * 12.0),
      cos(uTime * 0.7 + aRand.z * 9.0),
      sin(uTime * 0.8 + aRand.w * 7.0)
    ) * 0.035;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (0.55 + aRand.w * 0.9);
    gl_PointSize = size * uPixelRatio * (26.0 / -mv.z);
    // destellos aleatorios
    float twinkle = 0.65 + 0.35 * sin(uTime * (1.0 + aRand.x * 3.0) + aRand.y * 40.0);
    vAlpha = twinkle * (0.55 + 0.45 * (1.0 - mid * 0.6));
    vColor = mix(vColor, vec3(1.0), step(0.985, aRand.x) * 0.7);
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uOpacity;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.5, 0.0, d);
    float alpha = pow(core, 1.6) * vAlpha * uOpacity * 0.9;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor * (0.9 + core * 0.8), alpha);
  }
`;

export interface Scene {
  setProgress(p: number): void;
  setOpacity(o: number): void;
  setOffsetX(x: number): void;
  destroy(): void;
}

export function createScene(canvas: HTMLCanvasElement): Scene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const small = window.matchMedia('(max-width: 760px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = small ? 5200 : 11000;
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, small ? 21 : 16);

  const geometry = new THREE.BufferGeometry();
  const shapes = [logoShape(count), receiptShape(count), boxesShape(count), networkShape(count), chartShape(count)];
  // mezclar cada forma para que las partículas viajen en direcciones distintas
  shapes.forEach((s, idx) => {
    if (idx === 0) return;
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      for (let k = 0; k < 3; k++) [s[i * 3 + k], s[j * 3 + k]] = [s[j * 3 + k], s[i * 3 + k]];
    }
  });
  shapes.forEach((s, i) => geometry.setAttribute(`aS${i}`, new THREE.BufferAttribute(s, 3)));
  geometry.setAttribute('position', new THREE.BufferAttribute(shapes[0].slice(), 3));
  const rnd = new Float32Array(count * 4);
  for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
  geometry.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

  const uniforms = {
    uProgress: { value: 0 },
    uTime: { value: 0 },
    uSize: { value: small ? 3.4 : 3.0 },
    uPixelRatio: { value: pixelRatio },
    uOpacity: { value: 1 },
    uC0: { value: new THREE.Color('#2f9bff') },
    uC1: { value: new THREE.Color('#f2f6ff') },
    uC2: { value: new THREE.Color('#ffb020') },
    uC3: { value: new THREE.Color('#3ee6d2') },
    uC4: { value: new THREE.Color('#34d399') },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  // polvo de estrellas de fondo
  const starsGeo = new THREE.BufferGeometry();
  const starCount = small ? 500 : 1200;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) starPos.set([rand(-30, 30), rand(-20, 20), rand(-30, -5)], i * 3);
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(
    starsGeo,
    new THREE.PointsMaterial({ size: 0.06, color: '#8fb8ff', transparent: true, opacity: 0.5, depthWrite: false }),
  );
  scene.add(stars);

  const target = { progress: 0, offsetX: 0, opacity: 1 };
  const state = { progress: 0, offsetX: 0, opacity: 1 };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };

  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  const resize = () => {
    const { innerWidth: w, innerHeight: h } = window;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  let last = performance.now();
  let t = 0;
  let raf = 0;
  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting || state.opacity > 0.01));
  io.observe(canvas);

  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible || (state.opacity < 0.01 && target.opacity < 0.01)) return;
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    const k = 1 - Math.pow(0.0015, dt); // suavizado independiente de los fps
    state.progress += (target.progress - state.progress) * k;
    state.offsetX += (target.offsetX - state.offsetX) * k;
    state.opacity += (target.opacity - state.opacity) * k;
    pointer.sx += (pointer.x - pointer.sx) * k * 0.6;
    pointer.sy += (pointer.y - pointer.sy) * k * 0.6;

    uniforms.uProgress.value = state.progress;
    uniforms.uTime.value = reduced ? 0 : t;
    uniforms.uOpacity.value = state.opacity;
    canvas.style.opacity = String(Math.min(1, state.opacity * 1.5));

    group.position.x = state.offsetX;
    const spin = reduced ? 0 : Math.sin(t * 0.25) * 0.35;
    group.rotation.y = spin + pointer.sx * 0.45;
    group.rotation.x = pointer.sy * 0.25;
    stars.rotation.y = t * 0.01;
    stars.position.x = -pointer.sx * 0.6;
    stars.position.y = pointer.sy * 0.4;
    renderer.render(scene, camera);
  };
  tick();

  return {
    setProgress: (p) => (target.progress = Math.max(0, Math.min(SHAPES - 1, p))),
    setOpacity: (o) => (target.opacity = o),
    setOffsetX: (x) => (target.offsetX = small ? 0 : x),
    destroy: () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
