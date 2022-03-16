/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

module.exports = {
  preset: 'ts-jest/presets/default-esm',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironment: 'node',
  runner: 'groups',
  resolver: 'jest-node-exports-resolver',
  setupFiles: ["dotenv/config"],
  collectCoverageFrom: ["src/**/*.ts", "!src/generated/**/*", "!test", "!src/main.ts"],
  modulePathIgnorePatterns: ["test/unit"]
};