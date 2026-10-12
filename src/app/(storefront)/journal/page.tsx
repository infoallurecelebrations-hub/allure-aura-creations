import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/storefront/page-hero";
import { ArrowUpRight, Sparkle } from "@/components/ui/icons";
import { journal } from "@/lib/content";

export const metadata: Metadata = { title: "Journal", description: "Stories, studio notes and a closer look at the personalization process at Allure Aura Creations." };

export default function JournalPage() {
  return (
    <>
      <PageHero aside={<div className="page-hero__icon"><Sparkle /><span>Stories behind<br />the sparkle.</span></div>} description="Our story, behind-the-scenes details, event highlights and the thought that goes into every personalized piece." eyebrow="Notes from our studio" title={<>The Allure <em>journal.</em></>} />
      <section className="section"><div className="container journal-grid">{journal.posts.map((post, index) => <article className="journal-card" key={post.id}><div className="journal-card__number">0{index + 1}</div><p className="eyebrow">{post.eyebrow}</p><h2>{post.title}</h2><p>{post.excerpt}</p><Link className="text-link" href="/contact">Talk to the studio <ArrowUpRight /></Link></article>)}</div></section>
      <section className="journal-cta"><div className="container"><p className="eyebrow">Have a story or collaboration in mind?</p><h2>Let’s make something worth <em>remembering.</em></h2><Link className="button" href="/contact">Start a conversation <ArrowUpRight /></Link></div></section>
    </>
  );
}
