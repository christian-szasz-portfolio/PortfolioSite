import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoLaunchService } from '../../../core/services/site/demo-launch/demo-launch.service';
import { DemoLinkDirective } from './demo-link.directive';

@Component({
  imports: [DemoLinkDirective],
  template: `
    <a id="same" href="https://demo.example/app" lpgDemoLink="Stack86">Open</a>
    <a id="blank" href="https://demo.example/app" target="_blank" lpgDemoLink="Stack86">Open</a>
  `,
})
class HostComponent {}

describe('DemoLinkDirective', () => {
  let open: ReturnType<typeof vi.fn>;
  let fixture: ComponentFixture<HostComponent>;

  const click = (selector: string, init: MouseEventInit = {}): MouseEvent => {
    const event = new MouseEvent('click', { button: 0, bubbles: true, cancelable: true, ...init });
    (fixture.nativeElement.querySelector(selector) as HTMLElement).dispatchEvent(event);
    return event;
  };

  beforeEach(() => {
    open = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: DemoLaunchService, useValue: { open } }],
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('holds a plain click and hands the link to the launcher with the demo name', () => {
    const event = click('#same');

    expect(event.defaultPrevented).toBe(true);
    expect(open).toHaveBeenCalledExactlyOnceWith('https://demo.example/app', 'Stack86');
  });

  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }])(
    'lets the browser handle a click made with %o',
    (init) => {
      const event = click('#same', init);

      expect(event.defaultPrevented).toBe(false);
      expect(open).not.toHaveBeenCalled();
    },
  );

  it('lets a link that opens a new tab open it', () => {
    const event = click('#blank');

    expect(event.defaultPrevented).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });
});
