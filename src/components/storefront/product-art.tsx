"use client";

import Image from "next/image";
import { useState } from "react";

import type { Product } from "@/lib/content";

export function ProductArt({ product }: { product: Product }) {
  const [failedPath, setFailedPath] = useState("");
  if (product.image && failedPath !== product.image) {
    return <Image alt={product.name} className="product-art__image" fill onError={() => setFailedPath(product.image)} sizes="(max-width: 580px) 100vw, (max-width: 800px) 50vw, 33vw" src={product.image} />;
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
