import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// jsdom does not provide fetch, but firebase/functions references it at
// module scope — stub it so imports succeed (tests mock actual calls)
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = vi.fn(() =>
    Promise.reject(new Error('fetch is not available in tests — mock it'))
  ) as unknown as typeof fetch;
}

// Mock window.matchMedia (guarded — functions tests run in node env)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as unknown as typeof globalThis.IntersectionObserver;

  // Mock ResizeObserver
  globalThis.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as unknown as typeof globalThis.ResizeObserver;
}
