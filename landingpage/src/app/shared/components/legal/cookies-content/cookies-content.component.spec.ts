import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ViewCounterService, ViewStats } from '@christian-szasz-portfolio/common-web';

import { CookiesContentComponent } from './cookies-content.component';

describe('CookiesContentComponent', () => {
  let fixture: ComponentFixture<CookiesContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookiesContentComponent],
      providers: [
        provideRouter([]),
        {
          provide: ViewCounterService,
          useValue: {
            stats: signal<ViewStats | null>(null).asReadonly(),
            ensureLoaded: (): void => {
              /* never loads in these specs */
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CookiesContentComponent);
    fixture.detectChanges();
  });

  it('describes what is stored on the device', () => {
    const headings = [...fixture.nativeElement.querySelectorAll('.doc__heading')].map((heading) =>
      (heading as HTMLElement).textContent?.trim(),
    );

    expect(headings).toContain('Information stored on your device');
  });

  it('embeds the country breakdown', () => {
    expect(fixture.nativeElement.querySelector('lpg-view-breakdown')).not.toBeNull();
  });

  it('explains consent', () => {
    const headings = [...fixture.nativeElement.querySelectorAll('.doc__heading')].map((heading) =>
      (heading as HTMLElement).textContent?.trim(),
    );

    expect(headings).toContain('Consent');
  });
});
