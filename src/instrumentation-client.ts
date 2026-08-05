import '@formatjs/intl-segmenter/polyfill.js';
import 'core-js/actual/array/at';
import 'core-js/actual/object/has-own';
import 'core-js/actual/structured-clone';

import {
  ReadableStream as PolyfillReadableStream,
  TransformStream as PolyfillTransformStream,
  WritableStream as PolyfillWritableStream,
} from 'web-streams-polyfill/ponyfill/es2018';

type CryptoWithOptionalRandomUUID = Omit<Crypto, 'randomUUID'> & {
  randomUUID?: () => `${string}-${string}-${string}-${string}-${string}`;
};

function installMissingStreamGlobals() {
  const globalObject = globalThis as typeof globalThis & Record<string, unknown>;
  const streamConstructors = {
    ReadableStream: PolyfillReadableStream,
    TransformStream: PolyfillTransformStream,
    WritableStream: PolyfillWritableStream,
  } as const;

  for (const [name, constructor] of Object.entries(streamConstructors)) {
    if (globalObject[name] !== undefined) continue;

    Object.defineProperty(globalObject, name, {
      configurable: true,
      value: constructor,
      writable: true,
    });
  }
}

function installRandomUUID() {
  const cryptoObject = globalThis.crypto as CryptoWithOptionalRandomUUID | undefined;
  if (
    !cryptoObject ||
    typeof cryptoObject.randomUUID === 'function' ||
    typeof cryptoObject.getRandomValues !== 'function'
  ) {
    return;
  }

  Object.defineProperty(cryptoObject, 'randomUUID', {
    configurable: true,
    value: () => {
      const bytes = new Uint8Array(16);
      cryptoObject.getRandomValues(bytes);
      bytes[6] = (bytes[6]! & 0x0f) | 0x40;
      bytes[8] = (bytes[8]! & 0x3f) | 0x80;

      const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    },
    writable: true,
  });
}

installMissingStreamGlobals();
installRandomUUID();
