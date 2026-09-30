import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Health } from '../../../data';
import { HealthPanelComponent } from './health-panel.component';

const HEALTHY: Health = {
  reachable: true,
  problem: null,
  status: 'Healthy',
  checks: [{ name: 'storage', status: 'Healthy', note: 'Reachable.', ms: 4 }],
  workers: [
    { name: 'views-flush', ageSeconds: 2, periodSeconds: 5, overdue: false },
    { name: 'log-digest', ageSeconds: 7200, periodSeconds: 86400, overdue: false },
  ],
};

@Component({
  imports: [HealthPanelComponent],
  template: `<adm-health-panel
    [health]="health()"
    [busy]="busy()"
    (check)="asked.set(asked() + 1)"
  />`,
})
class Host {
  public readonly health = signal<Health | null>(null);
  public readonly busy = signal(false);
  public readonly asked = signal(0);
}

describe('HealthPanelComponent', () => {
  let fixture: ComponentFixture<Host>;

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function rows(): string[] {
    return [...fixture.nativeElement.querySelectorAll('tbody tr')].map((row) =>
      ((row as HTMLElement).textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
  }

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  // Not having asked is not a fault, so the panel says so rather than showing a green badge.
  it('says nothing has been asked before anything answers', () => {
    expect(text()).toContain('Unknown');
    expect(text()).toContain('Not asked yet');
  });

  it('asks when the button is pressed', () => {
    button().click();

    expect(fixture.componentInstance.asked()).toBe(1);
  });

  it('cannot be pressed while it is already asking', () => {
    fixture.componentInstance.busy.set(true);
    fixture.detectChanges();

    expect(button().disabled).toBe(true);
  });

  it('shows every check and what it said', () => {
    fixture.componentInstance.health.set(HEALTHY);
    fixture.detectChanges();

    expect(rows()).toContain('storage Reachable. 4 ms');
  });

  // Seconds for a flush and hours for the digest, because 86400 tells a reader nothing.
  it('puts each worker in units a person reads', () => {
    fixture.componentInstance.health.set(HEALTHY);
    fixture.detectChanges();

    expect(rows()).toContain('views-flush 2s ago every 5s');
    expect(rows()).toContain('log-digest 2 h ago every 24 h');
  });

  it('marks a worker that has missed its window', () => {
    fixture.componentInstance.health.set({
      ...HEALTHY,
      status: 'Degraded',
      workers: [{ name: 'usage-flush', ageSeconds: 600, periodSeconds: 5, overdue: true }],
    });
    fixture.detectChanges();

    expect(rows()[1]).toContain('overdue');
    expect(text()).toContain('Degraded');
  });

  // A sleeping or missing API is a sentence in this panel, not an error across the page.
  it('says why it could not ask', () => {
    fixture.componentInstance.health.set({
      reachable: false,
      problem: 'The analytics API could not be reached: HttpRequestException.',
      status: 'Unknown',
      checks: [],
      workers: [],
    });
    fixture.detectChanges();

    expect(text()).toContain('could not be reached');
  });

  // A worker that never started leaves no beat, which is the one thing the check cannot see.
  it('says when a reachable API has reported no workers at all', () => {
    fixture.componentInstance.health.set({ ...HEALTHY, workers: [] });
    fixture.detectChanges();

    expect(text()).toContain('No worker has reported yet');
  });
});
