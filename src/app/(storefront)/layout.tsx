import type { ReactNode } from "react";

import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { site } from "@/lib/content";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <SiteHeader leadNotice={site.leadNotice} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
