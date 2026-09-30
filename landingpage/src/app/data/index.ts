/**
 * One import path for the content, whatever file it happens to live in. For features only.
 *
 * The content modules call `$localize` at module level, which a bundler must treat as a side
 * effect, so importing any one name through this file loads all of them. Features are lazy routes,
 * so that costs nothing there. Anything below a feature can land on the first load the moment the
 * header uses it, so it imports from the one file it needs instead, or every case study rides along
 * with the first page. `no-restricted-imports` in eslint.config.js holds that line.
 */

export * from './content.types';
export * from './cv.types';
export * from './cv.data';
export * from './interaction.data';
export * from './projects';
export * from './site.data';
