import { TestBed } from '@angular/core/testing';

import { cv } from '../../../../data';
import { CvMainComponent } from './cv-main.component';

describe('CvMainComponent', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CvMainComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CvMainComponent);
    fixture.componentRef.setInput('cv', cv);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('writes every about paragraph, keeping its highlights emphasised', () => {
    expect(host.querySelectorAll('.cv-about__paragraph').length).toBe(cv.about.length);
    expect(host.querySelector('.cv-about__highlight')?.textContent).toContain(
      'Full-Stack Software Engineer',
    );
  });

  it('renders one entry per role', () => {
    expect(host.querySelectorAll('.cv-role').length).toBe(cv.roles.length);
  });

  it('carries the page number the sheet claims', () => {
    expect(host.querySelector('.cv-page-number')?.textContent?.trim()).toBe(cv.pageNumber);
  });
});
