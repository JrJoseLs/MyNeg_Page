import { Composition } from 'remotion';
import { MyNegVideo, type VideoProps } from './Video';
import timeline from './timeline.json';

const defaults: VideoProps = {
  // Cambia estos dos valores y vuelve a renderizar
  url: 'jrjosels.github.io/MyNeg_Page',
  whatsapp: 'Escríbenos por WhatsApp',
};

export const Root = () => (
  <>
    <Composition
      id="MyNeg16x9"
      component={MyNegVideo}
      durationInFrames={timeline.frames}
      fps={timeline.fps}
      width={1920}
      height={1080}
      defaultProps={defaults}
    />
    <Composition
      id="MyNeg9x16"
      component={MyNegVideo}
      durationInFrames={timeline.frames}
      fps={timeline.fps}
      width={1080}
      height={1920}
      defaultProps={defaults}
    />
  </>
);
