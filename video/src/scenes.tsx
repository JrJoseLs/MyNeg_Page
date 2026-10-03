import {
  BadgeDollarSign,
  Bike,
  BookOpen,
  Check,
  Factory,
  FileCode2,
  Lock,
  MessageCircle,
  ScanBarcode,
  UtensilsCrossed,
  Wifi,
  WifiOff,
  Wrench,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import {
  AbsoluteFill,
  Html5Audio,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { C, body, display, grad, mono, useLayout } from './theme';
import type { Scene, VideoProps } from './Video';

type P = { scene: Scene; props: VideoProps };

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const cue = (scene: Scene, i: number) => scene.captions[i]?.from ?? 0;
const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const usePop = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (at: number, damping = 14, stiffness = 150) => spring({ frame: f - at, fps, config: { damping, stiffness } });
};

const Sfx = ({ at, src, volume = 0.5 }: { at: number; src: string; volume?: number }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={40} layout="none">
    <Html5Audio src={staticFile(`audio/${src}.wav`)} volume={volume} />
  </Sequence>
);

/** Entrada y salida suaves de cada escena. */
const Frame = ({ scene, children, style }: { scene: Scene; children: ReactNode; style?: CSSProperties }) => {
  const f = useCurrentFrame();
  const enter = interpolate(f, [0, 10], [0, 1], clamp);
  const exit = interpolate(f, [scene.frames - 9, scene.frames], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(enter, exit),
        transform: `scale(${0.98 + 0.02 * enter + (1 - exit) * 0.03})`,
        filter: `blur(${(1 - Math.min(enter, exit)) * 8}px)`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Título que entra palabra por palabra. Las palabras desde `gradFrom` van en degradado. */
const Words = ({ text, at, size, gradFrom = 999, color = C.text, align = 'center' }: {
  text: string;
  at: number;
  size: number;
  gradFrom?: number;
  color?: string;
  align?: CSSProperties['textAlign'];
}) => {
  const pop = usePop();
  return (
    <div
      style={{
        fontFamily: display,
        fontWeight: 750,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: '-0.03em',
        textAlign: align,
        color,
      }}
    >
      {text.split(' ').map((w, i) => {
        const s = pop(at + i * 3, 13, 160);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              marginRight: '0.22em',
              opacity: s,
              transform: `translateY(${(1 - s) * 0.5 * size}px) rotate(${(1 - s) * 6}deg)`,
              ...(i >= gradFrom
                ? { backgroundImage: grad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }
                : {}),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

const Eyebrow = ({ children, u, color = C.teal }: { children: ReactNode; u: number; color?: string }) => (
  <div
    style={{
      fontFamily: mono,
      fontSize: 22 * u,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color,
      display: 'flex',
      alignItems: 'center',
      gap: 12 * u,
    }}
  >
    <span style={{ width: 28 * u, height: 2, background: color }} />
    {children}
  </div>
);

const Card = ({ children, style, u }: { children: ReactNode; style?: CSSProperties; u: number }) => (
  <div
    style={{
      background: 'rgba(14,18,30,0.86)',
      borderRadius: 32 * u,
      boxShadow: `inset 0 0 0 ${1.5 * u}px rgba(255,255,255,0.12), 0 ${40 * u}px ${100 * u}px -${40 * u}px rgba(0,0,0,0.9)`,
      padding: 36 * u,
      ...style,
    }}
  >
    {children}
  </div>
);

const Pill = ({ children, color, u, style }: { children: ReactNode; color: string; u: number; style?: CSSProperties }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10 * u,
      padding: `${8 * u}px ${18 * u}px`,
      borderRadius: 999,
      fontSize: 22 * u,
      fontWeight: 600,
      color,
      background: `color-mix(in srgb, ${color} 16%, transparent)`,
      boxShadow: `inset 0 0 0 ${1.5 * u}px color-mix(in srgb, ${color} 35%, transparent)`,
      ...style,
    }}
  >
    {children}
  </span>
);

/** QR decorativo con sus tres cuadros de posición. */
const Qr = ({ size }: { size: number }) => {
  const N = 25;
  const cells: string[] = [];
  const finders = [
    [0, 0],
    [N - 7, 0],
    [0, N - 7],
  ];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let on: boolean | null = null;
      for (const [fx, fy] of finders) {
        const lx = x - fx;
        const ly = y - fy;
        if (lx < -1 || ly < -1 || lx > 7 || ly > 7) continue;
        on = lx >= 0 && ly >= 0 && lx <= 6 && ly <= 6 && (lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4));
      }
      if (on ?? random(`qr${x}-${y}`) < 0.5) cells.push(`M${x} ${y}h1v1h-1z`);
    }
  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${N + 2} ${N + 2}`} style={{ shapeRendering: 'crispEdges' }}>
      <rect x={-1} y={-1} width={N + 2} height={N + 2} fill="#fff" />
      <path d={cells.join('')} fill="#111" />
    </svg>
  );
};

/** El ícono de MyNeg. */
const LogoIcon = ({ size, draw = 1, fill = 1 }: { size: number; draw?: number; fill?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <defs>
      <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2997ff" />
        <stop offset="1" stopColor="#0058b9" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="14" fill="url(#lg)" opacity={fill} />
    <rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="#7cc0ff" strokeWidth="1.5" strokeDasharray="240" strokeDashoffset={240 * (1 - draw)} opacity={1 - fill * 0.8} />
    <path
      d="M17 44V22l15 12 15-12v22"
      fill="none"
      stroke="#fff"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="110"
      strokeDashoffset={110 * (1 - draw)}
    />
  </svg>
);

// ─────────────────────────────── 1 · Gancho ───────────────────────────────
const BILLS = [
  { v: '2000', c: '#6d6ad8' },
  { v: '1000', c: '#d0505a' },
  { v: '500', c: '#2fa58f' },
  { v: '200', c: '#d06aa0' },
  { v: '100', c: '#e0913a' },
  { v: '50', c: '#8a63c9' },
];

export const Hook = ({ scene }: P) => {
  const f = useCurrentFrame();
  const { u, width, height, vertical } = useLayout();
  const seguro = cue(scene, 1);
  const shake = f > seguro ? Math.sin((f - seguro) * 1.9) * 14 * u * Math.exp(-(f - seguro) / 12) : 0;
  const pop = usePop();
  const s2 = pop(seguro, 9, 200);
  return (
    <Frame scene={scene}>
      {Array.from({ length: 14 }, (_, i) => {
        const b = BILLS[i % BILLS.length];
        const x = random(`bx${i}`) * width;
        const y = -200 + ((random(`by${i}`) * (height + 400) + f * (1.2 + random(`bs${i}`) * 1.6)) % (height + 400));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - 130 * u,
              top: y,
              width: 260 * u,
              height: 118 * u,
              borderRadius: 10 * u,
              background: `linear-gradient(135deg, ${b.c}, color-mix(in srgb, ${b.c} 55%, #000))`,
              opacity: 0.22,
              filter: `blur(${random(`bb${i}`) * 4 + 1}px)`,
              transform: `rotate(${random(`br${i}`) * 80 - 40 + f * (random(`bw${i}`) - 0.5)}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `0 ${18 * u}px`,
              fontFamily: display,
              fontWeight: 800,
              fontSize: 40 * u,
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            <span>{b.v}</span>
            <span style={{ fontSize: 18 * u }}>RD$</span>
          </div>
        );
      })}
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 80 * u, gap: 30 * u }}>
        <Words text="¿Tu caja cuadró ayer?" at={4} size={(vertical ? 128 : 150) * u} />
        <div
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: (vertical ? 150 : 170) * u,
            color: C.mango,
            opacity: s2,
            transform: `translateX(${shake}px) scale(${0.6 + 0.4 * s2})`,
            textShadow: `0 0 ${60 * u}px rgba(255,176,32,0.45)`,
            letterSpacing: '-0.03em',
          }}
        >
          ¿Seguro?
        </div>
      </AbsoluteFill>
    </Frame>
  );
};

// ─────────────────────────────── 2 · El dolor ───────────────────────────────
export const Dolor = ({ scene }: P) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const pop = usePop();
  const stop = cue(scene, 3);
  const glitch = f >= stop ? Math.exp(-(f - stop) / 10) : 0;
  const dead = interpolate(f, [stop, stop + 25], [0, 1], clamp);
  const jx = glitch * (random(`gx${f}`) - 0.5) * 50 * u;
  const jy = glitch * (random(`gy${f}`) - 0.5) * 20 * u;
  const cardW = (vertical ? 820 : 520) * u;
  const cardH = (vertical ? 380 : 470) * u;

  const cards = [
    {
      at: cue(scene, 0),
      title: 'El fiado, en un cuaderno',
      art: (
        <div
          style={{
            flex: 1,
            borderRadius: 14 * u,
            background: 'repeating-linear-gradient(#f6f0e1 0 38px, #c9d6ea 38px 40px)',
            padding: `${14 * u}px ${22 * u}px`,
            color: '#2a3550',
            fontFamily: mono,
            fontSize: 24 * u,
            lineHeight: `${40 * u}px`,
            transform: 'rotate(-2deg)',
            fontStyle: 'italic',
          }}
        >
          <div>Doña Rosa ....... 1,250</div>
          <div>Juan (colmado) .. 800</div>
          <div style={{ textDecoration: 'line-through' }}>Pedro ........... 450</div>
          <div>¿Ana? ........... ¿?</div>
        </div>
      ),
    },
    {
      at: cue(scene, 1),
      title: 'El inventario, a ojo',
      art: (
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 * u }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 110 * u,
                height: (110 + (i === 1 ? 60 : 0)) * u,
                background: '#c8904a',
                borderRadius: 8 * u,
                boxShadow: 'inset 0 -14px 0 rgba(0,0,0,0.18)',
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              top: 0,
              fontFamily: display,
              fontWeight: 800,
              fontSize: 120 * u,
              color: C.coral,
              transform: `rotate(${Math.sin(f / 6) * 8}deg)`,
            }}
          >
            ?
          </div>
        </div>
      ),
    },
    {
      at: cue(scene, 2),
      title: 'Sin internet, sin ventas',
      art: (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <WifiOff size={170 * u} color={C.coral} strokeWidth={1.6} style={{ opacity: 0.6 + 0.4 * Math.abs(Math.sin(f / 5)) }} />
        </div>
      ),
    },
  ];

  return (
    <Frame scene={scene}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: vertical ? 'column' : 'row',
          gap: 36 * u,
          paddingBottom: (vertical ? 200 : 60) * u,
          transform: `translate(${jx}px, ${jy}px)`,
          filter: `grayscale(${dead}) brightness(${1 - dead * 0.55})`,
        }}
      >
        {cards.map((c, i) => {
          const s = pop(c.at, 13, 140);
          return (
            <Card
              key={i}
              u={u}
              style={{
                width: cardW,
                height: cardH,
                display: 'flex',
                flexDirection: 'column',
                gap: 22 * u,
                opacity: s,
                transform: `translateY(${(1 - s) * 80 * u}px) rotate(${(1 - s) * (i - 1) * 6}deg)`,
                boxShadow: `inset 0 0 0 ${1.5 * u}px rgba(255,90,95,0.35)`,
              }}
            >
              <div style={{ fontFamily: mono, color: C.coral, fontSize: 22 * u }}>0{i + 1}</div>
              {c.art}
              <div style={{ fontFamily: display, fontWeight: 700, fontSize: 40 * u, letterSpacing: '-0.02em' }}>{c.title}</div>
            </Card>
          );
        })}
      </AbsoluteFill>
      {/* separación de colores del "glitch" */}
      {glitch > 0.05 && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(transparent ${random(`gl${f}`) * 80}%, rgba(255,90,95,0.25) 0 ${random(`gl${f}`) * 80 + 4}%, transparent 0)`,
            mixBlendMode: 'screen',
            opacity: glitch,
          }}
        />
      )}
      {cards.map((c, i) => (
        <Sfx key={i} at={c.at} src="pop" volume={0.5} />
      ))}
    </Frame>
  );
};

// ─────────────────────────────── 3 · Urgencia ───────────────────────────────
export const Urgencia = ({ scene }: P) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const pop = usePop();
  const flip = pop(4, 12, 90);
  const glow = 0.5 + 0.5 * Math.sin(f / 6);
  const s2 = pop(cue(scene, 1), 14, 140);
  return (
    <Frame scene={scene}>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: vertical ? 'column' : 'row',
          gap: 90 * u,
          paddingBottom: (vertical ? 200 : 40) * u,
          perspective: 1400,
        }}
      >
        <div
          style={{
            width: 440 * u,
            borderRadius: 40 * u,
            overflow: 'hidden',
            background: '#fbfaf7',
            transform: `rotateX(${(1 - flip) * -95}deg)`,
            transformOrigin: 'top',
            boxShadow: `0 0 ${120 * u * glow}px rgba(255,176,32,0.45), 0 40px 80px -30px #000`,
          }}
        >
          <div
            style={{
              background: C.mango,
              color: '#2a1700',
              fontFamily: display,
              fontWeight: 800,
              fontSize: 44 * u,
              textAlign: 'center',
              padding: `${18 * u}px 0`,
              letterSpacing: '0.04em',
            }}
          >
            NOVIEMBRE 2026
          </div>
          <div
            style={{
              fontFamily: display,
              fontWeight: 800,
              fontSize: 260 * u,
              lineHeight: 1.05,
              color: '#111',
              textAlign: 'center',
              paddingBottom: 20 * u,
            }}
          >
            15
          </div>
        </div>
        <div style={{ maxWidth: (vertical ? 900 : 860) * u, display: 'flex', flexDirection: 'column', gap: 28 * u, alignItems: vertical ? 'center' : 'flex-start' }}>
          <Eyebrow u={u} color={C.mango}>
            DGII · Ley 32-23
          </Eyebrow>
          <Words text="Factura electrónica obligatoria." at={10} size={(vertical ? 96 : 104) * u} gradFrom={2} align={vertical ? 'center' : 'left'} />
          <div style={{ display: 'flex', gap: 14 * u, opacity: s2, transform: `translateY(${(1 - s2) * 30}px)`, flexWrap: 'wrap' }}>
            {['E31', 'E32', 'E34', 'QR DGII'].map((t) => (
              <Pill key={t} color={C.mango} u={u}>
                {t}
              </Pill>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </Frame>
  );
};

// ─────────────────────────────── 4 · Aparece MyNeg ───────────────────────────────
const M_PTS = [
  [17, 44],
  [17, 22],
  [32, 34],
  [47, 22],
  [47, 44],
];
const pointOnM = (t: number) => {
  const segs = M_PTS.slice(1).map((p, i) => [M_PTS[i], p]);
  const lens = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  let d = t * lens.reduce((s, l) => s + l, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= lens[i]) {
      const [a, b] = segs[i];
      const k = d / lens[i];
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
    d -= lens[i];
  }
  return M_PTS[M_PTS.length - 1];
};

export const Logo4 = ({ scene }: P) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const pop = usePop();
  const size = (vertical ? 380 : 340) * u;
  const formed = 34;
  const icon = pop(formed, 12, 120);
  const word = pop(formed + 12, 14, 130);
  const ring = interpolate(f, [formed, formed + 40], [0, 1], clamp);
  return (
    <Frame scene={scene}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: (vertical ? 200 : 60) * u }}>
        <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', gap: 50 * u }}>
          <div style={{ position: 'relative', width: size, height: size }}>
            {/* partículas que forman la M */}
            {Array.from({ length: 150 }, (_, i) => {
              const onFrame = i % 3 === 0;
              const t = random(`t${i}`);
              let tx: number;
              let ty: number;
              if (onFrame) {
                const side = Math.floor(t * 4);
                const k = (t * 4) % 1;
                [tx, ty] = [
                  [3 + k * 58, 3],
                  [61, 3 + k * 58],
                  [61 - k * 58, 61],
                  [3, 61 - k * 58],
                ][side];
              } else [tx, ty] = pointOnM(t);
              const s = spring({ frame: f - random(`d${i}`) * 14, fps: 30, config: { damping: 16, stiffness: 60 } });
              const ang = random(`a${i}`) * Math.PI * 2;
              const r = (500 + random(`r${i}`) * 500) * u;
              const x = (tx / 64) * size + Math.cos(ang) * r * (1 - s);
              const y = (ty / 64) * size + Math.sin(ang) * r * (1 - s);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x - 5 * u,
                    top: y - 5 * u,
                    width: 10 * u,
                    height: 10 * u,
                    borderRadius: '50%',
                    background: onFrame ? '#7cc0ff' : '#fff',
                    boxShadow: `0 0 ${14 * u}px ${C.blue}`,
                    opacity: (1 - icon) * Math.min(1, s * 2),
                  }}
                />
              );
            })}
            <div
              style={{
                position: 'absolute',
                inset: -size * 0.5,
                borderRadius: '50%',
                border: `${3 * u}px solid ${C.teal}`,
                opacity: (1 - ring) * 0.7 * (ring > 0 ? 1 : 0),
                transform: `scale(${0.4 + ring * 1.2})`,
              }}
            />
            <div style={{ position: 'absolute', inset: 0, opacity: icon, transform: `scale(${0.7 + 0.3 * icon})`, filter: `drop-shadow(0 0 ${60 * u}px rgba(41,151,255,0.6))` }}>
              <LogoIcon size={size} draw={1} fill={1} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 * u, alignItems: vertical ? 'center' : 'flex-start' }}>
            <div
              style={{
                fontFamily: display,
                fontWeight: 800,
                fontSize: 210 * u,
                letterSpacing: '-0.04em',
                lineHeight: 0.9,
                opacity: word,
                transform: `translateX(${(1 - word) * -60 * u}px)`,
              }}
            >
              MyNeg
            </div>
            <Words text="Tu negocio, en orden." at={cue(scene, 1)} size={72 * u} gradFrom={2} align={vertical ? 'center' : 'left'} />
          </div>
        </div>
      </AbsoluteFill>
      <Sfx at={formed} src="ding" volume={0.45} />
    </Frame>
  );
};

