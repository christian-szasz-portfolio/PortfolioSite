import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserEnvironment } from '@christian-szasz-portfolio/common-web';

import { RevealGroupDirective } from './reveal-group.directive';

@Component({
  imports: [RevealGroupDirective],
  template: `
    <ul class="group" [lpgRevealGroup]="start()">
      @for (entry of entries(); track entry) {
        <li class="entry">{{ entry }}</li>
      }
    </ul>
  `,
})
class Host {
  public readonly entries = signal(['Stack86', 'Taskly', 'Assembler']);
  public readonly start = signal(0);
}

describe('RevealGroupDirective', () => {
  let fixture: ComponentFixture<Host>;

  const entries = (): readonly HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.entry') as NodeListOf<HTMLElement>);

  const indices = (): readonly string[] =>
    entries().map((entry) => entry.style.getPropertyValue('--reveal-index'));

  const setUp = async (animations: boolean) => {
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
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('numbers each child so the stylesheet can hold it back in turn', async () => {
    await setUp(true);

    expect(indices()).toEqual(['0', '1', '2']);
  });

  it('starts the count where it is asked to, for a group continuing another', async () => {
    fixture = undefined as unknown as ComponentFixture<Host>;
    await TestBed.configureTestingModule({
      imports: [Host],
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

    fixture = TestBed.createComponent(Host);
    fixture.componentInstance.start.set(3);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(indices()).toEqual(['3', '4', '5']);
  });

  it('numbers nothing under reduced motion, so no child is ever held back', async () => {
    await setUp(false);

    expect(indices()).toEqual(['', '', '']);
  });

  it('numbers a child that arrives after the first paint', async () => {
    await setUp(true);

    fixture.componentInstance.entries.update((list) => [...list, 'Landing']);
    fixture.detectChanges();

    // The observer reports asynchronously, so let the microtask queue drain.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(indices()).toEqual(['0', '1', '2', '3']);
  });
});
