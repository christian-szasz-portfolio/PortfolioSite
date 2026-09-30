import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { DiagramDialogService } from '../../../../core/services/dialogs/diagram-dialog/diagram-dialog.service';
import { DiagramViewerData } from '../../overlay/diagram-viewer/diagram-viewer.component';
import { FigureBlockComponent } from './figure-block.component';

class DiagramDialogStub {
  public opened: DiagramViewerData[] = [];

  public open(data: DiagramViewerData): Observable<void> {
    this.opened.push(data);
    return of(undefined);
  }
}

@Component({
  imports: [FigureBlockComponent],
  template: `
    <lpg-figure-block
      src="assets/img/stack86-1280.jpg"
      srcSmall="assets/img/stack86-640.jpg"
      alt="The Stack86 IDE"
      caption="The pipeline, stage by stage."
      [width]="1280"
      [height]="800"
    />
  `,
})
class Host {}

describe('FigureBlockComponent', () => {
  let fixture: ComponentFixture<Host>;
  let dialog: DiagramDialogStub;

  const image = (): HTMLImageElement =>
    fixture.nativeElement.querySelector('.figure__image') as HTMLImageElement;

  beforeEach(async () => {
    dialog = new DiagramDialogStub();
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [{ provide: DiagramDialogService, useValue: dialog }],
    }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('offers both widths, and defaults to the larger one', () => {
    expect(image().getAttribute('src')).toBe('assets/img/stack86-1280.jpg');
    expect(image().getAttribute('srcset')).toBe(
      'assets/img/stack86-640.jpg 640w, assets/img/stack86-1280.jpg 1280w',
    );
  });

  it('states the intrinsic size, so the box is held before the image lands', () => {
    const frame = fixture.nativeElement.querySelector('.figure__frame') as HTMLElement;

    expect(image().getAttribute('width')).toBe('1280');
    expect(image().getAttribute('height')).toBe('800');
    expect(frame.style.aspectRatio).toBe('1280 / 800');
  });

  it('describes the picture, and captions it separately', () => {
    expect(image().getAttribute('alt')).toBe('The Stack86 IDE');
    expect(fixture.nativeElement.querySelector('figcaption')?.textContent?.trim()).toBe(
      'The pipeline, stage by stage.',
    );
  });

  it('loads lazily, because a figure is always below the fold', () => {
    expect(image().getAttribute('loading')).toBe('lazy');
    expect(image().getAttribute('decoding')).toBe('async');
  });

  it('opens the drawing large when pressed, with the size and words it already has', () => {
    (fixture.nativeElement.querySelector('.figure__frame') as HTMLButtonElement).click();

    expect(dialog.opened).toEqual([
      {
        src: 'assets/img/stack86-1280.jpg',
        alt: 'The Stack86 IDE',
        caption: 'The pipeline, stage by stage.',
        width: 1280,
        height: 800,
      },
    ]);
  });
});
