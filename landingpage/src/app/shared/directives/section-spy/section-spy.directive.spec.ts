import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveSectionService } from '../../../core/services/site/active-section/active-section.service';
import { SectionSpyDirective } from './section-spy.directive';

@Component({
  imports: [SectionSpyDirective],
  template: `
    @if (shown()) {
      <section class="target" lpgSectionSpy="work"></section>
    }
  `,
})
class Host {
  public readonly shown = signal(true);
}

describe('SectionSpyDirective', () => {
  let fixture: ComponentFixture<Host>;
  const sections = { register: vi.fn(), unregister: vi.fn() };

  beforeEach(async () => {
    sections.register.mockClear();
    sections.unregister.mockClear();

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [{ provide: ActiveSectionService, useValue: sections }],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
  });

  it('offers its section, element and all, to be measured against the reading line', () => {
    const target = fixture.nativeElement.querySelector('.target') as HTMLElement;

    expect(sections.register).toHaveBeenCalledWith('work', target);
  });

  it('withdraws the section when it goes away', async () => {
    fixture.componentInstance.shown.set(false);
    await fixture.whenStable();

    expect(sections.unregister).toHaveBeenCalledWith('work');
  });
});
