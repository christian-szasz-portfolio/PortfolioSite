/** The projects, and the two lookups the /work routes need */

import { Project, ProjectPage } from '../content.types';
import { assembler, assemblerPage } from './assembler.data';
import { portfolio, portfolioPage } from './portfolio.data';
import { stack86, stack86Page } from './stack86.data';
import { taskly, tasklyPage } from './taskly.data';

/** Document order: the cards on the home page and the pager both follow it */
export const projects: readonly Project[] = [stack86, taskly, assembler, portfolio];

export const projectPages: readonly ProjectPage[] = [
  stack86Page,
  tasklyPage,
  assemblerPage,
  portfolioPage,
];

/** Finds a project or its page by the slug the route carries */
export class ProjectCatalog {
  public static projectBySlug(slug: string): Project | null {
    return projects.find((project) => project.slug === slug) ?? null;
  }

  public static pageBySlug(slug: string): ProjectPage | null {
    return projectPages.find((page) => page.slug === slug) ?? null;
  }

  private constructor() {
    // A namespace of statics, never an instance.
  }
}
