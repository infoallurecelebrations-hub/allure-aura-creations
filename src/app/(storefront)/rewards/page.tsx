import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHero } from "@/components/storefront/page-hero";
import { ArrowUpRight, Check, Heart } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Loyalty & Rewards", description: "Learn about loyalty stamps and referral rewards from Allure Aura Creations." };

const rewards = [
  "Your first loyalty stamp is free.",
  "Collect stamps when you place qualifying orders.",
  "Refer four new customers and receive a free gift, subject to current terms.",
  "Confirm current eligibility and redemption details with the studio.",
];

export default function RewardsPage() {
  return (
    <>
      <PageHero aside={<div className="page-hero__icon"><Heart /><span>A little thank-you,<br />made for you.</span></div>} description="Our loyalty and referral rewards celebrate the customers who keep choosing—and sharing—Allure Aura Creations." eyebrow="A little thank-you" title={<>Good things come <em>back around.</em></>} />
      <section className="section"><div className="container rewards-grid">
        <div className="loyalty-card">
          <div className="loyalty-card__head"><div><p className="eyebrow">Allure Aura Creations</p><h2>Loyalty card</h2></div><Image alt="" height={62} src="/brand/emblem.png" width={72} /></div>
          <p>Every order is a reason to say thank you.</p>
          <div className="stamps"><span className="stamp stamp--filled"><Image alt="First stamp" height={52} src="/brand/emblem.png" width={52} /></span><span className="stamp">2</span><span className="stamp">3</span><span className="stamp">4</span><span className="stamp">✦</span></div>
          <small>Ask us about the current stamp and reward terms.</small>
        </div>
        <div className="rewards-copy"><p className="eyebrow">Share the love</p><h2>Rewards for your <em>loyalty.</em></h2><div className="reward-list">{rewards.map((reward) => <div key={reward}><Check /><span>{reward}</span></div>)}</div><p className="legal-note">The card shown is an illustration, not a live digital tracker. Terms, qualifying orders and available gifts are confirmed directly with the studio.</p><Link className="button" href="/contact">Ask about rewards <ArrowUpRight /></Link></div>
      </div></section>
    </>
  );
}
