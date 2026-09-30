// @ts-check
const { defineConfig } = require('eslint/config');
const { baseConfig } = require('@christian-szasz-portfolio/common-web/tools/eslint-base.cjs');

/**
 * The shared rules every app here is held to, plus the one this app adds: a Chart is built in
 * one place. The rules about content are absent because this app has none: no i18n, one feature.
 */

/** Where a Chart may be built, and where one may only be described. */
const CHART_LIBRARY = {
  name: 'chart.js',
  message:
    'only adm-chart holds a Chart. Build a configuration in core/utils/chart-config and hand it over.',
};

module.exports = defineConfig([
  ...baseConfig({
    prefix: 'adm',
    dataHolds: 'the shapes the service answers with, and nothing above',
  }),
  {
    // Layout frames the app and never holds a Chart; the layering itself is in the shared rules,
    // restated here because a second block for the same rule replaces the first.
    files: ['src/app/layout/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [CHART_LIBRARY],
          patterns: [
            {
              group: ['**/features/**'],
              message: 'layout frames every feature, so it cannot depend on any one of them.',
            },
          ],
        },
      ],
    },
  },
  {
    // A feature composes panels and hands each one its slice of the archive. It never holds a
    // Chart: the theme and the configurations are pure functions in core, and one shared
    // component owns the canvas, so a component that draws is testable as the thing it draws.
    files: ['src/app/features/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { paths: [CHART_LIBRARY] }],
    },
  },
]);
