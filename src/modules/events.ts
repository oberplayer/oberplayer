import { isNotFullScreen } from './fullscreen';
import { PlayerApi, SolidEvents } from '@oberplayer-free/oberplayer';

interface WebKitPlaybackTargetAvailabilityEvent extends Event {
  availability: string; // 'available' or 'not-available'
}

export const solidEvents: Record<Uppercase<SolidEvents>, SolidEvents> = {
  PLAY: 'play',
  FIRSTPLAY: 'firstplay',
  TRYINGTOPLAY: 'tryingtoplay',
  CANPLAY: 'canplay',
  PAUSE: 'pause',
  AIRPLAY: 'airplay',
  CAST: 'cast',
  FULLSCREEN: 'fullscreen',
  VOLUME: 'volume',
  MUTE: 'mute',
  SEEKING: 'seeking',
  SEEKED: 'seeked',
  ENDED: 'ended',
  BEFOREENDED: 'beforeended',
  BUFFERING: 'buffering',
  TIME: 'time',
  METADATA: 'metadata',
  AUDIOTRACKS: 'audiotracks',
  AUDIOTRACKASKED: 'audiotrackasked',
  TEXTTRACKS: 'texttracks',
  TEXTTRACKASKED: 'texttrackasked',
  VIDEOTRACKS: 'videotracks',
  VIDEOTRACKCHANGED: 'videotrackchanged',
  VIDEOTRACKASKED: 'videotrackasked',
  VIDEOTYPE: 'videotype',
  READY: 'ready',
  NEXT: 'next',
  PREVIOUS: 'previous',
  LOAD: 'load',
  SETUP: 'setup',
  CLICKCTAVAST: 'clickctavast',
  ADVOLUME: 'advolume',
  ADMUTE: 'admute',
  ADPAUSE: 'adpause',
  ADPLAY: 'adplay',
  ERROR: 'error',
};


let lastEvent: string | undefined;

export function triggerSolidEvent(
  eventDomElement: HTMLDivElement,
  type: string,
  detail: CustomEventDetail = {} as CustomEventDetail,
  isAdEvent: boolean = false
) {
  if (type !== 'TIME') {
    // console.info(`solid event dispatched: %c${type}`, 'color: green; background: yellow; font-weight:bold;', detail);
  }

  // send all event
  let allDetail = { ...detail, name: isAdEvent ? `ad${type}` : type };
  eventDomElement.dispatchEvent(new CustomEvent<CustomEventDetail>('ALL', { detail: allDetail }));

  if (isAdEvent) {
    eventDomElement.dispatchEvent(new CustomEvent<CustomEventDetail>(`ad${type}`, { detail }));
  } else {
    eventDomElement.dispatchEvent(new CustomEvent<CustomEventDetail>(type, { detail }));
  }
}

export function handleOnLoadedmetadata(
  videoTag: PlayerAttributes["videoTag"],
  eventDomElement: PlayerAttributes["eventDomElement"],
  isPlayingAdVideo: () => boolean
) {
  triggerSolidEvent(
    eventDomElement,
    solidEvents.MUTE,
    { muted: videoTag?.muted },
    isPlayingAdVideo()
  );
  triggerSolidEvent(
    eventDomElement,
    solidEvents.VOLUME,
    { volume: videoTag?.volume },
    isPlayingAdVideo()
  );
  triggerSolidEvent(
    eventDomElement,
    solidEvents.METADATA,
    { duration: videoTag?.duration },
    isPlayingAdVideo()
  );
}

