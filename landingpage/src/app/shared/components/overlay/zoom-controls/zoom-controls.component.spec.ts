import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomControlsComponent } from './zoom-controls.component';

describe('ZoomControlsComponent', () => {
  let fixture: ComponentFixture<ZoomControlsComponent>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const press = (label: string): void => {
    Array.from(host().querySelectorAll('button'))
      .find((b) => b.getAttribute('aria-label') === label || b.textContent?.trim() === label)
      ?.click();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ZoomControlsComponent] }).compileComponents();
    fixture = TestBed.createComponent(ZoomControlsComponent);
    fixture.componentRef.setInput('level', 0.854);
    fixture.detectChanges();
  });

  it('shows the level as a whole percentage, in a labelled group', () => {
    expect(host().querySelector('.zoom__level')?.textContent?.trim()).toBe('85%');
    expect(host().querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Zoom');
  });

  it('reports each press and leaves the zooming to its owner', () => {
    const pressed: string[] = [];
    fixture.componentInstance.zoomOut.subscribe(() => pressed.push('out'));
    fixture.componentInstance.zoomIn.subscribe(() => pressed.push('in'));
    fixture.componentInstance.fit.subscribe(() => pressed.push('fit'));

    press('Zoom out');
    press('Zoom in');
    press('Fit');

    expect(pressed).toEqual(['out', 'in', 'fit']);
  });
});
