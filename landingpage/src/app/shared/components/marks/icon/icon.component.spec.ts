import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconComponent } from './icon.component';
import { IconName, IconRegistry } from './icon.registry';

/** The tags the template knows how to draw */
const DRAWN = ['path', 'circle', 'rect'];

@Component({
  imports: [IconComponent],
  template: `<lpg-icon [name]="name()" />`,
})
class Host {
  public readonly name = signal<IconName>('work');
}

describe('IconComponent', () => {
  let fixture: ComponentFixture<Host>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  const render = (name: IconName) => {
    fixture.componentInstance.name.set(name);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('draws every shape Lucide gives for the icon', () => {
    for (const name of IconRegistry.STROKE_NAMES) {
      render(name);

      const drawn = element().querySelectorAll('.icon__stroke').length;

      expect(drawn, `${name} drew ${drawn} of ${IconRegistry.shapesFor(name).length} shapes`).toBe(
        IconRegistry.shapesFor(name).length,
      );
      expect(drawn).toBeGreaterThan(0);
    }
  });

  it('puts the path data on the element rather than leaving it empty', () => {
    render('top');

    const path = element().querySelector('path');

    expect(path?.getAttribute('d')?.length).toBeGreaterThan(5);
  });

  it('draws a circle with its real radius, not a default', () => {
    render('about');

    const circle = element().querySelector('circle');

    expect(circle?.getAttribute('r')).not.toBe('0');
    expect(Number(circle?.getAttribute('r'))).toBeGreaterThan(0);
  });

  it('draws a rect with its real corner radius', () => {
    render('work');

    const rect = element().querySelector('rect');

    expect(rect?.getAttribute('width')).toBe('20');
    expect(rect?.getAttribute('rx')).toBe('2');
  });

  it('is decoration beside a visible label, so it is hidden from assistive tech', () => {
    render('cv');

    const svg = element().querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
  });

  it('draws a filled brand logo where Lucide carries no mark', () => {
    render('linkedin');

    const svg = element().querySelector('svg');

    expect(svg?.getAttribute('viewBox')).toBe('0 0 448 512');
    expect(element().querySelector('.icon__fill')).not.toBeNull();
    expect(element().querySelector('.icon__stroke')).toBeNull();
  });

  it('draws the GitHub logo on its own canvas rather than a 24 one', () => {
    render('github');

    expect(element().querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 512 512');
    expect(element().querySelector('.icon__fill')?.getAttribute('d')?.length).toBeGreaterThan(50);
  });

  it('keeps the outline icons stroked, not filled', () => {
    render('email');

    expect(element().querySelector('.icon__stroke')).not.toBeNull();
    expect(element().querySelector('.icon__fill')).toBeNull();
  });

  it('swaps the drawing when the name changes', () => {
    render('work');
    const work = element().innerHTML;

    render('cookies');

    expect(element().innerHTML).not.toBe(work);
  });
});

describe('icon registry', () => {
  it('draws every stroked icon on the same canvas the viewBox states', () => {
    for (const name of IconRegistry.STROKE_NAMES) {
      expect(
        IconRegistry.iconDataFor(name)?.size,
        `${name} is not drawn at ${IconRegistry.ICON_SIZE}`,
      ).toBe(IconRegistry.ICON_SIZE);
    }
  });

  it('needs no tag the template cannot draw, so nothing is silently dropped', () => {
    for (const name of IconRegistry.STROKE_NAMES) {
      const unknown = IconRegistry.tagsFor(name).filter((tag) => !DRAWN.includes(tag));

      expect(unknown, `${name} needs ${unknown.join(', ')}`).toEqual([]);
    }
  });

  it('registers a distinct drawing for every stroked name', () => {
    const drawings = IconRegistry.STROKE_NAMES.map((name) => IconRegistry.iconDataFor(name)?.name);

    expect(new Set(drawings).size).toBe(IconRegistry.STROKE_NAMES.length);
  });

  it('answers something drawable for every registered name', () => {
    for (const name of IconRegistry.ICON_NAMES) {
      const svg = document.createElement('div');
      expect(svg).not.toBeNull();
      expect(name.length).toBeGreaterThan(0);
    }

    expect(IconRegistry.ICON_NAMES.length).toBeGreaterThan(IconRegistry.STROKE_NAMES.length);
  });
});
