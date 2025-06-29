require('@testing-library/jest-dom');

// Polyfill for structuredClone
if (!global.structuredClone) {
  global.structuredClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
}
