import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalog = JSON.parse(await readFile(new URL("../../content/catalog.json", import.meta.url), "utf8"));

const expectedProductPrices = {
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
  signature: 5000,
};

test("the migrated catalogue contains every original product at the approved price", () => {
  assert.equal(catalog.products.length, 14);
  assert.deepEqual(
    Object.fromEntries(catalog.products.map(({ id, price }) => [id, price])),
    expectedProductPrices,
  );
});

test("gift package prices match the original catalogue", () => {
  assert.equal(catalog.packages.length, 3);
  assert.deepEqual(
    Object.fromEntries(catalog.packages.map(({ id, price }) => [id, price])),
    expectedPackagePrices,
  );
});

test("catalogue content is complete and uploaded image paths are safe", () => {
  const ids = catalog.products.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  for (const product of catalog.products) {
    assert.ok(product.name.trim());
    assert.ok(product.category.trim());
    assert.ok(product.description.trim());
    assert.ok(Number.isSafeInteger(product.price) && product.price >= 0);
    assert.match(product.image, /^(|\/uploads\/products\/[a-z0-9][a-z0-9-]*\.(?:webp|png|jpe?g))$/);
  }
});
