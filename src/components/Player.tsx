import { Component, createRef, RefObject } from 'preact';
import { version } from '../../package.json';
import Video from './Video.tsx';
import Settings from './Settings.tsx';
import GoToButton from './GoToButton.tsx';
import { mapSolidEvents, triggerSolidEvent, handleOnLoadedmetadata } from '../modules/events.ts';
import mapApi from '../modules/api.js';
import { handleCss } from './Player.lib.ts';
import { AutoRenew, Refresh, ErrorIcon } from './Icon.tsx';
import i18n from '../modules/i18n.ts';
import Controls from './Controls.tsx';
import ShakaProvider from '../modules/shaka.js';
import { log } from '../modules/lib.js';
import { PlayerApi, checkResult } from '@oberplayer-free/oberplayer';
import { getCdnBaseUrl } from '../modules/lib.ts';
import { solidEvents } from '../modules/events.ts'; // Import from your type definitions


export default class Player extends Component<PlayerProps, PlayerState> implements PlayerAttributes, PlayerFunctions {
  ref: RefObject<HTMLDivElement> | null = null;
  api: PlayerAttributes["api"];
  domElement: PlayerAttributes["domElement"];
  eventDomElement: PlayerProps["eventDomElement"];
  clickActivatedOnTouchDevice: PlayerAttributes["clickActivatedOnTouchDevice"];
  triggerReadyforpreroll: PlayerAttributes["triggerReadyforpreroll"];
  triggerReadyforpostroll: PlayerAttributes["triggerReadyforpostroll"];
  videoTag: PlayerAttributes["videoTag"];
  videoProvider: PlayerAttributes["videoProvider"];
  lastEvent: string | undefined;
  mouseEnterTimeout: PlayerAttributes["mouseEnterTimeout"];
  singleClickActionTimeOut: PlayerAttributes["singleClickActionTimeOut"];
  shouldPlayOnRelease: PlayerAttributes["shouldPlayOnRelease"];
  handleChecksTimeout: PlayerAttributes["handleChecksTimeout"];

  constructor(props:PlayerProps) {
    super(props);
    const { eventDomElement, autoplay, muted, restrictions, rights, geolocation, entitlements, chaptersVttUrl, thumbnailsVttUrl, token } = this.props as PlayerProps;
    // use "isAdPlayer" as "isAd" is hide by adBlock :)
    this.state = {
      // will apply class on container
      isPaused: true,
      isWaitingForClick: !autoplay,
      isReady: false,
      isBuffering: autoplay,
      isControlsVisible: false,
      isStylesheetLoaded: false,
      isMuted: muted,
      chaptersVttUrl,
      thumbnailsVttUrl,
      // update internally
      restrictions,
      rights,
      geolocation,
      autoplay,
      duration: 0,
    };

    
    eventDomElement.addEventListener(solidEvents.TIME, (evt) => {
      if (entitlements && entitlements.goToButton) {
        const customEvent = evt as CustomEvent
        this.setState({ goToButtonData: this.getGoToButtonData(customEvent.detail.currentTime) });
      }
    });
    eventDomElement.addEventListener(solidEvents.MUTE, (evt) => {
      const customEvent = evt as CustomEvent;
      this.setState({ isMuted: customEvent.detail.muted });
    });
    eventDomElement.addEventListener(solidEvents.METADATA, (evt) => {
      const customEvent = evt as CustomEvent
      this.setState({ duration: customEvent.detail.duration });
    });
    eventDomElement.addEventListener(solidEvents.CAST, (evt) => {
      const customEvent = evt as CustomEvent
      this.setState({ isChromecasting: customEvent.detail.active });
    });
    eventDomElement.addEventListener(solidEvents.PAUSE, () => {
      this.setState({ isPaused: true });
      this.setState({ isControlsVisible: true });
    });
    eventDomElement.addEventListener(solidEvents.PLAY, () => {
      this.setState({ isPaused: false });
      this.setState({ isControlsVisible: true });
      this.resetMouseEnterTimeout();
    });
    eventDomElement.addEventListener(`ad${solidEvents.METADATA}`, (evt) => {
      const customEvent = evt as CustomEvent
      this.setState({ duration: customEvent.detail.duration });
    });
    eventDomElement.addEventListener(`ad${solidEvents.PAUSE}`, () => {
      this.setState({ isPaused: true });
    });
    eventDomElement.addEventListener(`ad${solidEvents.PLAY}`, () => {
      this.setState({ isPaused: false });
    });
    this.ref = createRef();
    this.api = {} as PlayerApi;
    // use for touch device only, means when a click action is possible or not
    this.clickActivatedOnTouchDevice = true;
    this.eventDomElement = eventDomElement;
    this.setShouldPlayOnRelease = this.setShouldPlayOnRelease.bind(this);
    this.triggerReadyforpreroll = () => {
      const { isAdPlayer } = this.state;
      // trigger only in case of regular player
      if (!isAdPlayer) {
        triggerSolidEvent(this.eventDomElement, 'readyforpreroll');
      }
      this.eventDomElement.removeEventListener(solidEvents.TRYINGTOPLAY, this.triggerReadyforpreroll);
    };
    this.triggerReadyforpostroll = () => {
      const { isAdPlayer } = this.state;
      // trigger only in case of regular player
      if (!isAdPlayer) {
        triggerSolidEvent(this.eventDomElement, 'readyforpostroll');
      }
      this.eventDomElement.removeEventListener(solidEvents.BEFOREENDED, this.triggerReadyforpostroll);
    };
  }

