import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '@christian-szasz-portfolio/common-web';

import { AboutSectionComponent } from './about-section/about-section.component';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { ProfileSectionComponent } from './profile-section/profile-section.component';
import { TechBandComponent } from './tech-band/tech-band.component';
import { ThinkingSectionComponent } from './thinking-section/thinking-section.component';
import { WorkSectionComponent } from './work-section/work-section.component';

/** The landing page: six sections and the document metadata */
@Component({
  selector: 'lpg-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ProfileSectionComponent,
    HeroSectionComponent,
    TechBandComponent,
    WorkSectionComponent,
    ThinkingSectionComponent,
    AboutSectionComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  public constructor() {
    inject(SeoService).apply({
      title: $localize`:@@home.page.title:Christian-Ioan Szasz - Full-Stack Engineer Portfolio`,
      description: $localize`:@@home.page.description:Software engineer in Sibiu, Romania. 4+ years of .NET, Angular, React and Azure on cloud accounting products for the Nordic market, and four side projects of my own: a compiler, a CPU simulator, a task tracker and this site.`,
      path: '/',
    });
  }
}
