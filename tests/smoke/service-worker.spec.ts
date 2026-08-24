/**
 * Regression coverage for docs/09-DECISIONS.md ADR-018: a service-worker
 * caching bug meant a returning visitor's browser kept serving a build from
 * days earlier, even though every deploy since then had succeeded — nothing
 * else in this suite could have caught it, because Playwright gives every
 * test a fresh browser context by default, so every test elsewhere in
 * tests/smoke is architecturally a first visit. A service worker never
 * persists between them.
 *
 * This test is deliberately deep on one thing, unlike pages.spec.ts's
 * "shallow and broad" — hence its own file.
 */
import { expect, test } from "@playwright/test";

test("service worker serves fresh content on a second visit, not a stale cache hit", async ({ page }) => {
  await page.goto("/about");
  await page.evaluate(() => navigator.serviceWorker.ready);

  // Poison the worker's own HTML cache for this exact URL with fake
  // content, directly via the real Cache Storage API from the page's own
  // context — simulating "the cache holds a page from an earlier deploy."
  // This sidesteps relying on Playwright to intercept a request the
  // service worker issues internally, which isn't a reliable signal.
  const marker = `sw-poisoned-cache-check-${Date.now()}`;
  await page.evaluate(async (markerText) => {
    const cacheNames = await caches.keys();
    const htmlCacheName = cacheNames.find((n) => n.startsWith("nma-html-"));
    if (!htmlCacheName) throw new Error("No nma-html- cache found — did the worker not install?");
    const cache = await caches.open(htmlCacheName);
    await cache.put(
      "/about",
      new Response(`<!DOCTYPE html><html><body>${markerText}</body></html>`, {
        headers: { "Content-Type": "text/html" },
      })
    );
  }, marker);

  await page.reload();
  // Network-first means the worker always prefers a live network response
  // over whatever's cached — the poisoned entry above must never surface.
  // If this ever regresses to cache-first, the reload would show the
  // poisoned marker instead of the real page.
  await expect(page.getByText(marker)).toHaveCount(0);
  await expect(page.getByRole("banner")).toBeVisible();
});
