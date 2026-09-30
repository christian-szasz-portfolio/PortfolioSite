import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { technologies } from '../../../data';
import { TechBandComponent } from './tech-band.component';

describe('TechBandComponent', () => {
  let fixture: ComponentFixture<TechBandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechBandComponent],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => true,
            pointerEffectsEnabled: () => true,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TechBandComponent);
    fixture.detectChanges();
  });

  it('renders one ticker per row of technologies', () => {
    expect(fixture.nativeElement.querySelectorAll('.marquee').length).toBe(technologies.length);
  });

  it('repeats each track three times, which keeps a wide band full while it loops', () => {
    const tracks = fixture.nativeElement.querySelectorAll('.marquee__track');

    expect(tracks.length).toBe(technologies.length * 3);
  });

  it('hides the copies from assistive tech, so nothing is read twice', () => {
    const hidden = fixture.nativeElement.querySelectorAll('.marquee__track[aria-hidden="true"]');

    expect(hidden.length).toBe(technologies.length * 2);
  });

  it('names the band, since a list of words needs context', () => {
    const band = fixture.nativeElement.querySelector('.marquee-band') as HTMLElement;

    expect(band.getAttribute('aria-label')).toBe('Technologies I work with');
  });
});
