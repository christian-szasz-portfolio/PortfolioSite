import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { KeyboardKey } from '../../../../core/utils/keyboard/keyboard.utils';
import { DiagramViewerComponent, DiagramViewerData } from './diagram-viewer.component';

class DialogRefStub {
  public closed = 0;
  public close(): void {
    this.closed += 1;
  }
}

const DATA: DiagramViewerData = {
  src: 'assets/img/diagrams/taskly/erd/en.svg',
  alt: 'The Taskly schema',
  caption: 'Entity relationships',
  width: 1200,
  height: 800,
};

describe('DiagramViewerComponent', () => {
  let fixture: ComponentFixture<DiagramViewerComponent>;
  let dialogRef: DialogRefStub;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const level = (): string => host().querySelector('.zoom__level')?.textContent?.trim() ?? '';
  const stage = (): HTMLElement => host().querySelector('.diagram__stage') as HTMLElement;

  const press = (label: string): void => {
    const button = Array.from(host().querySelectorAll('button')).find(
      (candidate) =>
        candidate.getAttribute('aria-label') === label || candidate.textContent?.trim() === label,
    );
    button?.click();
    fixture.detectChanges();
  };

  const key = (value: string): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
    host().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  /** jsdom lays nothing out, so the viewport is given the size a browser would */
  const sizeViewport = (width: number, height: number): void => {
    const viewport = host().querySelector('.diagram') as HTMLElement;
    Object.defineProperty(viewport, 'clientWidth', { configurable: true, value: width });
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: height });
  };

  beforeEach(async () => {
    dialogRef = new DialogRefStub();

    await TestBed.configureTestingModule({
      imports: [DiagramViewerComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: DATA },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiagramViewerComponent);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows the drawing it was handed, described and titled by its caption', () => {
    const image = host().querySelector('.diagram__image') as HTMLImageElement;

    expect(image.getAttribute('src')).toBe(DATA.src);
    expect(image.getAttribute('alt')).toBe(DATA.alt);
    expect(host().querySelector('#diagram-modal-title')?.textContent?.trim()).toBe(DATA.caption);
  });

  it('zooms in and out in steps, resizing the stage rather than scaling it', () => {
    press('Zoom in');
    expect(level()).toBe('115%');
    expect(stage().style.width).toBe('1380px');
    expect(stage().style.height).toBe('920px');

    press('Zoom out');
    press('Zoom out');
    expect(level()).toBe('85%');
  });

  it('fits the whole drawing, whichever side runs out of room first', () => {
    // 1000 wide and 432 tall after the gutter: the height is the tighter one, 432 / 800
    sizeViewport(1032, 464);
    press('Fit');

    expect(level()).toBe('54%');
  });

  it('stops at the smallest and largest zoom', () => {
    for (let i = 0; i < 40; i += 1) {
      press('Zoom in');
    }
    expect(level()).toBe('400%');

    for (let i = 0; i < 40; i += 1) {
      press('Zoom out');
    }
    expect(level()).toBe('20%');
  });

  it('takes the zoom shortcuts, so the browser cannot scale the site under it', () => {
    expect(key(KeyboardKey.Equals).defaultPrevented).toBe(true);
    expect(level()).toBe('115%');

    expect(key(KeyboardKey.Minus).defaultPrevented).toBe(true);
    expect(level()).toBe('100%');

    sizeViewport(1032, 464);
    expect(key(KeyboardKey.Zero).defaultPrevented).toBe(true);
    expect(level()).toBe('54%');
  });

  it('leaves other keys alone', () => {
    expect(key('a').defaultPrevented).toBe(false);
    expect(level()).toBe('100%');
  });

  it('closes from the shell', () => {
    press('Close the diagram');

    expect(dialogRef.closed).toBe(1);
  });
});
