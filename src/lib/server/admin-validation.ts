import "server-only";

import type { AdminContent, PendingImage, PublishRequest } from "@/features/admin/types";

export class ValidationError extends Error {}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, maxLength = 500, required = true) {
  if (typeof value !== "string") throw new ValidationError(`${label} must be text.`);
  const clean = value.trim();
  if (required && !clean) throw new ValidationError(`${label} is required.`);
  if (clean.length > maxLength) throw new ValidationError(`${label} is too long.`);
  return clean;
}

function identifier(value: unknown, label: string) {
  const clean = text(value, label, 80);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(clean)) throw new ValidationError(`${label} may use lowercase letters, numbers and hyphens only.`);
  return clean;
}

function price(value: unknown, label: string) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 10_000_000) throw new ValidationError(`${label} must be a valid whole-number price.`);
  return value;
}

function list(value: unknown, label: string, maximum: number) {
  if (!Array.isArray(value)) throw new ValidationError(`${label} must be a list.`);
  if (value.length > maximum) throw new ValidationError(`${label} has too many entries.`);
  return value;
}

function uniqueIds(items: { id: string }[], label: string) {
  if (new Set(items.map((item) => item.id)).size !== items.length) throw new ValidationError(`${label} contains duplicate IDs.`);
}

function validateContent(value: unknown): AdminContent {
  const root = object(value, "Content");
  const catalog = object(root.catalog, "Catalog");
  const journal = object(root.journal, "Journal");
  const reviewRoot = object(root.reviews, "Reviews");
  const site = object(root.site, "Site settings");
  const business = object(site.business, "Business settings");
  const contact = object(site.contact, "Contact settings");

  const categories = list(catalog.categories, "Categories", 30).map((item, index) => text(item, `Category ${index + 1}`, 80));
  const products = list(catalog.products, "Products", 200).map((item, index) => {
    const product = object(item, `Product ${index + 1}`);
    const image = text(product.image ?? "", `Product ${index + 1} image`, 240, false);
    if (image && !/^\/uploads\/products\/[a-z0-9][a-z0-9-]*\.(webp|png|jpe?g)$/.test(image)) {
      throw new ValidationError(`Product ${index + 1} has an invalid image path.`);
    }
    return {
      id: identifier(product.id, `Product ${index + 1} ID`),
      name: text(product.name, `Product ${index + 1} name`, 120),
      category: text(product.category, `Product ${index + 1} category`, 80),
      price: price(product.price, `Product ${index + 1} price`),
      description: text(product.description, `Product ${index + 1} description`, 500),
      featured: Boolean(product.featured),
      image,
    };
  });
  uniqueIds(products, "Products");

  const packages = list(catalog.packages, "Packages", 50).map((item, index) => {
    const giftPackage = object(item, `Package ${index + 1}`);
    return {
      id: identifier(giftPackage.id, `Package ${index + 1} ID`),
      name: text(giftPackage.name, `Package ${index + 1} name`, 120),
      price: price(giftPackage.price, `Package ${index + 1} price`),
      description: text(giftPackage.description, `Package ${index + 1} description`, 500),
      includes: list(giftPackage.includes, `Package ${index + 1} includes`, 30).map((entry, entryIndex) => text(entry, `Package ${index + 1} item ${entryIndex + 1}`, 150)),
    };
  });
  uniqueIds(packages, "Packages");

  const posts = list(journal.posts, "Journal posts", 100).map((item, index) => {
    const post = object(item, `Journal post ${index + 1}`);
    return {
      id: identifier(post.id, `Journal post ${index + 1} ID`),
      eyebrow: text(post.eyebrow, `Journal post ${index + 1} label`, 80),
      title: text(post.title, `Journal post ${index + 1} title`, 180),
      excerpt: text(post.excerpt, `Journal post ${index + 1} excerpt`, 1200),
    };
  });
  uniqueIds(posts, "Journal posts");

  const reviews = list(reviewRoot.reviews, "Reviews", 200).map((item, index) => {
    const review = object(item, `Review ${index + 1}`);
    const stars = Number(review.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new ValidationError(`Review ${index + 1} stars must be between 1 and 5.`);
    return {
      id: identifier(review.id, `Review ${index + 1} ID`),
      name: text(review.name, `Review ${index + 1} name`, 120),
      text: text(review.text, `Review ${index + 1} text`, 1500),
      stars,
    };
  });
  uniqueIds(reviews, "Reviews");

  const socialLinks = list(site.socialLinks, "Social links", 12).map((item, index) => {
    const link = object(item, `Social link ${index + 1}`);
    const url = text(link.url, `Social link ${index + 1} URL`, 400);
    try {
      if (new URL(url).protocol !== "https:") throw new Error();
    } catch {
      throw new ValidationError(`Social link ${index + 1} must be a valid HTTPS URL.`);
    }
    return {
      name: text(link.name, `Social link ${index + 1} name`, 60),
      label: text(link.label, `Social link ${index + 1} label`, 120),
      url,
    };
  });

  const whatsapp = text(contact.whatsapp, "WhatsApp number", 20).replace(/[\s+()-]/g, "");
  if (!/^\d{8,15}$/.test(whatsapp)) throw new ValidationError("WhatsApp number must contain 8 to 15 digits.");

  const content: AdminContent = {
    catalog: { schemaVersion: 1, categories, products, packages },
    journal: { schemaVersion: 1, posts },
    reviews: { schemaVersion: 1, reviews },
    site: {
      schemaVersion: 1,
      business: {
        name: text(business.name, "Business name", 120),
        currency: text(business.currency, "Currency", 8).toUpperCase(),
        locale: text(business.locale, "Locale", 20),
      },
      contact: {
        email: text(contact.email, "Contact email", 200).toLowerCase(),
        phone: text(contact.phone, "Display phone", 80),
        whatsapp,
      },
      leadNotice: text(site.leadNotice, "Lead-time notice", 300),
      socialLinks,
    },
  };

  if (!/^\S+@\S+\.\S+$/.test(content.site.contact.email)) throw new ValidationError("Contact email is invalid.");
  if (JSON.stringify(content).length > 1_000_000) throw new ValidationError("Content is too large.");
  return content;
}

function validateImages(value: unknown): PendingImage[] {
  const images = list(value, "Images", 4).map((item, index) => {
    const image = object(item, `Image ${index + 1}`);
    const path = text(image.path, `Image ${index + 1} path`, 200);
    const contentBase64 = text(image.contentBase64, `Image ${index + 1} data`, 1_400_000);
    if (!/^public\/uploads\/products\/[a-z0-9][a-z0-9-]*\.webp$/.test(path)) throw new ValidationError(`Image ${index + 1} path is invalid.`);
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(contentBase64)) throw new ValidationError(`Image ${index + 1} data is invalid.`);
    const imageBuffer = Buffer.from(contentBase64, "base64");
    if (imageBuffer.byteLength > 650_000) throw new ValidationError(`Image ${index + 1} is larger than 650 KB.`);
    if (imageBuffer.byteLength < 12 || imageBuffer.toString("ascii", 0, 4) !== "RIFF" || imageBuffer.toString("ascii", 8, 12) !== "WEBP") {
      throw new ValidationError(`Image ${index + 1} is not a valid WebP image.`);
    }
    return { path, contentBase64 };
  });
  if (new Set(images.map((image) => image.path)).size !== images.length) throw new ValidationError("Image uploads contain duplicate paths.");
  return images;
}

