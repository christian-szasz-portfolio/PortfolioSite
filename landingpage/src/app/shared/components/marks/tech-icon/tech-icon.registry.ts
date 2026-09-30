import { faAngular, faDocker, faGithub, faReact, faTypescript } from '@fortawesome/free-brands-svg-icons';
import { BrandMarks, CustomMarks } from '@christian-szasz-portfolio/common-web';

/** What a technology's mark is made of */
export enum TechMarkKind {
  None = 'none',
  Brand = 'brand',
  Letters = 'letters',
}

/** A genuine mark where one exists, a short form otherwise; path data only, 0.8 kB each */
export type TechMark =
  | { readonly kind: TechMarkKind.None }
  | {
      readonly kind: TechMarkKind.Brand;
      readonly width: number;
      readonly height: number;
      /** Font Awesome draws one path; a Devicon silhouette can need several */
      readonly paths: readonly string[];
      /** Inner shapes cut out rather than filling in */
      readonly evenOdd: boolean;
    }
  | { readonly kind: TechMarkKind.Letters; readonly label: string };

/** Font Awesome carries the real mark for these */
const BRANDS = {
  Angular: faAngular,
  'Angular 22': faAngular,
  // A feature of Angular rather than a product, so it borrows Angular's mark.
  Signals: faAngular,
  Docker: faDocker,
  'GitHub Actions': faGithub,
  React: faReact,
  TypeScript: faTypescript,
} as const;

/** The .NET and Azure glyphs are shared across families that have no separate marks */
const MARK_FOR: Readonly<Record<string, string>> = {
  '.NET 10': 'dotnet',
  '.NET MAUI': 'dotnet',
  'ASP.NET Core': 'dotnet',
  Azure: 'azure',
  'Blob Storage': 'azure',
  'Service Bus': 'azure',
  'C#': 'csharp',
  PowerShell: 'powershell',
  Bash: 'bash',
  NgRx: 'ngrx',
  RxJS: 'rxjs',
  Playwright: 'playwright',
  Vite: 'vite',
  Vitest: 'vitest',
  SCSS: 'sass',
  HTML: 'html',
  Bootstrap: 'bootstrap',
  Tailwind: 'tailwind',
  'Claude Code': 'claudecode',
  'GitHub Copilot': 'copilot',
  JavaScript: 'javascript',
  Redis: 'redis',
  'Azure Functions': 'azurefunctions',
  // Monaco is the editor VS Code is built on, so it carries that mark.
  Monaco: 'vscode',
  n8n: 'n8n',
};

/** Patterns rather than products: no logo exists, and a lettered badge looks like a failure */
const UNMARKED: readonly string[] = ['CQRS', 'Saga', 'RESTful APIs'];

/** Short forms for everything neither set has a mark for, at most four characters */
const LETTERS: Readonly<Record<string, string>> = {
  '8086 assembly': '86',
  'CommunityToolkit.Mvvm': 'CT',
  MVP: 'MVP',
  MVVM: 'MVVM',
  OpenIddict: 'OID',
};

/** The mark each technology chip draws: a brand logo, a custom path, letters, or nothing */
export class TechIconRegistry {
  /** Every name the registry answers for, so a spec can prove the data is covered */
  public static readonly REGISTERED = Object.freeze([
    ...Object.keys(BRANDS),
    ...Object.keys(MARK_FOR),
    ...Object.keys(CustomMarks.byName),
    ...UNMARKED,
    ...Object.keys(LETTERS),
  ]);

  public static markFor(name: string): TechMark {
    const brand = Object.hasOwn(BRANDS, name) ? BRANDS[name as keyof typeof BRANDS] : null;

    if (brand !== null) {
      const [width, height, , , data] = brand.icon;
      return {
        kind: TechMarkKind.Brand,
        width,
        height,
        paths: [TechIconRegistry.pathOf(data)],
        evenOdd: false,
      };
    }

    if (UNMARKED.includes(name)) {
      return { kind: TechMarkKind.None };
    }

    const custom = CustomMarks.byName[name];
    if (custom !== undefined) {
      return {
        kind: TechMarkKind.Brand,
        width: 24,
        height: 24,
        paths: [custom.path],
        evenOdd: true,
      };
    }

    const key = MARK_FOR[name];
    const mark = key === undefined ? undefined : BrandMarks.byName[key];

    if (mark !== undefined) {
      return {
        kind: TechMarkKind.Brand,
        width: mark.width,
        height: mark.height,
        paths: [mark.path],
        evenOdd: false,
      };
    }

    return { kind: TechMarkKind.Letters, label: LETTERS[name] ?? TechIconRegistry.derive(name) };
  }

  /** Path data is either one string or a list of them, depending on the icon */
  private static pathOf(data: string | readonly string[]): string {
    return typeof data === 'string' ? data : data.join(' ');
  }

  /** Last resort for a technology nobody registered; a spec keeps this unreachable */
  private static derive(name: string): string {
    const compact = name.replace(/[^A-Za-z0-9#.]/g, '');
    return compact.slice(0, 4).toUpperCase();
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
