import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartConfiguration } from 'chart.js';

import { ChartComponent } from './chart.component';

function config(label: string): ChartConfiguration<'bar'> {
  return {
    type: 'bar',
    data: { labels: ['09-07'], datasets: [{ label, data: [1] }] },
  };
}

@Component({
  imports: [ChartComponent],
  template: `<adm-chart [config]="config()" label="Views for each archived day" />`,
})
class Host {
  public readonly config = signal(config('Views'));
}

describe('ChartComponent', () => {
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('puts a canvas on the page', () => {
    expect(fixture.nativeElement.querySelector('canvas')).not.toBeNull();
  });

  // The canvas is the whole content, so the words have to be on it rather than beside it.
  it('names the canvas for a reader who cannot see it', () => {
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas.getAttribute('aria-label')).toBe('Views for each archived day');
  });

  // jsdom hands back no drawing context. Drawing has to be a no-op there rather than a throw,
  // or every component that shows a chart would need a rendering engine to be testable.
  it('survives a canvas it cannot draw on, and a configuration that changes', () => {
    expect(() => {
      fixture.componentInstance.config.set(config('Interactions'));
      fixture.detectChanges();
      fixture.destroy();
    }).not.toThrow();
  });
});
