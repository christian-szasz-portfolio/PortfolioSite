import { LOCALE_ID, ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { unknownCountry, ViewCounterService } from '@christian-szasz-portfolio/common-web';

/** One row of the breakdown: a country, its count, and its share of the busiest country. */
interface BreakdownRow {
  readonly code: string;
  readonly name: string;
  readonly count: number;
  readonly share: number;
}

/** Per-country bars named at runtime with Intl.DisplayNames, sharing the footer's one fetch */
@Component({
  selector: 'lpg-view-breakdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './view-breakdown.component.html',
  styleUrl: './view-breakdown.component.scss',
})
export class ViewBreakdownComponent {
  private readonly counter = inject(ViewCounterService);
  private readonly localeId = inject(LOCALE_ID);

  protected readonly rows = computed<BreakdownRow[]>(() => {
    const stats = this.counter.stats();
    if (stats === null || stats.total <= 0) {
      return [];
    }

    const busiest =
      stats.countries.reduce((most, country) => Math.max(most, country.count), 0) || 1;
    return stats.countries.map((country) => ({
      code: country.code,
      name: this.countryName(country.code),
      count: country.count,
      share: Math.round((country.count / busiest) * 100),
    }));
  });

  public constructor() {
    this.counter.ensureLoaded();
  }

  private countryName(code: string): string {
    if (code === unknownCountry) {
      return $localize`:@@views.unknown.label:Unknown`;
    }

    try {
      return new Intl.DisplayNames([this.localeId], { type: 'region' }).of(code) ?? code;
    } catch {
      return code;
    }
  }
}
