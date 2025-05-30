const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/tests/__mocks__/fileMock.js',
    '^react-hot-toast$': '<rootDir>/src/tests/__mocks__/react-hot-toast.ts',
    '^react-use$': '<rootDir>/src/tests/__mocks__/react-use.ts',
    '^next/router$': '<rootDir>/src/tests/__mocks__/next/router.ts',
    '^next/navigation$': '<rootDir>/src/tests/__mocks__/next/router.ts',
    '^next/server$': '<rootDir>/src/tests/__mocks__/next/server.ts',
    '^@/config/firebase$': '<rootDir>/src/tests/__mocks__/firebase/index.ts',
    '^@/lib/firebase$': '<rootDir>/src/tests/__mocks__/firebase/index.ts',
    '^firebase/auth$': '<rootDir>/src/tests/__mocks__/firebase/index.ts',
    '^firebase/firestore$': '<rootDir>/src/tests/__mocks__/firebase/index.ts',
    '^firebase/storage$': '<rootDir>/src/tests/__mocks__/firebase/index.ts',
    '^firebase/functions$': '<rootDir>/src/tests/__mocks__/firebase/index.ts',
    '^firebase/analytics$': '<rootDir>/src/tests/__mocks__/firebase/index.ts',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/out/',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
  roots: ['<rootDir>/src'],
  modulePaths: ['<rootDir>/src'],
  resolver: '<rootDir>/jest.resolver.js',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig); 