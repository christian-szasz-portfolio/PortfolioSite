import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { ErrorDialogService } from '../../../../core/services/dialogs/error-dialog/error-dialog.service';
import type { ErrorReport } from '../../../../core/services/platform/error-handler/error-report';
import { ErrorViewerComponent } from './error-viewer.component';

/** What the component was given, and what it did with it */
interface ErrorViewerTestBed {
  readonly fixture: ComponentFixture<ErrorViewerComponent>;
  readonly closed: ReturnType<typeof vi.fn>;
  readonly reloaded: ReturnType<typeof vi.fn>;
  readonly dismissed: ReturnType<typeof vi.fn>;
}

async function configure(report: ErrorReport): Promise<ErrorViewerTestBed> {
  const closed = vi.fn();
  const reloaded = vi.fn();
  const dismissed = vi.fn();

  await TestBed.configureTestingModule({
    imports: [ErrorViewerComponent],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: report },
      { provide: MatDialogRef, useValue: { close: closed } },
      { provide: ErrorDialogService, useValue: { closed: dismissed } },
      { provide: BrowserEnvironment, useValue: { window: { location: { reload: reloaded } } } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ErrorViewerComponent);
  fixture.detectChanges();

  return { fixture, closed, reloaded, dismissed };
}

/** The button whose label matches, since neither carries an id */
function button(
  fixture: ComponentFixture<ErrorViewerComponent>,
  label: string,
): HTMLButtonElement | undefined {
  const buttons: HTMLButtonElement[] = [
    ...fixture.nativeElement.querySelectorAll('.error-modal__footer button'),
  ];

  return buttons.find((candidate) => candidate.textContent?.trim() === label);
}

describe('ErrorViewerComponent', () => {
  describe('while developing', () => {
    const report: ErrorReport = {
      message: 'TypeError: x is not a function',
      stack: 'TypeError: x is not a function\n    at somewhere',
      detailed: true,
    };

    it('shows what was thrown', async () => {
      const { fixture } = await configure(report);

      expect(fixture.nativeElement.querySelector('.error-modal__message')?.textContent).toContain(
        'TypeError: x is not a function',
      );
    });

    it('puts the stack in a panel that starts closed', async () => {
      const { fixture } = await configure(report);
      const details: HTMLDetailsElement =
        fixture.nativeElement.querySelector('.error-modal__details');

      expect(details.open).toBe(false);
      expect(details.querySelector('.error-modal__stack')?.textContent).toContain('at somewhere');
    });

    it('offers no reload, because the point here is to read the failure', async () => {
      const { fixture } = await configure(report);

      expect(fixture.nativeElement.querySelector('.error-modal__footer')).toBeNull();
    });

    it('shows no panel when nothing carried a stack', async () => {
      const { fixture } = await configure({ message: 'thrown as a string', detailed: true });

      expect(fixture.nativeElement.querySelector('.error-modal__details')).toBeNull();
    });
  });

  describe('in front of a visitor', () => {
    const report: ErrorReport = {
      message: 'TypeError: x is not a function',
      stack: 'at somewhere',
      detailed: false,
    };

    it('says nothing about what broke', async () => {
      const { fixture } = await configure(report);

      expect(fixture.nativeElement.textContent).not.toContain('TypeError');
      expect(fixture.nativeElement.querySelector('.error-modal__details')).toBeNull();
    });

    it('asks whether to reload', async () => {
      const { fixture } = await configure(report);

      expect(fixture.nativeElement.querySelector('.error-modal__text')?.textContent).toContain(
        'Try reloading?',
      );
      expect(button(fixture, 'Yes')).toBeDefined();
      expect(button(fixture, 'No')).toBeDefined();
    });

    it('reloads the page on yes', async () => {
      const { fixture, reloaded } = await configure(report);

      button(fixture, 'Yes')?.click();

      expect(reloaded).toHaveBeenCalledTimes(1);
    });

    it('closes the pop-up on no, and reloads nothing', async () => {
      const { fixture, closed, reloaded } = await configure(report);

      button(fixture, 'No')?.click();

      expect(closed).toHaveBeenCalledTimes(1);
      expect(reloaded).not.toHaveBeenCalled();
    });
  });

  it('tells the service it has gone, so the next failure can be shown', async () => {
    const { fixture, dismissed } = await configure({ message: 'broke', detailed: false });

    fixture.destroy();

    expect(dismissed).toHaveBeenCalledTimes(1);
  });
});
