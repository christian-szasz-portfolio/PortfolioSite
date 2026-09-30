import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ActiveSectionService } from '../../../../core/services/site/active-section/active-section.service';
import { TableOfContentsComponent, TocEntry } from './table-of-contents.component';

const ENTRIES: readonly TocEntry[] = [
  { id: 'overview', heading: 'Overview' },
  { id: 'architecture', heading: 'Architecture' },
  { id: 'changes', heading: 'What I would change' },
];

@Component({
  imports: [TableOfContentsComponent],
  template: `<lpg-table-of-contents [entries]="entries" />`,
})
class Host {
  public readonly entries = ENTRIES;
}

describe('TableOfContentsComponent', () => {
  let fixture: ComponentFixture<Host>;
  const active = signal<string | null>(null);

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const mark = (id: string) => {
    active.set(id);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideRouter([]),
        {
          provide: ActiveSectionService,
          useValue: {
            active,
            readingLine: () => 0,
            register: () => undefined,
            unregister: () => undefined,
          },
        },
      ],
    }).compileComponents();

    active.set(null);
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('builds one entry per article, in order, anchored at its id', () => {
    const links = [...element().querySelectorAll('.toc__link')] as HTMLAnchorElement[];

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Overview',
      'Architecture',
      'What I would change',
    ]);
    // Only the fragment is asserted: a bare `#id` would resolve against `<base href>`
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/#overview',
      '/#architecture',
      '/#changes',
    ]);
    for (const link of links) {
      expect(link.getAttribute('href')?.startsWith('#')).toBe(false);
    }
  });

  it('is a named navigation landmark, and the list is ordered', () => {
    const nav = element().querySelector('nav') as HTMLElement;

    expect(nav.getAttribute('aria-label')).toBe('On this page');
    expect(nav.querySelector('ol')).not.toBeNull();
  });

  it('marks nothing before anything is being read', () => {
    expect(element().querySelector('.is-current')).toBeNull();
  });

  it('marks the section being read, and says so to assistive tech', () => {
    mark('architecture');

    const current = element().querySelector('.is-current') as HTMLAnchorElement;

    expect(current.textContent?.trim()).toBe('Architecture');
    expect(current.getAttribute('aria-current')).toBe('true');
  });

  it('moves the mark as the reader moves', () => {
    mark('architecture');
    active.set(null);
    mark('changes');

    expect(element().querySelector('.is-current')?.textContent?.trim()).toBe('What I would change');
  });

  it('ignores a section that belongs to some other list on the page', () => {
    mark('thinking');

    expect(element().querySelector('.is-current')).toBeNull();
  });
});
