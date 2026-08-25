/**
 * Additional coverage of a different property than pages.spec.ts: not "does
 * this route render," but "can a signed-in user actually reach it by
 * clicking, starting from the dashboard they land on." pages.spec.ts's own
 * checks navigate straight to each URL, which would pass identically
 * against a portal with no menu at all — this is the test that would catch
 * that class of gap. The URL-navigation tests stay; this is additive, not a
 * replacement.
 */
import { expect, test } from "@playwright/test";
import { signInAs } from "./auth";
import { SMOKE_EVENT_SLUG, SMOKE_NEWS_SLUG } from "./global-setup";

test("member reaches every /portal quick-link route by clicking, starting from /portal", async ({ page }) => {
  // Five full reloads of /portal, each re-running its guard check and
  // profile/next-event subscriptions against the emulator — legitimately
  // slower than the other tests here, not flaky.
  test.setTimeout(60_000);
  await signInAs(page, "member", "/portal");

  const quickLinks: Array<{ label: string; path: string }> = [
    { label: "Your folio card →", path: "/portal/card" },
    { label: "Find a colleague →", path: "/portal/directory" },
    { label: "Your CPD log →", path: "/portal/cpd" },
    { label: "Jobs & locums →", path: "/portal/jobs" },
    { label: "Edit your profile →", path: "/portal/profile" },
  ];

  for (const { label, path } of quickLinks) {
    await page.goto("/portal");
    await page.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL((url) => url.pathname === path);
  }
});

test("member reaches /portal/jobs/new by clicking \"Post a listing\" on /portal/jobs", async ({ page }) => {
  await signInAs(page, "member", "/portal");
  await page.goto("/portal/jobs");
  await page.getByRole("link", { name: "Post a listing" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/portal/jobs/new");
});

test("exec reaches every /admin quick-link route by clicking, starting from /admin", async ({ page }) => {
  await signInAs(page, "exec", "/admin");

  const quickLinks: Array<{ label: string; path: string }> = [
    { label: "Verification queue →", path: "/admin/verification" },
    { label: "Members →", path: "/admin/members" },
    { label: "News →", path: "/admin/news" },
    { label: "Events →", path: "/admin/events" },
    { label: "Broadcast →", path: "/admin/broadcast" },
  ];

  for (const { label, path } of quickLinks) {
    await page.goto("/admin");
    await page.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL((url) => url.pathname === path);
  }
});

test("exec reaches events/news admin nested routes by clicking — new, and row actions on a real seeded item", async ({ page }) => {
  await signInAs(page, "exec", "/admin");

  await page.goto("/admin/events");
  await page.getByRole("link", { name: "New event" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/admin/events/new");

  // Row actions located by href, not by visible position — the emulator's
  // events collection can carry other seeded/leftover rows from other
  // tests, so "click the first Attendance link" isn't reliably this fixture.
  await page.goto("/admin/events");
  await page.locator(`a[href="/admin/events/${SMOKE_EVENT_SLUG}/attendance"]`).click();
  await expect(page).toHaveURL((url) => url.pathname === `/admin/events/${SMOKE_EVENT_SLUG}/attendance`);

  await page.goto("/admin/events");
  await page.locator(`a[href="/admin/events/${SMOKE_EVENT_SLUG}/edit"]`).click();
  await expect(page).toHaveURL((url) => url.pathname === `/admin/events/${SMOKE_EVENT_SLUG}/edit`);

  await page.goto("/admin/news");
  await page.getByRole("link", { name: "New communiqué" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/admin/news/new");

  await page.goto("/admin/news");
  await page.locator(`a[href="/admin/news/${SMOKE_NEWS_SLUG}/edit"]`).click();
  await expect(page).toHaveURL((url) => url.pathname === `/admin/news/${SMOKE_NEWS_SLUG}/edit`);
});
