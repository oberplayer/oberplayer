import {
  render,
  createRef,
} from 'preact';

import Player from './components/Player';
import { solidEvents, triggerSolidEvent } from './modules/events';
import { defaultPlayerConfig } from './modules/config';
import i18n, { isValidLocale } from './modules/i18n';
import { log, getCdnBaseUrl, secondsToHumanreadableDuration } from './modules/lib';
import './scss/oberplayer.scss';



const oberplayerInstances = {};

class Oberplayer {
  constructor(options) {
    Object.defineProperty(this, 'eventsList', {
      value: solidEvents,
      enumerable: true,
    });
    /* vast plugin */
    Object.defineProperty(this, 'ads', {
      value: {
        inAdBreak: () => this.instanceRef.current.state.isAdPlayer,
        startLinearAdMode: () => {
          this.trigger('adstart');
          // restore position only for no postroll (cad not end of the video)
          if (this.api.getPosition() < this.api.getDuration()) {
            this.restorePositionAfterAd = this.api.getPosition();
          } else {
            this.restorePositionAfterAd = false;
          }
          this.instanceRef.current.setState({ isAdPlayer: true, isLive: false, autoplay: true });
        },
        endLinearAdMode: async () => {
          // return to the normal video
          if (this.restorePositionAfterAd !== false) {
            this.instanceRef.current.setState({ isAdPlayer: false, autoplay: true, restorePositionAfterAd: this.restorePositionAfterAd });
          } else {
            // after a postroll display teaser
            this.instanceRef.current.setState({ isAdPlayer: false, autoplay: false, isWaitingForClick: true, isPlaying: false });
          }
          // reload the main video
          try {
            this.instanceRef.current.setState({ isBuffering: true });
            await this.instanceRef.current.videoProvider.load(this.instanceRef.current.props.videoUrl);
          } catch (error) {
            log('error', error);
          }
        },
      },
      enumerable: false,
    });
    Object.defineProperty(this, 'domElement', {
      value: options.domElement,
      enumerable: false,
    });
    Object.defineProperty(this, 'instanceRef', {
      value: createRef(),
      enumerable: false,
    });
    Object.defineProperty(this, 'eventDomElement', {
      value: document.createElement('div'),
      enumerable: false,
    });
    Object.defineProperty(this, 'on', {
      value: this.on,
      enumerable: false,
    });
    Object.defineProperty(this, 'off', {
      value: this.off,
      enumerable: false,
    });
    Object.defineProperty(this, 'load', {
      value: this.load,
      enumerable: true,
    });
    Object.defineProperty(this, 'destroy', {
      value: this.destroy,
      enumerable: true,
    });
    Object.defineProperty(this, 'getConfiguration', {
      value: this.getConfiguration,
      enumerable: true,
    });
    this.playlistIndex = 0;
    
  }

