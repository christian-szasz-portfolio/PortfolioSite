import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BrowserEnvironment, ScrollService, ScrollState } from '@christian-szasz-portfolio/common-web';

import { projects } from '../../../data';
import { WorkSectionComponent } from './work-section.component';

describe('WorkSectionComponent', () => {
  let fixture: ComponentFixture<WorkSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkSectionComponent],
      providers: [
        provideRouter([]),
        {
          provide: BrowserEnvironment,
          useValue: {
            isBrowser: true,
            animationsEnabled: () => false,
            pointerEffectsEnabled: () => false,
          },
        },
        {
          provide: ScrollService,
          useValue: { state: signal<ScrollState>({ y: 0, viewport: 0, document: 0 }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkSectionComponent);
    fixture.detectChanges();
  });

  it('renders one card per project', () => {
    const cards = fixture.nativeElement.querySelectorAll('.project');

    expect(cards.length).toBe(projects.length);
  });

  it('marks only the first card as first, so only it loses the divider', () => {
    const firsts = fixture.nativeElement.querySelectorAll('.project--first');
    const cards = fixture.nativeElement.querySelectorAll('.project');

    expect(firsts.length).toBe(1);
    expect(cards[0].classList.contains('project--first')).toBe(true);
  });

  it('alternates the reversed cards as the data says', () => {
    const cards = [...fixture.nativeElement.querySelectorAll('.project')];
    const reversed = cards.map((c: Element) => c.classList.contains('project--reverse'));

    expect(reversed).toEqual(projects.map((p) => p.reversed));
  });

  it('anchors the section so the navigation can reach it', () => {
    const section = fixture.nativeElement.querySelector('section') as HTMLElement;

    expect(section.id).toBe('work');
  });
});
