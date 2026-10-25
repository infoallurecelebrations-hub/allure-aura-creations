import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";

// A real local Next server and real authentication; publishing is intercepted so
// this suite never writes test products, images or commits to the live repository.
const port = 3187;
const base = `http://localhost:${port}`;
const email = "admin-test@example.com";
const password = randomBytes(24).toString("base64url");
const salt = randomBytes(16);
const hash = `pbkdf2-sha256$210000$${salt.toString("base64url")}$${pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("base64url")}`;
const content = Object.fromEntries(await Promise.all(["catalog", "journal", "reviews", "site"].map(async (key) => [key, JSON.parse(await readFile(`content/${key}.json`, "utf8"))])));
const fixture = { baseSha: "a".repeat(40), content };
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", process.env.ADMIN_TEST_MODE === "production" ? "start" : "dev", "--port", String(port)], {
  env: { ...process.env, ADMIN_EMAIL: email, ADMIN_PASSWORD_HASH: hash, SESSION_SECRET: randomBytes(48).toString("hex"), GITHUB_CONTENT_TOKEN: "test-no-network", ADMIN_USE_LOCAL_CONTENT: "false" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (chunk) => { serverLog += chunk; });
server.stderr.on("data", (chunk) => { serverLog += chunk; });
let browser;
const reports = [];
try {
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server.exitCode !== null) throw new Error(serverLog);
    try { if ((await fetch(`${base}/admin/login`)).ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({ headless: true, ...(process.env.ADMIN_TEST_CHROME ? { executablePath: process.env.ADMIN_TEST_CHROME } : {}), args: ["--no-sandbox"] });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());
  await mkdir("test-results/admin", { recursive: true });
  assert.equal((await context.request.get(`${base}/api/admin/content`)).status(), 401);
  assert.equal((await context.request.get(`${base}/api/admin/image?path=/content/site.json`)).status(), 401);
  assert.equal((await context.request.post(`${base}/api/admin/login`, { headers: { Origin: "https://invalid.example" }, data: { email, password } })).status(), 403);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/admin/login`);
  const buttonBounds = await page.getByRole("button", { name: "Enter studio" }).boundingBox();
  assert.ok(buttonBounds.y + buttonBounds.height < 844, "Mobile sign-in action should be visible without scrolling");
  await page.screenshot({ path: "test-results/admin/login-390.png", fullPage: true, caret: "initial" });
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Enter studio" }).click();
  await page.getByRole("alert").filter({ hasText: "incorrect" }).waitFor();
  await page.getByRole("button", { name: "Show password" }).click();
  assert.equal(await page.getByLabel("Password", { exact: true }).getAttribute("type"), "text");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.route("**/api/admin/content", (route) => route.fulfill({ json: fixture }));
  await page.getByRole("button", { name: "Enter studio" }).click();
  await page.getByRole("heading", { name: "Good to see you." }).waitFor();
  assert.equal((await context.request.get(`${base}/api/admin/image?path=/content/site.json&revision=main`)).status(), 400);
  assert.equal((await context.request.post(`${base}/api/admin/publish`, { data: { baseSha: "invalid" } })).status(), 400);
  reports.push("Authentication: protected API, origin rejection, invalid credentials, sign-in and password visibility");
  const nav = page.getByRole("navigation", { name: "Admin sections" });
  const visit = async (name) => { await nav.getByRole("button", { name: new RegExp(`^${name}`) }).click(); };
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const section of ["Overview", "Products", "Packages", "Journal", "Reviews", "Site settings"]) {
      await visit(section);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${section} overflows at ${width}px`);
      const overflow = await page.locator(".admin-main input:not([type=file]), .admin-main textarea, .admin-main select").evaluateAll((fields) => fields.filter((field) => { const r = field.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }).length);
      assert.equal(overflow, 0, `${section} fields overflow at ${width}px`);
      if ([390, 1440].includes(width)) await page.screenshot({ path: `test-results/admin/${section.replaceAll(" ", "-")}-${width}.png` });
    }
  }
  reports.push("Responsive layout: all six sections at 320, 390, 768, 1024 and 1440 pixels");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await visit("Products");
  await page.getByLabel("Find a product").fill("Headphones");
  assert.equal(await page.locator(".admin-product-editor").count(), 1);
  await page.getByLabel("Price (KSh)", { exact: true }).fill("2600");
  await page.getByRole("button", { name: "Discard changes" }).click();
  assert.equal(await page.getByLabel("Price (KSh)", { exact: true }).inputValue(), "2500");
  await page.getByRole("button", { name: "+ Add product", exact: true }).click();
  const card = page.locator(".admin-product-editor").first();
  await card.getByLabel("Product name", { exact: true }).fill("QA product");
  await card.getByLabel("Price (KSh)", { exact: true }).fill("1900");
  await card.getByLabel("Description").fill("A test product");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Publish changes" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/admin/draft-390.png" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await card.getByLabel("Add photos for QA product").setInputFiles(["public/brand/logo.png", "public/brand/emblem.png"]);
  await card.getByRole("button", { name: "Remove", exact: true }).waitFor();
  await page.waitForFunction(() => !document.querySelector(".admin-workspace-fields").disabled);
  assert.equal(await card.locator(".admin-product-gallery__thumbs button").count(), 2);
  await card.getByRole("button", { name: "Select photo 2 of QA product" }).click();
  await card.getByRole("button", { name: "Make cover" }).click();
  assert.ok(await card.locator("img").first().evaluate((img) => img.complete && img.naturalWidth > 0));
  let received;
  let mode = "conflict";
  let finishPublish;
  await page.route("**/api/admin/publish", async (route) => {
    received = route.request().postDataJSON();
    if (mode === "conflict") return route.fulfill({ status: 409, json: { error: "The repository changed. Reload before publishing again." } });
    if (mode === "expired") return route.fulfill({ status: 401, json: { error: "Authentication required." } });
    await new Promise((resolve) => { finishPublish = resolve; });
    return route.fulfill({ json: { ok: true, sha: "b".repeat(40) } });
  });
  await page.getByRole("button", { name: "Publish changes" }).click();
  await page.getByRole("alert").filter({ hasText: "repository changed" }).waitFor();
  assert.equal(received.content.catalog.products[0].name, "QA product");
  assert.equal(received.images.length, 2);
  assert.ok(received.images[0].path.endsWith(".webp"));
  assert.equal(received.content.catalog.products[0].images.length, 2);
  assert.equal(await card.getByLabel("Price (KSh)", { exact: true }).inputValue(), "1900");
  mode = "expired";
  await page.getByRole("button", { name: "Publish changes" }).click();
  await page.getByRole("alert").filter({ hasText: "session expired" }).waitFor();
  assert.ok(page.url().endsWith("/admin"));
  mode = "success";
  await page.getByRole("button", { name: "Publish changes" }).click();
  await page.waitForFunction(() => document.querySelector(".admin-workspace-fields").disabled);
  assert.equal(await card.getByLabel("Product name", { exact: true }).isDisabled(), true);
  while (!finishPublish) await new Promise((resolve) => setTimeout(resolve, 20));
  finishPublish();
  await page.getByRole("status").filter({ hasText: "Published to GitHub" }).waitFor();
  assert.ok(await card.locator("img").first().evaluate((img) => img.complete && img.naturalWidth > 0));
  await card.getByRole("button", { name: "Remove", exact: true }).click();
  mode = "conflict";
  await page.getByRole("button", { name: "Publish changes" }).click();
  await page.getByRole("alert").filter({ hasText: "repository changed" }).waitFor();
  assert.equal(received.deletions.length, 1);
  await card.getByRole("button", { name: "Delete product" }).click();
  assert.equal(await page.locator(".admin-product-editor").count(), content.catalog.products.length);
  await page.getByRole("button", { name: "Discard changes" }).click();
  reports.push("Products: search, edit, discard, create, multi-photo conversion/order/preview/removal, delete, publish locking, conflict and session-expiry recovery");
  for (const [section, add, remove] of [["Packages", "+ Add package", "Delete package"], ["Journal", "+ Add story", "Delete story"], ["Reviews", "+ Add review", "Delete review"]]) {
    await visit(section);
    const count = await page.locator(".admin-editor-list > article").count();
    await page.getByRole("button", { name: add, exact: true }).click();
    assert.equal(await page.locator(".admin-editor-list > article").count(), count + 1);
    await page.getByRole("button", { name: remove, exact: true }).first().click();
    assert.equal(await page.locator(".admin-editor-list > article").count(), count);
    await page.getByRole("button", { name: "Discard changes" }).click();
  }
  await visit("Site settings");
  const platform = page.getByLabel("Platform", { exact: true }).first();
  await platform.fill("");
  await platform.pressSequentially("Test platform");
  assert.equal(await platform.inputValue(), "Test platform");
  assert.equal(await platform.evaluate((field) => document.activeElement === field), true);
  const links = await page.locator(".admin-social-editor").count();
  await page.getByRole("button", { name: "+ Add link" }).click();
  assert.equal(await page.locator(".admin-social-editor").count(), links + 1);
  await page.getByRole("button", { name: "Delete link" }).last().click();
  assert.equal(await page.locator(".admin-social-editor").count(), links);
  await page.getByRole("button", { name: "Discard changes" }).click();
  reports.push("Packages, journal, reviews and social links: creation/deletion, draft discard, typing focus");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL("**/admin/login");
  assert.equal((await context.request.get(`${base}/api/admin/content`)).status(), 401);
  assert.deepEqual(errors, []);
  reports.push("Sign out invalidates access; no browser runtime errors");
  reports.forEach((report) => console.log(`PASS ${report}`));
} catch (error) {
  console.error(error);
  console.error(serverLog.slice(-4000));
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
