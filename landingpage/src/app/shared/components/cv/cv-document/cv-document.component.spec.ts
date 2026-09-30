import { TestBed } from '@angular/core/testing';

import { cv } from '../../../../data';
import { CvDocumentComponent } from './cv-document.component';

describe('CvDocumentComponent', () => {
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CvDocumentComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CvDocumentComponent);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  it('draws both columns of the sheet', () => {
    expect(host.querySelector('.cv')).not.toBeNull();
    expect(host.querySelector('.cv__sidebar')).not.toBeNull();
    expect(host.querySelector('.cv__main')).not.toBeNull();
  });

  it('falls back to the site CV when it is given nothing else', () => {
    expect(host.querySelector('.cv-profile__name')?.textContent).toBe(cv.profile.name);
  });
});
