import { useState, useEffect, useRef } from 'preact/hooks';
import { solidEvents } from '../modules/events'; // Importer les événements typés
import i18n from '../modules/i18n';
import Time from './Time';
import RangeSlider from './RangeSlider';
import { PlayArrow, Pause, VolumeUp, VolumeOff, VolumeMute, VolumeDown, SkipNext, SkipPrevious } from './Icon';

const ButtonsLeft = (props: ButtonsLeftProps) => {
  const { api, eventDomElement, shouldHover, isTouchDevice, setShouldPlayOnRelease, onClickPrevious, onClickNext, isAdPlayer, color, clickActivatedOnTouchDevice, duration } = props;
  
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState<number | undefined>();
  const ref = useRef<HTMLDivElement>(null);

  // Ajouter les listeners d'événements
  useEffect(() => {
    const handleVolume = (evt: CustomEvent) => setVolume(evt.detail.volume);
    const handleMute = (evt: CustomEvent) => setIsMuted(evt.detail.muted);
    const handlePause = () => setIsPaused(true);
    const handlePlay = () => setIsPaused(false);

    eventDomElement.addEventListener(solidEvents.VOLUME, handleVolume as EventListener);
    eventDomElement.addEventListener(solidEvents.MUTE, handleMute as EventListener);
    eventDomElement.addEventListener(solidEvents.PAUSE, handlePause);
    eventDomElement.addEventListener(solidEvents.PLAY, handlePlay);
    eventDomElement.addEventListener(solidEvents.TRYINGTOPLAY, handlePlay);
    eventDomElement.addEventListener(`ad${solidEvents.VOLUME}`, handleVolume as EventListener);
    eventDomElement.addEventListener(`ad${solidEvents.MUTE}`, handleMute as EventListener);
    eventDomElement.addEventListener(`ad${solidEvents.PAUSE}`, handlePause);
    eventDomElement.addEventListener(`ad${solidEvents.PLAY}`, handlePlay);

    return () => {
      eventDomElement.removeEventListener(solidEvents.VOLUME, handleVolume as EventListener);
      eventDomElement.removeEventListener(solidEvents.MUTE, handleMute as EventListener);
      eventDomElement.removeEventListener(solidEvents.PAUSE, handlePause);
      eventDomElement.removeEventListener(solidEvents.PLAY, handlePlay);
      eventDomElement.removeEventListener(solidEvents.TRYINGTOPLAY, handlePlay);
      eventDomElement.removeEventListener(`ad${solidEvents.VOLUME}`, handleVolume as EventListener);
      eventDomElement.removeEventListener(`ad${solidEvents.MUTE}`, handleMute as EventListener);
      eventDomElement.removeEventListener(`ad${solidEvents.PAUSE}`, handlePause);
      eventDomElement.removeEventListener(`ad${solidEvents.PLAY}`, handlePlay);
    };
  }, [eventDomElement]);

  return (
    <div
      className="l-buttons--left"
      onMouseLeave={() => {
        const volumeSlider = ref.current?.querySelector('.volume-slider');
        if (volumeSlider) {
          volumeSlider.classList.remove('is--hover');
        }
      }}
      ref={ref}
    >
      {!isAdPlayer && onClickPrevious && (
        <button
          tabIndex={0}
          type="button"
          className="icons tooltip tooltip--left previous"
          aria-label={i18n.t('ariaLabel.playPrevious')}
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
            onClickPrevious();
            evt.stopPropagation();
          }}
        >
          <SkipPrevious />
        </button>
      )}
      <button
        tabIndex={0}
        type="button"
        className="icons tooltip tooltip--left playStatus"
        aria-label={isPaused ? i18n.t('ariaLabel.play') : i18n.t('ariaLabel.pause')}
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
          api.togglePlay();
          evt.stopPropagation();
        }}
      >
        {isPaused ? <PlayArrow /> : <Pause />}
      </button>
      {!isAdPlayer && onClickNext && (
        <button
          tabIndex={0}
          type="button"
          className="icons tooltip tooltip--left next"
          aria-label={i18n.t('ariaLabel.playNext')}
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
            onClickNext();
            evt.stopPropagation();
          }}
        >
          <SkipNext />
        </button>
      )}
      {!isTouchDevice && (
        <div className="volume" type="button" tabIndex={-1}>
          <button
            type="button"
            className="tooltip icons volumeStatus"
            onClick={(evt) => {
              api.toggleMute(true);
              evt.stopPropagation();
            }}
            aria-label={i18n.t('ariaLabel.mutedSound')}
            tabIndex={0}
            onMouseMove={(evt) => {
              if (shouldHover) {
                if (evt.target instanceof HTMLElement && shouldHover) {
                  evt.target.classList.add('is--hover');
                }
                const volumeSlider = ref.current?.querySelector('.volume-slider');
                if (volumeSlider) {
                  volumeSlider.classList.add('is--hover');
                }
              }
            }}
            onFocus={(evt) => {
              evt.target?.dispatchEvent(new Event('mousemove'));
            }}
            onMouseLeave={(evt) => {
              if (evt.target instanceof HTMLElement) {
                evt.target.classList.remove('is--hover');
              }
            }}
          >
            {isMuted && <VolumeOff />}
            {!isMuted && volume && volume >= 0 && volume <= 0.3 && <VolumeMute />}
            {!isMuted && volume && volume > 0.3 && volume <= 0.6 && <VolumeDown />}
            {((!isMuted && volume && volume > 0.6) || (!isMuted && volume && isNaN(volume) && isTouchDevice)) && <VolumeUp />}
          </button>
          <button
            type="button"
            tabIndex={-1}
            className="volume-slider is--touch-hidden"
            aria-label={i18n.t('ariaLabel.volume')}
            onClick={(evt) => {
              evt.stopPropagation();
            }}
            onMouseDown={() => {
              setShouldPlayOnRelease(false);
            }}
          >
            <RangeSlider
              className="tooltip"
              max={1}
              val={volume || 0}
              ariaLabel={i18n.t('ariaLabel.volume')}
              tabIndex={0}
              onDragMove={(ratio) => {
                api.setVolume(ratio);

                const volumeSlider = ref.current?.querySelector('.volume-slider');
                if (volumeSlider) {
                  volumeSlider.classList.add('is--hover');
                }

                const playerContainer = document.querySelector('.l-player-container');
                if (playerContainer) {
                  playerContainer.dispatchEvent(new Event('mousemove'));
                }
              }}
              color={color}
            />
          </button>
        </div>
      )}
      <Time eventDomElement={eventDomElement} duration={duration} />
    </div>
  );
};

export default ButtonsLeft;
