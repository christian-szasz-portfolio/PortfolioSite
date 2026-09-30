import { defaultIfEmpty, firstValueFrom } from 'rxjs';

import { ClipPlayback } from './clip-playback.utils';

/** Just what the helper touches of a video element */
class VideoStub {
  public muted = false;
  public paused = 0;
  public refuse = false;

  public play(): Promise<void> {
    return this.refuse ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve();
  }

  public pause(): void {
    this.paused += 1;
  }
}

describe('ClipPlayback', () => {
  const setUp = (video: VideoStub | undefined = new VideoStub()) => ({
    video,
    playback: new ClipPlayback(() => video as unknown as HTMLVideoElement | undefined),
  });

  /** Runs the stream to its end, however it ends */
  const run = (playback: ClipPlayback): Promise<void> =>
    firstValueFrom(playback.start().pipe(defaultIfEmpty(undefined)));

  it('mutes the element before asking it to play, since an unattended start must be muted', async () => {
    const { video, playback } = setUp();

    await run(playback);

    expect(video?.muted).toBe(true);
  });

  it('starts nothing until it is subscribed to', () => {
    const { video, playback } = setUp();

    playback.start();

    expect(video?.muted).toBe(false);
  });

  it('shows the clip only once real frames arrive, and keeps it shown through a pause', () => {
    const { playback } = setUp();
    expect(playback.visible()).toBe(false);

    playback.onPlaying();
    expect(playback.playing()).toBe(true);
    expect(playback.visible()).toBe(true);

    playback.onPaused();
    expect(playback.playing()).toBe(false);
    expect(playback.visible()).toBe(true);
  });

  it('leaves the control offering Play when the browser refuses to start', async () => {
    const video = new VideoStub();
    video.refuse = true;
    const { playback } = setUp(video);
    playback.playing.set(true);

    await run(playback);

    expect(playback.playing()).toBe(false);
  });

  it('pauses the element, and does nothing before the element exists', async () => {
    const { video, playback } = setUp();
    playback.stop();
    expect(video?.paused).toBe(1);

    const empty = new ClipPlayback(() => undefined);
    await run(empty);
    empty.stop();
    expect(empty.playing()).toBe(false);
  });
});
