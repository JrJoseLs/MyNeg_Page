import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
// Usa el Chrome instalado en la máquina en vez de descargar uno
Config.setBrowserExecutable('C:/Program Files/Google/Chrome/Application/chrome.exe');
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(6);
