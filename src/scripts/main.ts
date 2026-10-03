/**
 * Orquesta la página: scroll suave (Lenis), animaciones (GSAP) y la escena 3D.
 * La escena se carga después del primer pintado para no frenar el LCP.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { Scene } from './scene';

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = window.matchMedia('(max-width: 960px)').matches;
let scene: Scene | null = null;

// ---------- Scroll suave ----------
if (!reduced) {
  const lenis = new Lenis({ lerp: 0.1, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ---------- Barra superior: se esconde al bajar, vuelve al subir ----------
const nav = document.getElementById('nav')!;
let lastY = 0;
window.addEventListener(
  'scroll',
  () => {
    const y = window.scrollY;
    nav.classList.toggle('hidden', y > 300 && y > lastY);
    lastY = y;
  },
  { passive: true },
);

// ---------- Entrada del hero: letra por letra ----------
document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
  el.setAttribute('aria-label', el.textContent!);
  el.innerHTML = el
    .textContent!.split(' ')
    .map(
      (w) =>
        `<span aria-hidden="true" style="display:inline-block;white-space:nowrap">${[...w]
          .map((c) => `<span class="char">${c}</span>`)
          .join('')}</span>`,
    )
    .join(' ');
});

if (!reduced) {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('[data-split] .char', { yPercent: 110, opacity: 0, rotate: 8, duration: 1.2, stagger: 0.025 })
    .from('[data-hero]', { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, '-=0.9')
    .from('.marquee', { opacity: 0, duration: 1 }, '-=0.6');

  // avisos flotantes que aparecen y se van, uno tras otro
  const tt = gsap.timeline({ repeat: -1, delay: 1.6 });
  gsap.utils.toArray<HTMLElement>('.toast').forEach((t) => {
    tt.fromTo(
      t,
      { opacity: 0, y: 16, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.7)' },
    )
      .to(t, { y: -6, duration: 2.2, ease: 'sine.inOut' })
      .to(t, { opacity: 0, y: -16, scale: 0.96, duration: 0.5, ease: 'power2.in' });
  });

  // ---------- Revelado al hacer scroll ----------
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });
} else {
  gsap.set('.toast', { opacity: 1 });
}

// ---------- Contadores ----------
document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
  const end = Number(el.dataset.count);
  if (reduced) return;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 90%',
    once: true,
    onEnter: () => {
      const o = { v: 0 };
      gsap.to(o, {
        v: end,
        duration: 1.6,
        ease: 'power3.out',
        onUpdate: () => (el.textContent = String(Math.round(o.v))),
      });
    },
  });
});

// ---------- Brillo de las tarjetas que sigue al cursor ----------
document.addEventListener(
  'pointermove',
  (e) => {
    const card = (e.target as HTMLElement).closest?.<HTMLElement>('.glow-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  },
  { passive: true },
);

// ---------- Recibo que se imprime ----------
const paper = document.getElementById('paper');
if (paper && !reduced) {
  gsap.set(paper, { yPercent: -100 });
  gsap.set(paper.querySelectorAll('[data-print]'), { opacity: 0 });
  ScrollTrigger.create({
    trigger: paper.closest('.printer'),
    start: 'top 70%',
    once: true,
    onEnter: () => {
      gsap
        .timeline()
        .to(paper, { yPercent: 0, duration: 3.2, ease: 'steps(28)' })
        .to(paper.querySelectorAll('[data-print]'), { opacity: 1, duration: 0.05, stagger: 0.18 }, 0.2);
    },
  });
}

// ---------- Escena 3D ----------
type SceneCfg = { progress?: number; x?: number; opacity?: number };
const parseCfg = (s: string): SceneCfg =>
  Object.fromEntries(
    s
      .split(';')
      .map((kv) => kv.split(':'))
      .map(([k, v]) => [k.trim(), Number(v)]),
  );

const apply = (cfg: SceneCfg) => {
  if (!scene) return;
  if (cfg.progress !== undefined) scene.setProgress(cfg.progress);
  if (cfg.x !== undefined) scene.setOffsetX(cfg.x);
  // en el celular el 3D queda detrás del texto: más tenue en el hero
  if (cfg.opacity !== undefined) scene.setOpacity(small && cfg.opacity === 1 ? 0.75 : cfg.opacity);
};

const setupStory = () => {
  const story = document.querySelector<HTMLElement>('.story');
  const chapters = [...document.querySelectorAll<HTMLElement>('.chapter')];
  const dots = [...document.querySelectorAll<HTMLElement>('[data-dot]')];
  let current = -1;
  const show = (i: number) => {
    if (i === current) return;
    current = i;
    chapters.forEach((c, j) => {
      c.classList.toggle('active', i === j);
      c.setAttribute('aria-hidden', String(i !== j));
    });
    dots.forEach((d, j) => d.classList.toggle('active', i === j));
  };
  show(0);
  if (!story || reduced) return;
  // Cada capítulo arma su forma en el primer 35 % de su tramo y la sostiene mientras se lee
  ScrollTrigger.create({
    trigger: story,
    start: 'top top',
    end: 'bottom bottom',
    onToggle: (self) => self.isActive && apply({ x: 3.4, opacity: small ? 0.6 : 1 }),
    onUpdate: (self) => {
      const seg = self.progress * chapters.length;
      const i = Math.min(chapters.length - 1, Math.floor(seg));
      show(i);
      scene?.setProgress(i + Math.min(1, (seg - i) / 0.35));
    },
  });
};

const setupSceneTriggers = () => {
  document.querySelectorAll<HTMLElement>('[data-scene]').forEach((el) => {
    const cfg = parseCfg(el.dataset.scene!);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => self.isActive && apply(cfg),
    });
  });
};

setupStory();

const boot = async () => {
  const canvas = document.getElementById('scene') as HTMLCanvasElement | null;
  if (!canvas) return;
  const { createScene } = await import('./scene');
  scene = createScene(canvas);
  if (!scene) {
    canvas.remove();
    return;
  }
  apply({ progress: 0, x: 3.6, opacity: 1 });
  setupSceneTriggers();
  ScrollTrigger.refresh();
};

if ('requestIdleCallback' in window) requestIdleCallback(() => void boot(), { timeout: 1200 });
else setTimeout(() => void boot(), 300);
