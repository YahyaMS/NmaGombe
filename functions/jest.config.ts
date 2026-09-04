import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testMatch: ['**/test/**/*.test.ts'],
  // Must run in-band (see package.json's --runInBand): every suite here shares
  // one Firestore emulator connection, same reasoning as the root project's
  // tests/rules suite.
}

export default config
