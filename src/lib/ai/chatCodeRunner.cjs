const { VM } = require('vm2');

// This file runs directly in Node on both hosting platforms; no separate build is needed.
const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  let serialized;
  try {
    const { code, context } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const vm = new VM({
      timeout: 1000,
      allowAsync: false,
      eval: false,
      wasm: false,
      bufferAllocLimit: 8 * 1024 * 1024,
    });
    for (const [name, value] of Object.entries(context)) {
      vm.freeze(value, name);
    }
    serialized = vm.run(
      `(function () {
'use strict';
const result = (function () {
${code}
})();
if (
  result !== null &&
  (typeof result === 'object' || typeof result === 'function') &&
  typeof result.then === 'function'
) {
  throw new Error('Async results are not supported.');
}
return JSON.stringify(result);
})()`,
      { filename: 'ai-chat-tool.vm.js' }
    );
  } catch {
    serialized = JSON.stringify({
      error: 'Code execution failed',
      details: 'Execution failed or exceeded the 1000ms limit.',
    });
  }
  process.stdout.end(serialized ?? 'null');
});
