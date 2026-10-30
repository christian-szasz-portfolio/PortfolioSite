import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CookiesContentComponent } from './cookies-content.component';

describe('CookiesContentComponent', () => {
  let fixture: ComponentFixture<CookiesContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookiesContentComponent],
      providers: [provideRouter([])],
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

  it('credits DB-IP without showing visit figures', () => {
    expect(fixture.nativeElement.querySelector('a[href="https://db-ip.com"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('lpg-view-breakdown')).toBeNull();
  });

  it('explains consent', () => {
    const headings = [...fixture.nativeElement.querySelectorAll('.doc__heading')].map((heading) =>
      (heading as HTMLElement).textContent?.trim(),
    );

    expect(headings).toContain('Consent');
  });
});
