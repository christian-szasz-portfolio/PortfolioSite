import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsService, BrowserEnvironment, ScrollService, ScrollState } from '@christian-szasz-portfolio/common-web';

import { Project } from '../../../data';
import { ProjectCardComponent } from './project-card.component';

const PROJECT: Project = {
  slug: 'stack86',
  index: '01',
  title: 'Stack86',
  tagline: 'A browser IDE.',
  summary: 'Source goes through a pipeline.',
  note: 'The interesting part is the IR.',
  facts: [{ key: 'Role', value: 'Sole author' }],
  chips: ['.NET 10', 'Angular'],
  repository: 'https://github.com/example/Stack86',
  media: {
    label: 'stack86',
    poster: 'poster.jpg',
    clip: null,
    alt: 'A screenshot',
  },
  reversed: false,
  languages: ['C#', 'TypeScript'],
};

@Component({
  imports: [ProjectCardComponent],
  template: `<lpg-project-card [project]="project()" />`,
})
class Host {
  public readonly project = signal<Project>(PROJECT);
}

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<Host>;
  let recorded: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    recorded = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        // A route that matches anything, so pressing "See more" is a navigation the router can
        // complete rather than one it refuses with nowhere to go.
        provideRouter([{ path: '**', children: [] }]),
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
        { provide: AnalyticsService, useValue: { record: recorded } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('renders the headline parts of the project', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.project__title')?.textContent?.trim()).toBe('Stack86');
    expect(element.querySelector('.project__tagline')?.textContent?.trim()).toBe('A browser IDE.');
    expect(element.querySelector('.project__index')?.textContent?.trim()).toBe('01');
  });

  it('links to the repository', () => {
    const link = fixture.nativeElement.querySelector('.link--repo') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('https://github.com/example/Stack86');
  });

  it('says a demo repository is one', () => {
    fixture.componentInstance.project.set({ ...PROJECT, demoVariant: true });
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('.link--repo') as HTMLAnchorElement;

    expect(link.textContent?.trim()).toBe('View the demo repository');
  });

  it('names a full repository plainly', () => {
    const link = fixture.nativeElement.querySelector('.link--repo') as HTMLAnchorElement;

    expect(link.textContent?.trim()).toBe('View the repository');
  });

  it('shows no repository link where there is none', () => {
    fixture.componentInstance.project.set({ ...PROJECT, repository: null });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.link--repo')).toBeNull();
  });

  it('links to the live demo, where one exists', () => {
    fixture.componentInstance.project.set({ ...PROJECT, demo: 'https://example.test' });
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('.link--demo') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('https://example.test');
    expect(link.textContent?.trim()).toBe('Open the live demo');
  });

  it('shows no demo link where there is none', () => {
    const link = fixture.nativeElement.querySelector('.link--demo');

    expect(link).toBeNull();
  });

  it('sends the reader to the project page rather than expanding in place', () => {
    const link = fixture.nativeElement.querySelector('.button--primary') as HTMLAnchorElement;

    expect(link.getAttribute('href')).toBe('/work/stack86');
    expect(fixture.nativeElement.querySelector('.disclosure__panel')).toBeNull();
  });

  it('says which project "See more" leads to, since three cards say the same words', () => {
    const link = fixture.nativeElement.querySelector('.button--primary') as HTMLAnchorElement;

    expect(link.getAttribute('aria-label')).toBe('See more about Stack86');
  });

  // The route change is counted too, but it cannot say the reader arrived from the card rather
  // than from a link, a bookmark or the pager.
  it('counts which project was picked, not just that a page was opened', () => {
    const link = fixture.nativeElement.querySelector('.button--primary') as HTMLAnchorElement;

    // The navigation itself is the router's business, and jsdom cannot perform it: stopped
    // after the binding has run so the test is about the counting and nothing else.
    link.addEventListener('click', (event) => event.preventDefault());
    link.click();

    expect(recorded).toHaveBeenCalledWith('project.read', 'stack86');
  });

  it('leaves the long version to the project page', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Source goes through a pipeline.');
    expect(text).not.toContain('A modular monolith.');
  });

  it('flips the layout for a reversed project', () => {
    expect(fixture.nativeElement.querySelector('.project--reverse')).toBeNull();

    fixture.componentInstance.project.set({ ...PROJECT, reversed: true });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.project--reverse')).not.toBeNull();
  });
});
