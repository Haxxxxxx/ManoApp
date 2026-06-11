export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      // The root tsconfig.json is a solution-style references file with no
      // compilerOptions, so ts-jest must be given real options or it falls
      // back to CommonJS output — which crashes under "type": "module"
      // with "exports is not defined".
      tsconfig: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        strict: true,
        isolatedModules: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        types: ['jest', '@testing-library/jest-dom', 'node'],
      },
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  // Keep Jest off compiled output and bundles — functions/lib contains
  // stale compiled copies of the functions tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/functions/lib/',
    '<rootDir>/dist/',
    '<rootDir>/functions/node_modules/',
  ],
  // firebase packages ship untranspiled ESM that Jest must transform
  transformIgnorePatterns: [
    '/node_modules/(?!(firebase|@firebase)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.*',
    '!src/**/*.spec.*',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
