import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { solidEvents, triggerSolidEvent } from '../modules/events';
import RangeSlider from './RangeSlider';
import i18n from '../modules/i18n';

function Timeline({
  eventDomElement,
  onMouseDown,
  onMouseUp,
  vttThumbnailsData,
  vttChaptersData,
  isTouchDevice,
  onTouchEnd,
  color,
  clickActivatedOnTouchDevice,
  isAdPlayer,
  api,
  duration,
  setIsComplete,
}: TimelineProps) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const durationRef = useRef(duration);

  useEffect(() => {
    durationRef.current = duration;

    const handleTimeUpdate = (evt: CustomEvent<CustomEventDetail>) => {
      setCurrentTime(evt.detail.currentTime as number);
    };

    const handleSeeked = (evt: CustomEvent<CustomEventDetail>) => {
      setCurrentTime(evt.detail.currentTime as number);
    };

    const handleLoad = () => {
      setCurrentTime(0);
    };

    eventDomElement.addEventListener(solidEvents.TIME, handleTimeUpdate as EventListener);
    eventDomElement.addEventListener(`ad${solidEvents.TIME}`, handleTimeUpdate as EventListener);
    eventDomElement.addEventListener(solidEvents.SEEKED, handleSeeked as EventListener);
    eventDomElement.addEventListener(solidEvents.LOAD, handleLoad as EventListener);

    return () => {
      eventDomElement.removeEventListener(solidEvents.TIME, handleTimeUpdate as EventListener);
      eventDomElement.removeEventListener(`ad${solidEvents.TIME}`, handleTimeUpdate as EventListener);
      eventDomElement.removeEventListener(solidEvents.SEEKED, handleSeeked as EventListener);
      eventDomElement.removeEventListener(solidEvents.LOAD, handleLoad as EventListener);
    };
  }, [eventDomElement, duration]);

  const onDragMove = useCallback(
    (ratio: number) => {
      // no drag with preroll
      if(isAdPlayer === true) return;

      api.pause();
      if(durationRef.current) {
        const currentTime = ratio * durationRef.current;
        setIsComplete(false);
        api.seek(currentTime);
        triggerSolidEvent(eventDomElement, solidEvents.TIME, { currentTime } as CustomEventDetail);
      }
    },
    [api, eventDomElement, isAdPlayer],
  );

  return (
    <RangeSlider
      onDragMove={onDragMove}
      className="timeline"
      max={durationRef.current || 1}
      val={currentTime}
      ariaLabel={i18n.t('ariaLabel.progression')}
      tabIndex={-1}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
      vttThumbnailsData={vttThumbnailsData}
      vttChaptersData={vttChaptersData}
      isTouchDevice={isTouchDevice}
      color={color}
      clickActivatedOnTouchDevice={clickActivatedOnTouchDevice}
      isAdPlayer={isAdPlayer}
    />
  );
}

export default Timeline;
