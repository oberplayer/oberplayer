/**
 * Video utility functions — pure helpers extracted from VideoProvider.
 */

export function getVideoBandwidthFromVariant(variant: Variant): number {
  return variant.videoBandwidth ?? variant.bandwidth;
}

export function sortByHeightThenByBandwidth(ob1: Variant, ob2: Variant): number {
  if (ob1.height < ob2.height) return 1;
  if (ob1.height > ob2.height) return -1;

  if (getVideoBandwidthFromVariant(ob1) > getVideoBandwidthFromVariant(ob2)) return -1;
  if (getVideoBandwidthFromVariant(ob1) < getVideoBandwidthFromVariant(ob2)) return 1;

  return 0;
}

export function getHumanReadableBandWidthFromBits(bandwidth: number): string {
  return bandwidth > 1024 * 1024
    ? `${Math.round((bandwidth / 1024 / 1024) * 10) / 10}Mbps`
    : `${Math.round((bandwidth / 1024) * 10) / 10}Kbps`;
}

export function getResolutionLabelFromWidth(width: number): string {
  if (width >= 3840) return '2160p';
  if (width >= 1920) return '1080p';
  if (width >= 1280) return '720p';
  if (width >= 720) return '480p';
  if (width >= 640) return '360p';
  if (width >= 352) return '288p';
  if (width >= 256) return '144p';
  return '144p';
}
