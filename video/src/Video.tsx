import { AbsoluteFill, Html5Audio, Sequence, interpolate, random, staticFile, useCurrentFrame } from 'remotion';
import timeline from './timeline.json';
import { C, body, grad, useLayout } from './theme';
import * as S from './scenes';

export type VideoProps = { url: string; whatsapp: string };
export type Scene = (typeof timeline.scenes)[number];

const SCENES: Record<string, (p: { scene: Scene; props: VideoProps }) => React.ReactNode> = {
  hook: S.Hook,
  dolor: S.Dolor,
  urgencia: S.Urgencia,
  logo: S.Logo,
  caja: S.Caja,
  offline: S.Offline,
  inventario: S.Inventario,
  modulos: S.Modulos,
  roles: S.Roles,
  fiscal: S.Fiscal,
  cta: S.Cta,
};

const LOGO_AT = timeline.scenes.find((s) => s.id === 'logo')!.from;

const voiceAt = (f: number) =>
  timeline.scenes.some((s) => f >= s.from + s.voiceFrom - 4 && f <= s.from + s.voiceFrom + s.voiceFrames + 4);

/** Fondo: manchas de luz que se mueven despacio, polvo de estrellas y una rejilla tenue. */
const Background = () => {
  const f = useCurrentFrame();
  const { width, height } = useLayout();
  const dark = interpolate(f, [0, LOGO_AT - 2, LOGO_AT + 28], [1, 1, 0], { extrapolateRight: 'clamp' }); // parte del problema, más oscura
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          width: width * 0.9,
          height: width * 0.9,
          left: width * 0.55 + Math.sin(f / 90) * 120 - width * 0.45,
          top: -height * 0.35 + Math.cos(f / 110) * 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(41,151,255,${0.22 - dark * 0.12}), transparent 62%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: width * 0.8,
          height: width * 0.8,
          left: -width * 0.3 + Math.cos(f / 120) * 100,
          top: height * 0.45 + Math.sin(f / 100) * 90,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(62,230,210,${0.14 - dark * 0.08}), transparent 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, rgba(255,90,95,${dark * 0.07}), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 75%)',
        }}
      />
      {Array.from({ length: 70 }, (_, i) => {
        const x = random(`x${i}`) * width;
        const y = (random(`y${i}`) * height - f * (0.2 + random(`s${i}`) * 0.6)) % height;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y < 0 ? y + height : y,
              width: 2 + random(`r${i}`) * 2.5,
              height: 2 + random(`r${i}`) * 2.5,
              borderRadius: '50%',
              background: i % 3 ? '#8fb8ff' : C.teal,
              opacity: 0.25 + 0.35 * Math.abs(Math.sin(f / 30 + i)),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Captions = ({ scene }: { scene: Scene }) => {
  const f = useCurrentFrame();
  const { u, vertical } = useLayout();
  const cue = scene.captions.find((c) => f >= c.from && f < c.to + 8);
  if (!cue) return null;
  const inO = interpolate(f, [cue.from, cue.from + 5], [0, 1], { extrapolateRight: 'clamp' });
  const outO = interpolate(f, [cue.to + 2, cue.to + 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: (vertical ? 300 : 70) * u }}>
      <div
        style={{
          opacity: Math.min(inO, outO),
          transform: `translateY(${(1 - inO) * 10}px)`,
          fontFamily: body,
          fontWeight: 600,
          fontSize: (vertical ? 46 : 40) * u,
          lineHeight: 1.25,
          color: '#fff',
          padding: `${14 * u}px ${28 * u}px`,
          borderRadius: 18 * u,
          background: 'rgba(5,7,13,0.72)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
          maxWidth: vertical ? '86%' : '70%',
          textAlign: 'center',
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  );
};

const Progress = () => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        height: 6,
        width: `${(f / timeline.frames) * 100}%`,
        background: grad,
      }}
    />
  );
};

export const MyNegVideo = (props: VideoProps) => {
  return (
    <AbsoluteFill style={{ fontFamily: body, color: C.text }}>
      <Background />
      <Html5Audio
        src={staticFile('audio/musica.wav')}
        volume={(f) => {
          const talking = voiceAt(f);
          const end = interpolate(f, [timeline.frames - 45, timeline.frames], [1, 0], { extrapolateLeft: 'clamp' });
          return (talking ? 0.2 : 0.42) * end;
        }}
      />
      {timeline.scenes.map((scene, i) => {
        const Comp = SCENES[scene.id];
        return (
          <Sequence key={scene.id} from={scene.from} durationInFrames={scene.frames} name={scene.id}>
            <Comp scene={scene} props={props} />
            <Sequence from={scene.voiceFrom} name={`voz ${scene.id}`}>
              <Html5Audio src={staticFile(scene.audio)} volume={1} />
            </Sequence>
            {i > 0 && <Html5Audio src={staticFile('audio/whoosh.wav')} volume={0.35} />}
            <Captions scene={scene} />
          </Sequence>
        );
      })}
      <Progress />
    </AbsoluteFill>
  );
};
