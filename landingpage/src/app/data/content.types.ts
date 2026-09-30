/** The shape of the content: models only, no data */

export interface Fact {
  readonly key: string;
  readonly value: string;
}

export interface Project {
  /** URL segment under /work, and the identity used everywhere else */
  readonly slug: string;
  readonly index: string;
  readonly title: string;
  readonly tagline: string;
  readonly summary: string;
  readonly note: string;
  readonly facts: readonly Fact[];
  readonly chips: readonly string[];
  /** Absent where the source is not public, e.g. a university-coordinated project */
  readonly repository: string | null;
  /** Shown in place of the repository link when there is none */
  readonly repositoryNote?: string;
  /** The live deployed instance, where one exists */
  readonly demo?: string | null;
  /** The public repository and the live instance are a demo, cut down from a private product */
  readonly demoVariant?: boolean;
  readonly media: {
    readonly label: string;
    readonly poster: string;
    readonly clip: string | null;
    readonly alt: string;
  };
  /** Puts the screenshot on the other side, alternating down the page */
  readonly reversed: boolean;
  /** The languages this project is written in, for the JSON-LD */
  readonly languages: readonly string[];
}

export interface Pillar {
  readonly index: string;
  readonly title: string;
  readonly text: string;
}

/** One language and the flag that goes with it, drawn from the region in the code */
export interface ContactPart {
  /** A locale code or bare region, the same form the language switcher's flags take */
  readonly code: string;
  readonly text: string;
}

export interface ContactRow {
  /** Stable, non-localised identifier used to pick the mark. The visible label is `key`. */
  readonly id: string;
  readonly key: string;
  /** The value as one string. Absent when the row is made of parts instead. */
  readonly text?: string;
  /** A value in pieces, each with its own flag, which one string could not carry */
  readonly parts?: readonly ContactPart[];
  /** Present when the value is a link; absent when it is plain text */
  readonly href?: string;
}

export interface Stat {
  readonly label: string;
  readonly value: number;
  readonly suffix?: string;
  /** True for values that are not quantities, such as a year */
  readonly plain?: boolean;
}

/** How a callout is meant to be read */
export enum CalloutTone {
  Note = 'note',
  Warning = 'warning',
  Aside = 'aside',
}

/** The languages a code block can be written in; C# is the only one coloured in-house */
export enum CodeLanguage {
  Csharp = 'csharp',
  Typescript = 'typescript',
  Text = 'text',
}

/** The kinds of block an article is built from */
export enum BlockKind {
  Prose = 'prose',
  List = 'list',
  Code = 'code',
  Figure = 'figure',
  Callout = 'callout',
  Specs = 'specs',
}

/** One unit of article content; the renderer switches on kind, so a new kind will not compile */
export type ArticleBlock =
  | { readonly kind: BlockKind.Prose; readonly text: string }
  | { readonly kind: BlockKind.List; readonly items: readonly string[]; readonly ordered?: boolean }
  | {
      readonly kind: BlockKind.Code;
      readonly language: CodeLanguage;
      readonly caption?: string;
      readonly source: string;
    }
  | {
      readonly kind: BlockKind.Figure;
      readonly src: string;
      readonly srcSmall: string;
      readonly alt: string;
      readonly caption: string;
      readonly width: number;
      readonly height: number;
    }
  | {
      readonly kind: BlockKind.Callout;
      readonly label: string;
      readonly text: string;
      readonly tone?: CalloutTone;
    }
  | { readonly kind: BlockKind.Specs; readonly rows: readonly Fact[] };

export interface ProjectArticle {
  /** Anchor and table-of-contents target */
  readonly id: string;
  readonly heading: string;
  readonly lede?: string;
  readonly blocks: readonly ArticleBlock[];
}

export interface ProjectPage {
  readonly slug: string;
  /** Overrides the card tagline where the page needs its own description */
  readonly description: string;
  readonly articles: readonly ProjectArticle[];
}
