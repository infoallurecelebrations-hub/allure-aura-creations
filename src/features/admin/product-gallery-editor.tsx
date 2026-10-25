"use client";

import Image from "next/image";
import { type ChangeEvent, useState } from "react";

import type { AdminProduct } from "./types";

type ProductGalleryEditorProps = {
  product: AdminProduct;
  uploading: boolean;
  imageSource: (path: string) => string;
  onUpload: (files: File[]) => void;
  onRemove: (path: string) => void;
  onMove: (path: string, direction: -1 | 1) => void;
  onMakeCover: (path: string) => void;
};

export function ProductGalleryEditor({ product, uploading, imageSource, onUpload, onRemove, onMove, onMakeCover }: ProductGalleryEditorProps) {
  const [selected, setSelected] = useState("");
  const selectedPath = product.images.includes(selected) ? selected : product.images[0] || "";
  const selectedIndex = product.images.indexOf(selectedPath);
  const remaining = 10 - product.images.length;

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length) onUpload(files);
  }

  return (
    <div className="admin-product-gallery">
      <div className="admin-product-gallery__heading"><strong>Product photos</strong><span>{product.images.length} / 10</span></div>
      <div className="admin-product-gallery__preview">
        {selectedPath ? <Image alt={`${product.name} selected photo`} fill sizes="260px" src={imageSource(selectedPath)} unoptimized /> : <span>{product.name.slice(0, 1)}</span>}
        {selectedIndex === 0 && selectedPath ? <small>Cover photo</small> : null}
      </div>

      {product.images.length ? (
        <div className="admin-product-gallery__thumbs" aria-label={`${product.name} photos`}>
          {product.images.map((path, index) => (
            <button aria-current={path === selectedPath ? "true" : undefined} aria-label={`Select photo ${index + 1} of ${product.name}`} key={path} onClick={() => setSelected(path)} type="button">
              <Image alt="" fill sizes="68px" src={imageSource(path)} unoptimized />
              <span>{index + 1}</span>
            </button>
          ))}
        </div>
      ) : <p className="admin-product-gallery__empty">Add clear photos from different angles. The first photo becomes the storefront cover.</p>}

      {selectedPath ? (
        <div className="admin-product-gallery__controls">
          <button disabled={selectedIndex === 0} onClick={() => onMove(selectedPath, -1)} type="button" aria-label="Move selected photo earlier">←</button>
          <button disabled={selectedIndex === product.images.length - 1} onClick={() => onMove(selectedPath, 1)} type="button" aria-label="Move selected photo later">→</button>
          <button disabled={selectedIndex === 0} onClick={() => onMakeCover(selectedPath)} type="button">Make cover</button>
          <button className="danger" onClick={() => onRemove(selectedPath)} type="button">Remove</button>
        </div>
      ) : null}

      <label className={`admin-product-gallery__upload${remaining === 0 ? " admin-product-gallery__upload--full" : ""}`}>
        <input aria-label={`Add photos for ${product.name}`} accept="image/png,image/jpeg,image/webp,image/avif" disabled={!remaining || uploading} multiple onChange={chooseFiles} type="file" />
        <strong>{uploading ? "Preparing photos…" : remaining ? "+ Add photos" : "Gallery full"}</strong>
        <span>{remaining ? `${remaining} space${remaining === 1 ? "" : "s"} left · choose multiple` : "Maximum 10 photos"}</span>
      </label>
    </div>
  );
}
