module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js', // <-- add this line
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
    // Use jest-esm-transformer for ESM in node_modules
    '^.+\\.mjs$': 'jest-esm-transformer',
    '^.+/node_modules/(lucide-react)/.+\\.[jt]sx?$': 'jest-esm-transformer',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!lucide-react/)', // allow lucide-react to be transformed
  ],
};