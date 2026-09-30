import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { PageHeaderComponent } from './page-header.component';

@Component({
  imports: [PageHeaderComponent],
  template: `
    <lpg-page-header
      heading="Cookies and storage"
      [eyebrow]="eyebrow()"
      [meta]="meta()"
      [lede]="lede()"
    >
      <p class="extra">Projected.</p>
    </lpg-page-header>
  `,
})
class Host {
  public readonly eyebrow = signal<string | undefined>(undefined);
  public readonly meta = signal<string | undefined>(undefined);
  public readonly lede = signal<string | undefined>(undefined);
}

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<Host>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('gives the page exactly one first-level heading', () => {
    const headings = element().querySelectorAll('h1');

    expect(headings.length).toBe(1);
    expect(headings[0]?.textContent?.trim()).toBe('Cookies and storage');
  });

  it('omits the optional parts entirely rather than rendering empty ones', () => {
    expect(element().querySelector('.page-header__eyebrow')).toBeNull();
    expect(element().querySelector('.page-header__meta')).toBeNull();
    expect(element().querySelector('.page-header__lede')).toBeNull();
  });

  it('shows each optional part once it is given', () => {
    fixture.componentInstance.eyebrow.set('The work');
    fixture.componentInstance.meta.set('Last updated 19 August 2026');
    fixture.componentInstance.lede.set('This site sets no cookies.');
    fixture.detectChanges();

    expect(element().querySelector('.page-header__eyebrow')?.textContent?.trim()).toBe('The work');
    expect(element().querySelector('.page-header__meta')?.textContent?.trim()).toBe(
      'Last updated 19 August 2026',
    );
    expect(element().querySelector('.page-header__lede')?.textContent?.trim()).toBe(
      'This site sets no cookies.',
    );
  });

  it('is left-aligned unless a page asks otherwise', () => {
    const header = element().querySelector('.page-header') as HTMLElement;

    expect(header.classList.contains('page-header--centred')).toBe(false);
  });

  it('projects whatever the page puts after the heading', () => {
    expect(element().querySelector('.page-header .extra')?.textContent?.trim()).toBe('Projected.');
  });
});
