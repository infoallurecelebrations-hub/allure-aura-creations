import Link from "next/link";

import { ArrowUpRight, Check } from "@/components/ui/icons";
import { formatPrice, type GiftPackage } from "@/lib/content";

export function PackageCard({ giftPackage, featured = false }: { giftPackage: GiftPackage; featured?: boolean }) {
  const query = new URLSearchParams({ item: `${giftPackage.name} Package`, price: String(giftPackage.price) });
  const number = giftPackage.id === "birthday" ? 1 : giftPackage.id === "celebration" ? 2 : 3;

  return (
    <article className={`package-card${featured ? " package-card--featured" : ""}`}>
      <div className="package-card__topline">
        <span>{featured ? "Most generous" : "Gift package"}</span><span>0{number}</span>
      </div>
      <h3>{giftPackage.name}</h3>
      <p className="package-card__price">From {formatPrice(giftPackage.price)}</p>
      <p className="package-card__description">{giftPackage.description}</p>
      <ul>
        {giftPackage.includes.map((item) => <li key={item}><Check /><span>{item}</span></li>)}
      </ul>
      <Link className="button button--ghost button--full" href={`/customize?${query.toString()}`}>
        Choose this package <ArrowUpRight />
      </Link>
    </article>
  );
}
