import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/features/admin/admin-login-form";
import { getCurrentAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <main className="admin-login-page">
      <section className="admin-login-brand">
        <Link className="brand" href="/">
          <span className="brand__mark"><Image alt="" height={52} priority src="/brand/logo.png" width={52} /></span>
          <span className="brand__text"><strong>Allure Aura</strong><small>Creations</small></span>
        </Link>
        <div>
          <p className="eyebrow">Private studio workspace</p>
          <h1>Keep every detail <em>beautifully in place.</em></h1>
          <p>Manage the collection, packages, stories and public studio information from one protected space.</p>
        </div>
        <p className="admin-login-brand__foot">Authorized access only · Sessions expire after eight hours</p>
      </section>
      <section className="admin-login-panel">
        <div className="admin-login-panel__inner">
          <p className="eyebrow">Administration</p>
          <h2>Welcome back.</h2>
          <p>Sign in with the private studio credentials.</p>
          <AdminLoginForm />
          <Link className="admin-back-link" href="/">← Return to the storefront</Link>
        </div>
      </section>
    </main>
  );
}
