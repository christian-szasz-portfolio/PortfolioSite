import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { BrowserEnvironment, SEO_CONFIG } from '@christian-szasz-portfolio/common-web';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [
        provideRouter([]),
        { provide: SEO_CONFIG, useValue: { siteUrl: 'https://example.test', siteName: 'Test' } },
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
  });

  // The route's own job: the body is shared, the metadata is not.
  it('sets its own document title', () => {
    expect(TestBed.inject(Title).getTitle()).toContain('Page not found');
  });

  it('shows the shared body', () => {
    expect(fixture.nativeElement.querySelector('lpg-not-found-content')).not.toBeNull();
  });
});