// ─────────────────────────────── 5 · Caja ───────────────────────────────
const SCENE_TITLE = ({ eyebrow, title, at, u, vertical, gradFrom }: { eyebrow: string; title: string; at: number; u: number; vertical: boolean; gradFrom: number }) => {
  const pop = usePop();
  const s = pop(at);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 * u, alignItems: vertical ? 'center' : 'flex-start', maxWidth: (vertical ? 960 : 700) * u }}>
      <div style={{ opacity: s }}>
        <Eyebrow u={u}>{eyebrow}</Eyebrow>
      </div>
      <Words text={title} at={at + 3} size={(vertical ? 92 : 96) * u} gradFrom={gradFrom} align={vertical ? 'center' : 'left'} />
    </div>
  );
};

const Split = ({ left, right, u, vertical }: { left: ReactNode; right: ReactNode; u: number; vertical: boolean }) => (
  <AbsoluteFill
    style={{
      flexDirection: vertical ? 'column' : 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: (vertical ? 60 : 90) * u,
      padding: `${(vertical ? 140 : 60) * u}px ${100 * u}px ${(vertical ? 360 : 150) * u}px`,
    }}
  >
    {left}
    {right}
  </AbsoluteFill>
);

const LINES = [
  { q: 3, n: 'Cemento gris 42.5 kg', p: 445 },
  { q: 2, n: 'Varilla 3/8" x 20 pies', p: 210 },
  { q: 1, n: 'Llave de paso 1/2"', p: 385 },
];
const DENOMS = [
  { v: 2000, n: 3 },
  { v: 1000, n: 4 },
  { v: 500, n: 5 },
  { v: 200, n: 6 },
  { v: 100, n: 9 },
];

