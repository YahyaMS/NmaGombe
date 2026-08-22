/**
 * Smoke tests. Deliberately shallow and broad, not deep.
 *
 * Purpose: catch the class of bug that has been reaching production on this project —
 * a page that throws on render, a hydration mismatch, a boundary violation. These are
 * invisible to tsc, eslint and unit tests, and there is no browser in the dev environment.
 *
 * Rule: every new route gets a line here in the same slice that creates it. One assertion
 * is enough. The value is coverage of routes, not depth per route.
 */
import { expect, test } from "@playwright/test";
import { signInAs } from "./auth";

const publicRoutes = [
  "/",
  "/about",
  "/about/executives",
  "/news",
  "/membership",
  "/contact",
  "/privacy",
  "/signin",
  "/signup",
];

// Any console error during load is a failure. Hydration mismatches surface here and
// nowhere else in the toolchain.
test.beforeEach(async ({ page }) => {
  page.on("console", (msg) => {
    if (msg.type() === "error") throw new Error(`Console error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => {
    throw new Error(`Uncaught: ${err.message}`);
  });
});

for (const route of publicRoutes) {
  test(`${route} renders without error`, async ({ page }) => {
    const res = await page.goto(route);
    expect(res?.status()).toBeLessThan(400);
    // header, not "header": a <header> only carries the implicit banner role
    // when it isn't nested inside another landmark (article/aside/main/nav/
    // section) — getByRole fails loudly if that regresses, where a bare tag
    // locator would keep matching whatever <header> it found, landmark or not.
    await expect(page.getByRole("banner")).toBeVisible();
  });
}

test.describe("header reflects real auth state, not just self-consistency", () => {
  // The exact bug that shipped: header rendered signed-out on server-rendered
  // pages. A test that only compares the header's markup before and after
  // navigation passes even if it's wrong on both — signed out on both pages
  // is "consistent." These assert the actual signed-in/signed-out content,
  // established via a real sign-in (tests/smoke/auth.ts), not a stub.

  // Scoped to the banner landmark, not the whole page: the homepage's own hero
  // also carries a "Member sign in" call to action outside the header, so an
  // unscoped locator either matches two elements (strict-mode violation) or,
  // worse, could pass by matching the wrong one.

  test("signed-in member: shows the account pill on home and after navigating", async ({ page }) => {
    await signInAs(page, "member", "/");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "My account" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "Member sign in" })).toHaveCount(0);

    await page.getByRole("link", { name: /about/i }).first().click();
    await page.waitForLoadState("networkidle");

    await expect(banner.getByRole("link", { name: "My account" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "Member sign in" })).toHaveCount(0);
  });

  test("signed-out visitor: shows the sign-in pill on home and after navigating", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: "Member sign in" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "My account" })).toHaveCount(0);

    await page.getByRole("link", { name: /about/i }).first().click();
    await page.waitForLoadState("networkidle");

    await expect(banner.getByRole("link", { name: "Member sign in" })).toBeVisible();
    await expect(banner.getByRole("link", { name: "My account" })).toHaveCount(0);
  });
});

test("gated routes redirect an anonymous visitor", async ({ page }) => {
  for (const route of ["/portal", "/portal/directory", "/admin", "/admin/verification"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/signin/);
  }
});

test.describe("authenticated routes render for the roles allowed to see them", () => {
  // Backfills the gap the boundary rules mostly describe: the server-to-client
  // data boundary, exercised only by routes that pass Firestore documents into
  // client islands — none of which were signed-in before this fixture existed.

  test("verified member: /portal, /portal/card, /portal/directory, /portal/profile", async ({ page }) => {
    await signInAs(page, "member", "/portal");
    for (const route of ["/portal", "/portal/card", "/portal/directory", "/portal/profile"]) {
      const res = await page.goto(route);
      expect(res?.status()).toBeLessThan(400);
      await expect(page).toHaveURL((url) => url.pathname === route);
      await expect(page.getByRole("banner")).toBeVisible();
    }
  });

  test("exec: /admin, /admin/verification", async ({ page }) => {
    await signInAs(page, "exec", "/admin");
    for (const route of ["/admin", "/admin/verification"]) {
      const res = await page.goto(route);
      expect(res?.status()).toBeLessThan(400);
      await expect(page).toHaveURL((url) => url.pathname === route);
      await expect(page.getByRole("banner")).toBeVisible();
    }
  });

  test("a verified member (not exec/admin) is redirected away from /admin", async ({ page }) => {
    await signInAs(page, "member", "/portal");
    await page.goto("/admin");
    await expect(page).toHaveURL((url) => url.pathname === "/portal");
  });
});

test("no route leaks a server-only value into the HTML", async ({ page }) => {
  // Cheap canary against a service account or secret reaching the client bundle.
  for (const route of publicRoutes) {
    await page.goto(route);
    const html = await page.content();
    expect(html).not.toContain("private_key");
    expect(html).not.toContain("BEGIN PRIVATE KEY");
    expect(html).not.toMatch(/sk_(test|live)_/);
  }
});
