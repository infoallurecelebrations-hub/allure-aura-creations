import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PackageCard } from "@/components/storefront/package-card";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeading } from "@/components/storefront/section-heading";
import { ArrowRight, ArrowUpRight, Clock, Gift, Heart, Sparkle } from "@/components/ui/icons";
import { catalog } from "@/lib/content";

export const metadata: Metadata = {
  title: "Personalized Gifts in Nairobi",
  description: "Thoughtfully personalized drinkware, accessories and gift packages, made in Nairobi by Allure Aura Creations.",
};

export default function HomePage() {
  const featured = catalog.products.filter((product) => product.featured).slice(0, 8);

  return (
    <>
      <section className="home-hero">
        <div className="ambient ambient--hero" />
        <div className="container home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow">Luxury gifting & personalization studio · Nairobi</p>
            <h1>Make it yours.<br /><em>Make it unforgettable.</em></h1>
            <p className="home-hero__lead">Everyday favourites, transformed into keepsakes through thoughtful details, a little sparkle and your personal story.</p>
            <div className="button-row">
              <Link className="button button--large" href="/studio">Explore the studio <ArrowUpRight /></Link>
              <Link className="button button--ghost button--large" href="/customize">Create something personal</Link>
            </div>
            <div className="hero-proof">
              <span><Sparkle /> Personalized by hand</span>
              <span><Gift /> Gift-ready options</span>
            </div>
          </div>

          <div className="hero-object" aria-label="Allure Aura Creations emblem">
            <span className="hero-object__orbit hero-object__orbit--outer" />
            <span className="hero-object__orbit hero-object__orbit--inner" />
            <div className="hero-object__emblem">
              <Image alt="Allure Aura Creations emblem" fill priority sizes="(max-width: 800px) 72vw, 38vw" src="/brand/emblem.png" />
            </div>
            <span className="floating-note floating-note--top">Ordinary made extraordinary</span>
            <span className="floating-note floating-note--bottom">Made with intention</span>
          </div>
        </div>
        <div className="hero-scroll"><span>Discover</span><span aria-hidden="true" /></div>
      </section>

      <section className="promise-bar" aria-label="Our promises">
        <div className="container promise-bar__grid">
          <div><Sparkle /><span><strong>Personal details</strong>Made around your story</span></div>
          <div><Gift /><span><strong>Elegant presentation</strong>Packaging to complete the moment</span></div>
          <div><Clock /><span><strong>Thoughtful timing</strong>Allow at least two weeks</span></div>
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
          <div className="story-art" aria-hidden="true">
            <span className="story-art__frame" />
            <span className="story-art__ribbon">Your words here</span>
            <div className="story-art__piece"><span>A</span></div>
            <span className="story-art__caption">One of one</span>
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
            {catalog.packages.map((giftPackage, index) => <PackageCard featured={index === 2} giftPackage={giftPackage} key={giftPackage.id} />)}
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
