import { TestBed } from '@angular/core/testing';

import { cv } from '../../../../data';
import { CvSidebarComponent } from './cv-sidebar.component';

describe('CvSidebarComponent', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CvSidebarComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CvSidebarComponent);
    fixture.componentRef.setInput('cv', cv);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('names the sheet and its headline', () => {
    expect(host.querySelector('.cv-profile__name')?.textContent).toBe(cv.profile.name);
    expect(host.querySelector('.cv-profile__title')?.textContent).toContain('Full-Stack');
  });

  it('draws a glyph for every contact line, and names it for assistive tech', () => {
    const items = Array.from(host.querySelectorAll('.cv-contact__item'));
    expect(items.length).toBe(cv.contact.length);

    for (const item of items) {
      const icon = item.querySelector('.cv-contact__icon');
      // A path with no data would render an empty box rather than a mark
      expect(icon?.querySelector('path')?.getAttribute('d')?.length).toBeGreaterThan(10);
      expect(icon?.getAttribute('aria-label')?.length).toBeGreaterThan(0);
    }
  });

  it('lists the skills, the studies and the languages', () => {
    expect(host.querySelectorAll('.cv-panel--skills .cv-skills__row').length).toBe(
      cv.skills.length,
    );
    expect(host.querySelectorAll('.cv-education__item').length).toBe(cv.education.length);
    expect(host.querySelectorAll('.cv-panel--languages .cv-skills__row').length).toBe(
      cv.languages.length,
    );
  });

  it('points the photograph at an asset the app actually ships', () => {
    const photo = host.querySelector('.cv-profile__photo');

    expect(photo?.getAttribute('src')).toBe(cv.profile.photo);
    expect(photo?.getAttribute('alt')).toBe(cv.profile.photoAlt);
  });
});
