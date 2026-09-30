import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayToggleComponent } from './play-toggle.component';

describe('PlayToggleComponent', () => {
  let fixture: ComponentFixture<PlayToggleComponent>;

  const button = (): HTMLButtonElement =>
    (fixture.nativeElement as HTMLElement).querySelector('.play-toggle') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlayToggleComponent] }).compileComponents();
    fixture = TestBed.createComponent(PlayToggleComponent);
    fixture.componentRef.setInput('playing', false);
    fixture.detectChanges();
  });

  it('offers the action a press will take, and says whether it is pressed', () => {
    expect(button().textContent?.trim()).toBe('Play');
    expect(button().getAttribute('aria-pressed')).toBe('false');

    fixture.componentRef.setInput('playing', true);
    fixture.detectChanges();

    expect(button().textContent?.trim()).toBe('Pause');
    expect(button().getAttribute('aria-pressed')).toBe('true');
  });

  it('reports a press, and leaves the state to its owner', () => {
    let presses = 0;
    fixture.componentInstance.toggled.subscribe(() => (presses += 1));

    button().click();

    expect(presses).toBe(1);
    expect(button().getAttribute('aria-pressed')).toBe('false');
  });

  it('takes the toolbar look in a pop-up', () => {
    expect(button().classList.contains('play-toggle--tool')).toBe(false);

    fixture.componentRef.setInput('variant', 'tool');
    fixture.detectChanges();

    expect(button().classList.contains('play-toggle--tool')).toBe(true);
  });
});
