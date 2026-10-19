import tseslint from 'typescript-eslint';

/**
 * ESLint flat config for the API.
 *
 * Type-aware linting is enabled (`recommendedTypeChecked`), which is what
 * catches the mistakes that matter in a NestJS/Prisma codebase: unawaited
 * promises, unsafe `any` flowing out of a query, floating async calls in a
 * controller.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.config.js', '*.config.mjs'],
  },

  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // `any` defeats strict mode; an escape hatch must be justified in code.
      '@typescript-eslint/no-explicit-any': 'error',
      // A forgotten `await` on a Prisma call is a silent data bug.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      // Nest decorators legitimately produce "useless" constructors.
      '@typescript-eslint/no-useless-constructor': 'off',
      // Template literals over DTO fields are idiomatic here.
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
    },
  },

  // Tests may be looser: mocks and fixtures are deliberately untyped.
  {
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
