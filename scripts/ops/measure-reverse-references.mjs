// Run against a local production build. PLAYWRIGHT_CORE points to an installed playwright-core.
import assert from 'node:assert/strict';
import { readdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)(
  process.env.PLAYWRIGHT_CORE || 'playwright-core'
);
const origin = process.argv[2] || 'http://127.0.0.1:3197';
const rounds = Number(process.argv[3] || 5);
assert(Number.isInteger(rounds) && rounds > 0);
const routes = [
  { path: '/items/鞭炮束/', marker: 'Section:道具描述', hasResults: true },
  { path: '/items/经验蛋糕/', marker: 'Section:道具描述', hasResults: false },
  { path: '/characters/汤姆/', marker: 'Section:技能描述', hasResults: true },
];
const migration = process.argv[4] === 'migration';
if (migration) {
  routes.push(
    ...[
      ['/buffs/眩晕/', 'Section:详细介绍'],
      ['/entities/线条火箭/', 'Section:衍生物描述'],
      ['/fixtures/平台/', 'Section:物件描述'],
      ['/achievements/mouse/无畏/', 'Section:成就描述'],
      ['/cards/缴械/', 'Section:知识卡效果'],
      ['/modes/多元乱斗/', 'Section:模式规则'],
      ['/special-skills/mouse/勇气投掷/', 'Section:技能描述'],
    ].map(([path, marker]) => ({ path, marker, hasResults: true }))
  );
}

async function fileBytes(file) {
  const info = await stat(file);
  if (!info.isDirectory()) return info.size;
  const entries = await readdir(file);
  const sizes = await Promise.all(entries.map((entry) => fileBytes(path.join(file, entry))));
  return sizes.reduce((a, b) => a + b, 0);
}

async function routeBytes(route) {
  const folder = path.join('.next/server/app', path.dirname(route.path.slice(1, -1)));
  const name = path.basename(route.path);
  const entries = (await readdir(folder)).filter((entry) => entry.startsWith(name + '.'));
  assert(entries.includes(name + '.html'), 'Missing prerendered HTML for ' + route.path);
  const sizes = await Promise.all(entries.map((entry) => fileBytes(path.join(folder, entry))));
  return sizes.reduce((a, b) => a + b, 0);
}

// Sum actual decoded response bodies once per Cache Storage entry (including duplicate entries
// across named caches). The HTTP disk cache and filesystem allocation are outside this measure.
async function cacheBytes(page) {
  return page.evaluate(async () => {
    const totals = {};
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      let bytes = 0;
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        if (response) bytes += (await response.arrayBuffer()).byteLength;
      }
      totals[name] = bytes;
    }
    return totals;
  });
}

async function visit(page, route) {
  console.error(route.path);
  const response = await page.goto(origin + encodeURI(route.path));
  assert.equal(response?.status(), 200);
  await page.waitForFunction((marker) => document.getElementById(marker), route.marker);
  // Record the first paint opportunity after detail content exists, independent of test polling.
  const readyMs = await page.evaluate(() => window.detailReady);
  await page.waitForLoadState('networkidle');
  const button = page.getByRole('button', { name: /引用项\(/ }).first();
  let openMs = null;
  let signature = null;
  if (route.hasResults) {
    // SSR exposes the button before React attaches its handler. The supported React build
    // attaches these props to the hydrated node, which can replace the original SSR node.
    await page.waitForFunction(() => {
      const trigger = [...document.querySelectorAll('button')].find((el) =>
        el.textContent.includes('引用项(')
      );
      return (
        trigger &&
        Object.keys(trigger).some(
          (key) => key.startsWith('__reactProps$') && typeof trigger[key]?.onClick === 'function'
        )
      );
    });
    // Time the same disclosure click at every viewport, independent of scrolling and sticky headers.
    openMs = await button.evaluate((trigger) => {
      const start = performance.now();
      const title = trigger.textContent;
      if (trigger.getAttribute('aria-expanded') !== 'false')
        throw new Error('Expected a collapsed disclosure: ' + title);
      trigger.click();
      return new Promise((resolve, reject) => {
        function check() {
          const current = [...document.querySelectorAll('button[aria-expanded="true"]')].find(
            (el) => el.textContent === title
          );
          if (current?.parentElement.querySelector('li a')) {
            requestAnimationFrame(() => resolve(performance.now() - start));
          } else if (performance.now() - start > 10000)
            reject(new Error('No reference rows for ' + location.pathname + ' ' + title));
          else requestAnimationFrame(check);
        }
        requestAnimationFrame(check);
      });
    });
    signature = await button.evaluate((trigger) => ({
      title: trigger.textContent,
      rows: [...trigger.parentElement.querySelectorAll('li a')].map((link) => [
        link.getAttribute('href'),
        link.textContent,
      ]),
    }));
  } else assert.equal(await button.count(), 0);
  await page.waitForLoadState('networkidle');
  // Resource Timing describes this document, excluding the worker's own network traffic.
  const pageTransferEstimateBytes = await page.evaluate(() =>
    [
      ...performance.getEntriesByType('navigation'),
      ...performance.getEntriesByType('resource'),
    ].reduce((sum, entry) => sum + (entry.transferSize || 0), 0)
  );
  return { readyMs, openMs, pageTransferEstimateBytes, signature };
}

const browser = await chromium.launch();
try {
  const results = [];
  const serverBytes = Object.fromEntries(
    await Promise.all(routes.map(async (route) => [route.path, await routeBytes(route)]))
  );
  const sharedBytes = Object.fromEntries(
    await Promise.all(
      [
        '.next/static/chunks',
        '.next/server/chunks',
        '.next/cache/fetch-cache',
        '.next/server/app/items',
        ...(migration
          ? [
              ...new Set(
                routes.slice(2).map((route) => '.next/server/app/' + route.path.split('/')[1])
              ),
            ]
          : []),
      ].map(async (directory) => [directory, await fileBytes(directory)])
    )
  );
  for (let round = 0; round < rounds; round++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(
      (markers) => {
        const marker = markers[decodeURI(location.pathname)];
        window.detailReady = new Promise((resolve) => {
          function check() {
            if (marker && document.getElementById(marker)) {
              requestAnimationFrame(() => resolve(performance.now()));
            } else requestAnimationFrame(check);
          }
          if (marker) requestAnimationFrame(check);
        });
      },
      Object.fromEntries(routes.map((route) => [route.path, route.marker]))
    );
    await page.goto(origin + '/');
    await page.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    const initialCache = await cacheBytes(page);
    const visits = [];
    let itemStorage;
    for (const route of routes) {
      visits.push({
        path: route.path,
        cold: await visit(page, route),
        warm: await visit(page, route),
      });
      if (route === routes[1]) {
        itemStorage = {
          browser: await cacheBytes(page),
          serverCache: await fileBytes('.next/cache/fetch-cache'),
        };
      }
    }
    await page.waitForLoadState('networkidle');
    const finalCache = await cacheBytes(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await context.setOffline(true);
    const offline = await visit(page, routes[0]);
    assert.deepEqual(offline.signature, visits[0].warm.signature);
    results.push({
      visits,
      initialCache,
      itemStorage,
      finalCache,
      finalServerCache: await fileBytes('.next/cache/fetch-cache'),
    });
    await context.close();
  }
  console.log(JSON.stringify({ serverBytes, sharedBytes, results }, null, 2));
} finally {
  await browser.close();
}