  isPlayingAdVideo = () => this.videoProvider?.getVideoUrl() !== this.props.videoUrl;

  setIsDragging: PlayerFunctions["setIsDragging"] = (isDragging) => this.setState({ isDragging });

  setIsSettingsOpen: PlayerFunctions["setIsSettingsOpen"] = (isSettingsOpen) => {this.setState({ isSettingsOpen })};

  setIsComplete: PlayerFunctions["setIsComplete"] = (isComplete) => this.setState({ isComplete });

  resetToPreview: PlayerFunctions["resetToPreview"] = () => this.setState({
    isWaitingForClick: true,
  });

  async componentDidMount() {
    const { entitlements, videoUrl } = this.props;

    this.domElement = this.ref?.current;

    if (this.domElement) {
      const videoTag = this.domElement.querySelector('video');
      if (videoTag !== null) {
        this.videoTag = videoTag;
      }

      this.setListeners();

      if (this.domElement.offsetWidth < 520) {
        this.setState({ isSmall: true });
      } else {
        this.setState({ isSmall: false });
      }
    }

    // load css
    try {
      await handleCss(getCdnBaseUrl());
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.displayMessage({
          icon: ErrorIcon(),
          text: error.message,
        });
      }
      return;
    }

    // controls can be now displayed properly
    this.setState({ isStylesheetLoaded: true });
    // dom can be modified
    triggerSolidEvent(this.eventDomElement, solidEvents.READY);

    mapSolidEvents(this.domElement, this.eventDomElement, this.isPlayingAdVideo, this.api, videoUrl);

    // now call one resize to apply the right size class
    this.domElement?.dispatchEvent(new Event('resize'));
    document.addEventListener('keydown', this.handleKeyDown, false);

    // listener to manage click outside the player actions
    document.addEventListener('click', this.handleGlobalClick);

