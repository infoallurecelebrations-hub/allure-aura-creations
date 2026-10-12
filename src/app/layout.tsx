import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { site } from "@/lib/content";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://allure-aura-creations.vercel.app"),
  title: {
    default: "Allure Aura Creations",
    template: "%s | Allure Aura Creations",
  },
  description:
    "Personalized gifts, drinkware, accessories and bespoke creations in Nairobi, Kenya.",
  openGraph: {
    title: "Allure Aura Creations",
    description: "Thoughtfully personalized gifts and gift packages, made in Nairobi.",
    locale: "en_KE",
    type: "website",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0f0e0c",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.business.name,
    description: "Luxury gifting and personalization studio in Nairobi, Kenya.",
    email: site.contact.email,
    areaServed: "Nairobi, Kenya",
    url: "https://allure-aura-creations.vercel.app",
  };

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} type="application/ld+json" />
      </body>
    </html>
  );
}
