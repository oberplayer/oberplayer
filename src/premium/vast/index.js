import { injectScriptTag, getLocalISOString, convertTimeOffsetToSeconds, safeWindowOpen } from './lib';
import { playLinearAd, playNonLinearAd, playCompanionAd } from './modes';
import { addIcons, handleVMAP, parseInlineVastData } from './features';
import { solidEvents } from '../../modules/events';
import { log } from '../../modules/lib';

class Vast {
  constructor(oberplayer, options) {
    this.oberplayer = oberplayer;

    // Load the options with default values
    const defaultOptions = {
      vastUrl: false,
      vmapUrl: false,
      verificationTimeout: 2000,
      addCtaClickZone: true,
      addSkipButton: true,
      debug: false,
      timeout: 5000,
      isLimitedTracking: false,
    };

    // Assign options that were passed in by the consumer
    this.options = Object.assign(defaultOptions, options);

    this.setMacros();

    // Init an empty array that will later contain the ads metadata
    this.adsArray = [];

    // array of nonlinear or companions dom element
    this.domElements = [];
    // array of icons dom containers
    this.iconContainers = [];

    this.oberplayer.on(solidEvents.ERROR, () => {
      if (this.oberplayer.ads.inAdBreak()) {
        this.onAdError();
      }
    });
  }

  async init() {
    if (this.options.vmapUrl) {
      await this.handleVMAP(this.options.vmapUrl);
    } else {
      await this.handleVAST(this.options.vastUrl);
      if (this.adsArray.length > 0) {
        this.addEventsListeners();
      }
    }
    return this;
  }

  setMacros(newMacros = undefined) {
    const { options } = this;
    if (!newMacros) {
      // generate unique int from current timestamp
      const cacheBuster = parseInt(Date.now().toString().slice(-8), 10);
      const ts = getLocalISOString(new Date());
      this.macros = {
        CACHEBUSTING: cacheBuster,
        TIMESTAMP: ts,
        PAGEURL: window.location !== window.parent.location ? document.referrer : document.location.href,
        // PODSEQUENCE: '',
        // UNIVERSALADID: '',
        // ADTYPE: '',
        // ADSERVINGID: '',
        // ADCATEGORIES: '',
        LIMITADTRACKING: options.isLimitedTracking,
      };
    } else {
      this.macros = {
        ...this.macros,
        ...newMacros,
      };
    }
  }

  async handleVAST(vastUrl) {
    // Now let's fetch some adsonp
    const dailymotionVastClient = await import('@dailymotion/vast-client');
    this.vastClient = new dailymotionVastClient.VASTClient();
    try {
      const response = await this.vastClient.get(vastUrl, {
        allowMultipleAds: true,
        resolveAll: true,
      });
      this.adsArray = response.ads ?? [];
      if (this.adsArray.length === 0) {
        // Deal with the error
        log('error', 'VastVjs: Empty VAST XML');
      }
    } catch (err) {
      // Deal with the error
      log('error', 'VastVjs: Empty VAST XML');
    }
  }

  removeDomElements() {
    // remove icons
    this.domElements.forEach((domElement) => {
      domElement.remove();
    });
    this.domElements = [];
  }

