import { IMAGE_LOADER } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { BrowserEnvironment, ScrollService, ScrollState } from '@christian-szasz-portfolio/common-web';

import { ImageLoader } from '../../../../core/utils/image-loader/image-loader.utils';
import { MediaDialogService } from '../../../../core/services/dialogs/media-dialog/media-dialog.service';
import { MediaViewerData } from '../../overlay/media-viewer/media-viewer.component';
import { MediaFrameComponent } from './media-frame.component';

@Component({
  imports: [MediaFrameComponent],
  template: `
    <lpg-media-frame
      label="stack86 · compiler"
      poster="assets/img/stack86-1280.jpg"
      [clip]="clip()"
      alt="The Stack86 IDE"
    />
  `,
})
class Host {
  public readonly clip = signal<string | null>('assets/clip/stack86.webm');
}

describe('MediaFrameComponent', () => {
  let fixture: ComponentFixture<Host>;
  let opened: MediaViewerData[];

  const setUp = async (animations: boolean) => {
    opened = [];
    const mediaDialog = {
      open: (data: MediaViewerData): Observable<void> => {
        opened.push(data);
        return of(undefined);
      },
    };

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => animations,
            pointerEffectsEnabled: () => animations,
          },
        },
        {
          provide: ScrollService,
          useValue: { state: signal<ScrollState>({ y: 0, viewport: 0, document: 0 }) },
        },
        { provide: IMAGE_LOADER, useValue: ImageLoader.sized },
        { provide: MediaDialogService, useValue: mediaDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  };

  const image = (): HTMLImageElement =>
    fixture.nativeElement.querySelector('.media__image') as HTMLImageElement;
  const video = (): HTMLVideoElement | null =>
    fixture.nativeElement.querySelector('.media__video') as HTMLVideoElement | null;
  const toggle = (): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector('.play-toggle') as HTMLButtonElement | null;
  const expand = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('.media__expand') as HTMLButtonElement;

  it('shows the poster with both widths, and keeps it there while a clip plays', async () => {
    await setUp(true);

    expect(image().getAttribute('src')).toBe('assets/img/stack86-1280.jpg');
    expect(image().getAttribute('srcset')).toContain('640w');

    toggle()?.click();
    fixture.detectChanges();

    // The poster is never swapped out, which is what lets NgOptimizedImage work here
    expect(image().getAttribute('src')).toBe('assets/img/stack86-1280.jpg');
  });

  it('offers a play control only when there is a clip', async () => {
    await setUp(true);
    expect(toggle()).not.toBeNull();

    fixture.componentInstance.clip.set(null);
    fixture.detectChanges();

    expect(toggle()).toBeNull();
  });

  it('builds a muted, looping clip that fetches nothing until it is asked to', async () => {
    await setUp(true);
    const element = video();

    expect(element?.getAttribute('src')).toBe('assets/clip/stack86.webm');
    expect(element?.hasAttribute('loop')).toBe(true);
    expect(element?.hasAttribute('muted')).toBe(true);
    expect(element?.hasAttribute('playsinline')).toBe(true);
    expect(element?.getAttribute('preload')).toBe('none');

    // Playback is script-driven, so a reader who reduced motion is never overruled
    expect(element?.hasAttribute('autoplay')).toBe(false);
  });

  it('drops the clip element entirely when there is nothing to play', async () => {
    await setUp(true);
    fixture.componentInstance.clip.set(null);
    fixture.detectChanges();

    expect(video()).toBeNull();
  });

  it('reveals the clip on play and freezes it on pause', async () => {
    await setUp(true);
    expect(video()?.classList.contains('is-showing')).toBe(false);
    expect(toggle()?.textContent).toContain('Play');

    toggle()?.click();
    fixture.detectChanges();

    expect(video()?.classList.contains('is-showing')).toBe(true);
    expect(toggle()?.getAttribute('aria-pressed')).toBe('true');
    expect(toggle()?.textContent).toContain('Pause');

    toggle()?.click();
    fixture.detectChanges();

    expect(toggle()?.getAttribute('aria-pressed')).toBe('false');
    // The picture stays put rather than snapping back to the poster
    expect(video()?.classList.contains('is-showing')).toBe(true);
  });

  it('still lets a reader who reduced motion start the clip by hand', async () => {
    await setUp(false);

    toggle()?.click();
    fixture.detectChanges();

    expect(toggle()?.getAttribute('aria-pressed')).toBe('true');
  });

  it('puts the tilt on the figure, which is the element that has a box', async () => {
    await setUp(true);
    const figure = fixture.nativeElement.querySelector('.media') as HTMLElement;

    // The directive writes its resting values onto whatever it is attached to.
    expect(figure.style.getPropertyValue('--tilt-x')).toBe('0.000deg');
  });

  it('labels the frame for assistive tech, and hides the duplicate clip from it', async () => {
    await setUp(true);

    expect(image().getAttribute('alt')).toBe('The Stack86 IDE');
    expect(video()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('opens the same picture large from the chrome, clip and all', async () => {
    await setUp(true);

    expect(expand()).not.toBeNull();
    expand().click();

    expect(opened).toEqual([
      {
        poster: 'assets/img/stack86-1280.jpg',
        alt: 'The Stack86 IDE',
        label: 'stack86 · compiler',
        clip: 'assets/clip/stack86.webm',
      },
    ]);
  });

  it('offers the larger view even for a frame with no clip', async () => {
    await setUp(true);
    fixture.componentInstance.clip.set(null);
    fixture.detectChanges();

    expand().click();

    expect(opened[0]?.clip).toBeNull();
  });
});
