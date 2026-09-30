import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BrowserEnvironment, PointerPosition, PointerService, ScrollService, ScrollState } from '@christian-szasz-portfolio/common-web';

import { stats } from '../../../data';
import { HeroSectionComponent } from './hero-section.component';

describe('HeroSectionComponent', () => {
  let fixture: ComponentFixture<HeroSectionComponent>;

  const setUp = async (animations: boolean) => {
    document.documentElement.classList.remove('is-intro-ready');

    await TestBed.configureTestingModule({
      imports: [HeroSectionComponent],
      providers: [
        provideRouter([]),
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            window,
            animationsEnabled: () => animations,
            pointerEffectsEnabled: () => animations,
          },
        },
        {
          provide: PointerService,
          useValue: { position: signal<PointerPosition>({ x: 0, y: 0, active: false }) },
        },
        {
          provide: ScrollService,
          useValue: { state: signal<ScrollState>({ y: 0, viewport: 0, document: 0 }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroSectionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('states the headline as one sentence, at the level its place on the page gives it', async () => {
    await setUp(false);
    const heading = fixture.nativeElement.querySelector('.hero__title') as HTMLElement;

    // The home page opens with the profile section, so that section carries the page heading and
    // this one is a section below it. The size says which is louder; the level says which is first.
    expect(heading.tagName).toBe('H2');
    expect(heading.textContent?.trim()).toBe(
      'I build web applications end to end, from the database to the browser.',
    );
  });

  it('carries both the location and the remote-work label in the pill', async () => {
    await setUp(false);
    const pill = fixture.nativeElement.querySelector('.hero__eyebrow') as HTMLElement;

    expect(pill.querySelector('.hero__status-face--here')?.textContent?.trim()).toBe(
      'Sibiu, Romania',
    );
    expect(pill.querySelector('.hero__status-face--remote')?.textContent?.trim()).toBe(
      'open to remote work',
    );
  });

  it('renders every stat', async () => {
    await setUp(false);

    expect(fixture.nativeElement.querySelectorAll('.stat').length).toBe(stats.length);
  });

  it('is ready immediately when motion is not wanted, so nothing stays hidden', async () => {
    await setUp(false);
    const hero = fixture.nativeElement.querySelector('.hero') as HTMLElement;

    expect(hero.classList.contains('is-ready')).toBe(true);
    expect(document.documentElement.classList.contains('is-intro-ready')).toBe(false);
  });

  it('rests the glow at its default position until the pointer reports one', async () => {
    await setUp(true);
    const glow = fixture.nativeElement.querySelector('.hero__glow') as HTMLElement;

    expect(glow.style.getPropertyValue('--mx')).toBe('26%');
    expect(glow.style.getPropertyValue('--my')).toBe('30%');
  });

  it('anchors the top of the page', async () => {
    await setUp(false);

    expect((fixture.nativeElement.querySelector('section') as HTMLElement).id).toBe('top');
  });
});
