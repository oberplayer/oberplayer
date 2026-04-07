import DOMPurify from 'dompurify';

// Validate URL protocol before opening (prevents javascript: XSS)
export const isSafeUrl = (url) => {
  try {
    const parsed = new URL(url, window.location.href);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch { return false; }
};

export const safeWindowOpen = (url) => {
  if (isSafeUrl(url)) {
    window.open(url, '_blank');
    return true;
  }
  return false;
};

// Sanitize HTML from ad servers before DOM injection
export const setSanitizedHTML = (element, html) => {
  element.innerHTML = DOMPurify.sanitize(html);
};

// Validate src attribute for img/iframe elements
export const setSafeSrc = (element, url) => {
  if (isSafeUrl(url)) element.src = url;
};

// Safely append to an ad slot element by validated ID
export const appendToAdSlot = (adSlotID, child, fallbackParent) => {
  if (/^[a-zA-Z0-9_-]+$/.test(adSlotID)) {
    const slot = document.querySelector(`#${adSlotID}`);
    if (slot) { slot.appendChild(child); return; }
  }
  fallbackParent.appendChild(child);
};

export const getLocalISOString = (date) => {
  const offset = date.getTimezoneOffset();
  const offsetAbs = Math.abs(offset);
  const isoString = new Date(date.getTime() - offset * 60 * 1000).toISOString();
  return `${isoString.slice(0, -1)}${offset > 0 ? '-' : '+'}${String(Math.floor(offsetAbs / 60)).padStart(2, '0')}`;
};

export const convertTimeOffsetToSeconds = (timecode, duration = null) => {
  // convert timeoffset in percent
  if (duration && timecode.includes('%')) {
    const percent = timecode.replace('%', '');
    return (duration / 100) * percent;
  }
  // convert timeoffset in seconds from the start
  if (timecode.includes('#')) {
    return timecode.replace('#', '');
  }
  // convert timeoffset in timecode
  const [time, ms] = timecode.split('.');
  const [hours, minutes, seconds] = time.split(':');
  return Number(`${parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseInt(seconds, 10)}.${ms}`);
};

export function applyNonLinearCommonDomStyle(domElement) {
  domElement.style.cursor = 'pointer';
  domElement.style.left = '50%';
  domElement.style.position = 'absolute';
  domElement.style.transform = 'translateX(-50%)';
  domElement.style.bottom = '80px';
  domElement.style.display = 'block';
  domElement.style.zIndex = '2';
}

/*
 * This method is responsible for choosing the best media file to play according to the user's
 * screen resolution and internet connection speed
 */
export function getBestMediaFile(mediaFilesAvailable) {
  // select the best media file based on internet bandwidth and screen size/resolution
  const videojsVhs = localStorage.getItem('videojs-vhs');
  let bandwidth;
  try { bandwidth = videojsVhs ? JSON.parse(videojsVhs).bandwidth : undefined; } catch { /* corrupted localStorage */ }

  let bestMediaFile = mediaFilesAvailable[0];

  if (mediaFilesAvailable && bandwidth) {
    const { height } = window.screen;
    const { width } = window.screen;

    const result = mediaFilesAvailable.sort(
      (a, b) => Math.abs(a.bitrate - bandwidth) - Math.abs(b.bitrate - bandwidth) || Math.abs(a.width - width) - Math.abs(b.width - width) || Math.abs(a.height - height) - Math.abs(b.height - height),
    );

    [bestMediaFile] = result;
  }

  return bestMediaFile;
}

export function getMidrolls(adBreaks) {
  const midrolls = [];
  if (adBreaks) {
    return adBreaks
      .filter((adBreak) => !['start', '0%', '00:00:00', 'end', '100%'].includes(adBreak.timeOffset))
      .reduce(
        (prev, current) => [
          ...prev,
          {
            timeOffset: current.timeOffset,
            vastUrl: current.adSource.adTagURI?.uri,
            vastData: current.adSource.vastAdData,
          },
        ],
        [],
      );
  }
  return midrolls;
}

export function getPreroll(adBreaks) {
  if (adBreaks) {
    return adBreaks.filter((adBreak) => ['start', '0%', '00:00:00'].includes(adBreak.timeOffset))[0];
  }
  return false;
}

export function getPostroll(adBreaks) {
  if (adBreaks) {
    return adBreaks.filter((adBreak) => ['end', '100%'].includes(adBreak.timeOffset))[0];
  }
  return false;
}