export const Caja = ({ scene }: P) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const pop = usePop();
  const typed = '3*cemento'.slice(0, Math.max(0, Math.floor((f - 10) / 2.5)));
  const lineAt = [26, 42, 58];
  const total = LINES.reduce((s, l, i) => s + (f >= lineAt[i] ? l.q * l.p : 0), 0);
  const payStart = cue(scene, 1);
  const payIdx = Math.min(2, Math.max(-1, Math.floor((f - payStart) / 24)));
  const receiptAt = cue(scene, 2);
  const receipt = pop(receiptAt, 16, 90);
  const closeAt = cue(scene, 3);
  const toClose = interpolate(f, [closeAt, closeAt + 14], [0, 1], clamp);
  const countEnd = cue(scene, 4) + 40;
  const countedTotal = DENOMS.reduce((s, d, i) => {
    const k = interpolate(f, [closeAt + 14 + i * 12, closeAt + 30 + i * 12], [0, d.n], clamp);
    return s + Math.round(k) * d.v;
  }, 0);
  const expected = DENOMS.reduce((s, d) => s + d.v * d.n, 0);
  const ok = pop(countEnd, 12, 150);
  const W = (vertical ? 900 : 860) * u;

  const pos = (
    <Card u={u} style={{ width: W, position: 'absolute', inset: 0, opacity: 1 - toClose, transform: `translateX(${-toClose * 80}px)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 26 * u, fontWeight: 600 }}>Caja · Turno de María</div>
        <Pill color={C.green} u={u}>
          ● En línea
        </Pill>
      </div>
      <div
        style={{
          marginTop: 24 * u,
          display: 'flex',
          alignItems: 'center',
          gap: 14 * u,
          padding: `${16 * u}px ${20 * u}px`,
          borderRadius: 16 * u,
          background: 'rgba(255,255,255,0.06)',
          fontFamily: mono,
          fontSize: 28 * u,
        }}
      >
        <ScanBarcode size={30 * u} color={C.teal} />
        {typed}
        <span style={{ width: 3, height: 30 * u, background: C.teal, opacity: f % 20 < 10 ? 1 : 0 }} />
      </div>
      <div style={{ marginTop: 20 * u, display: 'flex', flexDirection: 'column', gap: 10 * u, minHeight: 200 * u }}>
        {LINES.map((l, i) => {
          const s = pop(lineAt[i], 14, 200);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 27 * u,
                padding: `${12 * u}px ${16 * u}px`,
                borderRadius: 14 * u,
                background: 'rgba(255,255,255,0.04)',
                opacity: s,
                transform: `translateY(${(1 - s) * -20}px)`,
              }}
            >
              <span>
                <b style={{ color: C.teal }}>{l.q} ×</b> {l.n}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(l.q * l.p)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 22 * u, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: C.text3, fontSize: 26 * u }}>Total · ITBIS incluido</span>
        <span style={{ fontFamily: display, fontWeight: 800, fontSize: 74 * u, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
          RD${money(total)}
        </span>
      </div>
      <div style={{ marginTop: 20 * u, display: 'flex', gap: 12 * u }}>
        {['Efectivo', 'Tarjeta', 'Transferencia'].map((m, i) => (
          <div
            key={m}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: `${18 * u}px 0`,
              borderRadius: 18 * u,
              fontSize: 26 * u,
              fontWeight: 600,
              background: payIdx === i ? `linear-gradient(135deg, #3aa3ff, ${C.blueDeep})` : 'rgba(255,255,255,0.06)',
              transform: `scale(${payIdx === i ? 1.04 : 1})`,
            }}
          >
            {m}
          </div>
        ))}
      </div>
    </Card>
  );

  const cuadre = (
    <Card u={u} style={{ width: W, position: 'absolute', inset: 0, opacity: toClose, transform: `translateX(${(1 - toClose) * 80}px)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 26 * u, fontWeight: 600 }}>Cierre de caja · conteo</div>
        <Pill color={C.teal} u={u}>
          Billete por billete
        </Pill>
      </div>
      <div style={{ marginTop: 24 * u, display: 'flex', flexDirection: 'column', gap: 10 * u }}>
        {DENOMS.map((d, i) => {
          const k = Math.round(interpolate(f, [closeAt + 14 + i * 12, closeAt + 30 + i * 12], [0, d.n], clamp));
          return (
            <div key={d.v} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1.2fr', alignItems: 'center', fontSize: 28 * u, padding: `${8 * u}px ${14 * u}px`, borderRadius: 12 * u, background: 'rgba(255,255,255,0.04)' }}>
              <span style={{ fontWeight: 600 }}>RD${d.v.toLocaleString('en-US')}</span>
              <span style={{ fontFamily: mono, color: C.teal }}>− {k} +</span>
              <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(k * d.v)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 22 * u, display: 'flex', justifyContent: 'space-between', fontSize: 28 * u, color: C.text2 }}>
        <span>Contado</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>RD${money(countedTotal)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28 * u, color: C.text2 }}>
        <span>Esperado</span>
        <span>RD${money(expected)}</span>
      </div>
      <div
        style={{
          marginTop: 22 * u,
          padding: `${20 * u}px`,
          borderRadius: 20 * u,
          background: 'rgba(52,211,153,0.14)',
          color: C.green,
          fontFamily: display,
          fontWeight: 700,
          fontSize: 40 * u,
          display: 'flex',
          alignItems: 'center',
          gap: 16 * u,
          opacity: ok,
          transform: `scale(${0.85 + 0.15 * ok})`,
        }}
      >
        <Check size={44 * u} strokeWidth={3} /> Diferencia RD$0.00 · ¡Cuadrada!
      </div>
    </Card>
  );

  return (
    <Frame scene={scene}>
      <Split
        u={u}
        vertical={vertical}
        left={
          <div style={{ position: 'relative', width: W, height: (vertical ? 760 : 720) * u }}>
            {pos}
            {cuadre}
            {/* recibo que sale de la caja */}
            <div
              style={{
                position: 'absolute',
                right: (vertical ? 40 : -40) * u,
                top: (vertical ? -60 : -80) * u,
                width: 300 * u,
                padding: `${22 * u}px ${20 * u}px`,
                background: '#fbfaf7',
                color: '#111',
                fontFamily: mono,
                fontSize: 17 * u,
                lineHeight: 1.5,
                borderRadius: 6 * u,
                textAlign: 'center',
                boxShadow: '0 30px 60px -20px #000',
                opacity: receipt * (1 - toClose),
                transform: `translateY(${(1 - receipt) * 120 * u}px) rotate(${4 - receipt * 2}deg)`,
              }}
            >
              <b style={{ fontSize: 19 * u }}>FERRETERÍA EL PROGRESO</b>
              <div>Factura de Consumo Electrónica</div>
              <div>e-NCF E320000000123</div>
              <div style={{ borderTop: '1px dashed #999', margin: `${8 * u}px 0` }} />
              <b style={{ fontSize: 22 * u }}>TOTAL RD$2,140.00</b>
              <div style={{ display: 'flex', justifyContent: 'center', margin: `${10 * u}px 0` }}>
                <Qr size={130 * u} />
              </div>
              <div>Código de seguridad A7K2Q9</div>
            </div>
          </div>
        }
        right={
          <div style={{ position: 'relative', width: (vertical ? 960 : 640) * u, height: (vertical ? 200 : 300) * u }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 1 - toClose }}>
              <SCENE_TITLE eyebrow="Caja" title="Cobra en segundos." at={2} u={u} vertical={vertical} gradFrom={2} />
            </div>
            <div style={{ position: 'absolute', inset: 0, opacity: toClose }}>
              <SCENE_TITLE eyebrow="Cuadre" title="Cuadra sin estrés." at={closeAt} u={u} vertical={vertical} gradFrom={2} />
            </div>
          </div>
        }
      />
      {lineAt.map((a) => (
        <Sfx key={a} at={a} src="pop" volume={0.35} />
      ))}
      <Sfx at={receiptAt} src="ding" volume={0.4} />
      <Sfx at={countEnd} src="ding" volume={0.45} />
    </Frame>
  );
};

// ─────────────────────────────── 6 · Sin internet ───────────────────────────────
export const Offline = ({ scene }: P) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const pop = usePop();
  const back = cue(scene, 2);
  const online = f < 14 || f >= back;
  const sales = [
    { id: 1043, n: 'Pintura blanca', a: 1450 },
    { id: 1044, n: 'Tornillos 1/4', a: 320 },
    { id: 1045, n: 'Bombillo LED', a: 275 },
    { id: 1046, n: 'Cinta aislante', a: 180 },
  ];
  const saleAt = (i: number) => cue(scene, 1) - 10 + i * 16;
  const syncedAt = (i: number) => back + 10 + i * 9;
  const W = (vertical ? 900 : 820) * u;
  const all = f >= syncedAt(3) + 6;
  return (
    <Frame scene={scene}>
      <Split
        u={u}
        vertical={vertical}
        left={
          <Card
            u={u}
            style={{
              width: W,
              boxShadow: online
                ? `inset 0 0 0 ${1.5 * u}px rgba(52,211,153,0.4)`
                : `inset 0 0 0 ${2 * u}px rgba(255,176,32,0.6), 0 0 ${120 * u}px -${30 * u}px rgba(255,176,32,0.6)`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Pill color={online ? C.green : C.mango} u={u}>
                {online ? <Wifi size={24 * u} /> : <WifiOff size={24 * u} />}
                {online ? (all ? 'En línea · todo sincronizado' : 'En línea') : 'Sin conexión · vendiendo igual'}
              </Pill>
            </div>
            <div style={{ marginTop: 26 * u, display: 'flex', flexDirection: 'column', gap: 12 * u, minHeight: 380 * u }}>
              {sales.map((s, i) => {
                const k = pop(saleAt(i), 14, 180);
                const synced = f >= syncedAt(i);
                const flash = interpolate(f, [syncedAt(i), syncedAt(i) + 12], [1, 0], clamp) * (synced ? 1 : 0);
                return (
                  <div
                    key={s.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '110px 1fr auto 50px',
                      gap: 14 * u,
                      alignItems: 'center',
                      fontSize: 28 * u,
                      padding: `${16 * u}px ${18 * u}px`,
                      borderRadius: 16 * u,
                      background: synced ? `rgba(52,211,153,${0.06 + flash * 0.25})` : 'rgba(255,176,32,0.09)',
                      opacity: k,
                      transform: `translateY(${(1 - k) * -24}px)`,
                    }}
                  >
                    <span style={{ fontFamily: mono, color: C.text3, fontSize: 22 * u }}>#{s.id}</span>
                    <span>{s.n}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>RD${money(s.a)}</span>
                    <span style={{ textAlign: 'right', color: synced ? C.green : C.mango }}>{synced ? <Check size={30 * u} strokeWidth={3} /> : '⏳'}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14 * u, fontSize: 24 * u, color: all ? C.green : C.mango }}>
              {all ? 'Subidas al servidor, sin duplicarse.' : `${sales.filter((_, i) => f >= saleAt(i) && f < syncedAt(i)).length} ventas guardadas en este equipo`}
            </div>
          </Card>
        }
        right={<SCENE_TITLE eyebrow="Caja sin internet" title="Sin internet. Sin problema." at={4} u={u} vertical={vertical} gradFrom={2} />}
      />
      {sales.map((_, i) => (
        <Sfx key={i} at={saleAt(i)} src="pop" volume={0.3} />
      ))}
      <Sfx at={syncedAt(3)} src="ding" volume={0.35} />
    </Frame>
  );
};

// ─────────────────────────────── 7 · Inventario ───────────────────────────────
export const Inventario = ({ scene }: P) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const pop = usePop();
  const rows = [
    { n: 'Cemento gris 42.5 kg', stock: 4, q: 120, hot: true },
    { n: 'Varilla 3/8"', stock: 18, q: 80 },
    { n: 'Tubo PVC 1/2"', stock: 0, q: 60, hot: true },
    { n: 'Pintura blanca galón', stock: 7, q: 24 },
  ];
  const xmlAt = cue(scene, 2);
  const fly = pop(xmlAt, 15, 70);
  const done = pop(cue(scene, 3) + 18, 12, 160);
  const toBuy = interpolate(f, [xmlAt - 6, xmlAt + 6], [0, 1], clamp);
  const W = (vertical ? 900 : 860) * u;
  return (
    <Frame scene={scene}>
      <Split
        u={u}
        vertical={vertical}
        left={
          <div style={{ position: 'relative', width: W, height: (vertical ? 640 : 600) * u }}>
            <Card u={u} style={{ position: 'absolute', inset: 0, opacity: 1 - toBuy * 0.85, transform: `scale(${1 - toBuy * 0.06})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 28 * u, fontWeight: 600 }}>Pedido sugerido</div>
                <Pill color={C.mango} u={u}>
                  Ferretería Ochoa · 15 días
                </Pill>
              </div>
              <div style={{ marginTop: 26 * u, display: 'flex', flexDirection: 'column', gap: 14 * u }}>
                {rows.map((r, i) => {
                  const s = pop(10 + i * 10, 14, 150);
                  const bar = interpolate(f, [20 + i * 10, 50 + i * 10], [0, r.q / 120], clamp);
                  return (
                    <div key={r.n} style={{ opacity: s, transform: `translateX(${(1 - s) * -40}px)` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 27 * u }}>
                        <span>{r.n}</span>
                        <span>
                          <span style={{ color: r.hot ? C.coral : C.text3, marginRight: 18 * u }}>quedan {r.stock}</span>
                          <b style={{ color: C.teal }}>pedir {Math.round(bar * 120)}</b>
                        </span>
                      </div>
                      <div style={{ marginTop: 8 * u, height: 12 * u, borderRadius: 6 * u, background: 'rgba(255,255,255,0.07)' }}>
                        <div style={{ width: `${bar * 100}%`, height: '100%', borderRadius: 6 * u, background: `linear-gradient(90deg, ${C.blue}, ${C.teal})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 26 * u, display: 'flex', gap: 12 * u }}>
                <Pill color={C.coral} u={u}>
                  1 agotado
                </Pill>
                <Pill color={C.teal} u={u}>
                  RD$84,600 sugerido
                </Pill>
              </div>
            </Card>
            {/* la factura XML del proveedor entra y la compra se arma sola */}
            <Card
              u={u}
              style={{
                position: 'absolute',
                left: 60 * u,
                right: 60 * u,
                top: 120 * u,
                opacity: toBuy,
                transform: `translateY(${(1 - toBuy) * 40}px)`,
                boxShadow: `inset 0 0 0 ${2 * u}px rgba(62,230,210,0.5), 0 40px 100px -30px #000`,
                display: 'flex',
                flexDirection: 'column',
                gap: 22 * u,
              }}
            >
              <div style={{ fontSize: 28 * u, fontWeight: 600 }}>Nueva compra</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22 * u }}>
                <div
                  style={{
                    width: 120 * u,
                    height: 150 * u,
                    borderRadius: 14 * u,
                    background: 'rgba(41,151,255,0.18)',
                    display: 'grid',
                    placeItems: 'center',
                    color: C.blue,
                    transform: `translate(${(1 - fly) * -500 * u}px, ${(1 - fly) * -300 * u}px) rotate(${(1 - fly) * -30}deg)`,
                  }}
                >
                  <FileCode2 size={70 * u} />
                  <span style={{ fontFamily: mono, fontSize: 22 * u, fontWeight: 600 }}>XML</span>
                </div>
                <div style={{ fontSize: 26 * u, color: C.text2, lineHeight: 1.5 }}>
                  RNC 1-01-55555-1 · Ferretería Ochoa
                  <br />
                  e-CF E310000004581
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14 * u,
                  fontSize: 30 * u,
                  fontWeight: 700,
                  color: C.green,
                  opacity: done,
                  transform: `scale(${0.9 + 0.1 * done})`,
                }}
              >
                <Check size={38 * u} strokeWidth={3} /> 18 productos emparejados · costos al día
              </div>
            </Card>
          </div>
        }
        right={<SCENE_TITLE eyebrow="Inventario y compras" title="Se pide solo. Se registra solo." at={4} u={u} vertical={vertical} gradFrom={3} />}
      />
      <Sfx at={xmlAt + 12} src="pop" volume={0.4} />
      <Sfx at={cue(scene, 3) + 18} src="ding" volume={0.4} />
    </Frame>
  );
};

