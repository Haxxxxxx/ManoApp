/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // Cloud Functions tests run in node, frontend tests in jsdom
    environmentMatchGlobs: [
      ['functions/**', 'node'],
      ['src/**', 'jsdom'],
    ],
    setupFiles: ['./src/setupTests.ts'],
    include: [
      'src/**/__tests__/**/*.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
      'functions/src/**/__tests__/**/*.ts',
      'functions/src/**/*.{test,spec}.ts',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', 'functions/lib/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/**/__tests__/**',
        'src/**/*.{test,spec}.*',
        'src/**/*.stories.*',
      ],
    },
  },
});
