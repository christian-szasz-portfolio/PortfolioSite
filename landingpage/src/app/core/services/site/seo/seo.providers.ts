import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { SEO_CONFIG, SEO_LOCALES, SeoLocaleProvider } from '@christian-szasz-portfolio/common-web';

// Straight from its file, not the data barrel: see data/index.ts
import { person, siteUrl } from '../../../../data/site.data';
import { LangUrlUtils } from '../../../utils/lang-url/lang-url.utils';
import { LocaleService } from '../../locale/locale/locale.service';

/** This site's SEO_CONFIG and SEO_LOCALES for the shared SeoService. */
export function provideSeo(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: SEO_CONFIG,
      useValue: {
        siteUrl: siteUrl,
        siteName: 'Christian-Ioan Szasz',
        defaultImage: '/assets/img/social/portfolio.png',
        identity: [person],
      },
    },
    {
      provide: SEO_LOCALES,
      useFactory: (): SeoLocaleProvider => {
        const locale = inject(LocaleService);
        return {
          get current() {
            return locale.current;
          },
          get locales() {
            return locale.locales;
          },
          // Each language is a folder of real files, so canonical and hreflang name it by path
          pathFor: (path, target) => LangUrlUtils.withLangPrefix(path, target.subPath),
        };
      },
    },
  ]);
}
