import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MediaViewerComponent, MediaViewerData } from './media-viewer.component';

describe('MediaViewerComponent', () => {
  let fixture: ComponentFixture<MediaViewerComponent>;
  let closed: number;

  const setUp = async (data: MediaViewerData) => {
    closed = 0;
    await TestBed.configureTestingModule({
      imports: [MediaViewerComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        {
          provide: MatDialogRef,
          useValue: {
            close: () => {
              closed += 1;
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaViewerComponent);
    fixture.detectChanges();
  };

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const withClip: MediaViewerData = {
    poster: 'assets/img/stack86-1280.jpg',
    alt: 'The Stack86 IDE',
    label: 'stack86 · compiler',
    clip: 'assets/clip/stack86.webm',
  };

  it('titles the pop-up with the label and shows the poster', async () => {
    await setUp(withClip);

    expect(host().textContent).toContain('stack86 · compiler');
    const image = host().querySelector('.viewer__image') as HTMLImageElement;
    expect(image.getAttribute('src')).toBe('assets/img/stack86-1280.jpg');
    expect(image.getAttribute('alt')).toBe('The Stack86 IDE');
  });

  it('offers the clip and a play control when there is one', async () => {
    await setUp(withClip);

    expect(host().querySelector('.viewer__video')).not.toBeNull();
    expect(host().querySelector('.play-toggle')).not.toBeNull();
  });

  it('shows only the still picture when there is no clip', async () => {
    await setUp({ ...withClip, clip: null });

    expect(host().querySelector('.viewer__video')).toBeNull();
    expect(host().querySelector('.play-toggle')).toBeNull();
  });

  it('closes the pop-up through the shell', async () => {
    await setUp(withClip);

    (host().querySelector('.modal__close') as HTMLButtonElement).click();

    expect(closed).toBe(1);
  });
});
