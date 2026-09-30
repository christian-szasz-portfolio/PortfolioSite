import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackendStatusService } from '@christian-szasz-portfolio/common-web';
import { of } from 'rxjs';

import { CookiesDialogService } from '../../../../core/services/dialogs/cookies-dialog/cookies-dialog.service';

import { StatusBannerComponent } from './status-banner.component';

interface StatusBannerHarness {
  readonly fixture: ComponentFixture<StatusBannerComponent>;
  readonly dismiss: ReturnType<typeof vi.fn>;
  readonly openCookies: ReturnType<typeof vi.fn>;
}

function setup(visible: boolean): StatusBannerHarness {
  const dismiss = vi.fn();
  const openCookies = vi.fn(() => of(undefined));

  TestBed.configureTestingModule({
    imports: [StatusBannerComponent],
    providers: [
      { provide: BackendStatusService, useValue: { visible: () => visible, dismiss } },
      { provide: CookiesDialogService, useValue: { open: openCookies } },
    ],
  });

  return { fixture: TestBed.createComponent(StatusBannerComponent), dismiss, openCookies };
}

async function render(fixture: ComponentFixture<StatusBannerComponent>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('StatusBannerComponent', () => {
  it('stays in the DOM but visually collapsed while the backend is available', async () => {
    const { fixture } = setup(false);

    await render(fixture);

    const shell = fixture.nativeElement.querySelector('.status-banner') as HTMLElement;
    expect(shell).not.toBeNull();
    expect(shell.classList.contains('status-banner--visible')).toBe(false);
    expect(shell.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows once the backend is reported unavailable', async () => {
    const { fixture } = setup(true);

    await render(fixture);

    const shell = fixture.nativeElement.querySelector('.status-banner') as HTMLElement;
    expect(shell.classList.contains('status-banner--visible')).toBe(true);
    expect(shell.getAttribute('aria-hidden')).toBe('false');
  });

  it('dismisses through the service when closed', async () => {
    const { fixture, dismiss } = setup(true);
    await render(fixture);

    const close = fixture.nativeElement.querySelector('.status-banner__close') as HTMLButtonElement;
    close.click();

    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('says what is unavailable, and that the site is not', async () => {
    const { fixture } = setup(true);
    await render(fixture);

    const text = fixture.nativeElement.querySelector('.status-banner__message') as HTMLElement;
    expect(text.textContent?.trim()).toBe(
      'Visitor statistics are temporarily unavailable. The website itself is not affected.',
    );
  });

  it('opens the cookies notice to learn more', async () => {
    const { fixture, openCookies } = setup(true);
    await render(fixture);

    const more = fixture.nativeElement.querySelector('.status-banner__more') as HTMLButtonElement;
    expect(more.textContent?.trim()).toBe('Learn more');
    more.click();

    expect(openCookies).toHaveBeenCalledTimes(1);
  });
});