function validateDeletions(value: unknown): string[] {
  const paths = list(value, "Image deletions", 50).map((item, index) => {
    const path = text(item, `Image deletion ${index + 1}`, 200);
    if (!/^public\/uploads\/products\/[a-z0-9][a-z0-9-]*\.(webp|png|jpe?g)$/.test(path)) {
      throw new ValidationError(`Image deletion ${index + 1} path is invalid.`);
    }
    return path;
  });
  return [...new Set(paths)];
}

export function validatePublishRequest(value: unknown): PublishRequest {
  const root = object(value, "Publish request");
  const baseSha = text(root.baseSha, "Base revision", 80);
  if (!/^[a-f0-9]{40}$/.test(baseSha)) throw new ValidationError("Base revision is invalid.");
  const content = validateContent(root.content);
  const images = validateImages(root.images ?? []);
  const deletions = validateDeletions(root.deletions ?? []);
  const uploadedPaths = new Set(images.map((image) => image.path));
  if (deletions.some((path) => uploadedPaths.has(path))) {
    throw new ValidationError("An image cannot be uploaded and deleted in the same publish.");
  }
  const referencedImages = new Set(content.catalog.products.flatMap((product) => product.image ? [`public${product.image}`] : []));
  if (deletions.some((path) => referencedImages.has(path))) {
    throw new ValidationError("A product still references an image marked for deletion.");
  }
  return { baseSha, content, images, deletions };
}
