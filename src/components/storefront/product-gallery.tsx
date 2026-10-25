"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { productImages, type Product } from "@/lib/content";

import { ProductArt } from "./product-art";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d={direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} /></svg>;
}

function ExpandIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3H3v5m13-5h5v5M8 21H3v-5m18 0v5h-5" /></svg>;
}

export function ProductGallery({ product }: { product: Product }) {
  const track = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const images = productImages(product).filter((path) => !failed.includes(path));
  const current = Math.min(active, Math.max(0, images.length - 1));

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (viewerOpen && !node.open) node.showModal();
    if (!viewerOpen && node.open) node.close();
  }, [viewerOpen]);

  function show(index: number, behavior: ScrollBehavior = "smooth") {
    const next = Math.max(0, Math.min(index, images.length - 1));
    setActive(next);
    track.current?.scrollTo({ left: next * track.current.clientWidth, behavior });
  }

  function step(direction: -1 | 1) {
    if (!images.length) return;
    setActive((index) => (index + direction + images.length) % images.length);
  }

  function markFailed(path: string) {
    setFailed((paths) => paths.includes(path) ? paths : [...paths, path]);
    setActive(0);
  }

  function endSwipe(clientX: number) {
    if (touchStart.current === null) return;
    const distance = clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) > 44) step(distance > 0 ? -1 : 1);
  }

  if (!images.length) return <ProductArt product={product} />;

  return (
    <>
      <div className="product-gallery">
        <div
          aria-label={`${product.name} photo gallery`}
          className="product-gallery__track"
          onScroll={(event) => {
            const width = event.currentTarget.clientWidth;
            if (width) setActive(Math.round(event.currentTarget.scrollLeft / width));
          }}
          ref={track}
        >
          {images.map((path, index) => (
            <div className="product-gallery__slide" key={path}>
              <Image
                alt={index === 0 ? product.name : `${product.name}, alternate view ${index + 1}`}
                className="product-art__image"
                fill
                onError={() => markFailed(path)}
                sizes="(max-width: 580px) 100vw, (max-width: 820px) 50vw, 33vw"
                src={path}
              />
            </div>
          ))}
        </div>

        <button className="product-gallery__expand" onClick={() => setViewerOpen(true)} type="button" aria-label={`Open ${product.name} image gallery`}>
          <ExpandIcon />
        </button>

        {images.length > 1 ? (
          <>
            <button className="product-gallery__arrow product-gallery__arrow--previous" disabled={current === 0} onClick={() => show(current - 1)} type="button" aria-label={`Previous ${product.name} photo`}><Chevron direction="left" /></button>
            <button className="product-gallery__arrow product-gallery__arrow--next" disabled={current === images.length - 1} onClick={() => show(current + 1)} type="button" aria-label={`Next ${product.name} photo`}><Chevron direction="right" /></button>
            <div className="product-gallery__dots" aria-label={`Photo ${current + 1} of ${images.length}`}>
              {images.map((path, index) => <button aria-label={`Show photo ${index + 1} of ${product.name}`} aria-current={current === index ? "true" : undefined} key={path} onClick={() => show(index)} type="button" />)}
            </div>
          </>
        ) : null}
      </div>

      {viewerOpen ? <dialog
        aria-label={`${product.name} image gallery`}
        className="product-viewer"
        onCancel={(event) => { event.preventDefault(); setViewerOpen(false); }}
        onClick={(event) => { if (event.target === event.currentTarget) setViewerOpen(false); }}
        onClose={() => setViewerOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") step(-1);
          if (event.key === "ArrowRight") step(1);
        }}
        ref={dialog}
      >
        <div className="product-viewer__shell">
          <header className="product-viewer__header">
            <div><span>{product.category}</span><h2>{product.name}</h2></div>
            <p>{current + 1} / {images.length}</p>
            <button onClick={() => setViewerOpen(false)} type="button" aria-label="Close image gallery">×</button>
          </header>

          <div
            className="product-viewer__stage"
            onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => endSwipe(event.changedTouches[0]?.clientX ?? 0)}
          >
            <Image
              alt={`${product.name}, photo ${current + 1} of ${images.length}`}
              className="product-viewer__image"
              fill
              onError={() => markFailed(images[current])}
              sizes="100vw"
              src={images[current]}
            />
            {images.length > 1 ? (
              <>
                <button className="product-viewer__arrow product-viewer__arrow--previous" onClick={() => step(-1)} type="button" aria-label="Previous photo"><Chevron direction="left" /></button>
                <button className="product-viewer__arrow product-viewer__arrow--next" onClick={() => step(1)} type="button" aria-label="Next photo"><Chevron direction="right" /></button>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="product-viewer__thumbs" aria-label={`${product.name} gallery thumbnails`}>
              {images.map((path, index) => (
                <button aria-current={current === index ? "true" : undefined} aria-label={`View photo ${index + 1}`} key={path} onClick={() => setActive(index)} type="button">
                  <Image alt="" fill sizes="72px" src={path} />
                </button>
              ))}
            </div>
          ) : null}
          <p className="product-viewer__hint">Swipe or use the arrow keys to browse</p>
        </div>
      </dialog> : null}
    </>
  );
}
