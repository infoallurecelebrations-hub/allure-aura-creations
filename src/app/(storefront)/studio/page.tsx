import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/storefront/page-hero";
import { ArrowUpRight } from "@/components/ui/icons";
import { ProductGrid } from "@/features/catalog/product-grid";
import { catalog } from "@/lib/content";

export const metadata: Metadata = { title: "Studio Collection", description: "Explore customizable drinkware, mugs and accessories from Allure Aura Creations." };

export default function StudioPage() {
  return (
    <>
      <PageHero
        aside={<div className="hero-stat"><strong>{catalog.products.length}</strong><span>pieces across<br />{catalog.categories.length} categories</span></div>}
        description="Choose a piece to begin, then tell us the colours, words and details that will make it yours. Prices are in Kenyan shillings."
        eyebrow="The collection"
        title={<>Welcome to the <em>studio.</em></>}
      />
      <section className="section">
        <div className="container">
          <ProductGrid categories={catalog.categories} products={catalog.products} />
          <div className="wide-note"><div><p className="eyebrow">Something else in mind?</p><h2>Bring your own idea—or your own item.</h2></div><Link className="button button--ghost" href="/customize?item=Bring+Your+Own+Item">Tell us about it <ArrowUpRight /></Link></div>
        </div>
      </section>
    </>
  );
}
