module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
    },
  },
  moduleFileExtensions: [
    'js',
    'ts',
    'json'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: [
    '**/test/**/*.test.(ts|js)',
  ],
  testEnvironment: 'node',
  preset: 'ts-jest',
  /*
   * Disable use of 'lcov' in coverage reporting, which as of February 20, 2020
   * caused the generation of a bunch of spurious warnings (see
   * https://github.com/facebook/jest/issues/9396#issuecomment-573336035).
   * This line can be removed once the handlebars dependency of Jest is fixed to
   * no longer produce these warning messages.
   */
  coverageReporters: ['text']
}
