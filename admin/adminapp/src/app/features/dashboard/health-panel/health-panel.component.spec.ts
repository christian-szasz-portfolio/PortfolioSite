import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  healthTargets,
  Health,
  HealthPhase,
  HealthStatus,
  HealthTarget,
  TargetCheck,
} from '../../../data';
import { HealthPanelComponent } from './health-panel.component';

const API: Health = {
  target: HealthTarget.Api,
  reachable: true,
  problem: null,
  status: HealthStatus.Healthy,
  ms: 310,
  checks: [{ name: 'storage', status: HealthStatus.Healthy, note: 'Reachable.', ms: 4 }],
  workers: [
    { name: 'views-flush', ageSeconds: 2, periodSeconds: 5, overdue: false },
    { name: 'log-digest', ageSeconds: 7200, periodSeconds: 86400, overdue: false },
  ],
};

const TASKLY: Health = {
  target: HealthTarget.Taskly,
  reachable: true,
  problem: null,
  status: HealthStatus.Healthy,
  ms: 48_200,
  checks: [{ name: 'ready', status: HealthStatus.Healthy, note: 'projects 2', ms: 48_200 }],
  workers: [],
};

function idle(): TargetCheck[] {
  return healthTargets.map((target) => ({ target, phase: HealthPhase.Idle, health: null }));
}

function answered(...reports: Health[]): TargetCheck[] {
  return idle().map((row) => {
    const health = reports.find((report) => report.target === row.target) ?? null;

    return health ? { target: row.target, phase: HealthPhase.Answered, health } : row;
  });
}

@Component({
  imports: [HealthPanelComponent],
  template: `<adm-health-panel
    [checks]="checks()"
    [busy]="busy()"
    (check)="asked.set(asked() + 1)"
  />`,
})
class Host {
  public readonly checks = signal<readonly TargetCheck[]>(idle());
  public readonly busy = signal(false);
  public readonly asked = signal(0);
}

describe('HealthPanelComponent', () => {
  let fixture: ComponentFixture<Host>;

  function text(): string {
    return ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');
  }

  function section(index: number): string {
    const sections = fixture.nativeElement.querySelectorAll('.health__target');

    return ((sections[index] as HTMLElement).textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  function rows(): string[] {
    return [...fixture.nativeElement.querySelectorAll('tbody tr')].map((row) =>
      ((row as HTMLElement).textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
  }

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  function show(checks: readonly TargetCheck[]): void {
    fixture.componentInstance.checks.set(checks);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('shows a row for every service, in order', () => {
    expect(section(0)).toContain('Analytics API');
    expect(section(1)).toContain('Taskly');
    expect(section(2)).toContain('Stack86');
  });

  // Not having asked is not a fault, so the panel says so rather than showing a green badge.
  it('says nothing has been asked before anything answers', () => {
    expect(section(0)).toContain('Unknown');
    expect(section(0)).toContain('Not asked yet');
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

  // A silent service is most likely starting, which is worth saying instead of a bare spinner.
  it('says a service that has been silent for a while is waking', () => {
    show(
      idle().map((row) =>
        row.target === HealthTarget.Stack86 ? { ...row, phase: HealthPhase.Waking } : row,
      ),
    );

    expect(section(2)).toContain('Waking');
  });

  it('fills a row as soon as its service answers, whatever the others are doing', () => {
    show(
      answered(TASKLY).map((row) =>
        row.target === HealthTarget.Api ? { ...row, phase: HealthPhase.Asking } : row,
      ),
    );

    expect(section(0)).toContain('Asking');
    expect(section(1)).toContain('Healthy');
    expect(section(1)).toContain('projects 2');
  });

  it('shows how long the round trip took, which is the cold start', () => {
    show(answered(TASKLY));

    expect(section(1)).toContain('48200 ms');
  });

  it('shows every check and what it said', () => {
    show(answered(API));

    expect(rows()).toContain('storage Reachable. 4 ms');
  });

  // Seconds for a flush and hours for the digest, because 86400 tells a reader nothing.
  it('puts each worker in units a person reads', () => {
    show(answered(API));

    expect(rows()).toContain('views-flush 2s ago every 5s');
    expect(rows()).toContain('log-digest 2 h ago every 24 h');
  });

  it('marks a worker that has missed its window', () => {
    show(
      answered({
        ...API,
        status: HealthStatus.Degraded,
        workers: [{ name: 'usage-flush', ageSeconds: 600, periodSeconds: 5, overdue: true }],
      }),
    );

    expect(rows()[1]).toContain('overdue');
    expect(section(0)).toContain('Degraded');
  });

  // A sleeping or missing service is a sentence in its row, not an error across the page.
  it('says why it could not ask', () => {
    show(
      answered({
        ...TASKLY,
        reachable: false,
        problem: 'Taskly could not be reached: HttpRequestException.',
        status: HealthStatus.Unknown,
        checks: [],
      }),
    );

    expect(section(1)).toContain('could not be reached');
    expect(section(1)).not.toContain(' ms');
  });

  // A worker that never started leaves no beat, which is the one thing the check cannot see.
  it('says when a reachable API has reported no workers at all', () => {
    show(answered({ ...API, workers: [] }));

    expect(section(0)).toContain('No worker has reported yet');
  });

  // The demos have no workers to report, so their silence on the subject means nothing.
  it('does not ask a demo for workers it never has', () => {
    show(answered(TASKLY));

    expect(text()).not.toContain('No worker has reported yet');
  });
});
