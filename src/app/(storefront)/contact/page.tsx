import type { Metadata } from "next";

import { PageHero } from "@/components/storefront/page-hero";
import { ArrowUpRight, Mail, MessageCircle, Phone } from "@/components/ui/icons";
import { ContactForm } from "@/features/catalog/contact-form";
import { site } from "@/lib/content";

export const metadata: Metadata = { title: "Contact the Studio", description: "Contact Allure Aura Creations about custom orders, gift packages, collaborations and timelines." };

export default function ContactPage() {
  return (
    <>
      <PageHero description="For orders, collaborations, faster timelines or questions about available colours, reach us directly." eyebrow="Let’s create something personal" title={<>Contact the <em>studio.</em></>} />
      <section className="section"><div className="container contact-grid">
        <div className="contact-copy"><p className="eyebrow">We’re happy to help</p><h2>Start with an idea. We’ll help with <em>the rest.</em></h2><p>Tell us what you’re imagining and we’ll guide you through availability, customization and packaging options.</p>
          <div className="contact-methods">
            <a href={`https://wa.me/${site.contact.whatsapp}`} rel="noreferrer" target="_blank"><MessageCircle /><span><small>WhatsApp</small><strong>{site.contact.phone}</strong></span><ArrowUpRight /></a>
            <a href={`mailto:${site.contact.email}`}><Mail /><span><small>Email</small><strong>{site.contact.email}</strong></span><ArrowUpRight /></a>
            <div><Phone /><span><small>Order timing</small><strong>{site.leadNotice}</strong></span></div>
          </div>
          <div className="social-row">{site.socialLinks.map((item) => <a href={item.url} key={item.name} rel="noreferrer" target="_blank">{item.name} <ArrowUpRight /></a>)}</div>
        </div>
        <ContactForm />
      </div></section>
    </>
  );
}
