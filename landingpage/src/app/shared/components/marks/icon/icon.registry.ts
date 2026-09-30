import { faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { ArrowUp, Brain, BriefcaseBusiness, Cookie, ExternalLink, Eye, FileUser, Info, Languages, Lock, ListTree, Mail, Scale, ShieldCheck, UserRound } from '@lucide/icons';
import { BrandIcon, IconMark, IconMarkKind, IconShape, LucideIcon, brandMarkOf, resolveLucideShapes, strokeMarkOf } from '@christian-szasz-portfolio/common-web';

/** Lucide outlines for concepts, Font Awesome for brand marks; this site's own names only —
 *  the shape/mark types and the resolution from Lucide/Font Awesome data are shared. */

export type { IconMark, IconShape, LucideIcon };

/** Names say what the entry means, so the drawing can change without touching a template */
export type IconName =
  | 'work'
  | 'thinking'
  | 'about'
  | 'cv'
  | 'cookies'
  | 'privacy'
  | 'terms'
  | 'top'
  | 'email'
  | 'linkedin'
  | 'github'
  | 'languages'
  | 'sitemap'
  | 'views'
  | 'info'
  | 'demo'
  | 'closed';

const ICONS: Readonly<Record<string, LucideIcon>> = {
  work: BriefcaseBusiness,
  thinking: Brain,
  about: UserRound,
  cv: FileUser,
  cookies: Cookie,
  privacy: ShieldCheck,
  terms: Scale,
  top: ArrowUp,
  email: Mail,
  languages: Languages,
  sitemap: ListTree,
  views: Eye,
  info: Info,
  demo: ExternalLink,
  closed: Lock,
};

/** The two entries with a genuine logo, which Lucide does not carry */
const BRANDS: Readonly<Record<string, BrandIcon>> = {
  linkedin: faLinkedinIn,
  github: faGithub,
};

/** The stroked and brand icons the site draws, and the shapes each one resolves to */
export class IconRegistry {
  /** The canvas every icon is drawn on, asserted in the spec rather than assumed */
  public static readonly ICON_SIZE = 24;

  /** Every registered name, brand marks included */
  public static readonly ICON_NAMES = [
    ...Object.keys(ICONS),
    ...Object.keys(BRANDS),
  ] as readonly IconName[];

  /** Just the stroked ones, for the guard that checks the canvas they were drawn on */
  public static readonly STROKE_NAMES = Object.keys(ICONS) as readonly IconName[];

  /** Lucide's own data, for the guard that checks the canvas it was drawn on */
  public static iconDataFor(name: IconName): LucideIcon | undefined {
    return ICONS[name];
  }

  /** Narrows Lucide's loose pairs to the three shapes drawn here, so the template can switch */
  public static shapesFor(name: IconName): readonly IconShape[] {
    const icon = ICONS[name];
    return icon === undefined ? [] : resolveLucideShapes(icon);
  }

  /** Every tag Lucide gives for a registered icon, so the spec can prove none is dropped */
  public static tagsFor(name: IconName): readonly string[] {
    return ICONS[name]?.node.map(([tag]) => tag) ?? [];
  }

  /** A stroked Lucide outline, or a filled brand logo where Lucide has none */
  public static markFor(name: IconName): IconMark {
    const brand = BRANDS[name];
    const icon = ICONS[name];

    if (brand !== undefined) {
      return brandMarkOf(brand);
    }

    return icon === undefined ? { kind: IconMarkKind.Stroke, shapes: [] } : strokeMarkOf(icon);
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
