import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.STOREFRONT_TEST_URL || "http://localhost:3188";
const server = process.env.STOREFRONT_TEST_URL ? null : spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3188"], { stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
server?.stdout.on("data", (chunk) => { logs += chunk; });
server?.stderr.on("data", (chunk) => { logs += chunk; });
const catalog = JSON.parse(await readFile("content/catalog.json", "utf8"));
const site = JSON.parse(await readFile("content/site.json", "utf8"));
const format = (value) => new Intl.NumberFormat("en-KE", { style: "currency", currency: site.business.currency, maximumFractionDigits: 0 }).format(value);
const routes = ["/", "/studio", "/customize", "/packages", "/rewards", "/journal", "/reviews", "/contact"];
let browser;
try {
  if (server) {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (server.exitCode !== null) throw new Error(logs);
      try { if ((await fetch(base)).ok) break; } catch {}
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  browser = await chromium.launch({ ...(process.env.ADMIN_TEST_CHROME ? { executablePath: process.env.ADMIN_TEST_CHROME } : {}), args: ["--no-sandbox"] });
  const context = await browser.newContext();
  await context.addInitScript(() => { window.open = (url) => { window.__opened = String(url); return null; }; });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  const links = new Set();
  const failedAssets = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", (response) => {
    if (["image", "script", "stylesheet"].includes(response.request().resourceType()) && response.status() >= 400) failedAssets.push(response.url());
  });
  await mkdir("test-results/storefront", { recursive: true });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of routes) {
      const response = await page.goto(`${base}${path}`);
      assert.equal(response.status(), 200, `${path} status`);
      await page.locator("main h1").waitFor();
      if (path === "/customize") await page.locator(".order-form").waitFor();
      assert.equal(await page.locator("main h1").count(), 1, `${path} page heading`);
      assert.ok((await page.title()).length > 10, `${path} title`);
      assert.ok(await page.locator('meta[name="description"]').getAttribute("content"), `${path} description`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} page overflow at ${width}px`);
      const clipped = await page.locator("main input, main textarea, main select, .product-card, .package-card, .contact-methods a").evaluateAll((elements) => elements.filter((element) => { const rect = element.getBoundingClientRect(); return rect.width && (rect.right > innerWidth + 1 || rect.left < -1); }).length);
      assert.equal(clipped, 0, `${path} clipped content at ${width}px`);
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await page.waitForFunction(() => [...document.images].filter((image) => { const rect = image.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight; }).every((image) => image.complete && image.naturalWidth > 0));
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForFunction(() => window.scrollY === 0);
      if ([390, 1440].includes(width)) await page.screenshot({ path: `test-results/storefront/${path.slice(1) || "home"}-${width}.png`, fullPage: true, caret: "initial" });
      if (width === 1440) for (const href of await page.locator('a[href^="/"]').evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")))) links.add(href);
    }
    console.log(`PASS all public routes and layout at ${width}px`);
  }
  for (const href of links) assert.equal((await context.request.get(new URL(href, base).href)).status(), 200, `Broken internal link: ${href}`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.keyboard.press("Tab");
  assert.equal(await page.locator(":focus").textContent(), "Skip to content");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("button", { name: "Open navigation" }).getAttribute("aria-expanded"), "false");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Contact", exact: true }).click();
  await page.waitForURL("**/contact");
  assert.equal(await page.getByRole("button", { name: "Open navigation" }).getAttribute("aria-expanded"), "false");
  console.log("PASS internal links, keyboard skip link and mobile navigation");
  await page.goto(`${base}/studio`);
  for (const category of catalog.categories) {
    await page.getByRole("button", { name: category, exact: true }).click();
    assert.equal(await page.locator(".product-card").count(), catalog.products.filter((product) => product.category === category).length);
  }
  await page.getByRole("button", { name: "All", exact: true }).click();
  assert.equal(await page.locator(".product-card").count(), catalog.products.length);
  for (const [index, product] of catalog.products.entries()) {
    const card = page.locator(".product-card").nth(index);
    assert.ok((await card.textContent()).includes(format(product.price)));
    assert.equal(new URL(await card.getByRole("link").getAttribute("href"), base).searchParams.get("product"), product.id);
  }
  const firstGallery = page.locator(".product-card").first();
  await firstGallery.getByRole("button", { name: new RegExp(`Open ${catalog.products[0].name} image gallery`) }).click();
  await page.getByRole("dialog", { name: `${catalog.products[0].name} image gallery` }).waitFor();
  await page.getByRole("button", { name: "Close image gallery" }).click();
  await page.getByRole("dialog", { name: `${catalog.products[0].name} image gallery` }).waitFor({ state: "hidden" });
  await page.locator(".product-card").first().getByRole("link").click();
  assert.equal(await page.locator('[name="item"]').inputValue(), catalog.products[0].name);
  assert.equal(await page.getByLabel("Displayed starting price", { exact: true }).inputValue(), format(catalog.products[0].price));
  await page.locator('[name="item"]').fill("My own custom idea");
  assert.equal(await page.getByLabel("Displayed starting price", { exact: true }).inputValue(), "Confirmed after review");
  await page.goto(`${base}/customize?product=mug&price=1`);
  assert.equal(await page.getByLabel("Displayed starting price", { exact: true }).inputValue(), format(catalog.products.find((product) => product.id === "mug").price));
  await page.evaluate(() => history.pushState(null, "", "/customize?product=wine&price=999999"));
  await page.waitForFunction(() => document.querySelector('[name="item"]').value === "Wine Glass");
  assert.equal(await page.getByLabel("Displayed starting price", { exact: true }).inputValue(), format(catalog.products.find((product) => product.id === "wine").price));
  await page.goto(`${base}/packages`);
  for (const [index, giftPackage] of catalog.packages.entries()) {
    assert.ok((await page.locator(".package-card").nth(index).textContent()).includes(format(giftPackage.price)));
    assert.equal((await page.locator(".package-card__topline").nth(index).locator("span").last().textContent()), String(index + 1).padStart(2, "0"));
  }
  await page.locator(".package-card").first().getByRole("link").click();
  assert.equal(await page.locator('[name="item"]').inputValue(), `${catalog.packages[0].name} Package`);
  console.log("PASS catalogue filtering, all prices, product/package selection and query-price tampering regression");
  const order = page.locator(".order-form");
  await order.getByRole("button", { name: "Continue to WhatsApp" }).click();
  assert.equal(await page.evaluate(() => window.__opened), undefined);
  await order.locator('[name="itemColour"]').fill("Gold & cream");
  await order.locator('[name="customText"]').fill('Amina & Jay — "Forever"');
  await order.getByLabel("Crystal Clear", { exact: true }).check();
  await order.locator('[name="packaging"]').selectOption("Elegant");
  await order.locator('[name="deliveryMode"]').selectOption("Delivery");
  assert.equal(await order.locator('[name="deliveryLocation"]').getAttribute("required"), "");
  await order.locator('[name="deliveryLocation"]').fill("Nairobi");
  await order.locator('[name="customerName"]').fill("Amina");
  await order.locator('[name="customerPhone"]').fill("not-a-number");
  await order.getByRole("button", { name: "Continue to WhatsApp" }).click();
  assert.equal(await page.evaluate(() => window.__opened), undefined);
  await order.locator('[name="customerPhone"]').fill("+254 712 345 678");
  await order.locator('[name="needDate"]').fill("2020-01-01");
  await order.getByRole("button", { name: "Continue to WhatsApp" }).click();
  assert.equal(await page.evaluate(() => window.__opened), undefined);
  await order.locator('[name="needDate"]').fill("");
  await order.getByRole("button", { name: "Continue to WhatsApp" }).click();
  const requestUrl = new URL(await page.evaluate(() => window.__opened));
  assert.equal(requestUrl.hostname, "wa.me");
  assert.equal(requestUrl.pathname, `/${site.contact.whatsapp}`);
  assert.ok(requestUrl.searchParams.get("text").includes('Amina & Jay — "Forever"'));
  assert.ok(requestUrl.searchParams.get("text").includes("Delivery location: Nairobi"));
  assert.equal(await order.locator(".form-handoff a").getAttribute("href"), requestUrl.href);
  await order.locator('[name="deliveryMode"]').selectOption("Self-pick");
  assert.equal(await order.locator('[name="deliveryLocation"]').count(), 0);
  await page.goto(`${base}/contact`);
  const contact = page.locator(".contact-form");
  await contact.locator('[name="name"]').fill("   ");
  await contact.locator('[name="phone"]').fill("0712345678");
  await contact.locator('[name="message"]').fill("A gift enquiry & a question");
  await contact.getByRole("button", { name: "Send via WhatsApp" }).click();
  assert.equal(await page.evaluate(() => window.__opened), undefined);
  await contact.locator('[name="name"]').fill("Amina");
  await contact.getByRole("button", { name: "Send via WhatsApp" }).click();
  assert.ok(new URL(await page.evaluate(() => window.__opened)).searchParams.get("text").includes("A gift enquiry & a question"));
  assert.equal(await contact.locator(".form-handoff a").count(), 1);
  const adminResponse = await page.goto(`${base}/admin/login`);
  assert.equal(adminResponse.status(), 200);
  const adminColors = await page.locator(".admin-login-page").evaluate((element) => [
    getComputedStyle(element.querySelector(".admin-login-brand")).backgroundColor,
    getComputedStyle(element.querySelector(".admin-login-panel")).backgroundColor,
    getComputedStyle(element.querySelector(".field input")).backgroundColor,
    getComputedStyle(element.querySelector(".field input")).color,
    getComputedStyle(element.querySelector(".field > span")).color,
  ]);
  await page.goto(base);
  assert.equal(await page.evaluate(() => localStorage.getItem("allure-storefront-theme")), null);
  assert.equal(await page.locator(".site-shell").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(15, 14, 12)");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  assert.equal(await page.evaluate(() => localStorage.getItem("allure-storefront-theme")), "light");
  assert.equal(await page.getByRole("button", { name: "Switch to dark mode" }).getAttribute("aria-pressed"), "true");
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of routes) {
      await page.goto(`${base}${path}`);
      assert.equal(await page.evaluate(() => document.documentElement.dataset.storefrontTheme), "light", `${path} persisted light mode`);
      assert.equal(await page.locator(".site-shell").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(248, 244, 236)", `${path} light background`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} light mode overflow at ${width}px`);
      assert.equal(await page.getByRole("button", { name: "Switch to dark mode" }).getAttribute("aria-pressed"), "true");
      if (path === "/customize" || path === "/contact") {
        assert.equal(await page.locator(".field input").first().evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(255, 253, 248)");
      }
      if ([390, 1440].includes(width) && ["/", "/customize", "/packages", "/contact"].includes(path)) {
        await page.screenshot({ path: `test-results/storefront/light-${path.slice(1) || "home"}-${width}.png`, fullPage: true });
      }
    }
    console.log(`PASS light theme public routes at ${width}px`);
  }
  await page.goto(`${base}/admin/login`);
  assert.equal(await page.locator(".theme-toggle").count(), 0);
  assert.deepEqual(await page.locator(".admin-login-page").evaluate((element) => [
    getComputedStyle(element.querySelector(".admin-login-brand")).backgroundColor,
    getComputedStyle(element.querySelector(".admin-login-panel")).backgroundColor,
    getComputedStyle(element.querySelector(".field input")).backgroundColor,
    getComputedStyle(element.querySelector(".field input")).color,
    getComputedStyle(element.querySelector(".field > span")).color,
  ]), adminColors);
  await page.goto(base);
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  assert.equal(await page.locator(".site-shell").evaluate((element) => getComputedStyle(element).backgroundColor), "rgb(15, 14, 12)");
  assert.equal(await page.evaluate(() => localStorage.getItem("allure-storefront-theme")), "dark");
  assert.deepEqual(errors, []);
  assert.deepEqual(failedAssets, []);
  assert.equal((await context.request.get(`${base}/a-page-that-does-not-exist`)).status(), 404);
  console.log("PASS quote/contact validation, date checks, encoded WhatsApp handoff and popup fallback (no messages sent)");
  console.log("PASS no browser runtime/console errors, no failed assets, missing routes return 404");
} catch (error) {
  console.error(error);
  if (logs) console.error(logs.slice(-2000));
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill("SIGTERM");
}
