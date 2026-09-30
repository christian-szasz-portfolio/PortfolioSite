import { ComponentFixture, TestBed } from '@angular/core/testing';

import { unsupportedRedirect, UnsupportedComponent } from './unsupported.component';

describe('UnsupportedComponent', () => {
  let fixture: ComponentFixture<UnsupportedComponent>;

  const metaRefresh = (): Element | null =>
    document.head.querySelector('meta[http-equiv="refresh"]');

  beforeEach(() => {
    for (const meta of document.head.querySelectorAll('meta[http-equiv="refresh"]')) {
      meta.remove();
    }
    fixture = TestBed.createComponent(UnsupportedComponent);
    fixture.detectChanges();
  });

  it('sends a supported browser home, not to the notice', () => {
    expect(unsupportedRedirect).toBe('/');
    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.getAttribute('href')).toBe('/');
  });

  it('adds a meta refresh, so the redirect survives scripting being off', () => {
    expect(metaRefresh()?.getAttribute('content')).toBe(`0; url=${unsupportedRedirect}`);
  });
});
