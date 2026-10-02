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

  it('gives the site and the GitHub organisation a line each', () => {
    const lines = Array.from(host.querySelectorAll('.cv-contact__item')).map((item) => ({
      label: item.querySelector('.cv-contact__icon')?.getAttribute('aria-label'),
      text: item.querySelector('.cv-contact__text')?.textContent,
    }));

    expect(lines).toContainEqual({ label: 'Website', text: 'christianszasz.dev' });
    expect(lines).toContainEqual({ label: 'GitHub', text: '/christian-szasz-portfolio' });
  });

  // The octocat is drawn on a 16 canvas, so on the 24 the rest use it would sit in one corner
  it('draws each glyph on the canvas it was drawn for', () => {
    for (const item of Array.from(host.querySelectorAll('.cv-contact__item'))) {
      const icon = item.querySelector('.cv-contact__icon');
      const expected = icon?.getAttribute('aria-label') === 'GitHub' ? '0 0 16 16' : '0 0 24 24';

      expect(icon?.getAttribute('viewBox')).toBe(expected);
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
