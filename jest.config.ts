import type { Config } from 'jest'

const config: Config = {
  // Rules tests run in Node (no browser, no React)
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/tests/**/*.test.ts'],
  // Must run in-band: each test suite manages its own emulator connection
  maxWorkers: 1,
}

export default config