  async readAd() {
    const currentAd = this.getNextAd();

    if(!currentAd) {
      return;
    }

    if (currentAd.hasLinearCreative()) {

      // Retrieve the CTA URl to render
      this.ctaUrl = Vast.getBestCtaUrl(currentAd.linearCreative());
      this.debug('ctaUrl', this.ctaUrl);

      const dailymotionVastClient = await import('@dailymotion/vast-client');
      this.linearVastTracker = new dailymotionVastClient.VASTTracker(this.vastClient, currentAd.ad, currentAd.linearCreative());
      this.linearVastTracker.on('firstQuartile', () => {
        this.debug('firstQuartile');
      });
      this.linearVastTracker.on('midpoint', () => {
        this.debug('midpoint');
      });
      this.addIcons(currentAd);
      this.addSkipButton(currentAd.linearCreative());
      // We now check if verification is needed or not, if it is, then we import the
      // verification script with a timeout trigger. If it is not, then we simply display the ad
      // by calling playAd
      if ('adVerifications' in currentAd.ad && currentAd.ad.adVerifications.length > 0) {
        // Set a timeout for the verification script - accortding to the IAB spec, we should do
        // a best effort to load the verification script before the actual ad, but it should not
        // block the ad nor the video playback
        const verificationTimeout = setTimeout(() => {
          this.playLinearAd(currentAd.linearCreative());
        }, this.options.verificationTimeout);

        // Now for each verification script, we need to inject a script tag in the DOM and wait
        // for it to load
        let index = 0;
        this.setMacros({
          OMIDPARTNER: `${currentAd.ad.adVerifications[index].vendor ?? 'unknown'}`,
        });
        const scriptTagCallback = () => {
          index += 1;
          if (index < currentAd.ad.adVerifications.length) {
            injectScriptTag(
              currentAd.ad.adVerifications[index].resource,
              scriptTagCallback,
              scriptTagErrorCallback,
            );
          } else {
            // Once we are done with all verification tags, clear the timeout timer and play the ad
            clearTimeout(verificationTimeout);
            this.playLinearAd(currentAd.linearCreative());
          }
        };
        const scriptTagErrorCallback = () => {
          // track error
          this.linearVastTracker.verificationNotExecuted(currentAd.ad.adVerifications[index].vendor, { REASON: 3 });
          // load next script
          scriptTagCallback();
        };
        injectScriptTag(currentAd.ad.adVerifications[index].resource, scriptTagCallback, scriptTagErrorCallback);
      } else {
        // No verification to import, just run the add
        this.playLinearAd(currentAd.linearCreative());
      }
    } else {
      this.oberplayer.ads.skipLinearAdMode();
    }
    if (currentAd.hasNonlinearCreative()) {
      // TODO: remove those listeners
      this.oberplayer.one(currentAd.hasLinearCreative() ? 'adplaying' : 'playing', () => {
        this.nonLinearVastTracker = new VASTTracker(this.vastClient, currentAd.ad, currentAd.nonlinearCreative(), 'NonLinearAd');
        this.playNonLinearAd(currentAd.nonlinearCreative());
      });
    }
    if (currentAd.hasCompanionCreative()) {
      // TODO: remove those listeners
      this.oberplayer.one(currentAd.hasLinearCreative() ? 'adplaying' : 'playing', () => {
        this.companionVastTracker = new VASTTracker(this.vastClient, currentAd.ad, currentAd.companionCreative(), 'CompanionAd');
        this.playCompanionAd(currentAd.companionCreative());
      });
    }
  }

  /*
   * This method is responsible for retrieving the next ad to play from all the ads present in the
   * VAST manifest.
   * Please be aware that a single ad can have multple types of creatives.
   * A linear add for example can come with a companion ad and both can should be displayed.
   */
  getNextAd() {
    if (this.adsArray.length === 0) {
      return null;
    }
    const nextAd = this.adsArray.shift();
    return {
      ad: nextAd,
      hasLinearCreative: () => nextAd.creatives.find((creative) => creative.type === 'linear') !== undefined,
      linearCreative: () => nextAd.creatives.filter((creative) => creative.type === 'linear')[0],
      hasCompanionCreative: () => nextAd.creatives.find((creative) => creative.type === 'companion') !== undefined,
      companionCreative: () => nextAd.creatives.filter((creative) => creative.type === 'companion')[0],
      hasNonlinearCreative: () => nextAd.creatives.find((creative) => creative.type === 'nonlinear') !== undefined,
      nonlinearCreative: () => nextAd.creatives.filter((creative) => creative.type === 'nonlinear')[0],
    };
  }

  onAdPlay = () => {
    this.debug('adplay');
    // don't track the very first play to avoid sending resume tracker event
    if (parseInt(this.oberplayer.currentTime(), 10) > 0) {
      this.linearVastTracker.setPaused(false, {
        ...this.macros,
        ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
      });
    }
  };

  onAdPause = () => {
    this.debug('adpause');
    // don't track the pause event triggered before complete
    if (this.oberplayer.duration() - this.oberplayer.currentTime() > 0.2) {
      this.linearVastTracker.setPaused(true, {
        ...this.macros,
        ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
      });
    }
  };

  // Track timeupdate-related events
  onAdTimeUpdate = () => {
    // rare case when playing with next / previous, a very last event from the previous
    // video can be triggered with the next vast whom tracker is not yet created
    if (this.linearVastTracker) {
      this.debug('adtimeupdate');
      // Set progress to track automated trackign events
      this.linearVastTracker.setProgress(this.oberplayer.currentTime(), this.macros);
    }
  };

