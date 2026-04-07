import { applyNonLinearCommonDomStyle, safeWindowOpen, setSanitizedHTML, setSafeSrc, appendToAdSlot } from '../lib/utils';
/*
 * This method is responsible for rendering a nonlinear ad
 */
export function playCompanionAd(creative) {
  creative.variations.map((variation) => {
    this.companionVastTracker.trackImpression(this.macros);

    // image
    if (variation.staticResources && variation.staticResources.length > 0) {
      variation.staticResources.map((staticResource) => {
        const ressourceContainer = document.createElement('div');
        this.domElements.push(ressourceContainer);
        ressourceContainer.width = variation.staticResources.width > 0 ? variation.staticResources.width : 100;
        ressourceContainer.height = variation.staticResources.height > 0 ? variation.staticResources.height : 100;
        ressourceContainer.style.maxWidth = variation.staticResources.expandedWidth;
        ressourceContainer.style.maxHeight = variation.staticResources.expandedHeight;
        applyNonLinearCommonDomStyle(ressourceContainer);

        const ressource = document.createElement('img');
        this.domElements.push(ressourceContainer);
        ressource.addEventListener('click', () => {
          safeWindowOpen(variation.companionClickThroughURLTemplate);
          this.companionVastTracker.click(null, this.macros);
        });
        setSafeSrc(ressource, staticResource.url);
        ressourceContainer.appendChild(ressource);
        appendToAdSlot(variation.adSlotID, ressourceContainer, this.oberplayer.el());
        return staticResource;
      });
    }

    // html
    if (variation.htmlResources) {
      variation.htmlResources.map((htmlResource) => {
        const ressourceContainer = document.createElement('div');
        this.domElements.push(ressourceContainer);
        ressourceContainer.width = variation.htmlResources.width;
        ressourceContainer.height = variation.htmlResources.height;
        ressourceContainer.style.maxWidth = variation.htmlResources.expandedWidth;
        ressourceContainer.style.maxHeight = variation.htmlResources.expandedHeight;
        applyNonLinearCommonDomStyle(ressourceContainer);
        ressourceContainer.addEventListener('click', () => {
          safeWindowOpen(variation.companionClickThroughURLTemplate);
          this.companionVastTracker.click(null, this.macros);
        });
        setSanitizedHTML(ressourceContainer, htmlResource);
        appendToAdSlot(variation.adSlotID, ressourceContainer, this.oberplayer.el());
        return htmlResource;
      });
    }

    // iframe
    if (variation.iframeResources) {
      variation.iframeResources.map((iframeResource) => {
        const ressourceContainer = document.createElement('div');
        this.domElements.push(ressourceContainer);
        ressourceContainer.width = variation.iframeResources.width;
        ressourceContainer.height = variation.iframeResources.height;
        ressourceContainer.style.maxWidth = variation.iframeResources.expandedWidth;
        ressourceContainer.style.maxHeight = variation.iframeResources.expandedHeight;
        applyNonLinearCommonDomStyle(ressourceContainer);
        ressourceContainer.addEventListener('click', () => {
          safeWindowOpen(variation.companionClickThroughURLTemplate);
          this.companionVastTracker.click(null, this.macros);
        });
        setSafeSrc(ressourceContainer, iframeResource);
        appendToAdSlot(variation.adSlotID, ressourceContainer, this.oberplayer.el());
        return iframeResource;
      });
    }
    return variation;
  });
}

export default playCompanionAd;
