/**
 * End-to-end tests. These boot the real Nest application against the real
 * database named by DATABASE_URL, so they must be run serially
 * (`--runInBand`) and against a disposable database.
 */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  transform: {
    '^.+\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  clearMocks: true,
};
