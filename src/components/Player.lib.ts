import { log } from '../modules/lib';
import i18n from '../modules/i18n';
import { PlaylistEntry } from '@oberplayer/oberplayer';

const getRenderingPlace = (): string | undefined => {
  let renderingPlace: string | undefined;
  try {
    renderingPlace = window.parent.location.href;
  } catch (err) {
    console.error(err);
    if (document.referrer !== '') {
      renderingPlace = document.referrer;
    }
  }
  return renderingPlace;
};

export const sendPlayHit = (videoUrl: PlaylistEntry["videoUrl"]): void => {
  if (globalThis.bpdebug) log('info', i18n.t('log.send.playhit'));
  if (globalThis.gtag) {
    globalThis.gtag('event', 'video_play', {
      userId: undefined,
      videoUrl,
      renderingPlace: getRenderingPlace(),
    });
  }
};

export const handleCss = (cdnBaseUrl = 'https://cdn.oberplayer.com'): Promise<string> => {
  let cssLoadTimeout: ReturnType<typeof setTimeout>;
  return new Promise((resolve, reject) => {
    if (document.getElementById('bp-css')) {
      resolve(i18n.t('log.cssAlreadyLoaded'));
    }
    const styleNode = document.createElement('link');
    styleNode.setAttribute('id', 'bp-css');
    styleNode.setAttribute('rel', 'stylesheet');
    styleNode.setAttribute('type', 'text/css');
    styleNode.setAttribute('href', `${cdnBaseUrl}/oberplayer.css`);
    document.getElementsByTagName('head')[0].appendChild(styleNode);
    styleNode.addEventListener('load', () => {
      clearTimeout(cssLoadTimeout);
      resolve('Css Loaded');
    });
    cssLoadTimeout = setTimeout(() => {
      reject(new Error(`Cannot load stylesheet ${cdnBaseUrl}/oberplayer.css`));
    }, 5000);
  });
};

