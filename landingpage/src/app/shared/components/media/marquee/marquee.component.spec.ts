import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { MarqueeComponent } from './marquee.component';

@Component({
  imports: [MarqueeComponent],
  template: `<lpg-marquee [items]="items" [reverse]="true" />`,
})
class Host {
  public readonly items = ['C#', 'Angular', 'Azure'] as const;
}

describe('MarqueeComponent', () => {
  let fixture: ComponentFixture<Host>;

  const setUp = async (animations: boolean) => {
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  };

  it('renders the track three times, enough to keep a wide band full while it loops', async () => {
    await setUp(true);
    const tracks = fixture.nativeElement.querySelectorAll('.marquee__track');

    expect(tracks.length).toBe(3);
    for (const track of tracks) {
      expect(track.querySelectorAll('.marquee__item').length).toBe(3);
    }
  });

  it('hides the copies from assistive tech', async () => {
    await setUp(true);
    const tracks = fixture.nativeElement.querySelectorAll('.marquee__track');

    expect(tracks[0].getAttribute('aria-hidden')).toBeNull();
    expect(tracks[1].getAttribute('aria-hidden')).toBe('true');
    expect(tracks[2].getAttribute('aria-hidden')).toBe('true');
  });

  it('does not run when motion is not wanted', async () => {
    await setUp(false);
    const track = fixture.nativeElement.querySelector('.marquee') as HTMLElement;

    expect(track.classList.contains('is-running')).toBe(false);
  });

  it('scales the duration with the number of items, so both rows travel alike', async () => {
    await setUp(true);
    const track = fixture.nativeElement.querySelector('.marquee') as HTMLElement;

    // three items at roughly 118px, 46px per second
    expect(track.style.getPropertyValue('--marquee-duration')).toBe('9.8s');
  });
});
