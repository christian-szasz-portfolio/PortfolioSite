import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { ViewCounterService, ViewStats } from '@christian-szasz-portfolio/common-web';

import { CookiesViewerComponent } from './cookies-viewer.component';

describe('CookiesViewerComponent', () => {
  let fixture: ComponentFixture<CookiesViewerComponent>;
  let closed: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    closed = vi.fn();
    await TestBed.configureTestingModule({
      imports: [CookiesViewerComponent],
      providers: [
        provideRouter([]),
        { provide: MatDialogRef, useValue: { close: closed } },
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

    fixture = TestBed.createComponent(CookiesViewerComponent);
    fixture.detectChanges();
  });

  it('shows the cookies text inside a modal shell', () => {
    expect(fixture.nativeElement.querySelector('lpg-modal-shell')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('lpg-cookies-content')).not.toBeNull();
  });

  it('closes the dialog when the shell asks it to', () => {
    fixture.componentInstance.close();

    expect(closed).toHaveBeenCalledTimes(1);
  });
});
