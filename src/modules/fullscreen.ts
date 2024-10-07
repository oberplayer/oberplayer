export function isNotFullScreen(): boolean {
  return (
    !document.fullscreenElement
  );
}

function goFullScreen(el: HTMLElement, force?: boolean): void {
  // Only enter fullscreen mode if not yet fullscreen or if force was requested (for iOS)
  // If already in fullscreen mode, simply ignore the request, otherwise we will get a failed promise
  if (isNotFullScreen() || force) {
    if (el.requestFullscreen) {
      el.requestFullscreen();
    }
  }
}

/**
 * Player exit fullscreen mode
 * @param el player node
 */
export function goNoFullScreen(): void {
  // Only exit fullscreen mode if already in fullscreen
  // If not yet in fullscreen mode, simply ignore the request
  if (!isNotFullScreen()) {
    if ((document as Document).exitFullscreen) {
      (document as Document).exitFullscreen();
    }
  }
}

/**
 * Switch fullscreen mode
 * @param el player node
 */
export function toggleFullScreen(el: HTMLElement | null | undefined): void {
  if(el instanceof HTMLElement) {
    // Check if os information is available at all, sometimes it isn't and we shouldn't break
    if (/iphone/i.test(navigator.userAgent)) {
      const video = el.querySelector('video') as HTMLVideoElement;
      goFullScreen(video, true);
    } else if (isNotFullScreen()) {
      // concerns everything but ios
      goFullScreen(el);
    } else {
      // concerns everything but ios
      goNoFullScreen();
    }
  }
}
