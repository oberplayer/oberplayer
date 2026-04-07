import { getBestMediaFile } from '../lib/utils';
/*
 * This method is responsible for rendering a linear ad
 */
export function playLinearAd(creative) {
  // Retrieve the media file from the VAST manifest
  const mediaFile = getBestMediaFile(creative.mediaFiles);

  // Start ad mode
  if (!this.oberplayer.ads.inAdBreak()) {
    this.oberplayer.ads.startLinearAdMode();
  }

  // Set a property in the player object to indicate that an ad is playing
  // play linear ad content
  this.oberplayer.loadAdVideo(mediaFile.fileURL);
  this.setMacros({
    ASSETURI: mediaFile.fileURL,
    ADPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
    CONTENTPLAYHEAD: this.linearVastTracker.convertToTimecode(this.oberplayer.currentTime()),
  });
}

export default playLinearAd;
