import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { HeroProduct } from "@/components/storefront/hero-product";
import { PackageCard } from "@/components/storefront/package-card";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeading } from "@/components/storefront/section-heading";
import { ArrowRight, ArrowUpRight, Clock, Gift, Heart, Sparkle } from "@/components/ui/icons";
import { catalog, productImages, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Personalized Gifts in Nairobi",
  description: "Thoughtfully personalized drinkware, accessories and gift packages, made in Nairobi by Allure Aura Creations.",
};

export default function HomePage() {
  const featured = catalog.products.filter((product) => product.featured).slice(0, 8);
  const heroProduct = featured.find((product) => productImages(product).length) ?? catalog.products.find((product) => productImages(product).length);
  const storyProduct = catalog.products.find((product) => product.id === "own-item" && productImages(product).length)
    ?? catalog.products.find((product) => productImages(product).length);

  return (
    <>
      <section className="home-hero">
        <div className="container home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow">Personalized gifts · Nairobi</p>
            <h1>
              <span>Thoughtfully chosen.</span>
              <span><em>Beautifully personalized.</em></span>
              <span>Unmistakable Aura.</span>
            </h1>
            <p className="home-hero__lead">Personalized mugs, tumblers and gift packages, made in Nairobi. Choose a piece, then add the details that make it theirs.</p>
            <div className="home-hero__actions">
              <Link className="button button--large" href="/studio">Find their gift <ArrowUpRight /></Link>
              <Link className="home-hero__enquiry" href="/customize">Have something in mind? <ArrowRight /></Link>
            </div>
            <p className="home-hero__details">Names, words & rhinestone details.</p>
          </div>
          <HeroProduct product={heroProduct} />
        </div>
      </section>

      <section className="promise-bar" aria-label="Our promises">
        <div className="container promise-bar__grid">
          <div><Sparkle /><span><strong>Personal details</strong>Made around your story</span></div>
          <div><Gift /><span><strong>Elegant presentation</strong>Packaging to complete the moment</span></div>
          <div><Clock /><span><strong>Thoughtful timing</strong>{site.leadNotice}</span></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            action={<Link className="text-link" href="/studio">See the full collection <ArrowRight /></Link>}
            eyebrow="A few favourites"
            title={<>Personal pieces, <em>beautifully finished.</em></>}
          />
          <div className="product-grid product-grid--featured">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <section className="section story-section">
        <div className="container story-grid">
          <div className="story-art">
            {storyProduct ? (
              <Image
                alt="A collection of personalized rhinestone gifts by Allure Aura Creations"
                className="story-art__image"
                fill
                sizes="(max-width: 820px) 100vw, 42vw"
                src={productImages(storyProduct)[0]}
              />
            ) : null}
          </div>
          <div className="story-copy">
            <p className="eyebrow">More than a gift</p>
            <h2>A little detail can say <em>so much.</em></h2>
            <p>We take familiar things and make them feel entirely personal—whether it is one meaningful item, a celebration package or a piece you bring to us.</p>
            <ul className="feature-list">
              <li><Sparkle /><span>Names, words and rhinestone details</span></li>
              <li><Heart /><span>Created around the person and the occasion</span></li>
              <li><Gift /><span>Normal and elegant packaging options</span></li>
            </ul>
            <Link className="button" href="/customize">Bring your idea to life <ArrowUpRight /></Link>
          </div>
        </div>
      </section>

      <section className="section packages-preview">
        <div className="container">
          <SectionHeading centered description="Choose a thoughtful starting point, then make every detail your own." eyebrow="Gifts, composed with care" title={<>More to open. More to <em>remember.</em></>} />
          <div className="package-grid">
            {catalog.packages.map((giftPackage, index) => <PackageCard index={index} featured={index === 2} giftPackage={giftPackage} key={giftPackage.id} />)}
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="container">
          <SectionHeading eyebrow="How it comes together" title={<>From your idea to <em>their moment.</em></>} />
          <div className="process-grid">
            <article><span>01</span><h3>Choose</h3><p>Pick a studio item, a gift package or bring an item of your own for consideration.</p></article>
            <article><span>02</span><h3>Personalize</h3><p>Share the name, words, colours, occasion and details that make the piece yours.</p></article>
            <article><span>03</span><h3>Confirm</h3><p>We review availability, final pricing and timing with you directly on WhatsApp.</p></article>
          </div>
        </div>
      </section>
    </>
  );
}
