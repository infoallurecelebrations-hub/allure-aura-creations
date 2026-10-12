"use client";

import { useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ArrowUpRight, MessageCircle } from "@/components/ui/icons";
import { catalog, formatPrice, site, whatsappUrl } from "@/lib/content";
import { clearFieldError, validateRequestForm } from "./form-validation";

const stones = ["Crystal Clear", "AB Crystal", "Gold", "Siam Red", "Citrine", "Other / discuss"];

export function CustomizeForm() {
  const searchParams = useSearchParams();
  const selectedProduct = catalog.products.find((product) => product.id === searchParams.get("product"));
  const selectedPackage = catalog.packages.find((giftPackage) => giftPackage.id === searchParams.get("package"));
  const initialItem = selectedProduct?.name ?? (selectedPackage ? `${selectedPackage.name} Package` : (searchParams.get("item") ?? "").slice(0, 120));
  return <OrderForm key={initialItem} initialItem={initialItem} />;
}

function OrderForm({ initialItem }: { initialItem: string }) {
  const [delivery, setDelivery] = useState("");
  const [item, setItem] = useState(initialItem);
  const [readyUrl, setReadyUrl] = useState("");
  const [today] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const selected = catalog.products.find((product) => product.name === item.trim())
    ?? catalog.packages.find((giftPackage) => `${giftPackage.name} Package` === item.trim());
  const price = selected ? formatPrice(selected.price) : "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateRequestForm(event.currentTarget)) return;
    const data = new FormData(event.currentTarget);
    const selectedStones = data.getAll("stones").join(", ") || "To discuss";
    const lines = [
      "Hello Allure Aura Creations! I’d like to request a customization quote.",
      "",
      `Item / product: ${data.get("item")}`,
      price ? `Displayed starting price: ${price}` : "",
      `Item colour: ${data.get("itemColour")}`,
      `Name / words / design: ${data.get("customText")}`,
      `Rhinestone colour(s): ${selectedStones}`,
      `Packaging: ${data.get("packaging")}`,
      `Delivery: ${data.get("deliveryMode")}`,
      delivery === "Delivery" ? `Delivery location: ${data.get("deliveryLocation")}` : "",
      `Needed by: ${data.get("needDate") || "Not specified"}`,
      `Timeline: ${data.get("timeline")}`,
      `Customer: ${data.get("customerName")}`,
      `Contact: ${data.get("customerPhone")}`,
      data.get("designNotes") ? `Extra details: ${data.get("designNotes")}` : "",
    ].filter(Boolean);

    const url = whatsappUrl(lines.join("\n"));
    setReadyUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form className="order-form" onChange={(event) => { clearFieldError(event); setReadyUrl(""); }} onSubmit={submit}>
      <div className="form-section">
        <div className="form-section__number">01</div>
        <div className="form-section__content">
          <div className="form-section__heading"><h2>Choose the piece</h2><p>Start with an item and how you imagine it.</p></div>
          <div className="field-grid">
            <label className="field"><span>Item / product *</span><input name="item" onChange={(event) => setItem(event.target.value)} placeholder="e.g. Ceramic mug" required value={item} /></label>
            <label className="field"><span>Displayed starting price</span><input aria-label="Displayed starting price" readOnly value={price || "Confirmed after review"} /></label>
          </div>
          <div className="field-grid">
            <label className="field"><span>Colour of item *</span><input name="itemColour" placeholder="e.g. black, cream, pink" required /></label>
            <label className="field"><span>Name, words or design *</span><input name="customText" placeholder="What should we customize?" required /></label>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section__number">02</div>
        <div className="form-section__content">
          <div className="form-section__heading"><h2>Add the details</h2><p>Select one or several rhinestone colours.</p></div>
          <fieldset className="choice-field"><legend>Rhinestone colour(s)</legend><div className="choice-grid">
            {stones.map((stone) => <label className="choice" key={stone}><input name="stones" type="checkbox" value={stone} /><span>{stone}</span></label>)}
          </div></fieldset>
          <div className="field-grid">
            <label className="field"><span>Packaging *</span><select name="packaging" required defaultValue=""><option disabled value="">Choose packaging</option><option>Normal</option><option>Elegant</option></select></label>
            <label className="field"><span>Delivery mode *</span><select name="deliveryMode" onChange={(event) => setDelivery(event.target.value)} required defaultValue=""><option disabled value="">Choose delivery</option><option>Self-pick</option><option>Delivery</option></select></label>
          </div>
          {delivery === "Delivery" ? <label className="field"><span>Delivery location *</span><input name="deliveryLocation" placeholder="Estate, town or landmark" required /></label> : null}
        </div>
      </div>

      <div className="form-section">
        <div className="form-section__number">03</div>
        <div className="form-section__content">
          <div className="form-section__heading"><h2>Tell us when & where</h2><p>We’ll confirm availability and final pricing on WhatsApp.</p></div>
          <div className="field-grid">
            <label className="field"><span>Your name *</span><input name="customerName" autoComplete="name" required /></label>
            <label className="field"><span>Contact number *</span><input name="customerPhone" autoComplete="tel" inputMode="tel" placeholder="07xx xxx xxx" required /></label>
          </div>
          <div className="field-grid">
            <label className="field"><span>When do you need it?</span><input min={today} name="needDate" type="date" /></label>
            <label className="field"><span>Timeline</span><select name="timeline"><option>Standard — at least 2 weeks</option><option>Faster — please check availability</option></select></label>
          </div>
          <label className="field"><span>Extra details or package idea</span><textarea name="designNotes" placeholder="Design placement, number of items, occasion, budget or anything else…" rows={5} /></label>
          <div className="lead-note"><MessageCircle /><p><strong>Good to know:</strong> {site.leadNotice} Faster service depends on item and rhinestone availability.</p></div>
          <button className="button button--large" type="submit">Continue to WhatsApp <ArrowUpRight /></button>
          <p className="form-fineprint">WhatsApp opens with your request ready. Nothing is sent until you press Send there.</p>
          {readyUrl ? <p className="form-handoff" role="status">Your request is ready. <a href={readyUrl} target="_blank" rel="noopener noreferrer">Open WhatsApp if it didn’t open automatically.</a></p> : null}
        </div>
      </div>
    </form>
  );
}
