import catalogData from "../../content/catalog.json";
import journalData from "../../content/journal.json";
import reviewsData from "../../content/reviews.json";
import siteData from "../../content/site.json";

export type Product = (typeof catalogData.products)[number];
export type GiftPackage = (typeof catalogData.packages)[number];
export type JournalPost = (typeof journalData.posts)[number];
export type Review = {
  id: string;
  name: string;
  text: string;
  stars: number;
};

export const catalog = catalogData;
export const journal = journalData;
export const reviews = reviewsData as { schemaVersion: number; reviews: Review[] };
export const site = siteData;

export function productImages(product: Product) {
  return product.images.filter(Boolean);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: site.business.currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function whatsappUrl(message: string) {
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