  // track on regular content progress
  onProgress = async () => {
    if (this.watchForProgress && this.watchForProgress.length > 0) {
      const { timeOffset } = this.watchForProgress[0];
      const timeOffsetInSeconds = convertTimeOffsetToSeconds(timeOffset, this.oberplayer.duration());
      if (this.oberplayer.currentTime() > timeOffsetInSeconds) {
        const nextAd = this.watchForProgress.shift();
        if (nextAd.vastUrl) {
          await this.handleVAST(nextAd.vastUrl);
          this.readAd();
        } else if (nextAd.vastData) {
          this.parseInlineVastData(nextAd.vastData, 'midroll');
        }
      }
    }
  };

  onFirstPlay = () => {
    this.debug('first play');
    // Track the first timeupdate event - used for impression tracking
  };

  onAdVolumeChange = () => {
    this.debug('volume');
    if (!this.linearVastTracker) {
      return false;
    }
    // Track the user muting or unmuting the video
    this.linearVastTracker.setMuted(this.oberplayer.muted(), {
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
    });
    return true;
  };

  onAdFullScreen = (evt) => {
    this.debug('fullscreen');
    if (!this.linearVastTracker) {
      return false;
    }
    // Track skip event
    this.linearVastTracker.setFullscreen(evt.detail.isFullScreen);
    return true;
  };

  // Track when user closes the video
  onUnload = () => {
    this.removeEventsListeners();
    this.removeDomElements();

    if (!this.linearVastTracker) {
      return false;
    }

    this.linearVastTracker.close({
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
    });
    return null;
  };

  // send event when ad is playing to remove loading spinner
  onAdStart = () => {
    this.debug('adstart');
    // Track the impression of an ad
    this.linearVastTracker.load({
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
    });

    this.linearVastTracker.trackImpression({
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
    });
    this.linearVastTracker.overlayViewDuration(this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()), this.macros);

