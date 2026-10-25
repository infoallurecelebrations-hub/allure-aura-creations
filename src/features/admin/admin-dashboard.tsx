"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { ArrowUpRight, Check, Gift, Package, Sparkle } from "@/components/ui/icons";

import { ProductGalleryEditor } from "./product-gallery-editor";
import type { AdminContent, AdminContentResponse, PendingImage } from "./types";

type Tab = "overview" | "products" | "packages" | "journal" | "reviews" | "settings";

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "packages", label: "Packages" },
  { id: "journal", label: "Journal" },
  { id: "reviews", label: "Reviews" },
  { id: "settings", label: "Site settings" },
];

const MAX_PRODUCT_IMAGES = 10;
const MAX_PENDING_IMAGES = 10;
const MAX_OPTIMIZED_IMAGE_BYTES = 280_000;

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "item";
}

function uniqueId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function cloneContent(content: AdminContent) {
  return structuredClone(content);
}

async function optimizeImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 12_000_000) throw new Error("The original image must be smaller than 12 MB.");

  const bitmap = await createImageBitmap(file);
  try {
    const dimensions = [1600, 1400, 1200, 1050, 900];
    const qualities = [0.82, 0.72, 0.64];
    for (const maximum of dimensions) {
      const scale = Math.min(1, maximum / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser cannot prepare the image.");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of qualities) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
        if (!blob) throw new Error("Image conversion failed.");
        if (blob.size > MAX_OPTIMIZED_IMAGE_BYTES) continue;
        const buffer = await blob.arrayBuffer();
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let index = 0; index < bytes.length; index += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
        }
        return btoa(binary);
      }
    }
    throw new Error("This photo could not be reduced below 280 KB. Choose a less detailed or smaller image.");
  } finally {
    bitmap.close();
  }
}

function EditorHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="admin-editor-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}

