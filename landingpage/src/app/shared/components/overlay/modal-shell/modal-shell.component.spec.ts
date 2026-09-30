import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalShellComponent } from './modal-shell.component';

@Component({
  imports: [ModalShellComponent],
  template: `
    <lpg-modal-shell
      heading="Curriculum vitae"
      headingId="test-title"
      closeLabel="Close the thing"
      (closed)="closes = closes + 1"
    >
      <button class="tool" modal-tools type="button">Zoom</button>
      <div class="body">The body</div>
      <ng-container modal-hint>A hint</ng-container>
    </lpg-modal-shell>
  `,
})
class Host {
  public closes = 0;
}

describe('ModalShellComponent', () => {
  let fixture: ComponentFixture<Host>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('shows the heading and ties it to the dialog by id', () => {
    const title = host().querySelector('.modal__title') as HTMLElement;

    expect(title.textContent?.trim()).toBe('Curriculum vitae');
    expect(title.id).toBe('test-title');
  });

  it('projects the tools beside the close button', () => {
    expect(host().querySelector('.modal__tools .tool')).not.toBeNull();
  });

  it('projects the body and the hint', () => {
    expect(host().querySelector('.body')?.textContent).toBe('The body');
    expect(host().querySelector('.modal__hint')?.textContent?.trim()).toBe('A hint');
  });

  it('announces the close button with the label it was given', () => {
    expect(host().querySelector('.modal__close')?.getAttribute('aria-label')).toBe(
      'Close the thing',
    );
  });

  it('reports a close rather than closing anything itself', () => {
    (host().querySelector('.modal__close') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.closes).toBe(1);
  });
});
