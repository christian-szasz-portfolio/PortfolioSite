import { TestBed } from '@angular/core/testing';
import { PageMeta, SeoService } from '@christian-szasz-portfolio/common-web';

import { cv } from '../../data';
import { CvPageComponent } from './cv-page.component';

describe('CvPageComponent', () => {
  it('puts the sheet on a page and tells the crawler what it is', async () => {
    const applied: PageMeta[] = [];

    await TestBed.configureTestingModule({
      imports: [CvPageComponent],
      providers: [
        { provide: SeoService, useValue: { apply: (page: PageMeta) => applied.push(page) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CvPageComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.cv-desk .cv')).not.toBeNull();
    expect(applied.length).toBe(1);
    expect(applied[0]?.path).toBe('/cv');
    expect(applied[0]?.title).toBe(cv.documentTitle);
  });
});
