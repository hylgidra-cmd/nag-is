import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

/**
 * ESLint flat config.
 *
 * eslint-config-next 16 exports real flat-config arrays, so they are spread
 * directly. The `@eslint/eslintrc` FlatCompat bridge is not used: it throws on
 * these configs ("Converting circular structure to JSON") because the plugin
 * objects are self-referential.
 */
export default [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'dist/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Unused values are a real signal here, not noise. Underscore-prefixed
      // names are the documented opt-out.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // `any` defeats the point of strict mode.
      '@typescript-eslint/no-explicit-any': 'error',
      // Catches `<a href="/courses">` where a client-side <Link> belongs.
      '@next/next/no-html-link-for-pages': 'off',
      // A Pages Router rule: it warns that a font <link> outside
      // `pages/_document.js` loads for only one page. In the App Router the
      // root layout IS the global document, so the stylesheet there applies
      // to every route and the warning is a false positive.
      '@next/next/no-page-custom-font': 'off',
    },
  },
];
