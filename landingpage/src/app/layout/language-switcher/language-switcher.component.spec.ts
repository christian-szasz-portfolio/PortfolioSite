import { DOCUMENT, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  let fixture: ComponentFixture<LanguageSwitcherComponent>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const trigger = (): HTMLButtonElement =>
    host().querySelector('.lang__trigger') as HTMLButtonElement;
  const items = (): HTMLAnchorElement[] => Array.from(host().querySelectorAll('.lang__item'));

  const setUp = async (localeId: string) => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [
        { provide: LOCALE_ID, useValue: localeId },
        { provide: DOCUMENT, useValue: document },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();
  };

  it('shows the language being read, and offers the others', async () => {
    await setUp('de');

    expect(trigger().textContent).toContain('DE');

    trigger().click();
    fixture.detectChanges();

    expect(items().length).toBe(3);

    const codes = items().map((item) =>
      item.querySelector('.lang__item-code')?.textContent?.trim(),
    );
    expect(codes).toEqual(['EN', 'DE', 'RO']);
  });

  it('offers real links, so a language survives scripting being off', async () => {
    await setUp('en-GB');
    trigger().click();
    fixture.detectChanges();

    for (const item of items()) {
      expect(item.tagName).toBe('A');
      expect(item.getAttribute('href')?.length).toBeGreaterThan(0);
      // Named for crawlers as well as readers
      expect(item.getAttribute('hreflang')?.length).toBeGreaterThan(0);
    }
  });

  it('marks the language already being read rather than hiding it', async () => {
    await setUp('ro');
    trigger().click();
    fixture.detectChanges();

    const marked = items().filter((item) => item.getAttribute('aria-current') === 'true');
    expect(marked.length).toBe(1);
    expect(marked[0]?.getAttribute('hreflang')).toBe('ro');
  });
});
