export class VideoProvider {

  static getShakaErrorMessage(code: number): string | undefined {
    let errorMessage;
    for (const k in globalThis.shaka.util.Error.Code) {
      if (globalThis.shaka.util.Error.Code[k] === code) {
        errorMessage = k;
      }
    }
    return errorMessage;
  }

  static getVideoBandwidthFromVariant(variant: Variant) {
    return variant.videoBandwidth ?? variant.bandwidth;
  }
  
  static sortByHeightThenByBandwidth(ob1: Variant, ob2: Variant): number {
    if (ob1.height < ob2.height) return 1;
    if (ob1.height > ob2.height) return -1;
  
    if (VideoProvider.getVideoBandwidthFromVariant(ob1) > VideoProvider.getVideoBandwidthFromVariant(ob2)) return -1;
    if (VideoProvider.getVideoBandwidthFromVariant(ob1) < VideoProvider.getVideoBandwidthFromVariant(ob2)) return 1;
    
    return 0;
  }

  static getHumanReadableBandWidthFromBits(bandwidth: number): string {
    return bandwidth > 1024 * 1024
      ? `${Math.round((bandwidth / 1024 / 1024) * 10) / 10}Mbps`
      : `${Math.round((bandwidth / 1024) * 10) / 10}Kbps`;
  }

  static getResolutionLabelFromWidth(width: number): string {
    if (width >= 3840) return '2160p';
    if (width >= 1920) return '1080p';
    if (width >= 1280) return '720p';
    if (width >= 720) return '480p';
    if (width >= 640) return '360p';
    if (width >= 352) return '288p';
    if (width >= 256) return '144p';
    return '144p';
  }

  init() {}

  hideTextTracks() {}

  getActiveVariant() {}

  getActiveTextTrack() {}

  setPlayerToWaitingState() {}

  EmptyVideoData() {}

  destroy() {}
}
