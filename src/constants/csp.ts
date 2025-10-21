// Shared Content Security Policy configuration.
// Source of truth lives in csp.config.mjs so both Next.js runtime and build tooling
// can consume the same directives without duplicating strings.
// Typescript will treat the imported values as `any`, which is acceptable for constants.
// If stronger typing is needed later we can add a local declaration file.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – importing from .mjs for shared constant reuse
export { cspDirectives, cspHeaderValue, extendCsp } from '../../csp.config.mjs';
