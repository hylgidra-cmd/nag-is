/**
 * Web unit tests.
 *
 * Pure logic (i18n formatting, money, class merging) runs in `node`; there is
 * no DOM involved, so jsdom would only slow it down. Component tests, when
 * added, should opt into jsdom with a `@jest-environment jsdom` docblock.
 */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.test.tsx'],
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
};
