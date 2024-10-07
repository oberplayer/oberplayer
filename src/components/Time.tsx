
import { useState, useEffect } from 'preact/hooks';
import { secondsToHumanreadableDuration } from '../modules/lib';
import { solidEvents } from '../modules/events';
import i18n from '../modules/i18n';

function Time({ eventDomElement, duration }: TimeProps) {
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    const handleTimeUpdate = (evt: CustomEvent) => {
      setCurrentTime(evt.detail.currentTime);
    };

    const handleAdTimeUpdate = (evt: CustomEvent) => {
      setCurrentTime(evt.detail.currentTime);
    };

    const handleLoad = () => {
      setCurrentTime(0);
    };

    eventDomElement.addEventListener(solidEvents.TIME, handleTimeUpdate as EventListener);
    eventDomElement.addEventListener(`ad${solidEvents.TIME}`, handleAdTimeUpdate as EventListener);
    eventDomElement.addEventListener(solidEvents.LOAD, handleLoad as EventListener);

    return () => {
      eventDomElement.removeEventListener(solidEvents.TIME, handleTimeUpdate as EventListener);
      eventDomElement.removeEventListener(`ad${solidEvents.TIME}`, handleAdTimeUpdate as EventListener);
      eventDomElement.removeEventListener(solidEvents.LOAD, handleLoad as EventListener);
    };
  }, [eventDomElement]);

  return (
    <span className="time">
      <div aria-label={i18n.t('ariaLabel.position')}>
        {secondsToHumanreadableDuration(currentTime)}
      </div>
      &nbsp;/&nbsp;
      <div aria-label={i18n.t('ariaLabel.duration')}>
        {secondsToHumanreadableDuration(duration || 0)}
      </div>
    </span>
  );
}

export default Time;