// ─────────────────────────────── 8 · Módulos ───────────────────────────────
export const Modulos = ({ scene }: P) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const pop = usePop();
  const mods = [
    { n: 'Delivery', I: Bike, c: C.mango },
    { n: 'Mesas y cocina', I: UtensilsCrossed, c: C.coral },
    { n: 'Taller', I: Wrench, c: C.blue },
    { n: 'Nómina', I: BadgeDollarSign, c: C.green },
    { n: 'Contabilidad', I: BookOpen, c: C.teal },
    { n: 'Producción', I: Factory, c: '#b38cff' },
  ];
  const onAt = [12, 32, 50, 66, 86, cue(scene, 1) + 8];
  const cols = vertical ? 2 : 3;
  return (
    <Frame scene={scene}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 50 * u, paddingBottom: (vertical ? 340 : 150) * u }}>
        <Words text="Activa solo lo que necesitas." at={cue(scene, 1)} size={(vertical ? 84 : 88) * u} gradFrom={3} />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${(vertical ? 430 : 470) * u}px)`, gap: 22 * u }}>
          {mods.map(({ n, I, c }, i) => {
            const s = pop(i * 4, 14, 140);
            const on = f >= onAt[i];
            const k = pop(onAt[i], 13, 220);
            return (
              <div
                key={n}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22 * u,
                  padding: `${28 * u}px ${28 * u}px`,
                  borderRadius: 28 * u,
                  background: on ? `color-mix(in srgb, ${c} 14%, rgba(14,18,30,0.9))` : 'rgba(14,18,30,0.86)',
                  boxShadow: on ? `inset 0 0 0 ${2 * u}px color-mix(in srgb, ${c} 55%, transparent), 0 0 ${80 * u}px -${20 * u}px ${c}` : `inset 0 0 0 ${1.5 * u}px rgba(255,255,255,0.1)`,
                  opacity: s,
                  transform: `translateY(${(1 - s) * 40}px) scale(${1 + (on ? 0.04 * Math.sin(Math.min(1, k) * Math.PI) : 0)})`,
                }}
              >
                <div style={{ width: 84 * u, height: 84 * u, borderRadius: 22 * u, display: 'grid', placeItems: 'center', background: `color-mix(in srgb, ${c} 18%, transparent)`, color: c }}>
                  <I size={46 * u} />
                </div>
                <div style={{ flex: 1, fontSize: 34 * u, fontWeight: 650 }}>{n}</div>
                <div style={{ width: 76 * u, height: 44 * u, borderRadius: 22 * u, background: on ? C.green : 'rgba(255,255,255,0.15)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 4 * u, left: (4 + (on ? 32 * Math.min(1, k) : 0)) * u, width: 36 * u, height: 36 * u, borderRadius: '50%', background: '#fff' }} />
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {onAt.map((a) => (
        <Sfx key={a} at={a} src="pop" volume={0.35} />
      ))}
    </Frame>
  );
};

// ─────────────────────────────── 9 · Roles ───────────────────────────────
const Phone = ({ children, u, label, color }: { children: ReactNode; u: number; label: string; color: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 * u }}>
    <Pill color={color} u={u} style={{ fontSize: 28 * u }}>
      {label}
    </Pill>
    <div
      style={{
        width: 400 * u,
        height: 760 * u,
        borderRadius: 64 * u,
        padding: 16 * u,
        background: 'linear-gradient(160deg, #2a2f3b, #12151d)',
        boxShadow: `0 50px 100px -40px #000, inset 0 0 0 ${2 * u}px rgba(255,255,255,0.12)`,
      }}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: 50 * u, background: '#0b0f19', overflow: 'hidden', padding: `${50 * u}px ${24 * u}px ${24 * u}px`, display: 'flex', flexDirection: 'column', gap: 16 * u, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 14 * u, left: '50%', marginLeft: -60 * u, width: 120 * u, height: 32 * u, borderRadius: 16 * u, background: '#000' }} />
        {children}
      </div>
    </div>
  </div>
);

