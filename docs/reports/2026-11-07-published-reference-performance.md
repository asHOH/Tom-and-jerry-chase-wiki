# Published reverse-reference rollout measurements

The wiki's “引用项” cards now get their counts, rows and related-domain revisions from the same published snapshot as the detail page. Mobile clients format the visible group. Map pages and the private character draft editor retain their previous lookup. Map entries still appear as referring sources on migrated pages.

## Item pilot

The original measurement baseline was `f805cd48`. The fixture and harness are in `8e8e4919`, the published query in `e51a20c2`, and the item pilot in `bc3839de` on the local review branch `codex/reverse-reference-item-pilot`. The item's reviewed tree is `d769996cd1550395becea05989704398d0eb4ec0`.

A first item visit and repeat visit each had a 10% faster card-opening target. 鞭炮束, with 40 references, improved from 569 to 494 ms on first visit and from 258 to 209 ms on repeat. The full item prerender family shrank by 62,092 bytes. Including shared chunks and the fetch cache, the measured server footprint grew by 397,216 bytes. The two item visits added 44,414 extra browser Cache Storage bytes after startup. Following the pilot, rollout prioritized speed and continued to measure retained bytes.

## Mobile rendering

Each cell gives the item-pilot baseline followed by the migrated build. Cold means the first visit to that route after startup. Warm means a repeat visit. Values are median milliseconds across five independent profiles. The empty item has no disclosure.

| Route                           | Cold content ready | Warm content ready | Cold click to rows | Warm click to rows |
| ------------------------------- | -----------------: | -----------------: | -----------------: | -----------------: |
| /items/鞭炮束/                  |          557 → 605 |          431 → 396 |          492 → 490 |          204 → 212 |
| /items/经验蛋糕/                |          433 → 423 |          393 → 428 |                  — |                  — |
| /characters/汤姆/               |          597 → 671 |          610 → 693 |          300 → 255 |          227 → 141 |
| /buffs/眩晕/                    |          438 → 399 |          443 → 404 |        1,002 → 771 |          705 → 500 |
| /entities/线条火箭/             |          429 → 485 |          383 → 411 |          223 → 116 |          217 → 100 |
| /fixtures/平台/                 |          347 → 452 |          411 → 385 |          573 → 493 |          439 → 374 |
| /achievements/mouse/无畏/       |          411 → 425 |          394 → 381 |          231 → 214 |          172 → 137 |
| /cards/缴械/                    |          375 → 447 |          380 → 445 |          321 → 317 |          273 → 215 |
| /modes/多元乱斗/                |          363 → 409 |          411 → 410 |          236 → 187 |          183 → 148 |
| /special-skills/mouse/勇气投掷/ |          446 → 403 |          409 → 391 |          210 → 127 |          208 → 129 |

9 of nine disclosures opened faster cold and 8 opened faster warm. Adding one median click per nonempty route gives 3,588 → 2,971 ms cold and 2,627 → 1,956 ms warm. These totals weight each sampled route equally. Content-ready time measures the first paint opportunity after the detail marker appears. The click timer starts at a targeted click on a hydrated disclosure and ends at the paint opportunity after its rows appear.

The sum of the ten content-ready medians increased by 7.4% cold and 1.9% warm. The largest cold increase was 105 ms on 平台. Warming the row renderer after the main page rendered improved nine of the ten cold content-ready medians compared with the first full migration build, which loaded that code eagerly.

## Storage

The figures below compare all prerenders in the nine affected route families plus shared build chunks and cache. They include server-held copies of client assets and source maps. The fetch-cache figure is sampled after the visit sequence.

| Server scope                    | Item pilot, bytes | Migrated, bytes | Change, bytes |
| ------------------------------- | ----------------: | --------------: | ------------: |
| Shared browser chunks on server |        12,139,057 |      12,135,530 |        −3,527 |
| Shared server chunks            |       107,099,510 |     107,386,099 |      +286,589 |
| Server fetch cache              |         2,888,106 |       2,887,530 |          −576 |
| items                           |        17,510,421 |      17,520,010 |        +9,589 |
| characters                      |        31,304,056 |      31,172,185 |      −131,871 |
| buffs                           |        42,373,468 |      42,595,418 |      +221,950 |
| entities                        |        55,605,546 |      55,944,447 |      +338,901 |
| fixtures                        |        47,948,660 |      48,116,962 |      +168,302 |
| achievements                    |        10,121,079 |      10,147,704 |       +26,625 |
| cards                           |        64,664,414 |      64,449,355 |      −215,059 |
| modes                           |        10,373,974 |      10,303,914 |       −70,060 |
| special-skills                  |         9,536,711 |       9,497,239 |       −39,472 |
| Total                           |       411,565,002 |     412,156,393 |      +591,391 |

