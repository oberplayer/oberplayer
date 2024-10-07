import { useState, useRef, useEffect } from 'preact/hooks';
import { secondsToHumanreadableDuration } from '../modules/lib';

const clamp = (value: number, min: number, max: number) => (value > max ? max : value < min ? min : value);

function RangeSlider(props: RangeSliderProps) {
  const {
    max,
    val,
    ariaLabel,
    className,
    tabIndex,
    onMouseDown,
    onMouseUp,
    onTouchEnd,
    onDragMove,
    vttChaptersData,
    isTouchDevice,
    color,
    clickActivatedOnTouchDevice,
    vttThumbnailsData,
    isAdPlayer,
  } = props;

  const [hoverText, setHoverText] = useState<string>('');
  const [hoverWidth, setHoverWidth] = useState<number>(0);
  const [currentWidth, setCurrentWidth] = useState<number | undefined>();
  const [isSliderMouseEnter, setIsSliderMouseEnter] = useState<boolean>(false);
  const isSliderMouseDown = useRef<boolean>(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const maxRef = useRef(max);

  useEffect(() => {
    // Lorsque la valeur de `val` change, reset la taille du curseur
    setCurrentWidth((val / max) * 100);

    maxRef.current = max;

    if (isTouchDevice) {
      document.addEventListener('touchend', documentMouseUpEventListener);
      document.addEventListener('touchmove', documentMouseMoveEventListener);
    } else {
      document.addEventListener('mousemove', documentMouseMoveEventListener);
      document.addEventListener('mouseup', documentMouseUpEventListener);
    }
    return () => {
      document.removeEventListener('mousemove', documentMouseMoveEventListener);
      document.removeEventListener('touchmove', documentMouseMoveEventListener);
      document.removeEventListener('mouseup', documentMouseUpEventListener);
      document.removeEventListener('touchend', documentMouseUpEventListener);
    };
  }, [val, max, isTouchDevice]);

  const refreshFps = 50;
  let wait = false;

  const documentMouseMoveEventListener = (evt: MouseEvent | TouchEvent) => {
    if (!wait && sliderRef.current) {
      const timelineSpaceFromPlayer = 10;
      const sliderElement = sliderRef.current;
      const outputDomElement = sliderElement.querySelector('output');
      const hoverInfoDomElement = sliderElement.querySelector('.hoverInfo') as HTMLElement;
      const thumbDomElement = sliderElement.querySelector('.thumb') as HTMLElement;
      const RangeSliderRect = sliderElement.getBoundingClientRect();
      const hoverInfoDomElementLeftCompensation = timelineSpaceFromPlayer - hoverInfoDomElement.getBoundingClientRect().width / 2;
      let gapFromLeft = 0;
      if(evt instanceof MouseEvent ) {
        gapFromLeft = evt.pageX - RangeSliderRect.left;
      }
      else if(evt instanceof TouchEvent ) {
        gapFromLeft = evt.touches[0].pageX - RangeSliderRect.left;
      }
      const hoverInfoDomElementLeft = gapFromLeft + hoverInfoDomElementLeftCompensation;
      const currentTime = clamp(maxRef.current * (gapFromLeft / RangeSliderRect.width), 0, maxRef.current);

      const hoverInfoDomElementRightCompensation = hoverInfoDomElement.getBoundingClientRect().width - timelineSpaceFromPlayer;
      hoverInfoDomElement.style.left = `${clamp(hoverInfoDomElementLeft, timelineSpaceFromPlayer, RangeSliderRect.width - hoverInfoDomElementRightCompensation)}px`;

      let hoverTextValue = secondsToHumanreadableDuration(currentTime);

      if (vttChaptersData && vttChaptersData.length > 0 && !Number.isNaN(currentTime)) {
        const vttLineIndex = getVttLineFromCurrentTime(vttChaptersData, currentTime);
        if (vttChaptersData[vttLineIndex]) {
          hoverTextValue += ` : ${vttChaptersData[vttLineIndex].title}`;
        }
      }

      setHoverText(hoverTextValue);

      // VTT thumpbnails
      if (!isAdPlayer && !isTouchDevice && vttThumbnailsData && vttThumbnailsData.length > 0 && !Number.isNaN(currentTime)) {
        const vttLineIndex = getVttLineFromCurrentTime(vttThumbnailsData, currentTime);
        // the VTT can be bad or too short, or just not the corresponding one
        if (vttThumbnailsData[vttLineIndex]) {
          thumbDomElement.style.backgroundPosition = vttThumbnailsData[vttLineIndex].css.backgroundPosition;
          thumbDomElement.style.backgroundImage = vttThumbnailsData[vttLineIndex].css.backgroundImage;
          thumbDomElement.style.backgroundRepeat = vttThumbnailsData[vttLineIndex].css.backgroundRepeat;
          thumbDomElement.style.backgroundSize = vttThumbnailsData[vttLineIndex].css.backgroundSize;
          thumbDomElement.style.width = vttThumbnailsData[vttLineIndex].css.width;
          thumbDomElement.style.height = vttThumbnailsData[vttLineIndex].css.height;
          thumbDomElement.style.transformOrigin = vttThumbnailsData[vttLineIndex].css.transformOrigin;
          thumbDomElement.style.transform = vttThumbnailsData[vttLineIndex].css.transform;
          thumbDomElement.style.display = 'block';
        }
        hoverInfoDomElement.style.width = 'auto';
        hoverInfoDomElement.style.height = 'auto';
      } else {
        thumbDomElement.style.display = 'none';
        if (outputDomElement && outputDomElement.getBoundingClientRect().width > 0) {
          hoverInfoDomElement.style.width = `${outputDomElement.getBoundingClientRect().width}px`;
        }
      }

      setHoverWidth(clamp((gapFromLeft / RangeSliderRect.width) * 100, 0, 100));

      if (isSliderMouseDown.current) {
        currentToPosition(evt);
      }

      wait = true;
      setTimeout(() => {
        wait = false;
      }, 1000 / refreshFps);
    }
  };

  const documentMouseUpEventListener = (evt: MouseEvent | TouchEvent) => {
    if (!isTouchDevice && onMouseUp && evt instanceof MouseEvent) {
      onMouseUp(evt);
    }
    if (isTouchDevice && onTouchEnd && evt instanceof TouchEvent) {
      onTouchEnd(evt);
    }
    isSliderMouseDown.current = false;
  };

  const currentToPosition = (evt: MouseEvent | TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = evt instanceof MouseEvent ? evt.clientX : evt.touches?.[0].clientX;
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    setCurrentWidth(ratio * 100);
    if (onDragMove) onDragMove(ratio);
  };

  const getVttLineFromCurrentTime = (vttData: [{start: number, end: number}], currentTime: number) => {
    let foundvttIndex: number = -1;
    vttData.forEach((vttLine, i) => {
      if (currentTime >= vttLine.start && currentTime < vttLine.end) {
        foundvttIndex = i;
      }
    });
    return foundvttIndex;
  };

  return (
    <div
      tabIndex={tabIndex}
      className={`${`rangeslider ${className} ${!isAdPlayer && (isSliderMouseDown.current || isSliderMouseEnter) ? 'is--hover' : ''}`}`}
      aria-label={ariaLabel}
      ref={sliderRef}
      onMouseEnter={() => setIsSliderMouseEnter(true)}
      onMouseLeave={() => setIsSliderMouseEnter(false)}
      onMouseDown={(evt) => {
        if (isTouchDevice || isAdPlayer) return;
        if (evt.button !== 2) {
          if (onMouseDown) onMouseDown(evt);
          isSliderMouseDown.current = true;
          currentToPosition(evt);
        }
      }}
      onTouchStart={(evt) => {
        if (isTouchDevice && !clickActivatedOnTouchDevice) return;
        setIsSliderMouseEnter(true);
        if (onMouseDown) onMouseDown(evt);
        isSliderMouseDown.current = true;
        currentToPosition(evt);
      }}
    >
      <div className="rail">
        <div className="hover" style={{ width: `${hoverWidth}%` }} />
        <div className="current" style={{ width: `${currentWidth || (val / maxRef.current) * 100}%`, backgroundColor: color }} />
        {vttChaptersData
          && vttChaptersData.map((chapter, i) => (
            <div key={i} className="chapterMarker" style={{ left: `${(chapter.end / maxRef.current) * 100}%` }} />
          ))}
      </div>
      <div className="hoverInfo">
        <div className="thumb" />
        <output value={hoverText} />
      </div>
    </div>
  );
}

export default RangeSlider;
