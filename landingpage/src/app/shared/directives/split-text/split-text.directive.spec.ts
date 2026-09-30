import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { SplitTextDirective } from './split-text.directive';

@Component({
  imports: [SplitTextDirective],
  template: `<h2 class="target" lpgSplitText [splitDelay]="delay">Three things I built</h2>`,
})
class Host {
  public delay = 0;
}

@Component({
  imports: [SplitTextDirective],
  template: `<h1 class="target" [lpgSplitText]="heading()">{{ heading() }}</h1>`,
})
class BoundHost {
  public readonly heading = signal('Stack86');
}

describe('SplitTextDirective', () => {
  let fixture: ComponentFixture<Host>;

  const target = (): HTMLElement => fixture.nativeElement.querySelector('.target') as HTMLElement;

  const setUp = async (animations: boolean, delay = 0) => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => animations,
            pointerEffectsEnabled: () => animations,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.delay = delay;
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('wraps each word in its own pair of spans', async () => {
    await setUp(true);

    const words = [...target().querySelectorAll('.split__inner')].map((w) => w.textContent);

    expect(words).toEqual(['Three', 'things', 'I', 'built']);
    expect(target().classList.contains('split')).toBe(true);
  });

  it('keeps the sentence readable, by labelling it and hiding the pieces', async () => {
    await setUp(true);

    expect(target().getAttribute('aria-label')).toBe('Three things I built');
    expect(target().firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('staggers the words, offset by the delay it was given', async () => {
    await setUp(true, 200);

    const delays = [...target().querySelectorAll<HTMLElement>('.split__inner')].map((word) =>
      word.style.getPropertyValue('--delay'),
    );

    expect(delays).toEqual(['200ms', '242ms', '284ms', '326ms']);
  });

  it('leaves the heading exactly as written under reduced motion', async () => {
    await setUp(false);

    expect(target().querySelector('.split__inner')).toBeNull();
    expect(target().textContent?.trim()).toBe('Three things I built');
  });

  it('splits a bound heading again when it changes, as the pager changes the project', async () => {
    await TestBed.configureTestingModule({
      imports: [BoundHost],
      providers: [
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => true,
            pointerEffectsEnabled: () => true,
          },
        },
      ],
    }).compileComponents();
    const bound = TestBed.createComponent(BoundHost);
    await bound.whenStable();

    bound.componentInstance.heading.set('Taskly board');
    await bound.whenStable();

    const heading = bound.nativeElement.querySelector('.target') as HTMLElement;
    const words = [...heading.querySelectorAll('.split__inner')].map((word) => word.textContent);
    expect(words).toEqual(['Taskly', 'board']);
    expect(heading.getAttribute('aria-label')).toBe('Taskly board');
    expect(heading.textContent).not.toContain('Stack86');
  });
});