export function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [document, setDocument] = useState<AdminContentResponse | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const busy = useRef(false);
  const publishedDocument = useRef<AdminContentResponse | null>(null);
  const [imagePreviews, setImagePreviews] = useState<PendingImage[]>([]);
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let current = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/content", { cache: "no-store" });
        const result = await response.json() as AdminContentResponse & { error?: string };
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!response.ok) throw new Error(result.error || "Unable to load content.");
        if (current) {
          setDocument(result);
          publishedDocument.current = result;
        }
      } catch (caught) {
        if (current) setNotice({ tone: "error", text: caught instanceof Error ? caught.message : "Unable to load content." });
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => { current = false; };
  }, [router]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  const counts = useMemo(() => document ? {
    products: document.content.catalog.products.length,
    packages: document.content.catalog.packages.length,
    stories: document.content.journal.posts.length,
    reviews: document.content.reviews.reviews.length,
  } : null, [document]);

  function edit(mutator: (content: AdminContent) => void) {
    setDocument((current) => {
      if (!current) return current;
      const content = cloneContent(current.content);
      mutator(content);
      return { ...current, content };
    });
    setDirty(true);
    setNotice(null);
  }

  async function logout() {
    if (busy.current || signingOut) return;
    if (dirty && !window.confirm("Sign out and discard your unpublished changes?")) return;
    setSigningOut(true);
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed. Please try again.");
      setDirty(false);
      router.replace("/admin/login");
    } catch (caught) {
      setNotice({ tone: "error", text: caught instanceof Error ? caught.message : "Unable to sign out. Check your connection." });
      setSigningOut(false);
    }
  }

  function discard() {
    if (busy.current || !publishedDocument.current || !window.confirm("Discard all unpublished changes?")) return;
    setDocument(cloneContentResponse(publishedDocument.current));
    setPendingImages([]);
    setPendingDeletions([]);
    setDirty(false);
    setNotice(null);
  }

  async function publish() {
    if (!document || busy.current || !dirty) return;
    busy.current = true;
    setPublishing(true);
    setNotice(null);
    try {
      const content = cloneContent(document.content);
      content.catalog.categories = [...new Set(content.catalog.products.map((product) => product.category.trim()).filter(Boolean))];
      const response = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseSha: document.baseSha, content, images: pendingImages, deletions: pendingDeletions }),
      });
      const result = await response.json() as { error?: string; sha?: string; url?: string };
      if (response.status === 401) {
        throw new Error("Your session expired. Keep this tab open, sign in again in a new tab, then retry publishing. Your edits are still here.");
      }
      if (!response.ok || !result.sha) throw new Error(result.error || "Publishing failed.");
      setDocument({ baseSha: result.sha, content });
      publishedDocument.current = { baseSha: result.sha, content };
      setImagePreviews((current) => [...current, ...pendingImages]);
      setPendingImages([]);
      setPendingDeletions([]);
      setDirty(false);
      setNotice({ tone: "success", text: "Published to GitHub. Vercel is now preparing the updated storefront." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setNotice({ tone: "error", text: caught instanceof Error ? caught.message : "Publishing failed." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      busy.current = false;
      setPublishing(false);
    }
  }

  async function uploadProductImages(files: File[], productId: string) {
    if (!files.length || !document || busy.current) return;
    const product = document.content.catalog.products.find((entry) => entry.id === productId);
    if (!product) return;
    busy.current = true;
    setUploading(true);
    setNotice(null);
    try {
      if (product.images.length + files.length > MAX_PRODUCT_IMAGES) {
        throw new Error(`This product can have up to ${MAX_PRODUCT_IMAGES} photos. Choose ${MAX_PRODUCT_IMAGES - product.images.length} or fewer.`);
      }
      if (pendingImages.length + files.length > MAX_PENDING_IMAGES) {
        throw new Error(`Publish the ${pendingImages.length} prepared photo${pendingImages.length === 1 ? "" : "s"} before adding more.`);
      }

      const prepared: PendingImage[] = [];
      const storefrontPaths: string[] = [];
      for (const file of files) {
        const contentBase64 = await optimizeImage(file);
        const fileName = `${slug(productId)}-${crypto.randomUUID()}.webp`;
        prepared.push({ path: `public/uploads/products/${fileName}`, contentBase64 });
        storefrontPaths.push(`/uploads/products/${fileName}`);
      }

      setPendingImages([...pendingImages, ...prepared]);
      setPendingDeletions((paths) => paths.filter((path) => !prepared.some((image) => image.path === path)));
      edit((content) => {
        const entry = content.catalog.products.find((item) => item.id === productId);
        if (entry) entry.images.push(...storefrontPaths);
      });
    } catch (caught) {
      setNotice({ tone: "error", text: caught instanceof Error ? caught.message : "Unable to prepare photos." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      busy.current = false;
      setUploading(false);
    }
  }

  function removeProductImage(productId: string, imagePath: string) {
    const product = document?.content.catalog.products.find((entry) => entry.id === productId);
    if (!product?.images.includes(imagePath)) return;
    const repositoryPath = `public${imagePath}`;
    const wasPending = pendingImages.some((image) => image.path === repositoryPath);
    setPendingImages((images) => images.filter((image) => image.path !== repositoryPath));
    if (!wasPending) setPendingDeletions((paths) => paths.includes(repositoryPath) ? paths : [...paths, repositoryPath]);
    edit((content) => {
      const entry = content.catalog.products.find((item) => item.id === productId);
      if (entry) entry.images = entry.images.filter((path) => path !== imagePath);
    });
  }

  function moveProductImage(productId: string, imagePath: string, direction: -1 | 1) {
    edit((content) => {
      const product = content.catalog.products.find((entry) => entry.id === productId);
      if (!product) return;
      const currentIndex = product.images.indexOf(imagePath);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= product.images.length) return;
      [product.images[currentIndex], product.images[nextIndex]] = [product.images[nextIndex], product.images[currentIndex]];
    });
  }

  function makeProductCover(productId: string, imagePath: string) {
    edit((content) => {
      const product = content.catalog.products.find((entry) => entry.id === productId);
      if (!product) return;
      product.images = [imagePath, ...product.images.filter((path) => path !== imagePath)];
    });
  }

  function deleteProduct(productId: string) {
    const product = document?.content.catalog.products.find((entry) => entry.id === productId);
    if (!product || !window.confirm(`Remove ${product.name}?`)) return;
    const repositoryPaths = product.images.map((image) => `public${image}`);
    const pendingPaths = new Set(pendingImages.map((image) => image.path));
    setPendingImages((images) => images.filter((image) => !repositoryPaths.includes(image.path)));
    setPendingDeletions((paths) => [...new Set([...paths, ...repositoryPaths.filter((path) => !pendingPaths.has(path))])]);
    edit((content) => {
      const index = content.catalog.products.findIndex((entry) => entry.id === productId);
      if (index >= 0) content.catalog.products.splice(index, 1);
    });
  }

  function imageSource(path: string) {
    const pending = [...pendingImages, ...imagePreviews].find((image) => image.path === `public${path}`);
    return pending ? `data:image/webp;base64,${pending.contentBase64}` : `/api/admin/image?${new URLSearchParams({ path, revision: document?.baseSha || "" })}`;
  }

  if (loading) return <main className="admin-loading"><Image alt="" height={80} priority src="/brand/emblem.png" width={92} /><p>Opening the studio workspace…</p></main>;

  return (
    <div className="admin-dashboard">
      <header className="admin-topbar">
        <Link className="brand" href="/" target="_blank" rel="noopener noreferrer"><span className="brand__mark"><Image alt="" height={48} priority src="/brand/logo.png" width={48} /></span><span className="brand__text"><strong>Allure Aura</strong><small>Studio admin</small></span></Link>
        <div className="admin-topbar__actions">
          <Link className="admin-preview-link" href="/" target="_blank">View storefront <ArrowUpRight /></Link>
          <button className="admin-quiet-button" disabled={publishing || uploading || signingOut} onClick={logout} type="button">{signingOut ? "Signing out…" : "Sign out"}</button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div><p className="admin-sidebar__label">Workspace</p><nav aria-label="Admin sections">{tabs.map((tab) => <button aria-current={activeTab === tab.id ? "page" : undefined} key={tab.id} onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: "instant" }); }} type="button"><span>{tab.label}</span>{tab.id !== "overview" && counts ? <small>{tab.id === "products" ? counts.products : tab.id === "packages" ? counts.packages : tab.id === "journal" ? counts.stories : tab.id === "reviews" ? counts.reviews : ""}</small> : null}</button>)}</nav></div>
          <div className="admin-sidebar__status"><span className={dirty ? "status-dot status-dot--dirty" : "status-dot"} /><p><strong>{dirty ? "Unpublished changes" : "Everything is published"}</strong><small>{pendingImages.length || pendingDeletions.length ? `${pendingImages.length} image${pendingImages.length === 1 ? "" : "s"} ready · ${pendingDeletions.length} removal${pendingDeletions.length === 1 ? "" : "s"}` : "GitHub is the source of truth"}</small></p></div>
        </aside>

        <main className="admin-main">
          {notice ? <div className={`admin-alert admin-alert--${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>{notice.text}</div> : null}
          {!document ? <div className="admin-empty"><h1>Content could not be loaded.</h1><p>Check your connection and try again. If this continues, the studio connection may need attention.</p><button className="admin-add-button" onClick={() => window.location.reload()} type="button">Try again</button></div> : (
            <>
              <fieldset className="admin-workspace-fields" disabled={publishing || uploading || signingOut} aria-busy={publishing || uploading}>
              {activeTab === "overview" ? <section>
                <EditorHeading description="Your current workspace. Changes appear on the storefront after you publish." eyebrow="Studio workspace" title="Good to see you." />
                <div className="admin-metrics">
                  <article><Package /><strong>{counts?.products}</strong><span>Products</span></article>
                  <article><Gift /><strong>{counts?.packages}</strong><span>Gift packages</span></article>
                  <article><Sparkle /><strong>{counts?.stories}</strong><span>Journal stories</span></article>
                  <article><Check /><strong>{counts?.reviews}</strong><span>Reviews</span></article>
                </div>
                <div className="admin-overview-grid"><article><p className="eyebrow">Publishing flow</p><h2>Edit once. Publish everywhere.</h2><p>When you publish, the admin creates one versioned GitHub commit. Vercel detects it and deploys the updated storefront automatically.</p><ol><li><span>1</span>Edit content and prepare images</li><li><span>2</span>Review the unpublished status</li><li><span>3</span>Publish one atomic revision</li></ol></article><article><p className="eyebrow">Safe by design</p><h2>Public content only.</h2><p>Never enter passwords, private order details, payment information or customer contact data into these editors. Everything published here becomes part of the public website repository.</p></article></div>
              </section> : null}

              {activeTab === "products" ? <section>
                <EditorHeading action={<button className="admin-add-button" onClick={() => { setSearch(""); edit((content) => content.catalog.products.unshift({ id: uniqueId("product"), name: "New product", category: content.catalog.categories[0] || "Accessories", price: 0, description: "Add a product description.", featured: false, images: [] })); }} type="button">+ Add product</button>} description="Edit prices, descriptions, categories, featured items and product galleries." eyebrow="Catalogue" title="Products" />
                <label className="field admin-search"><span>Find a product</span><input type="search" placeholder="Search by name or category" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
                <p className="admin-editor-hint">Add up to 10 photos per product. Choose several at once, arrange the order and select the cover photo. Photos are automatically optimized.</p>
                {!document.content.catalog.products.some((product) => `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase().trim())) ? <p className="admin-empty">No products match. Try another search or add a product.</p> : null}
                <div className="admin-editor-list">{document.content.catalog.products.map((product, index) => ({ product, index })).filter(({ product }) => `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase().trim())).map(({ product, index }) => <article className="admin-editor-card admin-product-editor" key={product.id}>
                  <ProductGalleryEditor imageSource={imageSource} onMakeCover={(path) => makeProductCover(product.id, path)} onMove={(path, direction) => moveProductImage(product.id, path, direction)} onRemove={(path) => removeProductImage(product.id, path)} onUpload={(files) => void uploadProductImages(files, product.id)} product={product} uploading={uploading} />
                  <div className="admin-editor-fields"><div className="field-grid"><label className="field"><span>Product name</span><input onChange={(event) => edit((content) => { content.catalog.products[index].name = event.target.value; })} value={product.name} /></label><label className="field"><span>Category</span><input list="admin-categories" onChange={(event) => edit((content) => { content.catalog.products[index].category = event.target.value; })} value={product.category} /></label></div>
                    <div className="field-grid"><label className="field"><span>Price (KSh)</span><input min="0" onChange={(event) => edit((content) => { content.catalog.products[index].price = Number(event.target.value); })} type="number" value={product.price} /></label><label className="admin-check"><input checked={product.featured} onChange={(event) => edit((content) => { content.catalog.products[index].featured = event.target.checked; })} type="checkbox" /><span>Feature on homepage</span></label></div>
                    <label className="field"><span>Description</span><textarea onChange={(event) => edit((content) => { content.catalog.products[index].description = event.target.value; })} rows={3} value={product.description} /></label>
                    <div className="admin-card-actions"><button className="danger" onClick={() => deleteProduct(product.id)} type="button">Delete product</button></div>
                  </div>
                </article>)}</div><datalist id="admin-categories">{document.content.catalog.categories.map((category) => <option key={category} value={category} />)}</datalist>
              </section> : null}

              {activeTab === "packages" ? <section>
                <EditorHeading action={<button className="admin-add-button" onClick={() => edit((content) => content.catalog.packages.push({ id: uniqueId("package"), name: "New package", price: 0, description: "Add a package description.", includes: ["Personalized item"] }))} type="button">+ Add package</button>} description="Manage package names, starting prices and everything included." eyebrow="Gifting" title="Gift packages" />
                <div className="admin-editor-list">{document.content.catalog.packages.map((giftPackage, index) => <article className="admin-editor-card" key={giftPackage.id}><div className="admin-card-index">0{index + 1}</div><div className="admin-editor-fields"><div className="field-grid"><label className="field"><span>Package name</span><input onChange={(event) => edit((content) => { content.catalog.packages[index].name = event.target.value; })} value={giftPackage.name} /></label><label className="field"><span>Starting price (KSh)</span><input min="0" onChange={(event) => edit((content) => { content.catalog.packages[index].price = Number(event.target.value); })} type="number" value={giftPackage.price} /></label></div><label className="field"><span>Description</span><textarea onChange={(event) => edit((content) => { content.catalog.packages[index].description = event.target.value; })} rows={2} value={giftPackage.description} /></label><label className="field"><span>Included items — one per line</span><textarea onChange={(event) => edit((content) => { content.catalog.packages[index].includes = event.target.value.split("\n"); })} rows={5} value={giftPackage.includes.join("\n")} /></label><div className="admin-card-actions"><button className="danger" onClick={() => { if (window.confirm(`Remove ${giftPackage.name}?`)) edit((content) => { content.catalog.packages.splice(index, 1); }); }} type="button">Delete package</button></div></div></article>)}</div>
              </section> : null}

              {activeTab === "journal" ? <section>
                <EditorHeading action={<button className="admin-add-button" onClick={() => edit((content) => content.journal.posts.unshift({ id: uniqueId("story"), eyebrow: "Studio note", title: "New story", excerpt: "Write the story here." }))} type="button">+ Add story</button>} description="Share studio stories, event highlights and thoughtful behind-the-scenes notes." eyebrow="Stories" title="Journal" />
                <div className="admin-editor-list">{document.content.journal.posts.map((post, index) => <article className="admin-editor-card" key={post.id}><div className="admin-card-index">0{index + 1}</div><div className="admin-editor-fields"><div className="field-grid"><label className="field"><span>Label</span><input onChange={(event) => edit((content) => { content.journal.posts[index].eyebrow = event.target.value; })} value={post.eyebrow} /></label><label className="field"><span>Title</span><input onChange={(event) => edit((content) => { content.journal.posts[index].title = event.target.value; })} value={post.title} /></label></div><label className="field"><span>Story</span><textarea onChange={(event) => edit((content) => { content.journal.posts[index].excerpt = event.target.value; })} rows={6} value={post.excerpt} /></label><div className="admin-card-actions"><button className="danger" onClick={() => { if (window.confirm(`Remove ${post.title}?`)) edit((content) => { content.journal.posts.splice(index, 1); }); }} type="button">Delete story</button></div></div></article>)}</div>
              </section> : null}

              {activeTab === "reviews" ? <section>
                <EditorHeading action={<button className="admin-add-button" onClick={() => edit((content) => content.reviews.reviews.unshift({ id: uniqueId("review"), name: "Customer name", text: "Add genuine customer feedback shared with permission.", stars: 5 }))} type="button">+ Add review</button>} description="Publish only genuine feedback that the customer has allowed you to share." eyebrow="Kind words" title="Reviews" />
                {!document.content.reviews.reviews.length ? <div className="admin-empty admin-empty--bordered"><h2>No reviews published yet.</h2><p>This is intentional. Add the first review only when genuine customer feedback is ready and approved.</p></div> : <div className="admin-editor-list">{document.content.reviews.reviews.map((review, index) => <article className="admin-editor-card" key={review.id}><div className="admin-card-index">“</div><div className="admin-editor-fields"><div className="field-grid"><label className="field"><span>Customer name</span><input onChange={(event) => edit((content) => { content.reviews.reviews[index].name = event.target.value; })} value={review.name} /></label><label className="field"><span>Stars</span><select onChange={(event) => edit((content) => { content.reviews.reviews[index].stars = Number(event.target.value); })} value={review.stars}>{[5, 4, 3, 2, 1].map((stars) => <option key={stars} value={stars}>{stars} star{stars === 1 ? "" : "s"}</option>)}</select></label></div><label className="field"><span>Review</span><textarea onChange={(event) => edit((content) => { content.reviews.reviews[index].text = event.target.value; })} rows={5} value={review.text} /></label><div className="admin-card-actions"><button className="danger" onClick={() => { if (window.confirm(`Remove the review from ${review.name}?`)) edit((content) => { content.reviews.reviews.splice(index, 1); }); }} type="button">Delete review</button></div></div></article>)}</div>}
              </section> : null}

              {activeTab === "settings" ? <section>
                <EditorHeading description="Update the public contact information, order notice and social links." eyebrow="Business details" title="Site settings" />
                <div className="admin-settings-grid"><article className="admin-editor-card admin-editor-card--stack"><h3>Contact details</h3><label className="field"><span>Business name</span><input onChange={(event) => edit((content) => { content.site.business.name = event.target.value; })} value={document.content.site.business.name} /></label><label className="field"><span>Contact email</span><input onChange={(event) => edit((content) => { content.site.contact.email = event.target.value; })} type="email" value={document.content.site.contact.email} /></label><label className="field"><span>Display phone number</span><input onChange={(event) => edit((content) => { content.site.contact.phone = event.target.value; })} value={document.content.site.contact.phone} /></label><label className="field"><span>WhatsApp number — country code and digits only</span><input inputMode="numeric" onChange={(event) => edit((content) => { content.site.contact.whatsapp = event.target.value; })} value={document.content.site.contact.whatsapp} /></label><label className="field"><span>Lead-time notice</span><textarea onChange={(event) => edit((content) => { content.site.leadNotice = event.target.value; })} rows={3} value={document.content.site.leadNotice} /></label></article>
                  <article className="admin-editor-card admin-editor-card--stack"><div className="admin-inline-heading"><h3>Social links</h3><button className="admin-add-button admin-add-button--small" onClick={() => edit((content) => content.site.socialLinks.push({ name: "Instagram", label: "@yourhandle", url: "https://instagram.com/" }))} type="button">+ Add link</button></div>{document.content.site.socialLinks.map((link, index) => <div className="admin-social-editor" key={index}><div className="field-grid"><label className="field"><span>Platform</span><input onChange={(event) => edit((content) => { content.site.socialLinks[index].name = event.target.value; })} value={link.name} /></label><label className="field"><span>Public label</span><input onChange={(event) => edit((content) => { content.site.socialLinks[index].label = event.target.value; })} value={link.label} /></label></div><label className="field"><span>HTTPS URL</span><input onChange={(event) => edit((content) => { content.site.socialLinks[index].url = event.target.value; })} type="url" value={link.url} /></label><div className="admin-card-actions"><button className="danger" onClick={() => { if (window.confirm(`Remove the ${link.name} link?`)) edit((content) => { content.site.socialLinks.splice(index, 1); }); }} type="button">Delete link</button></div></div>)}</article></div>
              </section> : null}

              </fieldset>
              {uploading ? <p className="admin-operation-status" role="status">Preparing your image. Please wait…</p> : null}
              <div className={`admin-publish-bar${dirty ? " admin-publish-bar--visible" : ""}`} hidden={!dirty}><div><span className="status-dot status-dot--dirty" /><p><strong>{dirty ? "Changes are ready to publish" : "No unpublished changes"}</strong><small>Publishing commits the content to GitHub and starts a Vercel deployment.</small></p></div><button className="admin-quiet-button" disabled={publishing || uploading} onClick={discard} type="button">Discard changes</button><button className="button" disabled={!dirty || publishing || uploading || signingOut} onClick={publish} type="button">{uploading ? "Preparing image…" : publishing ? "Publishing…" : <>Publish changes <ArrowUpRight /></>}</button></div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function cloneContentResponse(value: AdminContentResponse): AdminContentResponse {
  return structuredClone(value);
}
