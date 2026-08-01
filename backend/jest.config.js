/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/setupAfterEnv.ts"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  testTimeout: 30000,
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json"
    }
  }
};
