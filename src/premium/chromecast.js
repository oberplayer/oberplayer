import { log } from '../modules/lib';
import mapApi from '../modules/api';
import { solidEvents, triggerSolidEvent } from '../modules/events';
import Castjs from './vendor/castjs';

class Cast {
  constructor(oberplayer, receiver) {
    window.__onGCastApiAvailable = (available) => {
      if (globalThis.bpdebug) log('info', 'Chromecast available');

      this.cjs = new Castjs({
        receiver,
      });

      // chromecast lib is loaded
      triggerSolidEvent(oberplayer.eventDomElement, solidEvents.CAST, {
        available,
        active: false,
      });

      const switchPlayerToRemoteMode = () => {
        // hide the video tag
        const videoTag = oberplayer.domElement.querySelector('video');
        videoTag.style.display = 'none';
        oberplayer.instanceRef.current.displayMessage(
          null,
          `Now chromecasting on ${this.cjs.device}`,
          true,
        );
        // remove teaser style and show controls
        oberplayer.instanceRef.current.setState({ isWaitingForClick: false, isControlsVisible: true });
        // map player API to cast
        this.map(oberplayer);
      };

      const syncFromPlayerToChromeCast = () => {
        // pause the player
        oberplayer.api.pause();

        switchPlayerToRemoteMode();

        // cast the video
        this.cjs.time = 0; // needed to reset the cast time
        this.cjs.cast(oberplayer.playlistItem.videoUrl);
      };

      const syncFromChromeCastToPlayer = () => {
        // display cast duration on player
        triggerSolidEvent(oberplayer.eventDomElement, solidEvents.METADATA, { duration: this.cjs.duration });
        // display cast position on player
        triggerSolidEvent(oberplayer.eventDomElement, solidEvents.TIME, { currentTime: this.cjs.time });
        switchPlayerToRemoteMode();
      };

      const onLoad = () => {
        this.positionWhileChromeCasting = 0;
        // to allow cast to seek to player position
        this.chromeCastHasBeenSyncedOnPlay = false;
        // pause the cast
        this.cjs.pause();
        // remap to player api
        mapApi(oberplayer.instanceRef.current);
      };

      this.cjs.on('disconnect', () => {
        log('info', 'Chromecast is disconnected');
        triggerSolidEvent(oberplayer.eventDomElement, solidEvents.CAST, {
          active: false,
        });

        oberplayer.eventDomElement.removeEventListener(solidEvents.FIRSTPLAY, syncFromPlayerToChromeCast);
        oberplayer.eventDomElement.removeEventListener(solidEvents.LOAD, onLoad);

        this.chromeCastHasBeenSyncedOnPlay = false;

        // reset src (CJS BUG CLEARLY)
        this.cjs.src = null;

        // remap to player api
        mapApi(oberplayer.instanceRef.current);
        const videoTag = oberplayer.domElement.querySelector('video');
        videoTag.style.display = 'block';
        // remove message
        oberplayer.instanceRef.current.setState({ isMessage: false, message: undefined });
        // play the video
        oberplayer.api.play();
        // now seek to same position
        if (this.positionWhileChromeCasting) {
          oberplayer.api.seek(this.positionWhileChromeCasting);
        }
      });

      this.cjs.on('connect', () => {
        log('info', 'Chromecast is connected');
        triggerSolidEvent(oberplayer.eventDomElement, solidEvents.CAST, {
          available: true,
          active: true,
        });

        // is there already a loaded video on chromecast device
        if (this.cjs.src) {
          syncFromChromeCastToPlayer();
        } else {
          // retrieve player parameter
          this.positionBeforeChromeCasting = oberplayer.api.getPosition();
          this.volumeBeforeChromeCasting = oberplayer.api.getVolume();
          this.muteBeforeChromeCasting = oberplayer.api.getMute();
          syncFromPlayerToChromeCast();
        }
        oberplayer.eventDomElement.addEventListener(solidEvents.LOAD, onLoad);
        oberplayer.eventDomElement.addEventListener(solidEvents.FIRSTPLAY, syncFromPlayerToChromeCast);
      });
    };
  }

