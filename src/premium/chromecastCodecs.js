// source : https://chromium.googlesource.com/chromium/src/media/+/master/base/mime_util_internal.cc

const chromeCastCodecs = {
  AAC: ['mp4a.40.2', 'mp4a.40.02', 'mp4a.40.5', 'mp4a.40.05', 'mp4a.40.29', 'mp4a.40.42'],
  AC3: ['ac-3', 'mp4a.a5', 'mp4a.A5'],
  MP3: ['mp4a.69', 'mp4a.6B'],
  TS_AAC: ['mp4a.66', 'mp4a.67', 'mp4a.68'],
  E_AC3: ['ec-3', 'mp4a.a6', 'mp4a.A6'],
};
export function getChromecastAudioCodec(audioCodec) {
  if (!audioCodec) {
    return undefined;
  }
  let chromecastAudioCodec = null;
  for (const [key, value] of Object.entries(chromeCastCodecs)) {
    if (value.includes(audioCodec)) {
      chromecastAudioCodec = key;
    }
  }
  return chromecastAudioCodec;
}
export function getChromecastVideoCodec(videoCodec) {
  if (!videoCodec) {
    return undefined;
  }
  return videoCodec === 'video/mp2t' ? 'MPEG2' : 'FMP';
}
