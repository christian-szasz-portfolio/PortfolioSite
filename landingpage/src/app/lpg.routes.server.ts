import { RenderMode, ServerRoute } from '@angular/ssr';

import { projects } from './data/projects';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'work/:slug',
    renderMode: RenderMode.Prerender,
    // Read from the data, so a new project cannot leave a route unbuilt.
    getPrerenderParams: async () => projects.map((project) => ({ slug: project.slug })),
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
