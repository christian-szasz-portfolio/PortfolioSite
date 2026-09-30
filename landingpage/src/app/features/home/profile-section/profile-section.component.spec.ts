import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { ProfileSectionComponent } from './profile-section.component';

describe('ProfileSectionComponent', () => {
  let fixture: ComponentFixture<ProfileSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSectionComponent],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: (): boolean => false,
            pointerEffectsEnabled: (): boolean => false,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSectionComponent);
    fixture.detectChanges();
  });

  it('marks the section by class, not an id', () => {
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;

    expect(section.classList.contains('section--profile')).toBe(true);
    expect(section.id).toBe('');
  });

  it('sets the first line as a testimonial quote', () => {
    const quote = fixture.nativeElement.querySelector('.testimonial__quote') as HTMLElement;

    expect(quote).not.toBeNull();
    expect(quote.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('lays an animated formula field behind the section', () => {
    expect(
      fixture.nativeElement.querySelector('.profile__backdrop common-formula-field'),
    ).not.toBeNull();
  });

  it('shows the portrait, pointing at the CV photo', () => {
    const photo = fixture.nativeElement.querySelector('.profile__photo') as HTMLImageElement;

    expect(photo).not.toBeNull();
    expect(photo.getAttribute('src')).toBe('assets/img/cv-photo.jpg');
    expect(photo.getAttribute('alt')?.length).toBeGreaterThan(0);
  });

  it('carries the page heading, since this section opens the page', () => {
    const heading = fixture.nativeElement.querySelector('.section__title') as HTMLElement;

    // Nothing renders above this section, so a reader arriving at the top meets the page's own
    // heading rather than a subheading, and the outline starts where the page starts.
    expect(heading.tagName).toBe('H1');
  });

  it('lists every hobby', () => {
    const hobbies = [...fixture.nativeElement.querySelectorAll('.hobby')] as HTMLElement[];
    const labels = hobbies.map((hobby) => hobby.textContent?.trim());

    expect(labels).toEqual(['Cycling', 'Reading', 'Padel', 'Travelling', 'Swimming']);
  });
});
