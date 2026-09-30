import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';

import { CookiesDialogService } from '../../../../core/services/dialogs/cookies-dialog/cookies-dialog.service';
import { PrivacyPolicyContentComponent } from './privacy-policy-content.component';

/** Records the ask without fetching the pop-up's chunk. */
class CookiesDialogStub {
  public opened = 0;

  public open(): Observable<void> {
    this.opened += 1;
    return EMPTY;
  }
}

describe('PrivacyPolicyContentComponent', () => {
  let fixture: ComponentFixture<PrivacyPolicyContentComponent>;
  let cookies: CookiesDialogStub;

  beforeEach(async () => {
    cookies = new CookiesDialogStub();

    await TestBed.configureTestingModule({
      imports: [PrivacyPolicyContentComponent],
      providers: [provideRouter([]), { provide: CookiesDialogService, useValue: cookies }],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicyContentComponent);
    fixture.detectChanges();
  });

  it('renders the policy sections', () => {
    const headings = fixture.nativeElement.querySelectorAll('.doc__heading');

    expect(headings.length).toBeGreaterThan(0);
  });

  it('opens the cookies notice for the storage detail, since it has no page', () => {
    const trigger = fixture.nativeElement.querySelector('button.link') as HTMLButtonElement;

    trigger.click();

    expect(cookies.opened).toBe(1);
  });
});
