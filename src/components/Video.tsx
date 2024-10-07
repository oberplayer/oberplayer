
import { useRef } from 'preact/hooks';

function Video({ imageUrl, aspect, isTouchDevice }: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <video
      ref={videoRef}
      className="l-player-container__video"
      poster={isTouchDevice ? imageUrl : undefined}
      preload="auto"
      playsInline
      controls={aspect === 'browser'}
    />
  );
}

export default Video;