const Row = ({ k, v, u, color = C.text }: { k: string; v: ReactNode; u: number; color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${14 * u}px ${16 * u}px`, borderRadius: 16 * u, background: 'rgba(255,255,255,0.05)', fontSize: 22 * u }}>
    <span style={{ color: C.text2 }}>{k}</span>
    <span style={{ color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 * u }}>{v}</span>
  </div>
);

export const Roles = ({ scene }: P) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const pop = usePop();
  const cashier = pop(cue(scene, 1) - 20, 14, 110);
  const lockAt = cue(scene, 2);
  const lockShake = f > lockAt ? Math.sin((f - lockAt) * 1.6) * 6 * Math.exp(-(f - lockAt) / 10) : 0;
  const owner = pop(cue(scene, 3) - 8, 14, 110);
  const bars = [0.4, 0.55, 0.5, 0.7, 0.65, 0.85, 1];
  const pu = u * (vertical ? 0.95 : 0.74);
  return (
    <Frame scene={scene}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 40 * u, paddingBottom: (vertical ? 330 : 140) * u }}>
        <Words text="Cada quien ve lo suyo." at={4} size={(vertical ? 86 : 80) * u} gradFrom={3} />
        <div style={{ display: 'flex', gap: (vertical ? 40 : 120) * u }}>
          <div style={{ opacity: cashier, transform: `translateY(${(1 - cashier) * 100}px) rotate(${(1 - cashier) * -8}deg)` }}>
            <Phone u={pu} label="Cajera" color={C.blue}>
              <div style={{ fontSize: 26 * pu, fontWeight: 700 }}>Caja</div>
              <Row u={pu} k="Cemento gris" v="RD$445.00" />
              <Row u={pu} k="Precio" v="RD$445.00" />
              <Row
                u={u}
                k="Costo"
                color={C.coral}
                v={
                  <>
                    <Lock size={22 * pu} style={{ transform: `rotate(${lockShake}deg)` }} /> Oculto
                  </>
                }
              />
              <Row
                u={u}
                k="Descuento"
                color={C.mango}
                v={
                  <>
                    <Lock size={22 * pu} /> Pide PIN
                  </>
                }
              />
              <div style={{ marginTop: 'auto', padding: `${20 * pu}px`, borderRadius: 20 * pu, textAlign: 'center', fontWeight: 700, fontSize: 26 * pu, background: `linear-gradient(135deg, #3aa3ff, ${C.blueDeep})` }}>Cobrar RD$445.00</div>
            </Phone>
          </div>
          <div style={{ opacity: owner, transform: `translateY(${(1 - owner) * 100}px) rotate(${(1 - owner) * 8}deg)` }}>
            <Phone u={pu} label="Dueño" color={C.mango}>
              <div style={{ fontSize: 26 * pu, fontWeight: 700 }}>Inicio · 3 sucursales</div>
              <div style={{ padding: 18 * pu, borderRadius: 18 * pu, background: 'rgba(41,151,255,0.12)' }}>
                <div style={{ fontSize: 20 * pu, color: C.text2 }}>Ventas de hoy</div>
                <div style={{ fontFamily: display, fontSize: 52 * pu, fontWeight: 800 }}>RD${Math.round(interpolate(f, [cue(scene, 3), cue(scene, 3) + 40], [0, 48320], clamp)).toLocaleString('en-US')}</div>
              </div>
              <Row u={pu} k="Ganancia" v="RD$12,940" color={C.green} />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 * pu, height: 150 * pu, padding: `0 ${8 * pu}px` }}>
                {bars.map((b, i) => (
                  <div key={i} style={{ flex: 1, height: `${b * 100 * interpolate(f, [cue(scene, 3) + i * 3, cue(scene, 3) + 20 + i * 3], [0, 1], clamp)}%`, borderRadius: 8 * pu, background: `linear-gradient(${C.teal}, ${C.blue})` }} />
                ))}
              </div>
              <Row u={pu} k="Caja de María" v="Cuadrada ✓" color={C.green} />
            </Phone>
          </div>
        </div>
      </AbsoluteFill>
      <Sfx at={cue(scene, 1) - 20} src="whoosh" volume={0.3} />
      <Sfx at={lockAt} src="pop" volume={0.45} />
      <Sfx at={cue(scene, 3) - 8} src="whoosh" volume={0.3} />
    </Frame>
  );
};

