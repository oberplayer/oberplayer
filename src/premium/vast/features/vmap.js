import { getPreroll, getMidrolls, getPostroll } from '../lib/utils';
import { fetchVmapUrl } from '../lib';
import { log } from '../../../modules/lib.ts';

export async function parseInlineVastData(vastAdData, adType) {
  const xmlString = new XMLSerializer().serializeToString(vastAdData);
  const vastXml = new window.DOMParser().parseFromString(xmlString, 'text/xml');
  const dailymotionVmap = await import('@dailymotion/vmap');
  const vastParser = new dailymotionVmap.VASTParser();
  vastParser
    .parseVAST(vastXml)
    .then((parsedVAST) => {
      if (adType === 'postroll') {
        // store for later use (in readyforpostroll event)
        this.postRollData = parsedVAST.ads ?? [];
      } else if (adType === 'preroll') {
        this.adsArray = parsedVAST.ads ?? [];
      } else if (adType === 'midroll') {
        // store for later use (in readyforpostroll event)
        this.adsArray = parsedVAST.ads ?? [];
        this.readAd();
      }
    })
    .catch((err) => {
      log('error', err);
      if (adType === 'postroll' || adType === 'midroll') {
        this.disablePostroll();
      } else if (adType === 'preroll') {
        // skip preroll, go ahaed to regular content
        this.oberplayer.ads.skipLinearAdMode();
      }
    });
}

export async function handleVMAP(vmapUrl) {
  try {
    const vmap = await fetchVmapUrl(vmapUrl);
    if (vmap.adBreaks && vmap.adBreaks.length > 0) {
      this.addEventsListeners();
      // handle preroll
      const preroll = getPreroll(vmap.adBreaks);
      if (!preroll) {
        this.disablePreroll();
      } else if (preroll.adSource?.adTagURI?.uri) {
        // load vast preroll url
        await this.handleVAST(preroll.adSource.adTagURI.uri);
      } else if (preroll.adSource.vastAdData) {
        this.parseInlineVastData(preroll.adSource?.vastAdData, 'preroll');
      }
      // handle postroll
      // if there is postroll, next should be at the end of the postroll
      // not at the end of the regular video
      const postroll = getPostroll(vmap.adBreaks);
      if (!postroll) {
        this.oberplayer.hasAPostroll = false;
        this.disablePostroll();
      } else if (postroll.adSource?.adTagURI?.uri) {
        this.oberplayer.hasAPostroll = true;
        this.postRollUrl = postroll.adSource.adTagURI.uri;
      } else if (postroll.adSource?.vastAdData) {
        this.oberplayer.hasAPostroll = true;
        this.parseInlineVastData(postroll.adSource?.vastAdData, 'postroll');
      }
      this.watchForProgress = getMidrolls(vmap.adBreaks);
      if (this.watchForProgress.length > 0) {
        // listen on regular content for midroll handling
        this.oberplayer.on('time', this.onProgress);
      }
    }
  } catch (err) {
    // could not fetch vmap
    log('error', err);
  }
}
