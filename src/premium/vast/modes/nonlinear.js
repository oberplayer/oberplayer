/*
 * This method is responsible for rendering a nonlinear ad
 */
import { applyNonLinearCommonDomStyle, safeWindowOpen, setSanitizedHTML, setSafeSrc, appendToAdSlot } from '../lib/utils';

function getCloseButton(clickCallback) {
  const closeButton = document.createElement('button');
  closeButton.addEventListener('click', clickCallback);
  closeButton.style.width = '20px';
  closeButton.style.height = '20px';
  closeButton.style.position = 'absolute';
  closeButton.style.right = '5px';
  closeButton.style.top = '5px';
  closeButton.style.zIndex = '3';
  closeButton.style.background = '#CCC';
  closeButton.style.color = '#000';
  closeButton.style.fontSize = '12px';
  closeButton.style.cursor = 'pointer';
  closeButton.textContent = 'X';
  return closeButton;
}
export function playNonLinearAd(creative) {
  creative.variations.map((variation) => {
    this.nonLinearVastTracker.trackImpression(this.macros);

    // image
    if (variation.staticResource) {
      const ressourceContainer = document.createElement('div');
      this.domElements.push(ressourceContainer);
      applyNonLinearCommonDomStyle(ressourceContainer);

      const ressource = document.createElement('img');
      ressource.addEventListener('click', () => {
        safeWindowOpen(variation.nonlinearClickThroughURLTemplate);
        this.nonLinearVastTracker.click(null, this.macros);
      });
      ressourceContainer.style.maxWidth = variation.expandedWidth;
      ressourceContainer.style.maxHeight = variation.expandedHeight;
      setSafeSrc(ressource, variation.staticResource);

      // add close button
      const closeButton = getCloseButton(() => ressourceContainer.remove());
      closeButton.style.display = variation.minSuggestedDuration ? 'none' : 'block';

      if (variation.minSuggestedDuration) {
        setTimeout(() => {
          closeButton.style.display = 'block';
          ressourceContainer.appendChild(closeButton);
        }, variation.minSuggestedDuration * 1000);
      }
      ressourceContainer.appendChild(ressource);
      appendToAdSlot(variation.adSlotID, ressourceContainer, this.oberplayer.el());
    }

    // html
    if (variation.htmlResource) {
      const ressourceContainer = document.createElement('div');
      this.domElements.push(ressourceContainer);
      applyNonLinearCommonDomStyle(ressourceContainer);
      ressourceContainer.addEventListener('click', () => {
        safeWindowOpen(variation.nonlinearClickThroughURLTemplate);
        this.nonLinearVastTracker.click(null, this.macros);
      });

      ressourceContainer.style.maxWidth = variation.expandedWidth;
      ressourceContainer.style.maxHeight = variation.expandedHeight;
      setSanitizedHTML(ressourceContainer, variation.htmlResource);

      appendToAdSlot(variation.adSlotID, ressourceContainer, this.oberplayer.el());
      if (variation.minSuggestedDuration) {
        setTimeout(() => {
          ressourceContainer.remove();
        }, variation.minSuggestedDuration * 1000);
      }
    }

    // iframe
    if (variation.iframeResource) {
      const ressourceContainer = document.createElement('iframe');
      this.domElements.push(ressourceContainer);
      applyNonLinearCommonDomStyle(ressourceContainer);
      ressourceContainer.addEventListener('click', () => {
        safeWindowOpen(variation.nonlinearClickThroughURLTemplate);
        this.nonLinearVastTracker.click(null, this.macros);
      });

      ressourceContainer.style.maxWidth = variation.expandedWidth;
      ressourceContainer.style.maxHeight = variation.expandedHeight;

      setSafeSrc(ressourceContainer, variation.iframeResource);
      appendToAdSlot(variation.adSlotID, ressourceContainer, this.oberplayer.el());
      if (variation.minSuggestedDuration) {
        setTimeout(() => {
          ressourceContainer.remove();
        }, variation.minSuggestedDuration * 1000);
      }
    }
    return variation;
  });
}

export default playNonLinearAd;