    if (this.options.addCtaClickZone) {
      // add the cta click
      const ctaDiv = document.createElement('div');
      ctaDiv.style.cssText = 'position: absolute; bottom:3em; left: 0; right: 0;top: 0;';
      ctaDiv.addEventListener('click', (evt) => {
        this.oberplayer.api.pause();
        this.adClickCallback(this.ctaUrl);
        evt.stopPropagation();
      });
      this.domElements.push(ctaDiv);
      this.oberplayer.el().appendChild(ctaDiv);
    }
  };

  addSkipButton(creative) {
    this.debug('addSkipButton');
    if (this.options.addSkipButton && creative.skipDelay > 0) {
      const { skipDelay } = creative;
      // add the skip button
      const skipButtonDiv = document.createElement('div');
      skipButtonDiv.className = 'adSkipButton';
      this.domElements.push(skipButtonDiv);
      // add to controls element
      this.oberplayer.el().appendChild(skipButtonDiv);
      // init it
      let isSkippable = false;
      let skipRemainingTime = Math.round(skipDelay);
      skipButtonDiv.innerHTML = skipRemainingTime.toFixed();
      // update time
      const interval = setInterval(() => {
        skipRemainingTime = Math.round(skipDelay - this.oberplayer.currentTime());
        isSkippable = skipRemainingTime < 1;
        if (isSkippable) {
          skipButtonDiv.addEventListener('click', (evt) => {
            this.oberplayer.trigger('adskip');
            evt.stopPropagation();
          });
          clearInterval(interval);
        }
        skipButtonDiv.innerHTML = isSkippable ? 'skip' : skipRemainingTime.toFixed();
      }, 1000);
    }
  }

  onAdError = () => {
    this.debug('aderror');
    // const error = this.oberplayer.error();
    // trigger a tracker error
    this.linearVastTracker.error({
      ...this.macros,
      ERRORCODE: 900, // undefined error, to be improved
    });

    this.removeEventsListeners();
    this.removeDomElements();

    // no more ads (end of preroll, adpods or midroll)
    if (this.adsArray.length === 0) {
      // Finish ad mode so that regular content can resume
      this.oberplayer.ads.endLinearAdMode();
    } else {
      // pods is not ended go ahead
      this.readAd();
    }
  };

  onReadyForPreroll = () => {
    this.debug('readyforpreroll');
    this.readAd();
  };

  onReadyForPostroll = async () => {
    this.debug('readyforpostroll');
    if (this.postRollUrl) {
      await this.handleVAST(this.postRollUrl);
      this.readAd();
    } else if (this.postRollData) {
      // handle inline data
      this.adsArray = this.postRollData;
      this.readAd();
    }
  };

  onSkip = () => {
    this.debug('skip');

    // Track skip event
    this.linearVastTracker.skip({
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
    });

    // delete ctadiv, skip btn, icons, companions or nonlinear elements
    this.removeDomElements();

    // no more ads (end of preroll, adpods or midroll)
    if (this.adsArray.length === 0) {
      // Finish ad mode so that regular content can resume
      this.oberplayer.ads.endLinearAdMode();
    } else {
      this.readAd();
    }
  };

  onAdEnded = () => {
    this.debug('adended');

    // Track the end of an ad
    if (this.linearVastTracker) {
      this.linearVastTracker.complete({
        ...this.macros,
        ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
      });
    }

    // delete ctadiv, skip btn, icons, companions or nonlinear elements
    this.removeDomElements();

    // no more ads (end of preroll, adpods or midroll)
    if (this.adsArray.length === 0) {
      // Finish ad mode so that regular content can resume
      this.oberplayer.ads.endLinearAdMode();
    } else {
      // pods is not ended go ahead
      this.readAd();
    }
  };

  addEventsListeners() {
    this.debug('addEventsListeners');
    // ad events
    this.oberplayer.one('adplay', this.onFirstPlay);
    this.oberplayer.on('adplay', this.onAdPlay);
    this.oberplayer.on('adpause', this.onAdPause);
    this.oberplayer.on('adtime', this.onAdTimeUpdate);
    this.oberplayer.on('advolume', this.onAdVolumeChange);
    this.oberplayer.on('adfullscreen', this.onAdFullScreen);
    this.oberplayer.on('adstart', this.onAdStart);
    this.oberplayer.on('aderror', this.onAdError);
    this.oberplayer.on('readyforpreroll', this.onReadyForPreroll);
    this.oberplayer.on('readyforpostroll', this.onReadyForPostroll);
    this.oberplayer.on('adskip', this.onSkip);
    this.oberplayer.on('adended', this.onAdEnded);
    this.oberplayer.on('error', this.onUnload);
    window.addEventListener('beforeunload', this.onUnload);
  }

  removeEventsListeners() {
    this.debug('removeEventsListeners');
    // added only if some midrolls have been found
    this.oberplayer.off('time', this.onProgress);
    this.oberplayer.off('adplay', this.onAdPlay);
    this.oberplayer.off('adplay', this.onFirstPlay);
    this.oberplayer.off('adpause', this.onAdPause);
    this.oberplayer.off('adtime', this.onAdTimeUpdate);
    this.oberplayer.off('advolume', this.onAdVolumeChange);
    this.oberplayer.off('adfullscreen', this.onAdFullScreen);
    this.oberplayer.off('adstart', this.onAdStart);
    this.oberplayer.off('aderror', this.onAdError);
    this.oberplayer.off('readyforpreroll', this.onReadyForPreroll);
    this.oberplayer.off('readyforpostroll', this.onReadyForPostroll);
    this.oberplayer.off('adskip', this.onSkip);
    this.oberplayer.off('adended', this.onAdEnded);
    this.oberplayer.off('error', this.onUnload);
    window.removeEventListener('beforeunload', this.onUnload);
  }

  /*
   * This method is responsible for dealing with the click on the ad
   */
  adClickCallback = (ctaUrl) => {
    this.oberplayer.trigger(solidEvents.CLICKCTAVAST);
    safeWindowOpen(ctaUrl);
    // Track when a user clicks on an ad
    this.linearVastTracker.click(null, {
      ...this.macros,
      ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
    });
  };

  /*
   * This method is responsible for choosing the best URl to redirect the user to when he clicks
   * on the ad
   */
  static getBestCtaUrl = (creative) => {
    if (creative.videoClickThroughURLTemplate && creative.videoClickThroughURLTemplate.url) {
      return creative.videoClickThroughURLTemplate.url;
    }
    return false;
  };

  debug(msg, data = undefined) {
    if (!this.options.debug) {
      return;
    }
    console.info('vast ---', msg, data ?? '');
  }
}

Vast.prototype.playLinearAd = playLinearAd;
Vast.prototype.playNonLinearAd = playNonLinearAd;
Vast.prototype.playCompanionAd = playCompanionAd;
Vast.prototype.addIcons = addIcons;
Vast.prototype.handleVMAP = handleVMAP;
Vast.prototype.parseInlineVastData = parseInlineVastData;

export default Vast;
