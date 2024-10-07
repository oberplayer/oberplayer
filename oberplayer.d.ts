declare module '@oberplayer-free/oberplayer' {
    type SolidEvents =
      | 'play'
      | 'firstplay'
      | 'tryingtoplay'
      | 'canplay'
      | 'pause'
      | 'airplay'
      | 'cast'
      | 'fullscreen'
      | 'volume'
      | 'mute'
      | 'seeking'
      | 'seeked'
      | 'ended'
      | 'beforeended'
      | 'buffering'
      | 'time'
      | 'metadata'
      | 'audiotracks'
      | 'audiotrackasked'
      | 'texttracks'
      | 'texttrackasked'
      | 'videotracks'
      | 'videotrackchanged'
      | 'videotrackasked'
      | 'videotype'
      | 'ready'
      | 'next'
      | 'previous'
      | 'load'
      | 'setup'
      | 'clickctavast'
      | 'advolume'
      | 'admute'
      | 'adpause'
      | 'adplay'
      | 'error';

    type PlayerApi = {
      play: () => Promise<void>;
      pause: () => void;
      togglePlay: () => void;
      seek: (seconds: number) => void;
      getPosition: () => number;
      getVolume: () => number;
      setVolume: (volume: number) => void;
      getDuration: () => number;
      getMute: () => boolean;
      setMute: (muted: boolean, shouldSetUserPrefs?: boolean) => void;
      toggleMute: (shouldSetUserPrefs: boolean) => void;
      toggleFullScreen: () => void;
      getState: () => 'paused' | 'ended' | 'playing' | 'buffering';
      playOnAirplay: () => void;
      setPlaybackRate: (rate: number) => void;
      setVideoTrack: (videoBandwidth: string) => void;
      setAudioTrack: (language: string, role: string | undefined) => void;
      getActiveTextTrack: () => ShakaTextTrack;
      getActiveVariant: () => Variant;
      setForcedTextTrack: () => void;
      setTextTrack: (language: string, roles: string[]) => void;
      hideTextTracks: () => void;
    };

    type Vast = {
      vastUrl?: string;
      vmapUrl?: string;
    };

    type Geolocation = {
      country: string,
      region: string,
    };

    type Restrictions = {
      age?: number;
      time?: {
        from: string;
        to: string;
      }
    };

    type Rights = {
      from?: Date;
      to?: Date;
    };

    type checkResult = {
      name: string;
      data?: {
        restrictions?: Restrictions;
        rights?: Rights;
      },
      result: string;
    }

    type GoToButton = {
      title: string;
      visibleFrom: number;
      visibleUntil: number;
      targetTime: number;
    };
    
    type GoToButtons = GoToButton[]; // Tableau d'objets GoToButton

    type Metadata = {
      title: string;
      description: string;
      imageUrl: string;
    }

    type PlaylistEntry = {
      videoUrl: string;
    } & Partial<{
      videoProviderOptions: unknown;
      autoplay: boolean;
      volume: ReturnType<PlayerApi['getVolume']>;
      muted: ReturnType<PlayerApi['getMute']>;
      aspect: 'player' | 'browser' | 'chromeless';
      aspectRatio: string;
      vast: Vast;
      rights: Rights;
      restrictions: Restrictions;
      geolocation: Geolocation;
      goToButtons: GoToButtons;
      thumbnailsVttUrl: string;
      chaptersVttUrl: string;
      metadata: Metadata;
    }>;

    type Phrases = typeof import('./src/locales.json');

    type PlayerOptions = {
      playlist: Array<PlaylistEntry>;
      lang?: keyof Phrases;
      phrases?: Phrases;
      debug?: boolean;
      token?: string;
      color?: string;
      chromecast_receiver_id?: string;
    };

    type DefaultPlayerConfig = {
      autoplay: boolean;
      volume: number;
      aspect: string;
      lang: keyof Phrases;
      aspectRatio: string;
    };

    type UppercasedSolidEvents = Uppercase<SolidEvents>;

    type SolidEventsMap = {
      [T in UppercasedSolidEvents]: Lowercase<T>;
    } & {
      // Add non conventional event names below
      BEFOREENDED: 'beforeended';
    };

  export type Oberplayer = {
    setup: (options: PlayerOptions) => Promise<Oberplayer>;
    on: (eventName: SolidEvents, callback: () => void) => void;
    off: (eventName: SolidEvents, callback: () => void) => void;
    destroy: () => void;
    api: PlayerApi;
  };

  export default function (domElement?: HTMLDivElement): Oberplayer;
  export function getCdnBaseUrl(): string;
  export function secondsToHumanreadableDuration(): string;
  export const solidEvents: SolidEvents;
  export const defaultPlayerConfig: DefaultPlayerConfig;
}
