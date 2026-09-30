import { TestBed } from '@angular/core/testing';

import { CvRole } from '../../../../data';
import { CvRoleComponent } from './cv-role.component';

describe('CvRoleComponent', () => {
  const render = async (role: CvRole) => {
    await TestBed.configureTestingModule({ imports: [CvRoleComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CvRoleComponent);
    fixture.componentRef.setInput('role', role);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const achievementRole: CvRole = {
    title: 'Software Developer',
    period: '2025 - 2026',
    project: 'A Suite',
    context: 'Some context.',
    achievements: [
      { lead: 'Did the thing', rest: ' by doing it well.' },
      { lead: 'Did the other thing', rest: ' as well.' },
    ],
    skills: 'Skills: One, Two',
  };

  it('leads each achievement with the claim, then the rest of the sentence', async () => {
    const host = await render(achievementRole);

    expect(host.querySelector('.cv-role__achievement-lead')?.textContent).toBe('Did the thing');
    expect(host.querySelector('.cv-role__achievement')?.textContent).toContain('by doing it well.');
  });

  it('draws every achievement a role carries, not only the first', async () => {
    const host = await render(achievementRole);

    expect(host.querySelectorAll('.cv-role__achievement').length).toBe(2);
  });

  it('shows the bullet form instead when that is what the role carries', async () => {
    const host = await render({
      title: 'System Administrator',
      period: '2021 - 2022',
      project: 'Monitoring',
      points: ['Did one thing.', 'Did another.'],
      skills: 'Skills: Three',
    });

    expect(host.querySelectorAll('.cv-role__point').length).toBe(2);
    expect(host.querySelector('.cv-role__achievement')).toBeNull();
    // Nothing to say about context means nothing is drawn for it
    expect(host.querySelector('.cv-role__context')).toBeNull();
  });

  it('always names the period and the skills', async () => {
    const host = await render(achievementRole);

    expect(host.querySelector('.cv-role__period')?.textContent).toContain('2025');
    expect(host.querySelector('.cv-role__skills')?.textContent).toContain('Skills:');
  });
});
