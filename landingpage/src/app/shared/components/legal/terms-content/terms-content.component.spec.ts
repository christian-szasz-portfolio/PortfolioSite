import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TermsContentComponent } from './terms-content.component';

describe('TermsContentComponent', () => {
  let fixture: ComponentFixture<TermsContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsContentComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsContentComponent);
    fixture.detectChanges();
  });

  it('renders the terms sections', () => {
    const headings = fixture.nativeElement.querySelectorAll('.doc__heading');

    expect(headings.length).toBeGreaterThan(0);
  });

  it('links to the privacy policy', () => {
    const link = fixture.nativeElement.querySelector('a[href="/privacy"]') as HTMLAnchorElement;

    expect(link).not.toBeNull();
  });
});
