"use client";

import type { FormEvent } from "react";

import { ArrowUpRight } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/content";

export function ContactForm() {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      "Hello Allure Aura Creations! I have an enquiry.",
      "",
      `Name: ${data.get("name")}`,
      `Phone: ${data.get("phone")}`,
      `About: ${data.get("type")}`,
      `Message: ${data.get("message")}`,
    ].join("\n");
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <p className="eyebrow">Send an enquiry</p>
      <h2>Tell us what you’re imagining.</h2>
      <div className="field-grid">
        <label className="field"><span>Your name *</span><input name="name" autoComplete="name" required /></label>
        <label className="field"><span>Phone number *</span><input name="phone" autoComplete="tel" inputMode="tel" required /></label>
      </div>
      <label className="field"><span>What is this about?</span><select name="type"><option>Product order</option><option>Custom package</option><option>Urgent order / availability</option><option>Collaboration</option><option>Feedback</option><option>Other enquiry</option></select></label>
      <label className="field"><span>Message *</span><textarea name="message" placeholder="How can we help?" required rows={6} /></label>
      <button className="button button--large" type="submit">Send via WhatsApp <ArrowUpRight /></button>
      <p className="form-fineprint">Your message opens in WhatsApp for you to review before sending.</p>
    </form>
  );
}