export function mapSolidEvents(
  domElement: PlayerAttributes["domElement"],
  eventDomElement: PlayerAttributes["eventDomElement"],
  isPlayingAdVideo: () => boolean,
  api: PlayerApi,
  videoUrl: string
) {
  const videoTag = domElement?.querySelector('video') as PlayerAttributes["videoTag"];
  let firstPlayTriggered: { [key: string]: boolean } = {};

  eventDomElement.addEventListener(solidEvents.LOAD, () => {
    firstPlayTriggered = {};
  });

  videoTag?.addEventListener('webkitplaybacktargetavailabilitychanged', (event: Event) => {
    const customEvent = event as WebKitPlaybackTargetAvailabilityEvent;
    triggerSolidEvent(
      eventDomElement,
      solidEvents.AIRPLAY,
      { availability: customEvent.availability },
      isPlayingAdVideo()
    );
  });

  domElement?.addEventListener('fullscreenchange', () => {
    triggerSolidEvent(
      eventDomElement,
      solidEvents.FULLSCREEN,
      { isFullScreen: !isNotFullScreen() },
      isPlayingAdVideo()
    );
  });

  videoTag?.addEventListener('volumechange', () => {
    triggerSolidEvent(
      eventDomElement,
      solidEvents.MUTE,
      { muted: videoTag.muted },
      isPlayingAdVideo()
    );
    triggerSolidEvent(
      eventDomElement,
      solidEvents.VOLUME,
      { volume: Math.round(videoTag.volume * 100) / 100 },
      isPlayingAdVideo()
    );
  });

  videoTag?.addEventListener('pause', () => {
    api.getState = () => 'paused';
    triggerSolidEvent(eventDomElement, solidEvents.PAUSE, undefined, isPlayingAdVideo());
  });

  videoTag?.addEventListener('seeking', () => {
    if (lastEvent !== 'loadedmetadata') {
      triggerSolidEvent(
        eventDomElement,
        solidEvents.SEEKING,
        {
          currentTime: videoTag.currentTime,
          duration: videoTag.duration,
        },
        isPlayingAdVideo()
      );
    }
  });

  videoTag?.addEventListener('seeked', () => {
    triggerSolidEvent(
      eventDomElement,
      solidEvents.SEEKED,
      {
        currentTime: videoTag.currentTime,
        duration: videoTag.duration,
      },
      isPlayingAdVideo()
    );
  });

  videoTag?.addEventListener('ended', () => {
    if (!isPlayingAdVideo()) {
      triggerSolidEvent(eventDomElement, solidEvents.NEXT, { comingFromClick: false });
    }
    triggerSolidEvent(eventDomElement, solidEvents.BEFOREENDED, undefined, isPlayingAdVideo());
    triggerSolidEvent(eventDomElement, solidEvents.ENDED, undefined, isPlayingAdVideo());
  });

  videoTag?.addEventListener('waiting', () => {
    api.getState = () => 'buffering';
    triggerSolidEvent(eventDomElement, solidEvents.BUFFERING, undefined, isPlayingAdVideo());
  });

  videoTag?.addEventListener('canplaythrough', () => {
    triggerSolidEvent(eventDomElement, solidEvents.CANPLAY, undefined, isPlayingAdVideo());
  });

  videoTag?.addEventListener('play', () => {
    triggerSolidEvent(eventDomElement, solidEvents.TRYINGTOPLAY, undefined, isPlayingAdVideo());
  });

  videoTag?.addEventListener('playing', () => {
    api.getState = () => 'playing';
    triggerSolidEvent(eventDomElement, solidEvents.PLAY, undefined, isPlayingAdVideo());
    if (!firstPlayTriggered[videoUrl]) {
      triggerSolidEvent(
        eventDomElement,
        solidEvents.FIRSTPLAY,
        { videoUrl },
        isPlayingAdVideo()
      );
      firstPlayTriggered[videoUrl] = true;
    }
  });

  const timeMetadata = () => {
    if (!Number.isNaN(videoTag?.duration)) {
      triggerSolidEvent(
        eventDomElement,
        solidEvents.METADATA,
        { duration: videoTag?.duration },
        isPlayingAdVideo()
      );
    }
    videoTag?.removeEventListener('timeupdate', timeMetadata);
  };

  videoTag?.addEventListener('timeupdate', timeMetadata);
  videoTag?.addEventListener('timeupdate', () => {
    if (lastEvent !== 'emptied' && lastEvent !== 'seeking') {
      triggerSolidEvent(
        eventDomElement,
        solidEvents.TIME,
        {
          currentTime: videoTag.currentTime,
          duration: videoTag.duration,
        },
        isPlayingAdVideo()
      );
    }
  });
  videoTag?.addEventListener('loadedmetadata', () => {
    handleOnLoadedmetadata(videoTag, eventDomElement, isPlayingAdVideo);
  });

  const addListenerMulti = (videoTag: PlayerAttributes["videoTag"], s: string, fn: EventListener) => {
    s.split(' ').forEach((e) => videoTag?.addEventListener(e, fn, false));
  };
  addListenerMulti(
    videoTag,
    'abort canplay canplaythrough durationchange emptied encrypted ended error interruptbegin interruptend loadeddata loadedmetadata loadstart mozaudioavailable pause play playing progress ratechange seeked seeking stalled suspend timeupdate volumechange waiting',
    (e) => {
      lastEvent = e.type;
    }
  );
}
