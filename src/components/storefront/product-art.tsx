import Image from "next/image";

import type { Product } from "@/lib/content";

export function ProductArt({ product }: { product: Product }) {
  if (product.image) {
    return <Image alt={product.name} className="product-art__image" fill sizes="(max-width: 680px) 100vw, (max-width: 1080px) 50vw, 25vw" src={product.image} />;
  }

  const kind = product.category === "Drinkware"
    ? "drinkware"
    : product.category === "Mugs & Cups"
      ? "mug"
      : product.category === "Bring Your Own"
        ? "custom"
        : "accessory";

  return (
    <div className={`product-art product-art--${kind}`} aria-hidden="true">
      <span className="product-art__halo" />
      <span className="product-art__shape"><span className="product-art__monogram">A</span></span>
      <span className="product-art__spark product-art__spark--one">✦</span>
      <span className="product-art__spark product-art__spark--two">✧</span>
    </div>
  );
}