  async setup(options) {
    let dataOptions = {};
    try {
      if (this.domElement.getAttribute('data-oberplayeroptions')) dataOptions = JSON.parse(this.domElement.getAttribute('data-oberplayeroptions'));
    } catch (error) {
      console.error(error);
    }
    // merge data-oberplayeroptions options with args options
    const mergedOptions = Object.assign(dataOptions, options);
    this.options = mergedOptions;
    globalThis.bpdebug = mergedOptions.debug;

    if (mergedOptions && mergedOptions.lang && isValidLocale(mergedOptions.lang)) this.lang = mergedOptions.lang;
    else this.lang = defaultPlayerConfig.lang;

    // load locales data
    i18n.handleLocales(this.lang, mergedOptions.phrases);

    if (mergedOptions && mergedOptions.token) this.token = mergedOptions.token;
    if (mergedOptions && mergedOptions.color) this.color = mergedOptions.color;

    // means a player has been already render in this this.domElement, should be destroyed first
    if (this.domElement.querySelector('.l-clickcatcher')) {
      log('error', 'this DOM element contains already a player, please destroy before setup again');
      return false;
    }

    

    this.goNextVideo = async () => {
      this.playlistIndex += 1;
      await this.load(
        mergedOptions.playlist[this.playlistIndex],
        mergedOptions.playlist[this.playlistIndex - 1]
          ? () => {
            triggerSolidEvent(this.eventDomElement, solidEvents.PREVIOUS, { comingFromClick: true });
          }
          : null,
        mergedOptions.playlist[this.playlistIndex + 1]
          ? () => {
            triggerSolidEvent(this.eventDomElement, solidEvents.NEXT, { comingFromClick: true });
          }
          : null,
      );
    };

    this.goPreviousVideo = async () => {
      this.playlistIndex -= 1;
      await this.load(
        mergedOptions.playlist[this.playlistIndex],
        mergedOptions.playlist[this.playlistIndex - 1]
          ? () => {
            triggerSolidEvent(this.eventDomElement, solidEvents.PREVIOUS, { comingFromClick: true });
          }
          : null,
        mergedOptions.playlist[this.playlistIndex + 1]
          ? () => {
            triggerSolidEvent(this.eventDomElement, solidEvents.NEXT, { comingFromClick: true });
          }
          : null,
      );
    };

    this.on(solidEvents.NEXT, (evt) => {
      if (mergedOptions && mergedOptions.playlist && mergedOptions.playlist[this.playlistIndex + 1]) {
        // end of a video without postroll or user has clicked on next button
        if (!this.hasAPostroll || (evt.detail && evt.detail.comingFromClick)) {
          this.goNextVideo();
        } else {
          // wait for postroll to be finished to load the next video
          this.one('adended', () => {
            this.goNextVideo();
          });
        }
      }
    });

    this.on(solidEvents.PREVIOUS, () => {
      if (mergedOptions && mergedOptions.playlist && mergedOptions.playlist[this.playlistIndex - 1]) {
        this.goPreviousVideo();
      }
    });

    // load basic style
    Oberplayer.handleStyle();

    triggerSolidEvent(this.eventDomElement, solidEvents.SETUP);
    this.isSetup = true;

    

    if (mergedOptions && mergedOptions.playlist) {
      await this.load(
        mergedOptions.playlist[this.playlistIndex],
        mergedOptions.playlist[this.playlistIndex - 1]
          ? () => {
            triggerSolidEvent(this.eventDomElement, solidEvents.PREVIOUS);
          }
          : null,
        mergedOptions.playlist[this.playlistIndex + 1]
          ? () => {
            triggerSolidEvent(this.eventDomElement, solidEvents.NEXT, { comingFromClick: true });
          }
          : null,
      );
    }
    return this;
  }

  static handleStyle() {
    if (!document.getElementById('BpStyle')) {
      // some css instructions have to be set immediately
      // so we do them with css / js
      const style = document.createElement('style');
      style.id = 'BpStyle';
      style.textContent += '.l-player-container {position: relative;color: white;background-color: #000;}';
      style.textContent += '.l-player-container video{width: 100%;height: 100%;position: absolute; left: 0;}';
      style.textContent += '.l-player-container .l-clickcatcher .l-controls, .l-player-container .l-clickcatcher .l-settings, .l-player-container .loader, .l-player-container .complete{display:none}';
      style.textContent += '.l-player-container .message {height: 100%;position: absolute;display: flex;width: 100%;align-items: center;justify-content: center;}';

      document.head.appendChild(style);
    }
  }
  
  on(eventName, callback) {
    this.eventDomElement.addEventListener(eventName, callback);
  }

  one(eventName, callback) {
    const callBackforOff = (evt) => {
      callback(evt);
      this.off(eventName, callBackforOff);
    };
    this.eventDomElement.addEventListener(eventName, callBackforOff);
  }

  off(eventName, callback) {
    this.eventDomElement.removeEventListener(eventName, callback);
  }

  /* vast plugin */
  trigger(eventName, data) {
    triggerSolidEvent(this.eventDomElement, eventName, data);
  }

