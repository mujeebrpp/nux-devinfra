/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  // Unit specs (*.spec.ts) and in-process API e2e specs
  // (*.e2e-spec.ts, supertest-based) both live under src/.
  testRegex: ".*\\.(spec|test|e2e-spec)\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  // Runs before the test framework is installed. Loads the isolated test
  // environment file and migrates the *_test database only.
  globalSetup: "<rootDir>/../test/global-setup.js",
};
