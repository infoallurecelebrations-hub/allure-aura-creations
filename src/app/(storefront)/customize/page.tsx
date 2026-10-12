import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHero } from "@/components/storefront/page-hero";
import { Clock } from "@/components/ui/icons";
import { CustomizeForm } from "@/features/catalog/customize-form";

export const metadata: Metadata = { title: "Customize Your Gift", description: "Share your personalized gift idea and prepare an order request for Allure Aura Creations on WhatsApp." };

export default function CustomizePage() {
  return (
    <>
      <PageHero
        aside={<div className="page-hero__note"><Clock /><span><strong>Planning ahead?</strong>Allow at least two weeks for standard custom orders.</span></div>}
        description="Take us through the details. We’ll prepare everything neatly for WhatsApp, where our team will confirm availability, timing and final pricing."
        eyebrow="Your idea, your details"
        title={<>Customize your <em>piece.</em></>}
      />
      <section className="section form-page"><div className="container container--form"><Suspense fallback={<div className="form-loading">Preparing the customization form…</div>}><CustomizeForm /></Suspense></div></section>
    </>
  );
}
