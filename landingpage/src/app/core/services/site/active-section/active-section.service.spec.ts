import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollService, ScrollState } from '@christian-szasz-portfolio/common-web';

import { ActiveSectionService } from './active-section.service';

/** A section on the page whose box the test decides */
function section(top: number, height: number): HTMLElement {
  const element = document.createElement('section');
  document.body.append(element);
  const box: Partial<DOMRect> = { top, bottom: top + height, height };
  vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => box as DOMRect);

  return element;
}

describe('ActiveSectionService', () => {
  let service: ActiveSectionService;
  let scroll: ReturnType<typeof signal<ScrollState>>;

  beforeEach(() => {
    scroll = signal<ScrollState>({ y: 400, viewport: 900, document: 5000 });
    TestBed.configureTestingModule({
      providers: [{ provide: ScrollService, useValue: { state: scroll } }],
    });
    service = TestBed.inject(ActiveSectionService);
    // jsdom resolves no calc(), so the padding styles.scss computes is stated resolved
    document.documentElement.style.setProperty('scroll-padding-top', '114px');
  });

  afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.style.removeProperty('scroll-padding-top');
  });

  it('has no active section before anything registers', () => {
    expect(service.active()).toBeNull();
  });

  it('reads the reading line from the scroll padding the browser anchors with', () => {
    expect(service.readingLine()).toBe(114);
  });

  it('answers the section under the reading line', () => {
    service.register('work', section(-600, 700));
    service.register('thinking', section(100, 800));

    expect(service.active()).toBe('thinking');
  });

  // The defect it replaced: a band that a section landed exactly on the edge of
  it('counts a section scrolled exactly to the line as reached, not the one ending there', () => {
    const line = service.readingLine();
    service.register('work', section(line - 900, 900));
    service.register('thinking', section(line, 800));

    expect(service.active()).toBe('thinking');
  });

  it('answers nothing above the first section', () => {
    service.register('work', section(600, 800));

    expect(service.active()).toBeNull();
  });

  it('reads the document order, not the order the sections registered in', () => {
    const later = section(-100, 900);
    const earlier = section(-100, 900);
    document.body.prepend(earlier);

    service.register('about', later);
    service.register('work', earlier);

    expect(service.active()).toBe('work');
  });

  it('answers the last section showing once the page can scroll no further', () => {
    service.register('thinking', section(-500, 600));
    service.register('about', section(400, 300));
    scroll.set({ y: 4100, viewport: 900, document: 5000 });

    expect(service.active()).toBe('about');
  });

  it('forgets a section once it unregisters', () => {
    service.register('work', section(0, 900));

    service.unregister('work');

    expect(service.active()).toBeNull();
  });

  it('answers nothing before the page has been measured', () => {
    service.register('work', section(0, 900));
    scroll.set({ y: 0, viewport: 0, document: 0 });

    expect(service.active()).toBeNull();
  });
});