    if (!entitlements) {
      await this.makeChecksAndLoadVideo();
    } else {
      
      // all tests ok let's go
      await this.makeChecksAndLoadVideo();
    }
  }

  async UNSAFE_componentWillReceiveProps() {
    // remove this event listener if still there
    this.eventDomElement.removeEventListener(solidEvents.TRYINGTOPLAY, this.triggerReadyforpreroll);
    this.eventDomElement.removeEventListener(solidEvents.BEFOREENDED, this.triggerReadyforpostroll);
  }

  async componentDidUpdate(prevProps:PlayerProps) {
    const { autoplay, restrictions, rights, geolocation, chaptersVttUrl, thumbnailsVttUrl, videoUrl, aspect } = this.props;

    // aspect has change to "player" so after having been hidden
    // we have to retrigger volume and duration for them to be displayed
    if (prevProps.aspect !== aspect && aspect === 'player') {
      handleOnLoadedmetadata(this.videoTag, this.eventDomElement, this.isPlayingAdVideo);
    }

    if (this.shouldLoadNewVideo(prevProps as PlayerProps)) {
      // destroy timeout
      clearTimeout(this.handleChecksTimeout);
      clearTimeout(this.mouseEnterTimeout);
      clearTimeout(this.singleClickActionTimeOut);

      // reset state
      this.setState({
        isHovered: false,
        isControlsVisible: false,
        isBuffering: autoplay,
        isMessage: false,
        isMessageUnderClickCatcher: false,
        message: undefined,
        isSettingsOpen: false,
        isWaitingForClick: !autoplay,
        isPaused: true,
        isPlaying: false,
        isReady: false,
        isComplete: false,
        chaptersVttUrl: undefined,
        thumbnailsVttUrl: undefined,
        goToButtonData: undefined,
      } as Partial<PlayerState>
      , () => {
        // update restrictions, isAdplayer and state from props
        
        this.setState({ restrictions, rights, geolocation, chaptersVttUrl, thumbnailsVttUrl, isAdPlayer: false }, async () => {
          // has to be tested as a video could have not be played (restrictions case)
          if (this.videoProvider) {
            this.videoProvider.EmptyVideoData();

            // detach the current video (detach is ok if there is a new video to come)
            if (videoUrl) {
              await this.videoProvider.detach();
            } else { // otherwise it should be destroy (case no videoUrl provided)
              await this.videoProvider.destroy();
            }
          }

          this.eventDomElement.addEventListener(solidEvents.TRYINGTOPLAY, this.triggerReadyforpreroll);
          this.eventDomElement.addEventListener(solidEvents.BEFOREENDED, this.triggerReadyforpostroll);

          await this.makeChecksAndLoadVideo();
        });
      });
    }
  }

  componentWillUnmount() {
    this.destroy();
  }

  setShouldPlayOnRelease: PlayerFunctions['setShouldPlayOnRelease'] = (value) =>{
    this.shouldPlayOnRelease = value;
  }

  displayMessage = (message : PlayerState["message"], isMessageUnderClickCatcher:PlayerState["isMessageUnderClickCatcher"] = false) => {
    this.setState({
      // avoid controls to be displayed when rollover on a message if autoplay is true (see full-otion example)
      isWaitingForClick: true,
      isReady: true,
      isMessage: true,
      isMessageUnderClickCatcher,
      message,
    });
  };

  makeChecksAndLoadVideo = async () => {
    const { isAdPlayer } = this.state;
    const { videoUrl, drm, videoProviderOptions, aspectRatio, } = this.props;
    
    let blockingChecks: checkResult[] = [];

    // apply ratio
    try {
      if(this.domElement) {
        this.domElement.style.paddingBottom = `${((parseInt(aspectRatio.split(':')[1], 10) / parseInt(aspectRatio.split(':')[0], 10)) * 100).toString()}%`;
      }
    } catch (error) {
      console.error(error, 'Cannot apply aspect ratio');
    }

    this.videoProvider = await this.handleProvider();

    mapApi(this.api, isAdPlayer, this.domElement);

    

    if (blockingChecks.length === 0) {
      // let's be honest, I don't know why I must pass videoProviderOptions as a deep copy, but has to 🤷🏼‍♂️
      await this.videoProvider?.load(videoUrl, drm, videoProviderOptions ? JSON.parse(JSON.stringify(videoProviderOptions)) : undefined);
    }
  };

  handleAccept = async () => {
    const { restrictions } = this.state;
    this.setState({
      restrictions: { ...restrictions, age: undefined },
      message: { icon: undefined, text: ''},
      isMessage: false,
    }, async () => {
      await this.makeChecksAndLoadVideo();
    });
  };

  handleDecline = () => {
    this.displayMessage({
      icon: undefined,
      text: <p>{i18n.t('log.checking.restrictions.age.declineMessage')}</p>,
    });
  };

  handleRightsOk = () => {
    this.setState({
      rights: { from: undefined, to: undefined },
      message: {icon: undefined, text: ''},
      isMessage: false,
    }, async () => {
      await this.makeChecksAndLoadVideo();
    });
  };

  shouldLoadNewVideo(prevProps:PlayerProps) {
    const { videoUrl, restrictions, geolocation, rights, autoplay, muted } = this.props;
    return prevProps.restrictions !== restrictions
    || prevProps.geolocation !== geolocation
    || prevProps.rights !== rights
    || prevProps.videoUrl !== videoUrl
    || prevProps.autoplay !== autoplay
    || prevProps.muted !== muted;
  }

  getGoToButtonData(currentTime:CustomEventDetail["currentTime"]) {
    const { goToButtons } = this.props;
    const { isAdPlayer } = this.state;
    let goToButtonData: PlayerState["goToButtonData"];
    if (goToButtons && goToButtons.length > 0 && currentTime) {
      goToButtons.forEach((goToButton) => {
        if (!isAdPlayer && currentTime > goToButton.visibleFrom && currentTime < goToButton.visibleUntil) {
          goToButtonData = goToButton;
        }
      });
    }
    return goToButtonData;
  }

  destroy() {
    if (globalThis.bpdebug) log('info', i18n.t('log.destroy'));

    // dispatch a pause if the provider is destroyed during the playing (case ad or props update) to have nice event logic
    if (this.lastEvent === 'playing' || this.lastEvent === 'timeupdate') {
      this.videoTag?.dispatchEvent(new Event('pause'));
    }
    // destroy provider
    if (this.videoProvider) {
      this.videoProvider.destroy();
    }

    // destroy global keyboard listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleGlobalClick);

    this.eventDomElement.removeEventListener(solidEvents.TRYINGTOPLAY, this.triggerReadyforpreroll);
    this.eventDomElement.removeEventListener(solidEvents.BEFOREENDED, this.triggerReadyforpostroll);

    // destroy checks timeout
    clearTimeout(this.handleChecksTimeout);
    clearTimeout(this.mouseEnterTimeout);
    clearTimeout(this.singleClickActionTimeOut);
  }

  clickEventListener: PlayerFunctions["clickEventListener"] = async (evt) => {
    const { isSettingsOpen } = this.state;
    const { isTouchDevice } = this.props;

    // shouldPlayOnRelease is not null -> coming from a dragMove
    // we don't play but just reset
    if (this.shouldPlayOnRelease === false) {
      this.setShouldPlayOnRelease(undefined);
      return;
    }

    if (evt.target instanceof HTMLDivElement) {
      // toggle play only on click play or restart and if controls are visible and not coming from a dragMove
      if (isTouchDevice && !this.shouldPlayOnRelease) {
        if (!evt.target.classList.contains('play') && !evt.target.classList.contains('complete') && !evt.target.classList.contains('rail')) {
          return;
        }
      }
      // click on skip button should not toggle
      if (evt.target.id.indexOf('skip') > -1) {
        return;
      }
      // click in controls zone should not toggle
      if (evt.target.classList.contains('l-buttons')) {
        return;
      }
    }

    // shouldPlayOnRelease is not null -> coming from a dragMove
    // we have to play
    if (this.shouldPlayOnRelease === true) {
      try {
        await this.api.play();
      } catch (error) {
        log('error', error);
      }
      this.setShouldPlayOnRelease(undefined);
      return;
    }

    // normal click/double click situation
    if (evt.target instanceof HTMLElement) {
      if (isSettingsOpen) {
        this.setState({ isSettingsOpen: false });
        // if we are not on the timeline, no toggle
        if (!(evt.target.classList.contains('rail') || evt.target.classList.contains('rangeslider'))) {
          return;
        }
      }
      // first click wait a bit to see if it's a double click
      this.singleClickActionTimeOut = setTimeout(async () => {
        try {
          await this.api.togglePlay();
        } catch (error) {
          log('error', error);
        }
      }, isTouchDevice ? 0 : 300);
    }
  }

  doubleClickEventListener(evt: MouseEvent | TouchEvent) {
    if (evt.target instanceof HTMLElement) {
      if (!evt.target.classList.contains('l-controls')) {
        return;
      }
      const { isTouchDevice } = this.props;
      clearTimeout(this.singleClickActionTimeOut);
      if (!isTouchDevice) {
        this.api.toggleFullScreen();
      }
    }
  
  }

  unHoverTooltips: PlayerFunctions["unHoverTooltips"] = () => {
    const tooltips = this.domElement?.querySelectorAll('.tooltip');
    if(tooltips) {
      for (let i = 0, len = tooltips.length; i < len; i += 1) {
        tooltips[i].classList.remove('is--hover');
      }
    }
  };

  hoverTooltips = () => {
    // display tooltip only if no overlay are open
    if (!this.state.isSettingsOpen) {
      document.activeElement?.classList.add('is--hover');
    }
  };

  render() {
    // some of state are to set for class only, they probably be not state
    const {
      duration,
      isSettingsOpen,
      message,
      isAdPlayer,
      // for className
      isStylesheetLoaded,
      isSmall,
      isWaitingForClick,
      isReady,
      isPaused,
      isFullScreen,
      isPlaying,
      isSeeking,
      isBuffering,
      isComplete,
      isLive,
      isHovered, // means mouse is on the player
      isChromecasting,
      isMessage,
      isMessageUnderClickCatcher,
      goToButtonData,
      vttThumbnailsData,
      vttChaptersData,
      isControlsVisible, // means controls should be displayed (which is not the same as isHovered)
      isDragging,
      isMuted,
    } = this.state;
    const { isTouchDevice, metadata, aspect, onClickPrevious, onClickNext, color, entitlements } = this.props;

    // calculate isChromeless
    const isChromeless = aspect !== 'player';

    // now get className based on state
    const variableToString = (varObj: unknown): string => {
      if (typeof varObj === 'object' && varObj !== null) {
        return Object.keys(varObj)[0];
      }
      throw new Error('varObj is not an object');
    };
    const stateToClassName = (state: unknown, name: string) => {
      return state ? `is--${name.substr(2)}` : '';
    };
    const classList = [];
    classList.push(
      stateToClassName(isChromeless, variableToString({ isChromeless }).toLowerCase()),
      stateToClassName(isAdPlayer, variableToString({ isAdPlayer }).toLowerCase()),
      stateToClassName(isTouchDevice, variableToString({ isTouchDevice }).toLowerCase()),
      stateToClassName(isStylesheetLoaded, variableToString({ isStylesheetLoaded }).toLowerCase()),
      stateToClassName(isSmall, variableToString({ isSmall }).toLowerCase()),
      stateToClassName(isWaitingForClick, variableToString({ isWaitingForClick }).toLowerCase()),
      stateToClassName(isReady, variableToString({ isReady }).toLowerCase()),
      stateToClassName(isPaused, variableToString({ isPaused }).toLowerCase()),
      stateToClassName(isFullScreen, variableToString({ isFullScreen }).toLowerCase()),
      stateToClassName(isPlaying, variableToString({ isPlaying }).toLowerCase()),
      stateToClassName(isSeeking, variableToString({ isSeeking }).toLowerCase()),
      stateToClassName(isBuffering, variableToString({ isBuffering }).toLowerCase()),
      stateToClassName(isComplete, variableToString({ isComplete }).toLowerCase()),
      stateToClassName(isLive, variableToString({ isLive }).toLowerCase()),
      stateToClassName(isControlsVisible, variableToString({ isControlsVisible }).toLowerCase()),
      stateToClassName(isDragging, variableToString({ isDragging }).toLowerCase()),
      stateToClassName(isChromecasting, variableToString({ isChromecasting }).toLowerCase()),
      stateToClassName(isMessage, variableToString({ isMessage }).toLowerCase()),
      stateToClassName(isMessageUnderClickCatcher, variableToString({ isMessageUnderClickCatcher }).toLowerCase()),
      version.replaceAll('.', '_'),
    );
    return (
      <div
        className={`l-player-container ${classList.join(' ')}`}
        ref={this.ref}
        onMouseMove={() => {
          if (!isTouchDevice) this.handleOnMouseMove();
        }}
        onTouchStart={
        () => {
          this.handleOnTouchStart();
        }
      }
        onMouseLeave={this.handleOnMouseLeave}
        aria-label={i18n.t('ariaLabel.videoPlayer')}
      >
        <Video imageUrl={metadata?.imageUrl} aspect={aspect} isTouchDevice={isTouchDevice} />
        {(isWaitingForClick || isMessage || isComplete) && metadata && metadata.imageUrl && (
        <div
          alt={metadata?.title}
          style={{
            backgroundImage: `url(${metadata.imageUrl})`,
            position: 'absolute',
            width: '100%',
            filter: isMessage ? 'grayscale(1) brightness(20%)' : '',
            height: '100%',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        )}
        {aspect === 'player' && (
        <div
          className="l-clickcatcher"
          aria-label={i18n.t('ariaLabel.clickableZone')}
          tabIndex={0}
          onClick={(evt) => {
            if (isTouchDevice && !this.clickActivatedOnTouchDevice) return;
            this.clickEventListener({
              target: evt.target as HTMLDivElement
            });
          }}
          // eslint-disable-next-line react/no-unknown-property
          onDblClick={(evt) => {
            this.doubleClickEventListener(evt);
          }}
          onKeyDown={() => {}}
          role="button"
        >
          <Controls
            isAdPlayer={isAdPlayer}
            isMessage={isMessage}
            metadata={metadata}
            isTouchDevice={isTouchDevice}
            isWaitingForClick={isWaitingForClick}
            message={message}
            isPaused={isPaused}
            isMuted={isMuted}
            isSettingsOpen={isSettingsOpen}
            onClickPrevious={onClickPrevious}
            onClickNext={onClickNext}
            isLive={isLive}
            color={color}
            duration={duration}
            isHovered={isHovered}
            vttThumbnailsData={vttThumbnailsData}
            vttChaptersData={vttChaptersData}
            entitlements={entitlements}
            eventDomElement={this.eventDomElement}
            api={this.api}
            setShouldPlayOnRelease={this.setShouldPlayOnRelease}
            clickActivatedOnTouchDevice={this.clickActivatedOnTouchDevice}
            shouldPlayOnRelease={this.shouldPlayOnRelease}
            clickEventListener={this.clickEventListener}
            unHoverTooltips={this.unHoverTooltips}
            setIsDragging={this.setIsDragging}
            setIsSettingsOpen={this.setIsSettingsOpen}
            setIsComplete={this.setIsComplete}
          />
          {!isAdPlayer && goToButtonData && <GoToButton api={this.api} title={goToButtonData.title} targetTime={goToButtonData.targetTime} />}
          <span className="loader icons">
            <AutoRenew />
          </span>
          <span className="complete icons">
            <Refresh />
          </span>
          <Settings
            api={this.api}
            isTouchDevice={isTouchDevice}
            eventDomElement={this.eventDomElement}
            isOpen={isSettingsOpen}
            onClickSettingsIcon={() => {
              this.unHoverTooltips();
              this.setState({ isSettingsOpen: !isSettingsOpen });
            }}
            isLive={isLive}
          />
        </div>
        )}
        {message && (message.icon || message.text) && (
        <div className="message">
          {message.icon && message.icon}
          {message.text !== '' && message.text}
        </div>
        )}
      </div>
    );
  }

  resetMouseEnterTimeout() {
    clearTimeout(this.mouseEnterTimeout);
    this.mouseEnterTimeout = setTimeout(() => {
      const { isPaused, isSettingsOpen } = this.state;
      if (!isSettingsOpen && !isPaused) {
        this.setState({ isControlsVisible: false }, () => {
          this.clickActivatedOnTouchDevice = false;
        });
      }
    }, 2000);
  }

  handleOnMouseMove() {
    this.setState({ isHovered: true, isControlsVisible: true });
    this.resetMouseEnterTimeout();
  }

  handleOnTouchStart() {
    const { isControlsVisible } = this.state;
    // toggle on touchdevice, always show on non-touch
    this.setState({ isHovered: true, isControlsVisible: !isControlsVisible }, () => {
      setTimeout(() => {
        this.clickActivatedOnTouchDevice = true;
      }, 300); // time of css animation
    });

    this.resetMouseEnterTimeout();
  }

  handleProvider(): Promise<ShakaProvider> {
    if (globalThis.bpdebug) log('info', i18n.t('log.loaded.videoProvider'));
    const { autoplay, muted, entitlements, videoUrl, volume } = this.props;
    const { isAdPlayer } = this.state;
    return new ShakaProvider(
      {
        videoUrl,
        videoTag: this.videoTag,
        volume,
        muted,
        isAdPlayer,
        autoplay,
        entitlements,
        displayMessage: this.displayMessage,
        eventDomElement: this.eventDomElement,
        domElement: this.domElement,
        resetToPreview: this.resetToPreview,
        api: this.api,
      },
    ).init();
  }

  handleOnMouseLeave = () => {
    const { isDragging, isSettingsOpen, isPaused } = this.state;

    this.setState({ isHovered: false });
    if (!isDragging && !isSettingsOpen && !isPaused) this.setState({ isControlsVisible: false });
    clearTimeout(this.mouseEnterTimeout);
  };

  handleGlobalClick = (evt: MouseEvent) => {
    const { isTouchDevice } = this.props;
    const RangeSliderRect = this.ref?.current?.getBoundingClientRect();
    if(RangeSliderRect) {
      const gapFromLeft = evt.clientX - RangeSliderRect.left;
      const gapFromRight = RangeSliderRect.right - evt.clientX;
      const gapFromTop = evt.clientY - RangeSliderRect.top;
      const gapFromBottom = RangeSliderRect.bottom - evt.clientY;
      const isOutOfPlayer = gapFromLeft < 0 || gapFromRight < 0 || gapFromTop < 0 || gapFromBottom < 0;
      // if the global click has been made out of the player, then close a eventual settingsBox
      // and make controls not visible
      if (!isTouchDevice && isOutOfPlayer) {
        this.setState({ isSettingsOpen: false, isControlsVisible: false });
      }
    }
  };

  handleKeyDown = (evt: KeyboardEvent) => {
    if (globalThis.bpdebug) log('info', i18n.t('log.keyPress', { key: evt.key }));
    const isActiveElementAButton = () => document.activeElement?.tagName === 'BUTTON';

    const thisDomElement = this.ref?.current;

    // do action only if this has synthetic focus
    if (thisDomElement?.contains(document.activeElement)) {
      setTimeout(() => {
        // first remove all tooltip
        this.unHoverTooltips();
        // then hover the tooltip to display it
        this.hoverTooltips();
        this.handleOnMouseMove();
      }, 0);

      if (evt.key === 'm') {
        this.api.setMute(!this.api.getMute());
      }
      if (evt.key === 'ArrowUp') {
        // make volume slider appearing 😍
        this.domElement?.querySelector('.volumeStatus')?.dispatchEvent(new Event('mousemove'));

        if (this.api.getVolume() < 1) {
          this.api.setVolume(Math.min(1, Math.max(0, (this.api.getVolume() * 100 + 10) / 100)));
        }
        evt.preventDefault();
      }
      if (evt.key === 'ArrowDown') {
        // make volume slider disappearing 😍
        this.domElement?.querySelector('.volumeStatus')?.dispatchEvent(new Event('mousemove'));

        if (this.api.getVolume() > 0) {
          this.api.setVolume((this.api.getVolume() * 100 - 10) / 100);
        }
        evt.preventDefault();
      }
      if (evt.key === 'ArrowRight') {
        // case seek on a complete video, reset the state
        this.setState({ isComplete: false });

        this.api.seek(this.api.getPosition() + 10);
      }
      if (evt.key === 'ArrowLeft') {
        // case seek on a complete video, reset the state
        this.setState({ isComplete: false });

        this.api.seek(this.api.getPosition() - 10);
      }
      if (evt.key === 'f') {
        this.api.toggleFullScreen();
      }
      if (evt.key === ' ' && !isActiveElementAButton()) {
        this.api.togglePlay();
        evt.preventDefault();
      }
    }
  };

  setListeners() {
    this.eventDomElement.addEventListener(solidEvents.FULLSCREEN, (evt) => {
      const customEvent = evt as CustomEvent
      this.setState({ isFullScreen: customEvent.detail.isFullScreen });
    });
    this.eventDomElement.addEventListener(solidEvents.PAUSE, () => {
      this.setState({
        isPlaying: false,
        isPaused: true,
      });
    });
    this.eventDomElement.addEventListener(solidEvents.PLAY, () => {
      this.setState({
        isComplete: false,
        isWaitingForClick: false,
        isBuffering: false,
        isPaused: false,
        isSeeking: false,
        isPlaying: true,
      });
    });
    this.eventDomElement.addEventListener('adplay', () => {
      this.setState({
        isComplete: false,
        isWaitingForClick: false,
        isBuffering: false,
        isPaused: false,
        isSeeking: false,
        isPlaying: true,
      });
    });
    this.eventDomElement.addEventListener(solidEvents.SEEKING, () => {
      this.setState({
        isSeeking: true,
      });
    });
    this.eventDomElement.addEventListener(solidEvents.SEEKED, () => {
      // exclusively for safari : it trigger seeking-seeked AFTER playing on start
      this.setState({
        isBuffering: false,
        isSeeking: false,
      });
    });
    this.eventDomElement.addEventListener(solidEvents.ENDED, () => {
      this.setState({
        isComplete: true,
        isPaused: true,
        isPlaying: false,
        isBuffering: false,
      });
    });
    this.eventDomElement.addEventListener(solidEvents.BUFFERING, () => {
      // throttle isBuffering
      setTimeout(() => {
        // if it's still buffering after 500ms, then display the spinner
        if (this.api.getState() === 'buffering') {
          this.setState({
            isBuffering: true,
          });
        }
      }, 500);
      this.setState({
        isComplete: false, // case reload the video
      });
    });
    this.eventDomElement.addEventListener(solidEvents.VIDEOTYPE, (evt) => {
      const customEvent = evt as CustomEvent
      const { restorePositionAfterAd, autoplay } = this.state;
      if (customEvent.detail.isLive) {
        this.setState({
          isLive: true,
        });
      } else {
        this.setState({
          isLive: false,
        });
        if (autoplay && restorePositionAfterAd) {
          this.api.seek(restorePositionAfterAd);
        }
      }
      this.setState({ restorePositionAfterAd: undefined });
    });
    this.eventDomElement.addEventListener(solidEvents.METADATA, () => {
      this.setState({
        isReady: true,
      });
    });
    this.eventDomElement.addEventListener(`ad${solidEvents.METADATA}`, () => {
      this.setState({
        isReady: true,
      });
    });
    /* this.eventDomElement.addEventListener("NATIVEALL", (e) => {
      log("info", `received native event : %c${e.detail.type}`, 'font-weight:bold;', `on ${ this.state.isAdPlayer ? 'ad Player' : 'regular Player'}`);
    }); */
  }
}
