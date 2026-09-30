import { ViewportScroller } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BrowserEnvironment, ViewCounterService, ViewStats } from '@christian-szasz-portfolio/common-web';

import { SiteFooterComponent } from './site-footer.component';

/** A counter that never loads, so the footer specs stay off the network. */
const stubViewCounter = {
  provide: ViewCounterService,
  useValue: {
    stats: signal<ViewStats | null>(null).asReadonly(),
    ensureLoaded: (): void => {
      /* never loads in these specs */
    },
  },
};

describe('SiteFooterComponent', () => {
  let fixture: ComponentFixture<SiteFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFooterComponent],
      providers: [provideRouter([]), stubViewCounter],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.detectChanges();
  });

  // Three sentences became two words and four marks. What the site does not load is still stated,
  // at length, in the cookies notice and the privacy policy.
  it('says what the site is made with, and nothing else', () => {
    const note = fixture.nativeElement.querySelector('.site-footer__note') as HTMLElement;

    expect(note.textContent?.replace(/\s+/g, ' ').trim()).toBe('Made with');
    expect(note.querySelectorAll('lpg-tech-icon')).toHaveLength(4);
  });

  // The marks are drawn aria-hidden, so without this the sentence has a hole in it.
  it('names the four technologies for a reader who cannot see the marks', () => {
    const tech = fixture.nativeElement.querySelector('.site-footer__tech') as HTMLElement;

    expect(tech.getAttribute('aria-label')).toBe('Angular, TypeScript, SCSS and RxJS');
  });

  it('carries the copyright in full', () => {
    const meta = fixture.nativeElement.querySelector('.site-footer__meta') as HTMLElement;

    expect(meta.textContent).toContain('Copyright');
    expect(meta.textContent).toContain('Christian-Ioan Szasz');
    expect(meta.textContent).toContain('All rights reserved.');
  });

  // The notice is a pop-up with no page behind it, so its trigger is a button, not a link.
  it('opens the cookies notice from a button', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const cookies = buttons.find((button) => button.textContent?.trim() === 'Cookies');

    expect(cookies).toBeDefined();
    expect(cookies?.getAttribute('type')).toBe('button');
  });

  // Privacy and terms are pages, and a link to a page is how a reader opens one in a new tab.
  it('links to the privacy and terms pages', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    const href = (label: string): string | null | undefined =>
      links.find((link) => link.textContent?.trim() === label)?.getAttribute('href');

    expect(href('Privacy')).toBe('/privacy');
    expect(href('Terms')).toBe('/terms');
  });

  it('points "back to top" at the page being read, not at the home page', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a')] as HTMLAnchorElement[];
    const top = links.find((link) => link.textContent?.trim() === 'Back to top');

    // `/#top` was the home page's hero, not where a project page's reader wants to go
    expect(top?.getAttribute('href')).not.toBe('/#top');
  });
});

describe('SiteFooterComponent back to top', () => {
  let fixture: ComponentFixture<SiteFooterComponent>;
  let scrolled: (readonly [number, number])[];

  const link = (): HTMLAnchorElement =>
    [...fixture.nativeElement.querySelectorAll('a')].find((a: HTMLAnchorElement) =>
      a.textContent?.includes('Back to top'),
    ) as HTMLAnchorElement;

  beforeEach(async () => {
    scrolled = [];

    await TestBed.configureTestingModule({
      imports: [SiteFooterComponent],
      providers: [
        provideRouter([]),
        stubViewCounter,
        { provide: BrowserEnvironment, useValue: { isBrowser: true } },
        {
          provide: ViewportScroller,
          useValue: { scrollToPosition: (p: readonly [number, number]) => scrolled.push(p) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.detectChanges();
  });

  it('points at the page being read, never at the home page', () => {
    // A bare `#top` would resolve against `<base href>` and leave the page.
    expect(link().getAttribute('href')).not.toBe('/#top');
    expect(link().getAttribute('href')?.includes('#')).toBe(false);
  });

  it('scrolls the page it is on rather than navigating', () => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link().dispatchEvent(event);

    expect(scrolled).toEqual([[0, 0]]);
    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves a modified click alone, so it can still open a tab', () => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0,
      ctrlKey: true,
    });
    link().dispatchEvent(event);

    expect(scrolled).toEqual([]);
    expect(event.defaultPrevented).toBe(false);
  });
});
