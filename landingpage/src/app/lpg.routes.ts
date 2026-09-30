import { Routes } from '@angular/router';

/** Every route here is prerendered to static HTML at build time */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    // The one route a visitor is likely to want next, so it is fetched early.
    path: 'work/:slug',
    data: { preload: true },
    loadComponent: () =>
      import('./features/work/project-page.component').then((m) => m.ProjectPageComponent),
  },
  {
    path: 'cv',
    loadComponent: () => import('./features/cv/cv-page.component').then((m) => m.CvPageComponent),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/privacy/privacy.component').then((m) => m.PrivacyComponent),
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/terms/terms.component').then((m) => m.TermsComponent),
  },
  {
    // A real route, so /unsupported resolves rather than falling to the 404
    path: 'unsupported',
    loadComponent: () =>
      import('./features/unsupported/unsupported.component').then((m) => m.UnsupportedComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
