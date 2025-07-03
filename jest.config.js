module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 10000,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!src/seeders/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/coverage/'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['./tests/setup.js'],
  // Mock modules that cause problems in tests
  moduleNameMapper: {
    '^sequelize$': '<rootDir>/node_modules/sequelize'
  },
  // Clear all mocks between tests
  clearMocks: true,
  // Don't use the real file system
  resetModules: true,
  // Initialize process.env.NODE_ENV
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};
