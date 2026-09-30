// @ts-check
/// <reference types="node" />
const { defineConfig } = require('eslint/config');
const importX = require('eslint-plugin-import-x');
const { baseConfig } = require('@christian-szasz-portfolio/common-web/tools/eslint-base.cjs');

/** The plugin's published types lag ESLint's own, so it is named a Plugin here */
const importXPlugin = /** @type {import('eslint').ESLint.Plugin} */ (/** @type {unknown} */ (importX));

/**
 * Every import on one line; the fix joins a wrapped one
 * @type {import('eslint').Rule.RuleModule}
 */
const oneLineImports = {
  meta: { type: 'layout', fixable: 'whitespace', schema: [] },
  create: (context) => ({
    ImportDeclaration: (node) => {
      if (!node.loc || node.loc.start.line === node.loc.end.line) {
        return;
      }
      const joined = context.sourceCode
        .getText(node)
        .replace(/\s*\n\s*/g, ' ')
        .replace(/,?\s*\}/g, ' }');
      const commented = context.sourceCode.getCommentsInside(node).length > 0;
      context.report({
        node,
        message: 'keep the import on one line.',
        fix: commented ? null : (fixer) => fixer.replaceText(node, joined),
      });
    },
  }),
};

/**
 * The shared rules every app here is held to, plus the four this site adds: imports on one line,
 * the one allowance in the layering, one feature never reaching into another, and the content
 * barrel kept to features.
 */
module.exports = defineConfig([
  ...baseConfig({
    prefix: 'lpg',
    dataHolds: 'content and the types describing it, and nothing above',
    coreHolds: 'services with no view of their own',
  }),
  {
    files: ['**/*.ts'],
    plugins: { local: { rules: { 'one-line-imports': oneLineImports } } },
    rules: { 'local/one-line-imports': 'error' },
  },
  {
    // The one exception: a dialog service names the overlay it lazily opens. Kept to this
    // folder so the allowance cannot spread through the rest of core.
    files: ['src/app/core/services/dialogs/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/layout/**', '**/features/**'],
              message: 'a dialog service may open a shared overlay, and nothing above it.',
            },
          ],
        },
      ],
    },
  },
  {
    // The content barrel is for features alone. Every route loads its feature lazily, but anything
    // below a feature can land on the first load the moment the header uses it, and the content
    // modules call $localize at module level: one name through the barrel keeps every case study
    // in the first download. Below features, content comes from the file that holds it.
    // ESLint's own rule rather than the TypeScript one, so this block adds to the layering rules
    // instead of replacing them; a second block for the same rule replaces the first.
    files: ['src/app/**/*.ts'],
    ignores: ['src/app/features/**', 'src/app/data/**', 'src/app/**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // The folder itself, never a file inside it: a glob would match both
              regex: '(^|/)data$',
              message:
                'below features, import content from its own file (data/cv.data, data/site.data, ...): the barrel loads every case study with the first page.',
            },
          ],
        },
      ],
    },
  },
  // One feature never reaches into another; needs real path resolution since a sibling names
  // no layer for the string matching above to catch. Zones are hand-listed: adding a feature
  // means adding it here too.
  {
    files: ['src/app/features/**/*.ts'],
    plugins: { 'import-x': importXPlugin },
    settings: {
      'import-x/resolver': { node: { extensions: ['.ts'] } },
    },
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          basePath: __dirname,
          zones: [
            {
              target: './src/app/features/cookies',
              from: [
                  './src/app/features/cv',
                  './src/app/features/home',
                  './src/app/features/not-found',
                  './src/app/features/privacy',
                  './src/app/features/terms',
                  './src/app/features/unsupported',
                  './src/app/features/work',
              ],
            },
            {
              target: './src/app/features/cv',
              from: [
                  './src/app/features/cookies',
                  './src/app/features/home',
                  './src/app/features/not-found',
                  './src/app/features/privacy',
                  './src/app/features/terms',
                  './src/app/features/unsupported',
                  './src/app/features/work',
              ],
            },
            {
              target: './src/app/features/home',
              from: [
                  './src/app/features/cookies',
                  './src/app/features/cv',
                  './src/app/features/not-found',
                  './src/app/features/privacy',
                  './src/app/features/terms',
                  './src/app/features/unsupported',
                  './src/app/features/work',
              ],
            },
            {
              target: './src/app/features/not-found',
              from: [
                  './src/app/features/cookies',
                  './src/app/features/cv',
                  './src/app/features/home',
                  './src/app/features/privacy',
                  './src/app/features/terms',
                  './src/app/features/unsupported',
                  './src/app/features/work',
              ],
            },
            {
              target: './src/app/features/privacy',
              from: [
                  './src/app/features/cookies',
                  './src/app/features/cv',
                  './src/app/features/home',
                  './src/app/features/not-found',
                  './src/app/features/terms',
                  './src/app/features/unsupported',
                  './src/app/features/work',
              ],
            },
            {
              target: './src/app/features/terms',
              from: [
                  './src/app/features/cookies',
                  './src/app/features/cv',
                  './src/app/features/home',
                  './src/app/features/not-found',
                  './src/app/features/privacy',
                  './src/app/features/unsupported',
                  './src/app/features/work',
              ],
            },
            {
              target: './src/app/features/unsupported',
              from: [
                  './src/app/features/cookies',
                  './src/app/features/cv',
                  './src/app/features/home',
                  './src/app/features/not-found',
                  './src/app/features/privacy',
                  './src/app/features/terms',
                  './src/app/features/work',
              ],
            },
            {
              target: './src/app/features/work',
              from: [
                  './src/app/features/cookies',
                  './src/app/features/cv',
                  './src/app/features/home',
                  './src/app/features/not-found',
                  './src/app/features/privacy',
                  './src/app/features/terms',
                  './src/app/features/unsupported',
              ],
            },
          ],
        },
      ],
    },
  },
]);
