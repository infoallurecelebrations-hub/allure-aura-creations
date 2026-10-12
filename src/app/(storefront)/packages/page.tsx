import type { Metadata } from "next";
import Link from "next/link";

import { PackageCard } from "@/components/storefront/package-card";
import { PageHero } from "@/components/storefront/page-hero";
import { ArrowUpRight, Gift } from "@/components/ui/icons";
import { catalog } from "@/lib/content";

export const metadata: Metadata = { title: "Gift Packages", description: "Explore personalized gift packages for birthdays, celebrations and meaningful moments." };

export default function PackagesPage() {
  return (
    <>
      <PageHero
        aside={<div className="page-hero__icon"><Gift /><span>Chosen with care.<br />Finished for them.</span></div>}
        description="A collection of personal touches in one thoughtful gift. Choose a package as your starting point, then make it your own."
        eyebrow="A thoughtful combination"
        title={<>Gift <em>packages.</em></>}
      />
      <section className="section"><div className="container"><div className="package-grid">{catalog.packages.map((giftPackage, index) => <PackageCard featured={index === 2} giftPackage={giftPackage} key={giftPackage.id} />)}</div>
        <div className="bespoke-banner"><div><p className="eyebrow">Made your way</p><h2>Build a package entirely <em>of your own.</em></h2><p>Mix and match items, add treats or a personal message, and tell us your occasion and budget.</p></div><Link className="button button--large" href="/customize?item=Custom+Gift+Package">Create your package <ArrowUpRight /></Link></div>
      </div></section>
    </>
  );
}