  map(oberplayer) {
    this.cjs.on('playing', () => {
      oberplayer.api.getState = () => 'playing';
      triggerSolidEvent(oberplayer.eventDomElement, solidEvents.PLAY);
      // needed to display the duration on player
      triggerSolidEvent(oberplayer.eventDomElement, solidEvents.METADATA, { duration: this.cjs.duration });
      // needed to allow cast to seek to player position
      if (!this.chromeCastHasBeenSyncedOnPlay) {
        this.cjs.seek(this.positionBeforeChromeCasting);
        this.cjs.volume(this.volumeBeforeChromeCasting);
        this.cjs.mute(this.muteBeforeChromeCasting);
      }
      this.chromeCastHasBeenSyncedOnPlay = true;
    });
    this.cjs.on('pause', () => { oberplayer.api.getState = () => 'paused'; triggerSolidEvent(oberplayer.eventDomElement, solidEvents.PAUSE); }); // Media is paused
    this.cjs.on('timeupdate', () => {
      if (this.cjs.time === 0) {
        return;
      }
      this.positionWhileChromeCasting = this.cjs.time;
      triggerSolidEvent(oberplayer.eventDomElement, solidEvents.TIME, { currentTime: this.cjs.time });
    }); // Current time changed
    this.cjs.on('mute', () => { triggerSolidEvent(oberplayer.eventDomElement, solidEvents.MUTE, { muted: true }); }); // Media is paused
    this.cjs.on('unmute', () => { triggerSolidEvent(oberplayer.eventDomElement, solidEvents.MUTE, { muted: false }); }); // Media is paused
    this.cjs.on('end', () => { triggerSolidEvent(oberplayer.eventDomElement, solidEvents.COMPLETE); }); // Media is paused
    this.cjs.on('buffering', () => { oberplayer.api.getState = () => 'buffering'; triggerSolidEvent(oberplayer.eventDomElement, solidEvents.BUFFERING); }); // Media is paused
    this.cjs.on('error', (evt) => {
      log('error', 'Chromecast error', evt);
      triggerSolidEvent(oberplayer.eventDomElement, solidEvents.CAST, {
        active: false,
      });
    });
    oberplayer.api.play = () => { this.cjs.play(); return Promise.resolve(); };
    oberplayer.api.pause = () => { this.cjs.pause(); };
    oberplayer.api.setMute = (value) => { if (value === true) this.cjs.mute(); else this.cjs.unmute(); };
    oberplayer.api.setVolume = (value) => this.cjs.volume(value);
    oberplayer.api.seek = (value) => {
      this.cjs.seek(value);
    };
    oberplayer.api.toggleMute = () => { if (this.cjs.muted) this.cjs.unmute(); else this.cjs.mute(); };
    oberplayer.api.setTextTrack = (language, roles) => {
      const session = globalThis.cast.framework.CastContext.getInstance().getCurrentSession();
      const { tracks } = session.getMediaSession().media;
      const activeTrackIds = [];
      if (language) {
        activeTrackIds.push(
          tracks.filter(
            (track) => track.language === language && track.roles[roles.length - 1] === roles[roles.length - 1] && track.type === 'TEXT',
          )[0].trackId || undefined,
        );
      }
      const tracksInfoRequest = new chrome.cast.media.EditTracksInfoRequest(activeTrackIds);
      const media = session.getMediaSession();
      media.editTracksInfo(tracksInfoRequest);
    };
    oberplayer.api.setForcedTextTrack = () => {
      const session = globalThis.cast.framework.CastContext.getInstance().getCurrentSession();
      const tracksInfoRequest = new chrome.cast.media.EditTracksInfoRequest([]);
      const media = session.getMediaSession();
      media.editTracksInfo(tracksInfoRequest);
    };
    oberplayer.api.setAudioTrack = (language, role) => {
      const session = globalThis.cast.framework.CastContext.getInstance().getCurrentSession();
      const { tracks } = session.getMediaSession().media;
      const activeTrackIds = [];
      if (language) {
        activeTrackIds.push(
          tracks.filter(
            (track) => track.language === language && track.role === role && track.type === 'AUDIO',
          )[0].trackId || undefined,
        );
      }
      const tracksInfoRequest = new chrome.cast.media.EditTracksInfoRequest(activeTrackIds);
      const media = session.getMediaSession();
      media.editTracksInfo(tracksInfoRequest);
    };
  }
}
window.Cast = Cast;
export default Cast;
