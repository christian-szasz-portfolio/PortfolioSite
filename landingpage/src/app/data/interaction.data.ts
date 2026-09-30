/** Everything the analytics API counts, by the name it counts it under. Kept here because
 *  AnalyticsService.record() takes a plain string now — this is this site's own vocabulary. */
export const interaction = {
  route: 'route',
  section: 'section',
  cvOpened: 'cv.open',
  cvPdf: 'cv.download.pdf',
  cvSource: 'cv.download.source',
  projectRead: 'project.read',
} as const;

/** One of the operations the API counts */
export type InteractionKind = (typeof interaction)[keyof typeof interaction];
