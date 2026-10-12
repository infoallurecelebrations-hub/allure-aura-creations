"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Menu, X } from "@/components/ui/icons";
import { storefrontNavigation } from "@/lib/config/navigation";

export function SiteHeader({ leadNotice }: { leadNotice: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="announcement">
        <span>Made personal, unforgettably memorable</span>
        <span className="announcement__divider" aria-hidden="true" />
        <span>{leadNotice}</span>
      </div>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link className="brand" href="/" aria-label="Allure Aura Creations home">
            <span className="brand__mark">
              <Image alt="" height={52} priority src="/brand/logo.png" width={52} />
            </span>
            <span className="brand__text">
              <strong>Allure Aura</strong>
              <small>Creations</small>
            </span>
          </Link>

          <button
            aria-expanded={open}
            aria-label={open ? "Close navigation" : "Open navigation"}
            className="menu-button"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <X /> : <Menu />}
            <span>{open ? "Close" : "Menu"}</span>
          </button>

          <nav className={`site-nav${open ? " site-nav--open" : ""}`} aria-label="Main navigation">
            {storefrontNavigation.map((item) => {
              const active = pathname === item.href;
              return (
                <Link aria-current={active ? "page" : undefined} href={item.href} key={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link className="header-cta" href="/customize">Start an order</Link>
        </div>
      </header>
    </>
  );
}
