"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowRight } from "@/components/ui/icons";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      router.replace("/admin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      {error ? <div className="admin-alert admin-alert--error" role="alert">{error}</div> : null}
      <label className="field"><span>Email address</span><input autoCapitalize="none" autoComplete="username" disabled={submitting} name="email" required type="email" /></label>
      <label className="field"><span>Password</span><input id="admin-password" autoComplete="current-password" disabled={submitting} name="password" required type={showPassword ? "text" : "password"} /></label>
      <button className="admin-password-toggle" aria-controls="admin-password" aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? "Hide password" : "Show password"}</button>
      <button className="button button--large button--full" disabled={submitting} type="submit">
        {submitting ? "Signing in…" : <>Enter studio <ArrowRight /></>}
      </button>
      <p className="form-fineprint">Your password is verified on the server and is never stored in the browser.</p>
    </form>
  );
}
