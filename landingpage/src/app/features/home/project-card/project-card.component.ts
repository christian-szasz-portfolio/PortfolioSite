import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsService, ArrowGlyphs, GithubIconComponent } from '@christian-szasz-portfolio/common-web';

import { interaction, Project } from '../../../data';
import { ChipListComponent } from '../../../shared/components/lists/chip-list/chip-list.component';
import { IconComponent } from '../../../shared/components/marks/icon/icon.component';
import { MediaFrameComponent } from '../../../shared/components/media/media-frame/media-frame.component';
import { DriftDepth, DriftDirective } from '../../../shared/directives/drift/drift.directive';
import { MagneticDirective } from '../../../shared/directives/magnetic/magnetic.directive';
import { DemoUrlPipe } from '../../../shared/pipes/demo-url/demo-url.pipe';
import { RevealDirective, RevealVariant } from '../../../shared/directives/reveal/reveal.directive';

/** A slide is one column and a bounded height; a stack alternates sides */
export enum ProjectCardVariant {
  Stacked = 'stacked',
  Slide = 'slide',
}

/** One project, as much of it as a shop window should carry */
@Component({
  selector: 'lpg-project-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ChipListComponent,
    DemoUrlPipe,
    DriftDirective,
    GithubIconComponent,
    IconComponent,
    MagneticDirective,
    MediaFrameComponent,
    RevealDirective,
    RouterLink,
  ],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
})
export class ProjectCardComponent {
  /** The template names these, and a template cannot reach an enum by itself */
  protected readonly depths = DriftDepth;

  private readonly analytics = inject(AnalyticsService);

  protected readonly glyphs = ArrowGlyphs;

  public readonly project = input.required<Project>();

  /** Stated rather than inferred */
  public readonly first = input(false);

  /** How the card lays itself out in its row */
  public readonly variant = input<ProjectCardVariant>(ProjectCardVariant.Stacked);

  /** A slide arrives head on; a stacked card arrives from the side its media sits on */
  protected readonly revealVariant = computed<RevealVariant>(() => {
    if (this.variant() === ProjectCardVariant.Slide) {
      return RevealVariant.Scale;
    }
    return this.project().reversed ? RevealVariant.SlideRight : RevealVariant.SlideLeft;
  });

  /** Says which project was picked, which the route change cannot tell apart. */
  protected opened(): void {
    this.analytics.record(interaction.projectRead, this.project().slug);
  }

  /** Named in the component, because a translator needs the whole sentence */
  protected seeMoreLabel(title: string): string {
    return $localize`:@@project.seeMoreAbout.label:See more about ${title}:title:`;
  }
}
