/** The curriculum vitae, as content rather than markup */

/** A run of text, optionally emphasised, so a paragraph can carry highlights */
export interface CvRun {
  readonly text: string;
  readonly strong?: boolean;
}

/** Which of the sheet's own glyphs sits beside a contact line */
export enum CvContactIcon {
  Phone = 'phone',
  Email = 'email',
  Location = 'location',
  Website = 'website',
  Linkedin = 'linkedin',
  Github = 'github',
}

export interface CvContactLine {
  readonly icon: CvContactIcon;
  /** Named for assistive tech, since the glyph carries no text of its own */
  readonly label: string;
  readonly text: string;
}

/** A name and a measure: years for a skill, fluency for a language */
export interface CvRating {
  readonly name: string;
  readonly measure: string;
}

export interface CvStudy {
  readonly school: string;
  /** Kept as lines, because the sheet breaks a degree title deliberately */
  readonly degree: readonly string[];
  readonly meta: string;
}

/** One achievement line, whose opening clause is the claim being made */
export interface CvAchievement {
  readonly lead: string;
  readonly rest: string;
}

export interface CvRole {
  readonly title: string;
  readonly period: string;
  readonly project: string;
  readonly context?: string;
  readonly achievements?: readonly CvAchievement[];
  /** The compact form, used where the work is supporting detail */
  readonly points?: readonly string[];
  readonly skills: string;
}

export interface CvProfile {
  readonly name: string;
  /** Kept as lines, because the headline breaks deliberately */
  readonly title: readonly string[];
  readonly subtitle: string;
  readonly photo: string;
  readonly photoAlt: string;
}

export interface Cv {
  readonly documentTitle: string;
  readonly description: string;
  readonly profile: CvProfile;
  readonly contact: readonly CvContactLine[];
  readonly skills: readonly CvRating[];
  readonly education: readonly CvStudy[];
  readonly languages: readonly CvRating[];
  readonly about: readonly (readonly CvRun[])[];
  readonly roles: readonly CvRole[];
  readonly pageNumber: string;
}
