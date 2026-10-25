import { ArrowUpRight } from "@/components/ui/icons";
import { formatPrice, type Product } from "@/lib/content";
import Link from "next/link";

import { ProductGallery } from "./product-gallery";

export function ProductCard({ product }: { product: Product }) {
  const query = new URLSearchParams({ product: product.id });

  return (
    <article className="product-card">
      <div className="product-card__visual">
        <ProductGallery product={product} />
        <span className="product-card__category">{product.category}</span>
      </div>
      <div className="product-card__body">
        <div className="product-card__title-row">
          <h3>{product.name}</h3>
          <p className="price">From {formatPrice(product.price)}</p>
        </div>
        <p>{product.description}</p>
        <Link className="text-link" href={`/customize?${query.toString()}`}>
          Customize this <ArrowUpRight />
        </Link>
      </div>
    </article>
  );
}
