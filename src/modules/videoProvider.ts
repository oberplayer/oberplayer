import { PlaylistEntry } from '@oberplayer/oberplayer';

export abstract class VideoProvider {
  abstract init(): Promise<this>;
  abstract load(videoUrl: PlaylistEntry["videoUrl"], drm?: unknown, options?: unknown): Promise<void>;
  abstract detach(): Promise<void>;
  abstract destroy(): Promise<void> | void;
  abstract getVideoUrl(): PlaylistEntry["videoUrl"];
  abstract clearTrackData(): void;

  setPlayerToWaitingState(): void {}
  hideTextTracks(): void {}
  getActiveVariant(): Variant | undefined { return undefined; }
  getActiveTextTrack(): ShakaTextTrack | undefined { return undefined; }
}
