import { PlayerOptions, DefaultPlayerConfig, PlaylistEntry, GoToButton, Metadata, PlayerApi } from '@oberplayer-free/oberplayer';
import Polyglot from 'node-polyglot';
import { JSX } from 'preact';

export {};

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'google-cast-launcher': object;
    }
  }
}

declare global {

  const ENV: string;
  var instance: Polyglot;
  var bpdebug: boolean;
  var gtag: (eventCategory: 'event', eventAction: string, eventParams: GtagEventParams) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var shaka: any;

  interface HTMLVideoElement {
    webkitShowPlaybackTargetPicker?: () => void;
  }
  
  interface GtagEventParams {
    userId: string | undefined;
    videoUrl: PlaylistEntry["videoUrl"];
    renderingPlace: string | undefined;
  }
  
  interface PlayerState {
    isAdPlayer?: boolean;
    isPaused?: boolean;
    isWaitingForClick?: boolean;
    isReady?: boolean;
    isFullScreen?: boolean;
    isPlaying?: boolean;
    isSeeking?: boolean;
    isBuffering?: boolean;
    isComplete?: boolean;
    isLive?: boolean;
    isChromecasting?: boolean;
    isMessage?: boolean;
    isDragging?: boolean;
    isSettingsOpen?: boolean;
    isControlsVisible?: boolean;
    isSmall?: boolean;
    isHovered?: boolean;
    isStylesheetLoaded?: boolean;
    isMessageUnderClickCatcher?: boolean;
    isMuted?: boolean;
    chaptersVttUrl?: PlaylistEntry["chaptersVttUrl"];
    thumbnailsVttUrl?: PlaylistEntry["thumbnailsVttUrl"];
    restrictions?: PlaylistEntry["restrictions"];
    rights?: PlaylistEntry["rights"];
    geolocation?: PlaylistEntry["geolocation"];
    message?: {
      icon: JSX.Element | undefined;
      text: string | JSX.Element;
    }
    duration?: number;
    goToButtonData?: GoToButton;
    restorePositionAfterAd?: number;
    autoplay?: boolean;
    vttThumbnailsData?: [{
      start: number,
      end: number,
      css: {
        backgroundPosition: string,
        backgroundImage: string,
        backgroundRepeat: string,
        backgroundSize: string,
        width: string,
        height: string,
        transformOrigin: string,
        transform: string,
      },
      title: string,
    }];

    vttChaptersData?: [{
      start: number;
      end: number;
      title: string;
    }];
  }  

  export interface entitlements {
    userPreferences: boolean,
    hostsAllowed: string,
    goToButton: boolean,
    restrictions: boolean,
    rights: boolean,
    geolocation: boolean,
  }

  interface Robustness {
    videoRobustness: string;
    audioRobustness: string;
  }

  interface RobustnessOption {
    [key: string]: {
      videoRobustness: string;
      audioRobustness: string;
    };
  }
  
  interface RequestHeaders {
    [key: string]: string;
  }

  interface ShakaProviderOptions {
    videoUrl: PlaylistEntry["videoUrl"];
    videoTag: PlayerAttributes["videoTag"];
    volume: PlaylistEntry["volume"];
    muted: PlaylistEntry["muted"];
    displayMessage: (message: { icon: JSX.Element, text: string }) => void;
    eventDomElement: PlayerProps["eventDomElement"];
    domElement: PlayerAttributes["domElement"];
    isAdPlayer: PlayerState["isAdPlayer"];
    autoplay: PlaylistEntry["autoplay"];
    entitlements?: entitlements;
    resetToPreview: PlayerFunctions["resetToPreview"];
    api: PlayerApi;
  }

  type ShakaPlayerConfiguration = {
    abr: {
      enabled: boolean;
    }
  }
  type ShakaPlayer = {
    getConfiguration: () => ShakaPlayerConfiguration;
    detach: () => void;
    configure: (videoProviderOptions: PlayerProps['videoProviderOptions']) => void;
    addEventListener: (name: string, callback: () => void) => void;
    getVariantTracks: () => Array<Variant>;
    isLive: () => boolean;
    getTextTracks: () => [ShakaTextTrack];
    getAudioLanguagesAndRoles: () => [AudioTrack];
    loadsetTextTrackVisibility: () => void;
    selectAudioLanguage: (language: string, role?: string) => void;
    resetConfiguration: () => void;
    load: (videoUrl: PlayerProps['videoUrl']) => void;
    unload: () => void;
    getNetworkingEngine: () => {registerRequestFilter: (callback: (type: unknown, request: {headers: RequestHeaders, uris: [string], allowCrossSiteCredentials: boolean}) => void) => void};
    selectVariantTrack: (variantToSelect: Variant, clearBuffer: boolean ) => void;
    destroy: () => void;
    setTextTrackVisibility: (visibility: boolean) => void;
    selectTextLanguage: (language: string, role: string, forced: boolean) => void;
  }

  interface VariantWithVideoBandwidth {
    height: number;
    width: number;
    videoBandwidth: number;
    bandwidth?: undefined;
    hdr?: boolean;
    boolean: boolean;
    active: boolean;
    label: string;
    language: string;
    audioRoles :Array<string>
  }

  interface VariantWithBandwidth {
    height: number;
    width: number;
    videoBandwidth?: undefined;
    bandwidth: number;
    hdr?: boolean | string;
    active: boolean;
    label: string;
    language: string;
    audioRoles :Array<string>
  }

  type Variant = VariantWithVideoBandwidth | VariantWithBandwidth;

  export type PlayerProps = PlayerOptions
  & Pick<PlaylistEntry, 'aspect' | 'metadata' | 'goToButtons' | 'videoUrl' | 'restrictions' | 'muted' | 'rights' | 'geolocation' | 'chaptersVttUrl' | 'thumbnailsVttUrl'>
  & DefaultPlayerConfig
  & {
    eventDomElement: HTMLDivElement;
    entitlements?: entitlements;
    onClickPrevious: () => void;
    isTouchDevice: boolean;
    videoProviderOptions: object;
    onClickNext: () => void;
    drm: {
      keySystem: "com.widevine.alpha" | "com.microsoft.playready" | "com.apple.fps",
      serverUrl: string,
      certificate: ArrayBufferLike,
      certificateUrl: string,
      servers: {
        advanced:  [string],
      },
      robustness:Robustness;
      authType: 'header' | 'parameter',
      headerKey: string,
      headerValue: string,
      parameterValue: string,
      withCookie?: boolean,
    };
  };

  export type PlayerAttributes = {
    api: PlayerApi;
    eventDomElement: HTMLDivElement;
    domElement: HTMLDivElement | null | undefined;
    clickActivatedOnTouchDevice: boolean;
    triggerReadyforpreroll: EventListener;
    triggerReadyforpostroll: EventListener;
    videoTag: HTMLVideoElement | null | undefined;
    videoProvider?: {
      getVideoUrl: () => string;
      EmptyVideoData: () => void;
      detach: () => void;
      destroy: () => void;
      load: (videoUrl: PlaylistEntry["videoUrl"], drm: PlayerProps["drm"], videoProviderOptions: PlayerProps["videoProviderOptions"]) => void;
    };
    mouseEnterTimeout?: number;
    shouldPlayOnRelease?: boolean | undefined;
    singleClickActionTimeOut?: number;
    handleChecksTimeout?: number;
  }

  export interface PlayerFunctions {
    setShouldPlayOnRelease: (value: PlayerAttributes["shouldPlayOnRelease"]) => void;
    unHoverTooltips: () => void;
    setIsComplete: (isComplete: PlayerState["isComplete"]) => void;
    setIsDragging: (isDragging: PlayerState["isDragging"]) => void;
    setIsSettingsOpen: (isSettingsOpen: PlayerState["isSettingsOpen"]) => void;
    resetToPreview: () => void;
    clickEventListener: (evt: {
      target:HTMLElement,
    }) => void;
  }

  interface AudioTrack {
    id: string;
    name: string;
    label: string;
    language: string;
    role: string;
    selected: boolean;
  }
  
  interface VideoTrack {
    id: string;
    name: string;
    kind?: string;
    label: string;
    language?: string;
    selected?: boolean;
    width?: number;
    height?: number;
    bitrate?: number;
    hd?: boolean;
    uhd?: boolean;
    hdr?: boolean;
  }
  
  // named ShakaTextTrack because TextTrack is a native type from HTML
  interface ShakaTextTrack {
    id: string;
    name: string;
    label: string;
    roles?: string[];
    forced?: boolean;
    originalTextId?: string;
    language: string;
    kind: TextTrackKind;
    active?: boolean;
    selected?: boolean;
  }

  type CustomEventDetail = {
    videoUrl?: PlaylistEntry["videoUrl"];
    muted?: PlaylistEntry["muted"];
    volume?: PlaylistEntry["volume"];
    message?: string;
    name?: string;
    currentTime?: number;
    duration?: number;
    active?: boolean;
    isFullScreen?: PlayerState["isFullScreen"];
    isLive?: PlayerState["isLive"];
    availability?: string;
    comingFromClick?: boolean;
    videoTracks?: Array<VideoTrack>;
    audioTracks?: Array<AudioTrack>;
    textTracks?: Array<ShakaTextTrack>;
    abr?: boolean;
    height?: number;
    width?: number;
    bandwidth?: number;
    language?: string;
    roles?: Array<string>;
    role?: string;
    hd?: boolean;
    uhd?: boolean;
    hdr?: boolean;
    error?: unknown
  }

  interface TimeProps {
    eventDomElement: PlayerAttributes['eventDomElement'];
    duration?: number;
  }

  interface VideoProps {
    imageUrl?: Metadata['imageUrl'];
    aspect:  PlaylistEntry['aspect']
    isTouchDevice: PlayerProps['isTouchDevice'];
  }

  export type ControlProps = PlayerState
  & Pick<PlayerProps, 'entitlements' | 'color' | 'isTouchDevice' | 'onClickPrevious' | 'onClickNext'>
  & Pick<PlayerFunctions, 'setShouldPlayOnRelease' | 'unHoverTooltips' | 'setIsComplete' | 'setIsDragging' | 'setIsSettingsOpen' | 'clickEventListener'>
  & Pick<PlayerAttributes, 'eventDomElement' | 'clickActivatedOnTouchDevice' | 'shouldPlayOnRelease'>
  & {
    metadata?: Metadata,
    api: PlayerApi;
  }

  export type ButtonProps = PlayerState
  & Pick<PlayerProps, 'isTouchDevice' | 'onClickPrevious' | 'onClickNext' | 'entitlements'>
  & {
    onClickSettingsIcon: () => void;
    shouldHover: PlayerState['isSettingsOpen'];
    color: PlayerProps['color'];
    api: PlayerApi;
    eventDomElement: PlayerAttributes['eventDomElement'];
    setShouldPlayOnRelease: PlayerFunctions['setShouldPlayOnRelease'];
    clickActivatedOnTouchDevice:  PlayerAttributes['clickActivatedOnTouchDevice'];
  }

  export type GoToButtonProps = {
    api: PlayerApi;
    title: GoToButton['title'];
    targetTime: GoToButton['targetTime'];
  }

  export type SettingsProps = PlayerState & {
    api: PlayerApi;
    isTouchDevice: PlayerProps['isTouchDevice'];
    eventDomElement: PlayerAttributes['eventDomElement'];
    onClickSettingsIcon: ButtonProps['onClickSettingsIcon'];
    isOpen: PlayerState['isSettingsOpen'];
  }

  interface InfoProps { title: Metadata['title']; description: Metadata['description']; isTouchDevice: PlayerProps['isTouchDevice']; }

  export type TimelineProps = PlayerState & {
    eventDomElement: PlayerAttributes['eventDomElement'];
    onMouseDown: EventListener;
    onMouseUp: EventListener;
    onTouchEnd: EventListener;
    api: PlayerApi;
    setIsComplete: PlayerFunctions['setIsComplete'];
    isTouchDevice: PlayerProps['isTouchDevice'];
    color: PlayerProps['color'];
    clickActivatedOnTouchDevice: PlayerAttributes['clickActivatedOnTouchDevice'];
  }

  interface ButtonsLeftProps {
    isAdPlayer?: boolean;
    duration: PlayerState["duration"];
    shouldHover: PlayerState['isSettingsOpen'];
    isTouchDevice: PlayerProps['isTouchDevice'];
    onClickPrevious: PlayerProps['onClickPrevious'];
    onClickNext: PlayerProps['onClickNext'];
    color: PlayerProps['color'];
    api: PlayerApi;
    eventDomElement: PlayerAttributes['eventDomElement'];
    setShouldPlayOnRelease: PlayerFunctions['setShouldPlayOnRelease'];
    clickActivatedOnTouchDevice: PlayerAttributes['clickActivatedOnTouchDevice'];
  }

  interface ButtonsRightProps {
  api: PlayerApi;
  eventDomElement: HTMLDivElement;
  onClickSettingsIcon: () => void;
  shouldHover: PlayerState['isSettingsOpen'];
  isTouchDevice: PlayerProps['isTouchDevice'];
  isAdPlayer?: boolean;
  isLive: PlayerState["isLive"];
  entitlements: PlayerProps['entitlements'];
  clickActivatedOnTouchDevice: PlayerAttributes['clickActivatedOnTouchDevice'];
}

  interface RangeSliderProps {
    max: number;
    val: number;
    ariaLabel: string;
    className: string;
    tabIndex: number;
    onMouseDown?: (event: MouseEvent | TouchEvent) => void;
    onMouseUp?: (event: MouseEvent | TouchEvent) => void;
    onTouchEnd?: (event: TouchEvent) => void;
    onDragMove?: (ratio: number) => void;
    vttThumbnailsData?: PlayerState['vttThumbnailsData'];
    vttChaptersData?: PlayerState['vttChaptersData'];
    isTouchDevice?: boolean;
    color?: string;
    clickActivatedOnTouchDevice?: boolean;
    isAdPlayer?: boolean;
  }
}
