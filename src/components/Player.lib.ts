import { log } from '../modules/lib';
import i18n from '../modules/i18n';
import { version } from '../../package.json';
import { PlayerOptions, PlaylistEntry } from '@oberplayer-free/oberplayer';

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

// now get className based on state
const variableToString = (varObj: object): string => Object.keys(varObj)[0];

const stateToClassName = (state: boolean | undefined, name: string): string => (state ? `is--${name.substr(2)}` : '');

export const getClassList = (state: PlayerState, props: PlayerProps): string[] => {
  const {
    isAdPlayer,
    isStylesheetLoaded,
    isSmall,
    isWaitingForClick,
    isReady,
    isPaused,
    isFullScreen,
    isPlaying,
    isSeeking,
    isBuffering,
    isComplete,
    isLive,
    isChromecasting,
    isMessage,
    isMessageUnderClickCatcher,
    isControlsVisible,
    isDragging,
  } = state;

  const { isTouchDevice, aspect } = props;

  const isChromeless = aspect !== 'player';

  const classList: string[] = [];
  classList.push(
    stateToClassName(isChromeless, variableToString({ isChromeless }).toLowerCase()),
    stateToClassName(isAdPlayer, variableToString({ isAdPlayer }).toLowerCase()),
    stateToClassName(isTouchDevice, variableToString({ isTouchDevice }).toLowerCase()),
    stateToClassName(isStylesheetLoaded, variableToString({ isStylesheetLoaded }).toLowerCase()),
    stateToClassName(isSmall, variableToString({ isSmall }).toLowerCase()),
    stateToClassName(isWaitingForClick, variableToString({ isWaitingForClick }).toLowerCase()),
    stateToClassName(isReady, variableToString({ isReady }).toLowerCase()),
    stateToClassName(isPaused, variableToString({ isPaused }).toLowerCase()),
    stateToClassName(isFullScreen, variableToString({ isFullScreen }).toLowerCase()),
    stateToClassName(isPlaying, variableToString({ isPlaying }).toLowerCase()),
    stateToClassName(isSeeking, variableToString({ isSeeking }).toLowerCase()),
    stateToClassName(isBuffering, variableToString({ isBuffering }).toLowerCase()),
    stateToClassName(isComplete, variableToString({ isComplete }).toLowerCase()),
    stateToClassName(isLive, variableToString({ isLive }).toLowerCase()),
    stateToClassName(isControlsVisible, variableToString({ isControlsVisible }).toLowerCase()),
    stateToClassName(isDragging, variableToString({ isDragging }).toLowerCase()),
    stateToClassName(isChromecasting, variableToString({ isChromecasting }).toLowerCase()),
    stateToClassName(isMessage, variableToString({ isMessage }).toLowerCase()),
    stateToClassName(isMessageUnderClickCatcher, variableToString({ isMessageUnderClickCatcher }).toLowerCase()),
    version.replaceAll('.', '_'),
  );
  return classList;
};
