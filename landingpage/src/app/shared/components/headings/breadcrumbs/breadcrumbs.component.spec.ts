import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BreadcrumbsComponent, Crumb } from './breadcrumbs.component';

const TRAIL: readonly Crumb[] = [
  { label: 'Home', path: '/' },
  { label: 'Work', path: '/', fragment: 'work' },
  { label: 'Stack86' },
];

@Component({
  imports: [BreadcrumbsComponent],
  template: `<lpg-breadcrumbs [trail]="trail" />`,
})
class Host {
  public readonly trail = TRAIL;
}

describe('BreadcrumbsComponent', () => {
  let fixture: ComponentFixture<Host>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('is a named navigation landmark, ordered', () => {
    const nav = element().querySelector('nav') as HTMLElement;

    expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(nav.querySelector('ol')).not.toBeNull();
  });

  it('links every crumb but the last', () => {
    const links = [...element().querySelectorAll('a')].map((a) => a.textContent?.trim());

    expect(links).toEqual(['Home', 'Work']);
  });

  it('takes a crumb that points at a section rather than a page', () => {
    const links = [...element().querySelectorAll('a')] as HTMLAnchorElement[];

    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/', '/#work']);
  });

  it('marks the last crumb as the page you are on, and does not link it', () => {
    const current = element().querySelector('[aria-current="page"]') as HTMLElement;

    expect(current.textContent?.trim()).toBe('Stack86');
    expect(current.tagName).toBe('SPAN');
  });

  it('puts a divider between crumbs, hidden from assistive tech', () => {
    const dividers = element().querySelectorAll('.crumbs__divider');

    expect(dividers.length).toBe(2);
    expect(dividers[0]?.getAttribute('aria-hidden')).toBe('true');
  });
});
