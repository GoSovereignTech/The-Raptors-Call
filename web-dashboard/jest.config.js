// jest.config.js
export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@sqlite\\.org/sqlite-wasm)/)'  
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@sqlite\\.org/sqlite-wasm$': '<rootDir>/src/__mocks__/sqlite-wasm.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testPathIgnorePatterns: ['/node_modules/', '/runAllTests\\.js$'] // Exclude runAllTests.js
};