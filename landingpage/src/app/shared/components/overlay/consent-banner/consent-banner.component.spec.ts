import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BackendStatusService, ConsentService, ConsentStatus } from '@christian-szasz-portfolio/common-web';
import { of } from 'rxjs';

import { CookiesDialogService } from '../../../../core/services/dialogs/cookies-dialog/cookies-dialog.service';

import { ConsentBannerComponent } from './consent-banner.component';

/** The mounted banner and the three calls a case asserts on */
interface ConsentBannerHarness {
  readonly fixture: ComponentFixture<ConsentBannerComponent>;
  readonly grant: ReturnType<typeof vi.fn>;
  readonly deny: ReturnType<typeof vi.fn>;
  readonly open: ReturnType<typeof vi.fn>;
}

function setup(initial: ConsentStatus, unavailable = false): ConsentBannerHarness {
  const status = signal<ConsentStatus>(initial);
  const grant = vi.fn(() => status.set(ConsentStatus.Granted));
  const deny = vi.fn(() => status.set(ConsentStatus.Denied));
  const open = vi.fn(() => of(undefined));

  TestBed.configureTestingModule({
    imports: [ConsentBannerComponent],
    providers: [
      { provide: ConsentService, useValue: { status: status.asReadonly(), grant, deny } },
      { provide: CookiesDialogService, useValue: { open } },
      { provide: BackendStatusService, useValue: { unavailable: () => unavailable } },
    ],
  });

  return { fixture: TestBed.createComponent(ConsentBannerComponent), grant, deny, open };
}

async function render(fixture: ComponentFixture<ConsentBannerComponent>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function button(
  fixture: ComponentFixture<ConsentBannerComponent>,
  label: string,
): HTMLButtonElement {
  return [...fixture.nativeElement.querySelectorAll('button')].find(
    (element) => (element as HTMLButtonElement).textContent?.trim() === label,
  ) as HTMLButtonElement;
}

describe('ConsentBannerComponent', () => {
  it('appears once hydrated while the choice is unset', async () => {
    const { fixture } = setup(ConsentStatus.Unset);

    await render(fixture);

    expect(fixture.nativeElement.querySelector('.consent')).not.toBeNull();
  });

  it('stays away once a choice has been made', async () => {
    const { fixture } = setup(ConsentStatus.Granted);

    await render(fixture);

    expect(fixture.nativeElement.querySelector('.consent')).toBeNull();
  });

  it('stays away while the backend is unavailable, even with the choice unset', async () => {
    const { fixture } = setup(ConsentStatus.Unset, true);

    await render(fixture);

    expect(fixture.nativeElement.querySelector('.consent')).toBeNull();
  });

  it('records consent and dismisses itself on accept', async () => {
    const { fixture, grant } = setup(ConsentStatus.Unset);
    await render(fixture);

    button(fixture, 'Accept').click();
    fixture.detectChanges();

    expect(grant).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.consent')).toBeNull();
  });

  it('records a decline and dismisses itself', async () => {
    const { fixture, deny } = setup(ConsentStatus.Unset);
    await render(fixture);

    button(fixture, 'Decline').click();
    fixture.detectChanges();

    expect(deny).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.consent')).toBeNull();
  });

  it('opens the cookies notice from the details button', async () => {
    const { fixture, open } = setup(ConsentStatus.Unset);
    await render(fixture);

    const details = fixture.nativeElement.querySelector('.consent__more') as HTMLButtonElement;
    details.click();

    expect(open).toHaveBeenCalledTimes(1);
    expect(details.tagName).toBe('BUTTON');
  });
});
