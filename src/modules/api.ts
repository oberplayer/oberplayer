import { PlayerApi } from '@oberplayer-free/oberplayer';
import { toggleFullScreen } from './fullscreen';


export default function mapApi(api:PlayerApi, isAdPlayer:PlayerState["isAdPlayer"], domElement: PlayerAttributes["domElement"]) {
  const videoTag = domElement?.querySelector('video') as HTMLVideoElement;
  if (videoTag instanceof HTMLVideoElement) {
    api.play = () => videoTag.play.bind(videoTag)();
    api.pause = () => {
      videoTag.pause.bind(videoTag)();
    };
    api.togglePlay = () => {
      if (api.getState() === 'playing') {
        return api.pause.bind(videoTag)();
      }
      return api.play.bind(videoTag)();
    };
    api.seek = (position) => {
      if (!isAdPlayer && !Number.isNaN(position)) {
        videoTag.currentTime = position;
      }
    };
    api.getPosition = () => videoTag.currentTime;
    api.getVolume = () => Math.round(videoTag.volume * 100) / 100;
    api.setVolume = (volume, shouldSetUserPrefs = false) => {
      if (!Number.isNaN(volume) && volume >= 0 && volume <= 1) {
        videoTag.volume = volume;
        
      }
    };
    api.getDuration = () => videoTag.duration;
    api.getMute = () => videoTag.muted;
    api.setMute = (muted, shouldSetUserPrefs = false) => {
      videoTag.muted = muted;
      
    };
    api.toggleMute = (shouldSetUserPrefs) => {
      api.setMute(!api.getMute(), shouldSetUserPrefs);
    };
    api.toggleFullScreen = () => {
      toggleFullScreen(domElement);
    };
    api.playOnAirplay = () => { 
      if (videoTag.webkitShowPlaybackTargetPicker) {
        videoTag.webkitShowPlaybackTargetPicker();
      }
    }
    api.getState = () => 'paused';
    api.setPlaybackRate = (playbackRate) => {
      videoTag.playbackRate = playbackRate;
    };
  }
}
