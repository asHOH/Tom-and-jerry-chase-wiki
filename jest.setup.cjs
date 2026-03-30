require('@testing-library/jest-dom');

const { TextDecoder, TextEncoder } = require('util');

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

if (!global.structuredClone) {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

const intersectionObserverMock = () => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});

global.IntersectionObserver = jest.fn().mockImplementation(intersectionObserverMock);