// ─────────────────────────────── 10 · Fiscal ───────────────────────────────
export const Fiscal = ({ scene }: P) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const pop = usePop();
  const docs = [
    { t: 'IT-1 · ITBIS', d: 'ITBIS a pagar', v: 'RD$38,210.45', at: 10 },
    { t: 'Formato 606', d: 'Compras del mes', v: '142 registros', at: cue(scene, 1) },
    { t: 'Formato 607', d: 'Ventas del mes', v: '1,893 registros', at: cue(scene, 2) + 6 },
  ];
  return (
    <Frame scene={scene}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 60 * u, paddingBottom: (vertical ? 330 : 140) * u }}>
        <Words text="La DGII, tranquila." at={4} size={(vertical ? 96 : 92) * u} gradFrom={1} />
        <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: 34 * u }}>
          {docs.map((d, i) => {
            const s = pop(d.at, 14, 120);
            const stamp = pop(d.at + 14, 10, 260);
            return (
              <div
                key={d.t}
                style={{
                  position: 'relative',
                  width: (vertical ? 760 : 440) * u,
                  padding: 34 * u,
                  borderRadius: 24 * u,
                  background: '#fbfaf7',
                  color: '#151821',
                  opacity: s,
                  transform: `translateY(${(1 - s) * 80}px) rotate(${(i - 1) * (vertical ? 0 : 3)}deg)`,
                  boxShadow: '0 40px 80px -30px #000',
                }}
              >
                <div style={{ fontFamily: mono, fontSize: 22 * u, color: '#5b6375' }}>{d.t}</div>
                <div style={{ marginTop: 10 * u, fontSize: 26 * u, color: '#5b6375' }}>{d.d}</div>
                <div style={{ fontFamily: display, fontWeight: 800, fontSize: 52 * u, letterSpacing: '-0.02em' }}>{d.v}</div>
                {Array.from({ length: vertical ? 1 : 4 }, (_, k) => (
                  <div key={k} style={{ marginTop: 14 * u, height: 12 * u, width: `${90 - k * 15}%`, borderRadius: 6, background: '#e3e5ea' }} />
                ))}
                <div
                  style={{
                    position: 'absolute',
                    right: 24 * u,
                    bottom: 24 * u,
                    padding: `${10 * u}px ${18 * u}px`,
                    border: `${4 * u}px solid ${C.green}`,
                    borderRadius: 14 * u,
                    color: '#16a36b',
                    fontFamily: display,
                    fontWeight: 800,
                    fontSize: 34 * u,
                    opacity: stamp,
                    transform: `rotate(-12deg) scale(${2.2 - 1.2 * stamp})`,
                  }}
                >
                  LISTO ✓
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {docs.map((d) => (
        <Sfx key={d.t} at={d.at + 14} src="pop" volume={0.5} />
      ))}
    </Frame>
  );
};

// ─────────────────────────────── 11 · Llamado a la acción ───────────────────────────────
export const Cta = ({ scene, props }: P) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const pop = usePop();
  const logo = pop(2, 12, 110);
  const chips = ['14 días gratis', 'Usuarios ilimitados', 'Funciona sin internet'];
  const btn = pop(cue(scene, 2), 12, 140);
  const pulse = 1 + 0.03 * Math.sin(f / 5) * (f > cue(scene, 2) + 15 ? 1 : 0);
  const urlS = pop(cue(scene, 3), 14, 120);
  const hoy = pop(cue(scene, 4), 10, 200);
  return (
    <Frame scene={scene}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', gap: 40 * u, paddingBottom: (vertical ? 300 : 120) * u }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34 * u, opacity: logo, transform: `scale(${0.8 + 0.2 * logo})` }}>
          <div style={{ filter: `drop-shadow(0 0 ${50 * u}px rgba(41,151,255,0.6))` }}>
            <LogoIcon size={170 * u} />
          </div>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 170 * u, letterSpacing: '-0.04em' }}>MyNeg</div>
        </div>
        <div style={{ display: 'flex', gap: 16 * u, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1000 * u }}>
          {chips.map((c, i) => {
            const s = pop(cue(scene, 1) + i * 8, 14, 160);
            return (
              <Pill key={c} color={i === 0 ? C.mango : C.teal} u={u} style={{ fontSize: 32 * u, padding: `${12 * u}px ${26 * u}px`, opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
                <Check size={30 * u} strokeWidth={3} /> {c}
              </Pill>
            );
          })}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18 * u,
            padding: `${28 * u}px ${54 * u}px`,
            borderRadius: 999,
            background: 'linear-gradient(135deg, #2bd46b, #128c4a)',
            fontSize: 44 * u,
            fontWeight: 700,
            boxShadow: `0 ${20 * u}px ${80 * u}px -${20 * u}px rgba(37,211,102,0.8)`,
            opacity: btn,
            transform: `scale(${(0.8 + 0.2 * btn) * pulse})`,
          }}
        >
          <MessageCircle size={50 * u} /> {props.whatsapp}
        </div>
        <div style={{ fontFamily: mono, fontSize: 34 * u, color: C.text2, opacity: urlS, transform: `translateY(${(1 - urlS) * 20}px)` }}>{props.url}</div>
        <div
          style={{
            fontFamily: display,
            fontWeight: 800,
            fontSize: 120 * u,
            backgroundImage: grad,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            opacity: hoy,
            transform: `scale(${1.6 - 0.6 * hoy})`,
            letterSpacing: '-0.03em',
            height: 130 * u,
          }}
        >
          Hoy.
        </div>
      </AbsoluteFill>
      <Sfx at={cue(scene, 2)} src="pop" volume={0.5} />
      <Sfx at={cue(scene, 4)} src="ding" volume={0.45} />
    </Frame>
  );
};

export { Logo4 as Logo };
