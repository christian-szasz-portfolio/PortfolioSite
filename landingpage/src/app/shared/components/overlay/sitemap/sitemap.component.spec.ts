import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';

import { projects } from '../../../../data';
import { KeyboardKey } from '../../../../core/utils/keyboard/keyboard.utils';
import { SitemapComponent } from './sitemap.component';

describe('SitemapComponent', () => {
  let fixture: ComponentFixture<SitemapComponent>;
  let closed: number;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const nodes = (): readonly HTMLElement[] =>
    Array.from(host().querySelectorAll('.sitemap__node') as NodeListOf<HTMLElement>);
  const canvas = (): HTMLElement => host().querySelector('.sitemap__canvas') as HTMLElement;
  const stage = (): HTMLElement => host().querySelector('.sitemap__stage') as HTMLElement;
  const viewport = (): HTMLElement => host().querySelector('.sitemap') as HTMLElement;
  const level = (): string => host().querySelector('.zoom__level')?.textContent?.trim() ?? '';
  const press = (label: string): void => {
    (host().querySelector(`[aria-label="${label}"]`) as HTMLElement).click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    closed = 0;

    await TestBed.configureTestingModule({
      imports: [SitemapComponent],
      providers: [
        // Real enough to resolve: a link click otherwise navigates nowhere and throws.
        provideRouter([
          { path: '', children: [] },
          { path: 'cookies', children: [] },
          { path: 'work/:slug', children: [] },
        ]),
        {
          provide: MatDialogRef,
          useValue: {
            close: () => {
              closed += 1;
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SitemapComponent);
    fixture.detectChanges();
  });

  it('draws a node for every page, built from the real project data', () => {
    const labels = nodes().map((node) => node.textContent?.trim());

    for (const project of projects) {
      expect(labels, `${project.title} is missing`).toContain(project.title);
    }

    expect(labels).toContain('Home');
    expect(labels).toContain('Privacy');
    expect(labels).toContain('Terms');

    // The cookies notice is a pop-up with no address, so the map of addresses leaves it out.
    expect(labels).not.toContain('Cookies');
  });

  it('links each project node to the page that actually exists', () => {
    const hrefs = nodes().map((node) => node.getAttribute('href'));

    for (const project of projects) {
      expect(hrefs, `${project.slug} is not linked`).toContain(`/work/${project.slug}`);
    }
  });

  it('draws one connector for every parent and child pair', () => {
    const wires = host().querySelectorAll('.sitemap__wire').length;

    // Work, Thinking, About, CV, Privacy and Terms hang off Home, then a node per project.
    expect(wires).toBe(6 + projects.length);
  });

  it('sizes the canvas to the tree rather than to a guess', () => {
    const canvas = host().querySelector('.sitemap__canvas') as HTMLElement;

    expect(Number.parseInt(canvas.style.width, 10)).toBeGreaterThan(0);
    expect(Number.parseInt(canvas.style.height, 10)).toBeGreaterThan(0);
  });

  it('hides the wires from assistive tech, the links carrying the meaning', () => {
    expect(host().querySelector('.sitemap__wires')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('closes itself when a destination is chosen', () => {
    nodes()[1]?.click();
    fixture.detectChanges();

    expect(closed).toBe(1);
  });

  it('starts at full size', () => {
    expect(level()).toBe('100%');
    expect(canvas().style.transform).toBe('none');
  });

  it('scales the tree from the plus and minus buttons', () => {
    press('Zoom in');
    expect(level()).toBe('115%');
    expect(canvas().style.transform).toBe('scale(1.15)');

    press('Zoom out');
    press('Zoom out');
    expect(level()).toBe('85%');
  });

  it('refuses to shrink or grow past its bounds', () => {
    for (let i = 0; i < 20; i += 1) {
      press('Zoom out');
    }
    expect(level()).toBe('35%');

    for (let i = 0; i < 40; i += 1) {
      press('Zoom in');
    }
    expect(level()).toBe('300%');
  });

  it('grows the stage with the zoom, so the scrollbars follow', () => {
    const before = Number.parseInt(stage().style.width, 10);

    press('Zoom in');

    expect(Number.parseInt(stage().style.width, 10)).toBeGreaterThan(before);
  });

  it('zooms on ctrl and wheel, and leaves a plain wheel to pan', () => {
    viewport().dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
    fixture.detectChanges();
    expect(level(), 'a plain wheel should pan, not zoom').toBe('100%');

    viewport().dispatchEvent(
      new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, bubbles: true }),
    );
    fixture.detectChanges();
    expect(level()).toBe('115%');
  });

  /** A cancelable keydown on the viewport, so a case can assert it was taken */
  const sendKey = (key: KeyboardKey): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    viewport().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  it('takes the browser zoom shortcuts rather than letting them scale the site', () => {
    const plus = sendKey(KeyboardKey.Plus);

    expect(level()).toBe('115%');
    expect(plus.defaultPrevented).toBe(true);

    sendKey(KeyboardKey.Zero);
    expect(level()).toBe('100%');
  });
});
