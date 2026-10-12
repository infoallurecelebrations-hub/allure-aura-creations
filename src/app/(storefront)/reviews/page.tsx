import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/storefront/page-hero";
import { ArrowUpRight, Heart } from "@/components/ui/icons";
import { reviews } from "@/lib/content";

export const metadata: Metadata = { title: "Customer Reviews", description: "Genuine customer feedback shared with permission by Allure Aura Creations." };

export default function ReviewsPage() {
  return (
    <>
      <PageHero aside={<div className="page-hero__icon"><Heart /><span>Made memorable,<br />together.</span></div>} description="Every order carries a story. This is where genuine customer feedback will be shared—with permission and with gratitude." eyebrow="Kind words" title={<>Made memorable, <em>together.</em></>} />
      <section className="section"><div className="container">
        {reviews.reviews.length ? <div className="review-grid">{reviews.reviews.map((review) => <article className="review-card" key={review.id}><div className="stars" aria-label={`${review.stars} out of 5 stars`}>{"★".repeat(review.stars)}</div><blockquote>“{review.text}”</blockquote><p>— {review.name}</p></article>)}</div> : <div className="empty-state"><span className="empty-state__mark">“</span><p className="eyebrow">Stories coming soon</p><h2>We’re making room for <em>real words.</em></h2><p>Only genuine, approved customer feedback belongs here. After your order, we’d be delighted to hear about your experience.</p><Link className="button button--ghost" href="/contact">Share your feedback <ArrowUpRight /></Link></div>}
      </div></section>
    </>
  );
}
