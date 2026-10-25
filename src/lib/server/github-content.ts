import "server-only";

import type { AdminContent, PendingImage } from "@/features/admin/types";
import localCatalog from "../../../content/catalog.json";
import localJournal from "../../../content/journal.json";
import localReviews from "../../../content/reviews.json";
import localSite from "../../../content/site.json";

import { getAdminEnvironment } from "./env";

const CONTENT_FILES = {
  catalog: "content/catalog.json",
  journal: "content/journal.json",
  reviews: "content/reviews.json",
  site: "content/site.json",
} as const;

export class GithubContentError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

async function github<T>(path: string, init?: RequestInit): Promise<T> {
  const environment = getAdminEnvironment();
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${environment.githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "allure-aura-admin",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const details = await response.json().catch(() => null) as { message?: string } | null;
    throw new GithubContentError(details?.message || "GitHub request failed.", response.status);
  }
  return response.json() as Promise<T>;
}

function repositoryPath(path: string) {
  const { githubOwner, githubRepository } = getAdminEnvironment();
  return `/repos/${encodeURIComponent(githubOwner)}/${encodeURIComponent(githubRepository)}${path}`;
}

async function getJsonFile<T>(path: string, revision: string): Promise<T> {
  const file = await github<{ content: string; encoding: string }>(
    repositoryPath(`/contents/${path}?ref=${encodeURIComponent(revision)}`),
  );
  if (file.encoding !== "base64") throw new GithubContentError(`Unexpected encoding for ${path}.`);
  return JSON.parse(Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8")) as T;
}

export async function readAdminContent() {
  const { githubBranch } = getAdminEnvironment();
  if (process.env.ADMIN_USE_LOCAL_CONTENT === "true") {
    const reference = await github<{ object: { sha: string } }>(repositoryPath(`/git/ref/heads/${encodeURIComponent(githubBranch)}`));
    return {
      baseSha: reference.object.sha,
      content: {
        catalog: localCatalog,
        journal: localJournal,
        reviews: localReviews,
        site: localSite,
      } as AdminContent,
    };
  }

  const reference = await github<{ object: { sha: string } }>(repositoryPath(`/git/ref/heads/${encodeURIComponent(githubBranch)}`));
  const revision = reference.object.sha;
  const [catalog, journal, reviews, site] = await Promise.all([
    getJsonFile<AdminContent["catalog"]>(CONTENT_FILES.catalog, revision),
    getJsonFile<AdminContent["journal"]>(CONTENT_FILES.journal, revision),
    getJsonFile<AdminContent["reviews"]>(CONTENT_FILES.reviews, revision),
    getJsonFile<AdminContent["site"]>(CONTENT_FILES.site, revision),
  ]);
  return { baseSha: reference.object.sha, content: { catalog, journal, reviews, site } satisfies AdminContent };
}

async function createBlob(content: string, encoding: "utf-8" | "base64") {
  const blob = await github<{ sha: string }>(repositoryPath("/git/blobs"), {
    method: "POST",
    body: JSON.stringify({ content, encoding }),
  });
  return blob.sha;
}

export async function readProductImage(path: string, revision: string) {
  if (!/^\/uploads\/products\/[a-z0-9][a-z0-9-]*\.(webp|png|jpe?g)$/.test(path) || !/^[a-f0-9]{40}$/.test(revision)) {
    throw new GithubContentError("Invalid image request.", 400);
  }
  const file = await github<{ content: string; encoding: string }>(
    repositoryPath(`/contents/public${path}?ref=${revision}`),
  );
  if (file.encoding !== "base64") throw new GithubContentError("Image could not be read.", 502);
  const bytes = Buffer.from(file.content.replace(/\n/g, ""), "base64");
  if (bytes.byteLength > 650_000) throw new GithubContentError("Image exceeds the supported size.", 413);
  return { bytes, contentType: path.endsWith(".webp") ? "image/webp" : path.endsWith(".png") ? "image/png" : "image/jpeg" };
}

export async function publishAdminContent(baseSha: string, content: AdminContent, images: PendingImage[], deletions: string[]) {
  const { githubBranch } = getAdminEnvironment();
  const referencePath = repositoryPath(`/git/ref/heads/${encodeURIComponent(githubBranch)}`);
  const reference = await github<{ object: { sha: string } }>(referencePath);
  if (reference.object.sha !== baseSha) {
    throw new GithubContentError("The repository changed after this editor was opened. Reload before publishing again.", 409);
  }

  const parent = await github<{ tree: { sha: string } }>(repositoryPath(`/git/commits/${baseSha}`));
  const currentTree = await github<{ tree: { path: string; type: string }[]; truncated: boolean }>(
    repositoryPath(`/git/trees/${parent.tree.sha}?recursive=1`),
  );
  if (currentTree.truncated) throw new GithubContentError("The repository tree is too large to verify safely.", 409);
  const existingFiles = new Set(currentTree.tree.filter((entry) => entry.type === "blob").map((entry) => entry.path));
  const uploadedFiles = new Set(images.map((image) => image.path));
  const missingImage = content.catalog.products
    .flatMap((product) => product.images.map((image) => `public${image}`))
    .find((path) => path && !existingFiles.has(path) && !uploadedFiles.has(path));
  if (missingImage) throw new GithubContentError("A product image is missing. Upload it again before publishing.", 400);
  const effectiveDeletions = deletions.filter((path) => existingFiles.has(path));
  const jsonFiles = [
    [CONTENT_FILES.catalog, content.catalog],
    [CONTENT_FILES.journal, content.journal],
    [CONTENT_FILES.reviews, content.reviews],
    [CONTENT_FILES.site, content.site],
  ] as const;

  const [jsonBlobs, imageBlobs] = await Promise.all([
    Promise.all(jsonFiles.map(async ([path, value]) => ({ path, sha: await createBlob(`${JSON.stringify(value, null, 2)}\n`, "utf-8") }))),
    Promise.all(images.map(async (image) => ({ path: image.path, sha: await createBlob(image.contentBase64, "base64") }))),
  ]);

  const tree = await github<{ sha: string }>(repositoryPath("/git/trees"), {
    method: "POST",
    body: JSON.stringify({
      base_tree: parent.tree.sha,
      tree: [
        ...[...jsonBlobs, ...imageBlobs].map((entry) => ({ path: entry.path, mode: "100644", type: "blob", sha: entry.sha })),
        ...effectiveDeletions.map((path) => ({ path, mode: "100644", type: "blob", sha: null })),
      ],
    }),
  });

  const commit = await github<{ sha: string; html_url: string }>(repositoryPath("/git/commits"), {
    method: "POST",
    body: JSON.stringify({
      message: "Admin: publish storefront content",
      tree: tree.sha,
      parents: [baseSha],
    }),
  });

  await github(repositoryPath(`/git/refs/heads/${encodeURIComponent(githubBranch)}`), {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return { sha: commit.sha, url: commit.html_url };
}
