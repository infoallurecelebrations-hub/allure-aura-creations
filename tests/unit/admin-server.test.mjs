import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const revision = "a".repeat(40);
const content = Object.fromEntries(["catalog", "journal", "reviews", "site"].map((name) => [name, JSON.parse(readFileSync(new URL(`../../content/${name}.json`, import.meta.url)))]));

function loadServer(name, fetch = () => { throw new Error("Unexpected network access"); }) {
  const file = new URL(`../../src/lib/server/${name}.ts`, import.meta.url);
  const require = createRequire(file);
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Buffer, URL, process: { env: {} }, fetch, require: (id) => {
    if (id === "server-only") return {};
    if (id === "./env") return { getAdminEnvironment: () => ({ githubOwner: "test", githubRepository: "test", githubBranch: "main", githubToken: "test" }) };
    return require(id);
  } });
  return exports;
}

const plain = (value) => JSON.parse(JSON.stringify(value));
test("admin images read the published revision and reject access outside the upload directory", async () => {
  let calls = 0;
  const server = loadServer("github-content", async (url) => {
    calls++;
    assert.ok(url.endsWith(`/contents/public/uploads/products/test.webp?ref=${revision}`));
    return Response.json({ encoding: "base64", content: Buffer.from("image bytes").toString("base64") });
  });
  await assert.rejects(server.readProductImage("/../../content/site.json", revision), /Invalid image/);
  await assert.rejects(server.readProductImage("/uploads/products/test.webp", "main"), /Invalid image/);
  assert.equal(calls, 0);
  assert.equal((await server.readProductImage("/uploads/products/test.webp", revision)).contentType, "image/webp");
  assert.equal(calls, 1);
});
test("content reads use one pinned revision", async () => {
  const calls = [];
  const server = loadServer("github-content", async (url) => {
    calls.push(url);
    if (url.includes("/git/ref/")) return Response.json({ object: { sha: revision } });
    assert.equal(new URL(url).searchParams.get("ref"), revision);
    const name = new URL(url).pathname.split("/").at(-1).replace(".json", "");
    return Response.json({ encoding: "base64", content: Buffer.from(JSON.stringify(content[name])).toString("base64") });
  });
  assert.equal((await server.readAdminContent()).baseSha, revision);
  assert.equal(calls.length, 5);
});

test("publish commits JSON and image deletions then fast-forwards the correct GitHub endpoint", async () => {
  const calls = [];
  const server = loadServer("github-content", async (url, init) => {
    const body = init.body ? JSON.parse(init.body) : null;
    calls.push({ url, method: init.method || "GET", body });
    if (url.includes("/git/ref/")) return Response.json({ object: { sha: revision } });
    if (url.endsWith(`/git/commits/${revision}`)) return Response.json({ tree: { sha: "tree" } });
    if (url.includes("?recursive=1")) return Response.json({ truncated: false, tree: [{ path: "public/uploads/products/old.webp", type: "blob" }] });
    return Response.json({ sha: "b".repeat(40), html_url: "https://example.com/commit" });
  });
  await server.publishAdminContent(revision, content, [], ["public/uploads/products/old.webp"]);
  const update = calls.at(-1);
  assert.equal(update.method, "PATCH");
  assert.ok(update.url.endsWith("/git/refs/heads/main"));
  assert.equal(update.body.force, false);
  const tree = calls.find((call) => call.url.endsWith("/git/trees"));
  assert.deepEqual(tree.body.tree.at(-1), { path: "public/uploads/products/old.webp", mode: "100644", type: "blob", sha: null });
});

test("stale editors cannot create any blobs or commits", async () => {
  const calls = [];
  const server = loadServer("github-content", async (url, init) => {
    calls.push(init.method || "GET");
    return Response.json({ object: { sha: "b".repeat(40) } });
  });
  await assert.rejects(server.publishAdminContent(revision, content, [], []), /repository changed/);
  assert.deepEqual(calls, ["GET"]);
});

test("invalid prices, image bytes, unsafe paths and referenced deletions are rejected", () => {
  const { validatePublishRequest } = loadServer("admin-validation");
  const payload = { baseSha: revision, content: structuredClone(content), images: [], deletions: [] };
  assert.equal(plain(validatePublishRequest(payload)).content.catalog.products.length, 14);
  payload.content.catalog.products[0].price = -1;
  assert.throws(() => validatePublishRequest(payload), /price/);
  payload.content.catalog.products[0].price = 1100;
  payload.images = [{ path: "public/uploads/products/test.webp", contentBase64: Buffer.from("not an image").toString("base64") }];
  assert.throws(() => validatePublishRequest(payload), /WebP/);
  payload.images = [];
  payload.deletions = ["content/catalog.json"];
  assert.throws(() => validatePublishRequest(payload), /path/);
  payload.deletions = ["public/uploads/products/test.webp"];
  payload.content.catalog.products[0].image = "/uploads/products/test.webp";
  assert.throws(() => validatePublishRequest(payload), /still references/);
});
