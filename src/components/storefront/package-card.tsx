import Link from "next/link";

import { ArrowUpRight, Check } from "@/components/ui/icons";
import { formatPrice, type GiftPackage } from "@/lib/content";

export function PackageCard({ giftPackage, featured = false, index = 0 }: { giftPackage: GiftPackage; featured?: boolean; index?: number }) {
  const query = new URLSearchParams({ package: giftPackage.id });
  const number = String(index + 1).padStart(2, "0");

  return (
    <article className={`package-card${featured ? " package-card--featured" : ""}`}>
      <div className="package-card__topline">
        <span>{featured ? "Featured package" : "Gift package"}</span><span>{number}</span>
      </div>
      <h3>{giftPackage.name}</h3>
      <p className="package-card__price">From {formatPrice(giftPackage.price)}</p>
      <p className="package-card__description">{giftPackage.description}</p>
      <ul>
        {giftPackage.includes.map((item, index) => <li key={index}><Check /><span>{item}</span></li>)}
      </ul>
      <Link className="button button--ghost button--full" href={`/customize?${query.toString()}`}>
        Choose this package <ArrowUpRight />
      </Link>
    </article>
  );
}