  currentTime() {
    return this.api.getPosition();
  }

  duration() {
    return this.api.getDuration();
  }

  muted() {
    return this.api.getMute();
  }

  el() {
    // basic case aspect player
    if (this.domElement.querySelector('.l-clickcatcher')) return this.domElement.querySelector('.l-clickcatcher');

    // browser or chromeless
    return this.domElement.querySelector('.l-player-container');
  }

  async loadAdVideo(videoUrl) {
    this.instanceRef.current.setState({ isBuffering: true });
    await this.instanceRef.current.videoProvider.load(videoUrl);
  }

  destroy() {
    delete oberplayerInstances[this.domElement.bpId];
    this.playlistIndex = 0;
    render(null, this.domElement);
  }

  getConfiguration() {
    return this.options;
  }

  async load(playlistItem, onClickPrevious, onClickNext) {
    // destroy vast plugin
    if (this.vastPlugin) {
      this.vastPlugin.onUnload();
    }

    // load has been probably been called without setup() before
    if (!this.isSetup) {
      // error text is hardcoded has i18n module is not instantiated at this step
      return Promise.reject(new Error('Player has not been setup'));
    }
    this.restorePositionAfterAd = false;

    triggerSolidEvent(this.eventDomElement, solidEvents.LOAD, { playlistItem });

    // extract data from playlist item
    const {
      videoUrl, videoProviderOptions, metadata, geolocation, rights, restrictions, vast, autoplay, muted, volume, aspect, drm, goToButtons, thumbnailsVttUrl, chaptersVttUrl, aspectRatio,
    } = playlistItem;

    

    render(
      <Player
        // free
        videoUrl={videoUrl}
        videoProviderOptions={videoProviderOptions}
        autoplay={autoplay !== undefined ? autoplay : defaultPlayerConfig.autoplay}
        muted={muted}
        volume={volume !== undefined ? volume : defaultPlayerConfig.volume}
        aspect={aspect || defaultPlayerConfig.aspect}
        lang={this.lang}
        aspectRatio={aspectRatio || defaultPlayerConfig.aspectRatio}
        // premium
        drm={drm}
        metadata={metadata}
        geolocation={geolocation}
        rights={rights}
        restrictions={restrictions}
        goToButtons={goToButtons}
        thumbnailsVttUrl={thumbnailsVttUrl}
        chaptersVttUrl={chaptersVttUrl}
        // internal technical props
        eventDomElement={this.eventDomElement}
        ref={this.instanceRef}
        isTouchDevice={'ontouchstart' in document.documentElement}
        onClickPrevious={onClickPrevious}
        onClickNext={onClickNext}
        
        color={this.color}
      />,
      this.domElement,
    );

    // api has to be refresh at each load
    Object.defineProperty(this, 'api', {
      value: this.instanceRef.current.api,
      enumerable: true,
      configurable: true,
    });
    return this;
  }
}

const oberplayer = (domElement) => {
  // case func is called without params, let's return the first instance if there is one
  if (!domElement) {
    if (Object.values(oberplayerInstances)[0]) return Object.values(oberplayerInstances)[0];
    return new Error('no player to return sorry');
  }
  // case this is the first the func is called with this this.domElement, so this is a creation, let's add the bpId
  if (!domElement.bpId) {
    const getRndInteger = (min, max) => Math.floor(Math.random() * (max - min)) + min;
    domElement.bpId = getRndInteger(1000, 9999999999);
  }
  // if there is no instance related to this DOM element than create it
  if (!oberplayerInstances[domElement.bpId]) {
    oberplayerInstances[domElement.bpId] = new Oberplayer({
      domElement,
    });
  }
  // At the end we can securely return the instance
  return oberplayerInstances[domElement.bpId];
};

export default oberplayer;
// used in E2E and Features
export { solidEvents };
// used in E2E
export { defaultPlayerConfig, secondsToHumanreadableDuration };
// used in docusaurus
export { getCdnBaseUrl };
globalThis.oberplayer = oberplayer;
