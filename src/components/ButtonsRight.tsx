import { useState, useEffect } from 'preact/hooks';
import { solidEvents } from '../modules/events';
import { Settings, FullScreen, FullScreenExit, Airplay, Live, Hd, Hdr, Uhd } from './Icon';
import i18n from '../modules/i18n';

const ButtonsRight = (props: ButtonsRightProps) => {
  const { api, eventDomElement, onClickSettingsIcon, shouldHover, isTouchDevice, isAdPlayer, isLive, entitlements, clickActivatedOnTouchDevice } = props;

  const [isAirPlayAvailable, setIsAirPlayAvailable] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHd, setIsHd] = useState(false);
  const [isUhd, setIsUhd] = useState(false);
  const [isHdr, setIsHdr] = useState(false);
  const [videoTracks, setVideoTracks] = useState<Array<VideoTrack>>([]);
  const [audioTracks, setAudioTracks] = useState<Array<AudioTrack>>([]);
  const [textTracks, setTextTracks] = useState<Array<ShakaTextTrack>>([]);

  useEffect(() => {
    const handleVideoTracks = (evt: CustomEvent) => setVideoTracks(evt.detail.videoTracks);
    const handleAudioTracks = (evt: CustomEvent) => setAudioTracks(evt.detail.audioTracks);
    const handleTextTracks = (evt: CustomEvent) => setTextTracks(evt.detail.textTracks);
    const handleAirPlay = (evt: CustomEvent) => setIsAirPlayAvailable(evt.detail.availability === 'available');
    const handleFullscreen = (evt: CustomEvent) => setIsFullscreen(evt.detail.isFullScreen);
    const handleVideoTrackChanged = (evt: CustomEvent) => {
      setIsHd(evt.detail.hd);
      setIsUhd(evt.detail.uhd);
      setIsHdr(evt.detail.hdr);
    };
    const handleLoad = () => {
      setIsHd(false);
      setIsUhd(false);
      setIsHdr(false);
    };

    eventDomElement.addEventListener(solidEvents.VIDEOTRACKS, handleVideoTracks as EventListener);
    eventDomElement.addEventListener(solidEvents.AUDIOTRACKS, handleAudioTracks as EventListener);
    eventDomElement.addEventListener(solidEvents.TEXTTRACKS, handleTextTracks as EventListener);
    eventDomElement.addEventListener(solidEvents.AIRPLAY, handleAirPlay as EventListener);
    eventDomElement.addEventListener(solidEvents.FULLSCREEN, handleFullscreen as EventListener);
    eventDomElement.addEventListener(solidEvents.VIDEOTRACKCHANGED, handleVideoTrackChanged as EventListener);
    eventDomElement.addEventListener(solidEvents.LOAD, handleLoad as EventListener);

    return () => {
      eventDomElement.removeEventListener(solidEvents.VIDEOTRACKS, handleVideoTracks as EventListener);
      eventDomElement.removeEventListener(solidEvents.AUDIOTRACKS, handleAudioTracks as EventListener);
      eventDomElement.removeEventListener(solidEvents.TEXTTRACKS, handleTextTracks as EventListener);
      eventDomElement.removeEventListener(solidEvents.AIRPLAY, handleAirPlay as EventListener);
      eventDomElement.removeEventListener(solidEvents.FULLSCREEN, handleFullscreen as EventListener);
      eventDomElement.removeEventListener(solidEvents.VIDEOTRACKCHANGED, handleVideoTrackChanged as EventListener);
      eventDomElement.removeEventListener(solidEvents.LOAD, handleLoad as EventListener);
    };
  }, [eventDomElement]);

  return (
    <div className="l-buttons--right">
      <div className="live is--small-hidden">
        <Live className="live--redcircle" />
        LIVE
      </div>
      {
      
      }
      {isAirPlayAvailable && (
        <button
          type="button"
          className="tooltip icons airplay"
          tabIndex={0}
          aria-label={i18n.t('ariaLabel.watchOnTv')}
          onClick={(evt) => {
            if (isTouchDevice && !clickActivatedOnTouchDevice) return;
            api.playOnAirplay();
            evt.stopPropagation();
          }}
          onKeyDown={(evt) => {
            if (evt.key === 'Enter') api.playOnAirplay();
          }}
          onMouseMove={(evt) => {
            if (evt.target instanceof HTMLElement && shouldHover) {
              evt.target.classList.add('is--hover');
            }
          }}
          onMouseLeave={(evt) => {
            if (evt.target instanceof HTMLElement) {
              evt.target.classList.remove('is--hover');
            }
          }}
        >
          <Airplay />
        </button>
      )}
      {!isTouchDevice && !isAdPlayer && isHd && (
        <div className="hd icons" aria-label="High Definition">
          <Hd />
        </div>
      )}
      {!isTouchDevice && !isAdPlayer && isUhd && (
        <div className="uhd icons" aria-label="Ultra High Definition">
          <Uhd />
        </div>
      )}
      {!isTouchDevice && !isAdPlayer && isHdr && (
        <div className="hdr icons" aria-label="High dynamic range">
          <Hdr />
        </div>
      )}
      {!isAdPlayer && (videoTracks || audioTracks || textTracks || !isLive) && (
        <button
          type="button"
          className="tooltip icons settings"
          onClick={(evt) => {
            if (isTouchDevice && clickActivatedOnTouchDevice === false) return;
            if (evt.target instanceof HTMLElement) {
              evt.target.classList.remove('is--hover');
            }
            onClickSettingsIcon();
            evt.stopPropagation();
          }}
          onKeyDown={(evt) => {
            if (evt.key === 'Enter') onClickSettingsIcon();
          }}
          tabIndex={0}
          aria-label={i18n.t('ariaLabel.parameters')}
          onMouseMove={(evt) => {
            if (evt.target instanceof HTMLElement && shouldHover) {
              evt.target.classList.add('is--hover');
            }
          }}
          onMouseLeave={(evt) => {
            if (evt.target instanceof HTMLElement) {
              evt.target.classList.remove('is--hover');
            }
          }}
        >
          <Settings />
        </button>
      )}
      <button
        type="button"
        className="tooltip tooltip--right icons fullscreenStatus"
        aria-label={i18n.t(isFullscreen ? 'ariaLabel.quitFullscreen' : 'ariaLabel.watchFullscreen')}
        tabIndex={0}
        onMouseMove={(evt) => {
          if (evt.target instanceof HTMLElement && shouldHover) {
            evt.target.classList.add('is--hover');
          }
        }}
        onMouseLeave={(evt) => {
          if (evt.target instanceof HTMLElement) {
            evt.target.classList.remove('is--hover');
          }
        }}
        onClick={(evt) => {
          if (isTouchDevice && !clickActivatedOnTouchDevice) return;
          api.toggleFullScreen();
          evt.stopPropagation();
        }}
        onKeyDown={(evt) => {
          if (evt.key === 'Enter') api.toggleFullScreen();
          evt.stopPropagation();
        }}
      >
        {isFullscreen ? <FullScreenExit /> : <FullScreen />}
      </button>
    </div>
  );
};

export default ButtonsRight;
