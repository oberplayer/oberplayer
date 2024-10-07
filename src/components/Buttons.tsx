import { useRef } from 'preact/hooks';
import ButtonsLeft from './ButtonsLeft';
import ButtonsRight from './ButtonsRight';

function Buttons(props:ButtonProps) {
  const ref = useRef(null);
  const { api, eventDomElement, onClickSettingsIcon, shouldHover, isTouchDevice, setShouldPlayOnRelease, isAdPlayer, onClickPrevious, onClickNext, isLive, color, entitlements, clickActivatedOnTouchDevice, duration } = props;
  return (
    <div className="l-buttons" ref={ref}>
      <ButtonsLeft
        eventDomElement={eventDomElement}
        api={api}
        shouldHover={shouldHover}
        isTouchDevice={isTouchDevice}
        setShouldPlayOnRelease={setShouldPlayOnRelease}
        onClickPrevious={onClickPrevious}
        onClickNext={onClickNext}
        isAdPlayer={isAdPlayer}
        color={color}
        clickActivatedOnTouchDevice={clickActivatedOnTouchDevice}
        duration={duration}
      />
      <ButtonsRight clickActivatedOnTouchDevice={clickActivatedOnTouchDevice} eventDomElement={eventDomElement} api={api} onClickSettingsIcon={onClickSettingsIcon} shouldHover={shouldHover} isTouchDevice={isTouchDevice} isAdPlayer={isAdPlayer} isLive={isLive} entitlements={entitlements} />
    </div>
  );
}
export default Buttons;
