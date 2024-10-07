
import Timeline from './Timeline';
import Buttons from './Buttons';
import Info from './Info';
import { BigPlayArrow, BigPause, VolumeOff } from './Icon';
import { log } from '../modules/lib';
import i18n from '../modules/i18n';

function Controls(props:ControlProps) {
  const {
    isAdPlayer,
    isMessage,
    metadata,
    isTouchDevice,
    isWaitingForClick,
    message,
    isPaused,
    isMuted,
    isSettingsOpen,
    onClickPrevious,
    onClickNext,
    isLive,
    color,
    isHovered,
    vttThumbnailsData,
    vttChaptersData,
    entitlements,
    eventDomElement,
    api,
    setShouldPlayOnRelease,
    clickActivatedOnTouchDevice,
    shouldPlayOnRelease,
    unHoverTooltips,
    duration,
    setIsComplete,
    setIsDragging,
    setIsSettingsOpen,
    clickEventListener,
  } = props;

  const onMouseUp = () => {
    setIsDragging(false);

    if (!isHovered && shouldPlayOnRelease) {
      api.play().catch((error: unknown) => log('error', error));
      setShouldPlayOnRelease(undefined);
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    if (shouldPlayOnRelease !== null && eventDomElement instanceof HTMLElement) {
      clickEventListener({
        target: eventDomElement
      });
    }
  };

  const onMouseDown = () => {
    setShouldPlayOnRelease(api.getState() === 'playing');
  };
  return (
    <div className="l-controls">
      {!isAdPlayer && !isMessage && metadata && (metadata.title || metadata.description) && (
        <Info isTouchDevice={isTouchDevice} title={metadata?.title} description={isWaitingForClick ? metadata.description : ''} />
      )}

      {!message && (
        <div className="play">
          {isPaused ? <BigPlayArrow /> : <BigPause />}
        </div>
      )}

      {isTouchDevice && (
        <button
          type="button"
          className="tooltip icons volumeStatus"
          onClick={(evt) => {
            api.toggleMute(true);
            evt.stopPropagation();
          }}
          aria-label={i18n.t('ariaLabel.mutedSound')}
        >
          {isMuted && <VolumeOff />}
        </button>
      )}

      <div className="l-controls--bottom">
        {isTouchDevice && (
          <Buttons
            api={api}
            eventDomElement={eventDomElement}
            onClickSettingsIcon={() => {
              unHoverTooltips();
              setIsSettingsOpen(!isSettingsOpen);
            }}
            shouldHover={!isSettingsOpen}
            isTouchDevice={isTouchDevice}
            isAdPlayer={isAdPlayer}
            onClickPrevious={onClickPrevious}
            onClickNext={onClickNext}
            isLive={isLive}
            color={color}
            clickActivatedOnTouchDevice={clickActivatedOnTouchDevice}
            duration={duration}
            setShouldPlayOnRelease={setShouldPlayOnRelease}
            entitlements={entitlements}
          />
        )}

        <Timeline
          api={api}
          setIsComplete={setIsComplete}
          onMouseUp={onMouseUp}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          eventDomElement={eventDomElement}
          vttThumbnailsData={vttThumbnailsData}
          vttChaptersData={vttChaptersData}
          isTouchDevice={isTouchDevice}
          color={color}
          clickActivatedOnTouchDevice={clickActivatedOnTouchDevice}
          isAdPlayer={isAdPlayer}
          duration={duration}
        />

        {!isTouchDevice && (
          <Buttons
            api={api}
            eventDomElement={eventDomElement}
            onClickSettingsIcon={() => {
              unHoverTooltips();
              setIsSettingsOpen(!isSettingsOpen);
            }}
            shouldHover={!isSettingsOpen}
            isTouchDevice={isTouchDevice}
            setShouldPlayOnRelease={setShouldPlayOnRelease}
            isAdPlayer={isAdPlayer}
            onClickPrevious={onClickPrevious}
            onClickNext={onClickNext}
            isLive={isLive}
            color={color}
            clickActivatedOnTouchDevice={clickActivatedOnTouchDevice}
            entitlements={entitlements}
            duration={duration}
            
          />
        )}
      </div>
    </div>
  );
}
export default Controls;
