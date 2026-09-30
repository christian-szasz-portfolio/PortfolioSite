import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { CvDialogService } from '../../../../core/services/dialogs/cv-dialog/cv-dialog.service';
import { CvCardComponent } from './cv-card.component';

class CvDialogStub {
  public calls = 0;
  /** Hands back a stream, because that is what the real service does now */
  public open(): Observable<void> {
    this.calls += 1;
    return of(undefined);
  }
}

describe('CvCardComponent', () => {
  let fixture: ComponentFixture<CvCardComponent>;
  let dialog: CvDialogStub;

  beforeEach(async () => {
    dialog = new CvDialogStub();
    await TestBed.configureTestingModule({
      imports: [CvCardComponent],
      providers: [{ provide: CvDialogService, useValue: dialog }],
    }).compileComponents();

    fixture = TestBed.createComponent(CvCardComponent);
    fixture.detectChanges();
  });

  it('keeps a real href, so the CV is reachable without scripting', () => {
    const link = fixture.nativeElement.querySelector('a.button') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/cv');
  });

  it('opens the pop-up instead of navigating on a plain click', () => {
    const link = fixture.nativeElement.querySelector('a.button') as HTMLAnchorElement;
    const event = new MouseEvent('click', { cancelable: true, bubbles: true });

    link.dispatchEvent(event);

    expect(dialog.calls).toBe(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('lets a modified click through, because that means "new tab"', () => {
    const link = fixture.nativeElement.querySelector('a.button') as HTMLAnchorElement;
    const event = new MouseEvent('click', { cancelable: true, bubbles: true, ctrlKey: true });

    link.dispatchEvent(event);

    expect(dialog.calls).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });
});
