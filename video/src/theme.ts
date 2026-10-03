import { loadFont as loadDisplay } from '@remotion/google-fonts/BricolageGrotesque';
import { loadFont as loadBody } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { useVideoConfig } from 'remotion';

export const display = loadDisplay('normal', { weights: ['600', '700', '800'], subsets: ['latin'] }).fontFamily;
export const body = loadBody('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }).fontFamily;
export const mono = loadMono('normal', { weights: ['400', '600'], subsets: ['latin'] }).fontFamily;

export const C = {
  bg: '#05070d',
  card: 'rgba(255,255,255,0.05)',
  line: 'rgba(255,255,255,0.12)',
  text: '#f4f6fb',
  text2: 'rgba(226,232,245,0.72)',
  text3: 'rgba(226,232,245,0.45)',
  blue: '#2997ff',
  blueDeep: '#0058b9',
  teal: '#3ee6d2',
  mango: '#ffb020',
  coral: '#ff5a5f',
  green: '#34d399',
};

export const grad = `linear-gradient(100deg, ${C.blue} 0%, ${C.teal} 55%, ${C.mango} 100%)`;

/** Medidas que se adaptan a 16:9 y 9:16. `u` es 1 en 1080 px del lado corto. */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const u = Math.min(width, height) / 1080;
  return { width, height, vertical, u };
};