| Browser Cache Storage        | Item pilot, bytes | Migrated, bytes |
| ---------------------------- | ----------------: | --------------: |
| Startup                      |        11,951,808 |      11,952,952 |
| Added by the two item visits |           697,912 |         636,793 |
| After all ten routes         |        19,939,461 |      19,917,333 |

Browser storage is the decoded response-body size per Cache Storage entry. The measurement excludes opaque HTTP disk cache files, filesystem block allocation and Supabase disk usage.

## Transfer

These are document Resource Timing estimates in bytes, sampled after the result assets settle. Service-worker-originated network requests are outside the estimate.

| Route                           | First visit, bytes | Repeat visit, bytes |
| ------------------------------- | -----------------: | ------------------: |
| /items/鞭炮束/                  |  120,382 → 120,424 |   120,382 → 120,424 |
| /items/经验蛋糕/                |  110,675 → 110,717 |   110,675 → 110,717 |
| /characters/汤姆/               |  272,277 → 273,546 |   272,277 → 273,546 |
| /buffs/眩晕/                    |  141,786 → 147,232 |   141,786 → 147,232 |
| /entities/线条火箭/             |  115,405 → 116,938 |   115,405 → 116,938 |
| /fixtures/平台/                 |  134,339 → 135,496 |   134,339 → 135,496 |
| /achievements/mouse/无畏/       |  104,385 → 104,733 |   104,385 → 104,733 |
| /cards/缴械/                    |  312,735 → 313,240 |   312,735 → 313,240 |
| /modes/多元乱斗/                |  149,263 → 149,451 |   149,263 → 149,451 |
| /special-skills/mouse/勇气投掷/ |  151,702 → 151,577 |   151,702 → 151,577 |

## Consistency and verification

- The route test adds an item's first reference by changing only a character's skill. The item revision stays stable, the character revision changes, and the published skill name, owner, link and excerpt appear together. Revoking the referring edit removes the row.
- Additional fixtures exercise renamed targets, same-named skills under distinct owners, faction-specific ownership, child-only hits, indirect prototypes, map-origin hits, and exact reconstruction of both mobile and desktop excerpts. Character and skill references are batched for one snapshot.
- The sampled titles, normalized link destinations and displayed text matched across the before and after builds for every sampled route. A separate production check visited all ten routes without opening their cards. After disabling the ordinary HTTP cache and going offline, the first card opens reproduced the corresponding online results. Mobile light and dark theme checks verified focus visibility, navigation to the correct character and a 390-pixel layout without document overflow.
- Validation included lint, TypeScript, Tailwind, 80 canonical actor profiles, 2,906 application tests across 406 suites, 32 script tests and the production build with 886 prerendered routes. The build used a fixed checked-in dataset. Production traffic and live revalidation load are outside the experiment.

## Reproduction

Use Node 24.11.0, npm 11.20.0, Playwright Core 1.57.0 and Chromium headless shell 143.0.7499.4. Set `PLAYWRIGHT_CORE` to the installed Playwright Core package path. Build each revision with its own fresh fetch cache. Keep environment and build validation enabled.

```powershell
$env:NEXT_PUBLIC_DISABLE_ARTICLES='1'
$env:DEPLOY_BUILD_ID='references-comparison'
$env:NEXT_CPU_COUNT='4'
npm run build:skip-images
npm run start -- --hostname 127.0.0.1 --port 3197
```

In a second terminal, run the migration commit's harness against each build:

```powershell
node scripts/ops/measure-reverse-references.mjs http://127.0.0.1:3197 5 migration
```

Omit `migration` to reproduce the three-route item pilot. The harness uses a 390 × 844 touch viewport, 4× CPU throttling and a fresh context for each round. It primes the production worker at the home page and visits each measured route twice. This is local mobile emulation with independent storage and transfer measurements.
