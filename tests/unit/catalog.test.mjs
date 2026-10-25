import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalog = JSON.parse(await readFile(new URL("../../content/catalog.json", import.meta.url), "utf8"));

const expectedProductPrices = {
  "product-9caba3df-ead5-4a52-9a66-c4c105801503": 3500,
  "product-832873ed-b804-479e-8617-6e004f7f729d": 800,
  mug: 1100,
  ceramic: 800,
  wine: 600,
  stanley: 2700,
  thermo: 1800,
  sports: 1300,
  mirror: 600,
  notebook: 1500,
  phone: 800,
  laptop: 300,
  "mini-fan": 800,
  earpods: 1500,
  headphones: 2500,
  "own-item": 700,
};

const expectedPackagePrices = {
  birthday: 2200,
  celebration: 3000,
  signature: 4000,
};

test("the migrated catalogue contains every original product at the approved price", () => {
  assert.equal(catalog.products.length, Object.keys(expectedProductPrices).length);
  assert.deepEqual(
    Object.fromEntries(catalog.products.map(({ id, price }) => [id, price])),
    expectedProductPrices,
  );
});

test("core gift package prices match the published catalogue", () => {
  const packagePrices = Object.fromEntries(catalog.packages.map(({ id, price }) => [id, price]));
  for (const [id, price] of Object.entries(expectedPackagePrices)) assert.equal(packagePrices[id], price);
});

test("catalogue content is complete and uploaded image paths are safe", () => {
  assert.equal(catalog.schemaVersion, 2);
  const ids = catalog.products.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  for (const product of catalog.products) {
    assert.ok(product.name.trim());
    assert.ok(product.category.trim());
    assert.ok(product.description.trim());
    assert.ok(Number.isSafeInteger(product.price) && product.price >= 0);
    assert.ok(Array.isArray(product.images));
    assert.ok(product.images.length <= 10);
    assert.equal(new Set(product.images).size, product.images.length);
    for (const image of product.images) assert.match(image, /^\/uploads\/products\/[a-z0-9][a-z0-9-]*\.(?:webp|png|jpe?g)$/);
  }
  const packageIds = catalog.packages.map(({ id }) => id);
  assert.equal(new Set(packageIds).size, packageIds.length);
  for (const giftPackage of catalog.packages) {
    assert.ok(giftPackage.name.trim());
    assert.ok(giftPackage.description.trim());
    assert.ok(Number.isSafeInteger(giftPackage.price) && giftPackage.price >= 0);
    assert.ok(giftPackage.includes.length);
  }
});
