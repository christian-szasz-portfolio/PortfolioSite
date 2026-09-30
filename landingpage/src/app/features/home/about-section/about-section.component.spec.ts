import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { CvDialogService } from '../../../core/services/dialogs/cv-dialog/cv-dialog.service';
import { contact } from '../../../data';
import { AboutSectionComponent } from './about-section.component';

describe('AboutSectionComponent', () => {
  let fixture: ComponentFixture<AboutSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutSectionComponent],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
          },
        },
        { provide: CvDialogService, useValue: { open: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutSectionComponent);
    fixture.detectChanges();
  });

  it('renders every way of reaching me', () => {
    expect(fixture.nativeElement.querySelectorAll('.contact__item').length).toBe(contact.length);
  });

  it('offers the CV card', () => {
    expect(fixture.nativeElement.querySelector('.cv-card')).not.toBeNull();
  });

  it('keeps its heading at level two, under the page title', () => {
    const heading = fixture.nativeElement.querySelector('.section__title') as HTMLElement;

    expect(heading.tagName).toBe('H2');
    expect(heading.textContent?.trim()).toBe('Christian-Ioan Szasz');
  });

  it('anchors the section for the navigation', () => {
    expect((fixture.nativeElement.querySelector('section') as HTMLElement).id).toBe('about');
  });
});
