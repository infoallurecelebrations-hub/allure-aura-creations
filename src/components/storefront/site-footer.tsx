import Image from "next/image";
import Link from "next/link";

import { ArrowUpRight } from "@/components/ui/icons";
import { storefrontNavigation } from "@/lib/config/navigation";
import { site } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-intro">
          <p className="eyebrow">Made to mean more</p>
          <h2>Your idea, finished with <em>intention.</em></h2>
          <Link className="button" href="/customize">Create something personal <ArrowUpRight /></Link>
        </div>

        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand" href="/">
              <span className="brand__mark"><Image alt="" height={52} src="/brand/logo.png" width={52} /></span>
              <span className="brand__text"><strong>Allure Aura</strong><small>Creations</small></span>
            </Link>
            <p>Personalized pieces and thoughtful gift packages, created to celebrate the people and moments that matter.</p>
          </div>

          <div>
            <p className="footer-title">Explore</p>
            <div className="footer-links">
              {storefrontNavigation.slice(0, 5).map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
            </div>
          </div>

          <div>
            <p className="footer-title">Studio</p>
            <div className="footer-links">
              <Link href="/reviews">Reviews</Link>
              <Link href="/contact">Contact</Link>
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              <span>{site.contact.phone}</span>
            </div>
          </div>

          <div>
            <p className="footer-title">Follow along</p>
            <div className="footer-links">
              {site.socialLinks.map((item) => (
                <a href={item.url} key={item.name} rel="noreferrer" target="_blank">{item.name} <ArrowUpRight /></a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Allure Aura Creations</span>
          <span>Thoughtfully customized. Beautifully yours.</span>
        </div>
      </div>
    </footer>
  );
}
