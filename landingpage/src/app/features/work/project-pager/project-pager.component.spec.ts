import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Project } from '../../../data';
import { assembler } from '../../../data/projects/assembler.data';
import { stack86 } from '../../../data/projects/stack86.data';
import { ProjectPagerComponent } from './project-pager.component';

@Component({
  imports: [ProjectPagerComponent],
  template: `<lpg-project-pager [previous]="previous()" [next]="next()" />`,
})
class Host {
  public readonly previous = signal<Project | null>(stack86);
  public readonly next = signal<Project | null>(assembler);
}

describe('ProjectPagerComponent', () => {
  let fixture: ComponentFixture<Host>;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('is a named navigation landmark', () => {
    expect(element().querySelector('nav')?.getAttribute('aria-label')).toBe('Other projects');
  });

  it('links both neighbours, each at its own route', () => {
    const links = [...element().querySelectorAll('a')] as HTMLAnchorElement[];

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/work/stack86',
      '/work/assembler',
    ]);
  });

  it('says which direction each neighbour is', () => {
    const previous = element().querySelector('.pager__link--previous') as HTMLElement;
    const next = element().querySelector('.pager__link--next') as HTMLElement;

    expect(previous.querySelector('.pager__direction')?.textContent?.trim()).toBe('Previous');
    expect(previous.querySelector('.pager__title')?.textContent?.trim()).toBe('Stack86');
    expect(next.querySelector('.pager__title')?.textContent?.trim()).toBe('Assembler');
  });

  it('renders only the neighbour that exists, at the ends of the run', () => {
    fixture.componentInstance.previous.set(null);
    fixture.detectChanges();

    expect(element().querySelectorAll('a').length).toBe(1);
    expect(element().querySelector('.pager__link--previous')).toBeNull();

    fixture.componentInstance.next.set(null);
    fixture.detectChanges();

    expect(element().querySelectorAll('a').length).toBe(0);
  });
});
