import { log, isAppleDevice, isNumeric } from './lib';
import i18n from './i18n';
import { triggerSolidEvent, solidEvents } from './events';

import { VideoProvider } from './videoProvider';
import { ErrorIcon } from '../components/Icon';
import { PlaylistEntry } from '@oberplayer-free/oberplayer';

class ShakaProvider extends VideoProvider {
  private options: ShakaProviderOptions;
  private shouldDisplayBandwidth: boolean;
  shakaPlayer: ShakaPlayer;

  constructor(options: ShakaProviderOptions) {
    super();
    // @ts-expect-error 
    this.shakaPlayer = {};
    this.options = options;
    this.shouldDisplayBandwidth = false;
    this.options.api.setVideoTrack = this.setVideoTrack.bind(this);
    this.options.api.setAudioTrack = this.setAudioTrack.bind(this);
    this.options.api.setTextTrack = this.setTextTrack.bind(this);
    this.options.api.hideTextTracks = this.hideTextTracks.bind(this);
    this.options.api.getActiveTextTrack = this.getActiveTextTrack.bind(this);
    this.options.api.getActiveVariant = this.getActiveVariant.bind(this);
    this.options.api.setForcedTextTrack = this.setForcedTextTrack.bind(this);
  }

  async init() {
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
        const shakaModule = await import('./vendor/shaka-player.compiled');
        globalThis.shaka = shakaModule.default;
        globalThis.shaka.polyfill.installAll();

        if (!globalThis.shaka.Player.isBrowserSupported()) {
          this.options.displayMessage({
            icon: ErrorIcon(),
            text: 'Sorry your browser is not compatible with the player',
          });
        }

        this.shakaPlayer = new globalThis.shaka.Player(this.options.videoTag);

      } catch (error) {
        console.error('Erreur lors de l\'importation de Shaka:', error);
      }
    }
    return this;
  }

  async detach() {
    return this.shakaPlayer.detach();
  }

  async load(videoUrl: string, drm: PlayerProps['drm'], videoProviderOptions?: PlayerProps['videoProviderOptions']) {
    if (globalThis.bpdebug) log('info', `Now loading ${videoUrl || this.getVideoUrl()}`);

    this.options.videoUrl = videoUrl;
    if (videoProviderOptions) {
      this.shakaPlayer.configure(videoProviderOptions);
    }

    this.shakaPlayer.addEventListener(
      'adaptation',
      () => {
        const variants = this.shakaPlayer.getVariantTracks();
        const activeTrack = variants.find((t: Variant) => t.active);
        const { isHd, isUhd, isHdr } = this.getNameAndPropsFromVariant(activeTrack);
        triggerSolidEvent(
          this.options.eventDomElement,
          solidEvents.VIDEOTRACKCHANGED,
          {
            hd: isHd,
            uhd: isUhd,
            hdr: isHdr,
          },
          this.options.isAdPlayer,
        );
      }
    );

    this.shakaPlayer.addEventListener('variantchanged', () => {
      const variants = this.shakaPlayer.getVariantTracks();
      const activeTrack = variants.find((t: Variant) => t.active);
      const { isHd, isUhd, isHdr } = this.getNameAndPropsFromVariant(activeTrack);
      triggerSolidEvent(
        this.options.eventDomElement,
        solidEvents.VIDEOTRACKCHANGED,
        {
          hd: isHd,
          uhd: isUhd,
          hdr: isHdr,
        },
        this.options.isAdPlayer,
      );
    });

    if (drm) {
      this.handleDrm(drm);
    }

    const videoTracks: VideoTrack[] = [];
    const audioTracks: AudioTrack[] = [];
    const textTracks: ShakaTextTrack[] = [];

    const onCanPlay = () => {
      const variants = this.shakaPlayer.getVariantTracks();

      this.options.eventDomElement.removeEventListener(solidEvents.CANPLAY, onCanPlay);

      triggerSolidEvent(
        this.options.eventDomElement,
        solidEvents.VIDEOTYPE,
        {
          isLive: this.shakaPlayer.isLive(),
        },
        this.options.isAdPlayer,
      );

      if (variants.length > 0 || isAppleDevice()) {
        

        const activeVariant = this.getActiveVariant();

        if (this.shakaPlayer.getTextTracks().length > 0) {
          

          textTracks.push({
            id: 'none',            
            name: 'none',
            label: '',
            roles: [],
            forced: false,
            originalTextId: '',
            language: '',
            kind: 'subtitles',
            active: false,
            selected: false,
          } as ShakaTextTrack);
          this.shakaPlayer.getTextTracks().forEach((textTrack: ShakaTextTrack) => {
            let id = '';
            textTrack.roles?.forEach((role: string) => {
              id += `${role}|`;
            });
            if (!textTrack.forced) {
              let textTrackLabel = textTrack.label;
              if (!textTrackLabel) {
                if (textTrack.originalTextId && !isNumeric(textTrack.originalTextId)) {
                  textTrackLabel = textTrack.originalTextId;
                } else {
                  textTrackLabel = i18n.t(`languageLabels.${textTrack.language}`);
                }
              }

              textTracks.push({
                language: textTrack.language,
                kind: textTrack.kind as TextTrackKind,
                name: textTrack.kind === 'captions' ? `CC (${textTrackLabel})` : textTrackLabel,
                label: textTrack.kind === 'captions' ? `CC (${textTrackLabel})` : textTrackLabel,
                selected: textTrack.active,
                id: `${textTrack.language}_${id.slice(0, -1)}`,
              });
            }
          });
          triggerSolidEvent(this.options.eventDomElement, solidEvents.TEXTTRACKS, { textTracks }, this.options.isAdPlayer);
        }

        if (this.shakaPlayer.getAudioLanguagesAndRoles().length > 1) {
          this.shakaPlayer.getAudioLanguagesAndRoles().forEach((audioTrack: AudioTrack) => {
            if (audioTrack.language !== 'und') {
              let audioTrackLabel = audioTrack.label;
              if (!audioTrackLabel) {
                audioTrackLabel = i18n.t(`languageLabels.${audioTrack.language}`);
              }

              audioTracks.push({
                language: audioTrack.language,
                name: audioTrackLabel,
                label: audioTrackLabel,
                role: audioTrack.role,
                selected:
                  audioTrack.language === activeVariant.language &&
                  (audioTrack.role === activeVariant.audioRoles[0] ||
                    (audioTrack.role === '' && activeVariant.audioRoles.length === 0)),
                id: `${audioTrack.language}${audioTrack.role ? `_${audioTrack.role}` : ''}`,
              });
            }
          });
          triggerSolidEvent(this.options.eventDomElement, solidEvents.AUDIOTRACKS, { audioTracks }, this.options.isAdPlayer);
        }

        const reducedVariants = variants.reduce((accumulator: Variant[], current: Variant) => {
          if (!accumulator.find((item: Variant) => (item.videoBandwidth ? item.videoBandwidth === current.videoBandwidth : item.bandwidth === current.bandwidth))) {
            accumulator.push(current);
          }
          return accumulator;
        }, []);

        if (reducedVariants.length > 1) {
          videoTracks.push({
            name: 'Auto',
            id: 'auto',
            label: 'auto',
            selected: false,
          });

          const orderedReducedVariants = reducedVariants.sort(VideoProvider.sortByHeightThenByBandwidth);
          this.shouldDisplayBandwidth = false;
          orderedReducedVariants.forEach((variant: Variant) => {
            if (this.shakaPlayer.getVariantTracks().filter((track: Variant) => VideoProvider.getResolutionLabelFromWidth(track.width) === VideoProvider.getResolutionLabelFromWidth(variant.width)).length > 1) {
              this.shouldDisplayBandwidth = true;
            }
          });

          orderedReducedVariants.forEach((variant: Variant) => {
            const { isHd, isUhd, isHdr, name } = this.getNameAndPropsFromVariant(variant);
            const videoTrack: VideoTrack = {
              width: variant.width,
              height: variant.height,
              bitrate: VideoProvider.getVideoBandwidthFromVariant(variant),
              name: name || '',
              label: name || '',
              selected: this.shakaPlayer.getConfiguration().abr.enabled === false
              ? VideoProvider.getVideoBandwidthFromVariant(variant) === VideoProvider.getVideoBandwidthFromVariant(activeVariant) && variant.height === activeVariant.height
              : false,
              id: VideoProvider.getVideoBandwidthFromVariant(variant).toString(),
              hd: isHd,
              uhd: isUhd,
              hdr: isHdr
            };
            videoTracks.push(videoTrack);
          });
          triggerSolidEvent(this.options.eventDomElement, solidEvents.VIDEOTRACKS, { videoTracks }, this.options.isAdPlayer);
        }
      }
    };
    this.options.eventDomElement.addEventListener(solidEvents.CANPLAY, onCanPlay);

    type ShakaError  = {code: number, category: number, severity: number, message: string};

    // Vérification de type personnalisée pour ShakaError
    function isShakaError(error: unknown): error is ShakaError {
      console.info('error', error)
      return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'category' in error &&
        'severity' in error &&
        typeof (error as ShakaError).code === 'number' &&
        typeof (error as ShakaError).category === 'number' &&
        typeof (error as ShakaError).message === 'string' &&
        typeof (error as ShakaError).severity === 'number'
      );
    }

    try {
      await this.shakaPlayer.load(videoUrl || this.getVideoUrl());
    } catch (error: unknown) {
      log('error', error);
      if (isShakaError(error)) {
        if (error.severity === globalThis.shaka.util.Error.Severity.CRITICAL && error.code !== 7000) {
          triggerSolidEvent(this.options.eventDomElement, solidEvents.ERROR, { error }, this.options.isAdPlayer);
          if (!this.options.isAdPlayer === true) {
            this.options.displayMessage({
              icon: ErrorIcon(),
              text: `${error.message}: ${VideoProvider.getShakaErrorMessage(error.code)}`,
            });
          }
        }
      }
    }

    // set volume and muted
    let volumeToSet = this.options.volume as number;
    let mutedToSet = this.options.muted as boolean;
    
    this.options.api.setVolume(volumeToSet);
    this.options.api.setMute(mutedToSet);

    await this.handleAutoplay();
  };

  getVideoUrl(): PlaylistEntry["videoUrl"] {
    return this.options.videoUrl;
  }

  getConfiguration(): ShakaPlayerConfiguration {
    return this.shakaPlayer.getConfiguration();
  }

  getNameAndPropsFromVariant(variant: Variant | undefined) {
    let isHd = false;
    let isUhd = false;
    let isHdr = false;
    let name;
    let bandwidth;

    if(variant) {
      isHdr = variant.hdr === true || variant.hdr === 'PQ' || variant.hdr === 'HLG';
      if (variant.width >= 3840) {
        isUhd = true;
      } else if (variant.width >= 1920) {
        isHd = true;
      }
      bandwidth = VideoProvider.getVideoBandwidthFromVariant(variant);
      // audio only ?
      if (!variant.width) {
        name = `${this.shouldDisplayBandwidth ? `${VideoProvider.getHumanReadableBandWidthFromBits(bandwidth)}` : ''}`;
      } else {
        name = `${VideoProvider.getResolutionLabelFromWidth(variant.width)}${this.shouldDisplayBandwidth ? ` @ ${VideoProvider.getHumanReadableBandWidthFromBits(bandwidth)}` : ''}`;
      }
    }

    return {
      isHd,
      isUhd,
      isHdr,
      name,
    };
  }

  hideTextTracks() {
    this.shakaPlayer.setTextTrackVisibility(false);
  }

  setTextTrack(language: string, roles?: string[], forced = false) {
    this.shakaPlayer.selectTextLanguage(language, roles ? roles[roles.length - 1] : '', forced);
    this.shakaPlayer.setTextTrackVisibility(true);
    triggerSolidEvent(
      this.options.eventDomElement,
      solidEvents.TEXTTRACKASKED,
      { language: forced ? undefined : language, roles: forced ? undefined : roles },
      this.options.isAdPlayer,
    );
  }

  setForcedTextTrack() {
    const forcedShakaTextTracks = this.getForcedShakaTextTracks();
    if (forcedShakaTextTracks.length > 0) {
      this.setTextTrack(forcedShakaTextTracks[0].language, forcedShakaTextTracks[0].roles, true);
    }
  }

  getActiveVariant() {
    return this.shakaPlayer.getVariantTracks().filter((variant: Variant) => variant.active)[0];
  }

  getForcedShakaTextTracks() {
    return this.shakaPlayer.getTextTracks().filter((textTrack: ShakaTextTrack) => textTrack.forced === true);
  }

  getActiveTextTrack() {
    return this.shakaPlayer.getTextTracks().filter((textTrack: ShakaTextTrack) => textTrack.active === true)[0];
  }

  setVideoTrack(videoBandwidth: string) {
    if (videoBandwidth === 'auto') {
      this.shakaPlayer.configure({ abr: { enabled: true } });
      triggerSolidEvent(this.options.eventDomElement, solidEvents.VIDEOTRACKASKED, { abr: true }, this.options.isAdPlayer);
    } else {
      const activeVariant = this.getActiveVariant();
      const variantToSelect = this.shakaPlayer
        .getVariantTracks()
        .find((variant: Variant) => VideoProvider.getVideoBandwidthFromVariant(variant) === parseInt(videoBandwidth, 10) && variant.label === activeVariant.label);

      if (variantToSelect) {
        this.shakaPlayer.configure({ abr: { enabled: false } });
        this.shakaPlayer.selectVariantTrack(variantToSelect, true);
        triggerSolidEvent(
          this.options.eventDomElement,
          solidEvents.VIDEOTRACKASKED,
          { height: variantToSelect.height, width: variantToSelect.width, bandwidth: VideoProvider.getVideoBandwidthFromVariant(variantToSelect), abr: false },
          this.options.isAdPlayer,
        );
      }
    }
  }

  setAudioTrack(language: string, role?: string) {
    this.shakaPlayer.selectAudioLanguage(language, role);
    triggerSolidEvent(this.options.eventDomElement, solidEvents.AUDIOTRACKASKED, { language, role }, this.options.isAdPlayer);
  }

  destroy() {
    if (globalThis.bpdebug) log('info', `Now destroying provider shaka ${this.getVideoUrl()}`);

    this.EmptyVideoData();
    this.shakaPlayer.resetConfiguration();
    this.shakaPlayer.unload();

    return this.shakaPlayer && this.shakaPlayer.destroy();
  }

  handleAutoplay() {
    if (!this.options.autoplay) {
      this.setPlayerToWaitingState();
    } else {
      if (this.options.videoTag instanceof HTMLVideoElement) {
        this.options.videoTag.play().catch(() => {
          if (this.options.videoTag) {
            this.options.videoTag.muted = true;
            this.options.videoTag.play().catch((mutedError: Error) => {
              if (!this.options.isAdPlayer) {
                this.options.resetToPreview();
              }
              log('error', mutedError);
            });
          }
        });
      }
    }
  }

  setPlayerToWaitingState() {
    this.options.domElement?.classList.add('is--waitingforclick');
  }

  handleDrm(drm: PlayerProps["drm"]) {
    if (drm.keySystem === 'com.widevine.alpha' || drm.keySystem === 'com.microsoft.playready') {
      const serversOptions: { [key: string]: string } = {};
      serversOptions[drm.keySystem] = drm.serverUrl;
      this.shakaPlayer.configure({
        drm: {
          servers: serversOptions,
        },
      });
    }

    if (drm.keySystem === 'com.apple.fps') {
      if (drm.certificate) {
        this.shakaPlayer.configure({'drm.advanced.com\\.apple\\.fps.serverCertificate': new Uint8Array(drm.certificate)});
      }
      if (drm.certificateUrl) {
        this.shakaPlayer.configure({'drm.advanced.com\\.apple\\.fps.serverCertificateUri': drm.certificateUrl});
      }
    }

    if (drm.servers && drm.servers.advanced) {
      const robustnessOption: RobustnessOption = {};
      robustnessOption[drm.keySystem] = {
        videoRobustness: drm.robustness.videoRobustness,
        audioRobustness: drm.robustness.audioRobustness,
      };
      this.shakaPlayer.configure({
        drm: {
          advanced: robustnessOption,
        },
      });
    }

    this.shakaPlayer.getNetworkingEngine().registerRequestFilter((type, request) => {
      if (type === globalThis.shaka.net.NetworkingEngine.RequestType.LICENSE) {
        if (drm.authType === 'header' && drm.headerKey && drm.headerValue) {
          request.headers[drm.headerKey] = drm.headerValue;
        }
        if (drm.authType === 'parameter' && drm.parameterValue) {
          request.uris[0] += drm.parameterValue;
        }
        if (drm.withCookie === true) {
          request.allowCrossSiteCredentials = true;
        }
      }
    });
  }

  EmptyVideoData() {
    triggerSolidEvent(this.options.eventDomElement, solidEvents.VIDEOTRACKS, {}, this.options.isAdPlayer);
    triggerSolidEvent(this.options.eventDomElement, solidEvents.AUDIOTRACKS, {}, this.options.isAdPlayer);
    triggerSolidEvent(this.options.eventDomElement, solidEvents.TEXTTRACKS, {}, this.options.isAdPlayer);
  }
}

export default ShakaProvider;
