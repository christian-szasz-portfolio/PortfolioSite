import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { SEO_CONFIG } from '@christian-szasz-portfolio/common-web';

import { TermsComponent } from './terms.component';

describe('TermsComponent', () => {
  let fixture: ComponentFixture<TermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsComponent],
      providers: [
        provideRouter([]),
        { provide: SEO_CONFIG, useValue: { siteUrl: 'https://example.test', siteName: 'Test' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsComponent);
    fixture.detectChanges();
  });

  it('opens with one heading, naming the page', () => {
    const headings = fixture.nativeElement.querySelectorAll('h1');

    expect(headings.length).toBe(1);
    expect((headings[0] as HTMLElement).textContent?.trim()).toBe('Terms and conditions');
  });

  it('sets its own document metadata, during prerendering', () => {
    expect(TestBed.inject(Title).getTitle()).toContain('Terms and conditions');
  });
});
