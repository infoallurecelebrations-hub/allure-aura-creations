"use client";

import { useState } from "react";

import { ProductCard } from "@/components/storefront/product-card";
import type { Product } from "@/lib/content";

export function ProductGrid({ categories, products }: { categories: string[]; products: Product[] }) {
  const [selected, setSelected] = useState("All");
  const visible = selected === "All" ? products : products.filter((product) => product.category === selected);

  return (
    <>
      <div className="filters" aria-label="Filter products by category">
        {["All", ...categories].map((category) => (
          <button
            aria-pressed={selected === category}
            className={selected === category ? "filter filter--active" : "filter"}
            key={category}
            onClick={() => setSelected(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>
      <p className="result-count" aria-live="polite">Showing {visible.length} {visible.length === 1 ? "piece" : "pieces"}</p>
      <div className="product-grid">
        {visible.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </>
  );
}
