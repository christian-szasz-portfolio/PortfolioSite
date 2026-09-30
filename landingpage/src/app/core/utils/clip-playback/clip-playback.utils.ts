import { signal } from '@angular/core';
import { EMPTY, Observable, catchError, defer, from } from 'rxjs';

/**
 * A muted, looping clip laid over its poster: the playback the media frame and its larger view
 * share. The element is asked for on each use, since a view query only resolves after render.
 */
export class ClipPlayback {
  /** Follows the element itself, so a control never claims more than is true */
  public readonly playing = signal(false);

  /** Never cleared, so a pause freezes the picture rather than snapping back to the poster */
  public readonly visible = signal(false);

  public constructor(private readonly element: () => HTMLVideoElement | undefined) {}

  /** For the element's `playing` event: real frames have arrived */
  public onPlaying(): void {
    this.playing.set(true);
    this.visible.set(true);
  }

  /** For the element's `pause` event */
  public onPaused(): void {
    this.playing.set(false);
  }

  /**
   * Starts the clip, which is fetched only here, the element carrying preload="none", so play
   * cannot flash. Cold: nothing plays until a caller subscribes. `play()` answers with a native
   * promise, which is wrapped here rather than handed on.
   */
  public start(): Observable<void> {
    return defer(() => {
      const video = this.element();
      if (video === undefined) {
        return EMPTY;
      }

      // An unattended start needs a muted element, and the attribute alone does not mute one
      video.muted = true;
      return from(video.play());
    }).pipe(
      catchError(() => {
        // A refused start leaves the poster up and the control still offering Play
        this.playing.set(false);
        return EMPTY;
      }),
    );
  }

  public stop(): void {
    this.element()?.pause();
  }
}
