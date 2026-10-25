"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { ArrowUpRight } from "@/components/ui/icons";
import { formatPrice, productImages, type Product } from "@/lib/content";

export function HeroProduct({ product }: { product?: Product }) {
  const [failedImage, setFailedImage] = useState("");
  const image = product ? productImages(product)[0] : "";
  const showPhoto = Boolean(image && image !== failedImage);
  const href = showPhoto && product
    ? `/customize?${new URLSearchParams({ product: product.id })}`
    : "/studio";

  return (
    <figure className="hero-piece">
      <div className="hero-piece__visual">
        {showPhoto && product ? (
          <Image alt={product.name} className="hero-piece__photo" fill loading="eager" fetchPriority="high" onError={() => setFailedImage(image)} sizes="(max-width: 820px) 92vw, 46vw" src={image} />
        ) : (
          <>
            <span className="hero-piece__label">Personalization example</span>
            <svg className="hero-piece__illustration" viewBox="0 0 600 610" role="img" aria-label="Illustration of a cream mug with the name Amina, beside a handwritten gift note">
              <defs>
                <linearGradient id="hero-paper" x2="1" y2="1"><stop stopColor="#e8dcc7" /><stop offset="1" stopColor="#c5b392" /></linearGradient>
                <linearGradient id="hero-ceramic"><stop stopColor="#d9cbb1" /><stop offset=".3" stopColor="#fff9e9" /><stop offset=".75" stopColor="#f2e8d3" /><stop offset="1" stopColor="#c1ad87" /></linearGradient>
                <linearGradient id="hero-handle"><stop stopColor="#b7a17c" /><stop offset=".5" stopColor="#f4ead5" /><stop offset="1" stopColor="#ccb995" /></linearGradient>
                <radialGradient id="hero-shadow"><stop stopColor="#5f4b30" stopOpacity=".3" /><stop offset="1" stopColor="#5f4b30" stopOpacity="0" /></radialGradient>
              </defs>
              <path fill="url(#hero-paper)" d="M0 0h600v610H0z" />
              <path fill="#f7efdf" fillOpacity=".25" d="M0 0h440L0 480z" />
              <path fill="#dccdaf" d="m375 420 225-67v257H188z" />
              <path stroke="#b3a181" strokeOpacity=".35" fill="none" d="m379 430 221-65M344 450l256-76" />
              <ellipse cx="304" cy="453" rx="205" ry="61" fill="url(#hero-shadow)" />
              <g transform="rotate(-7 285 330)">
                <path d="M385 234h27c93 0 100 159-1 159h-32v-33h28c52 0 53-91 1-91h-23z" fill="url(#hero-handle)" stroke="#b6a17c" strokeWidth="2" />
                <path d="M160 203h232l-11 196c-3 49-207 54-212 1z" fill="url(#hero-ceramic)" stroke="#c5b392" strokeWidth="1.5" />
                <ellipse cx="276" cy="203" rx="116" ry="21" fill="#fff9eb" stroke="#c7b592" strokeWidth="2" />
                <ellipse cx="276" cy="204" rx="104" ry="13" fill="#c4b190" />
                <path d="M175 227l8 159c2 14 10 24 24 27" fill="none" stroke="#fffdf5" strokeOpacity=".6" strokeWidth="5" strokeLinecap="round" />
                <text x="276" y="327" textAnchor="middle" fill="#705128" fontFamily="Georgia, serif" fontSize="49" fontStyle="italic">Amina</text>
                <path d="M219 340q56 10 109-3" fill="none" stroke="#967340" strokeWidth="1.5" />
              </g>
              <g transform="rotate(9 145 480)">
                <path d="M59 439h180v116H59z" fill="#9f8967" fillOpacity=".2" transform="translate(5 6)" />
                <path d="M59 439h180v116H59z" fill="#fffaee" />
                <text x="83" y="479" fill="#6f4937" fontFamily="Georgia, serif" fontSize="27" fontStyle="italic">for you,</text>
                <text x="83" y="514" fill="#7c725f" fontFamily="Georgia, serif" fontSize="14">and only you.</text>
              </g>
              <path d="M520 0c-13 78-58 107-84 124s-13 49 22 37c31-11 17-44-10-27S411 164 386 151" fill="none" stroke="#7f4439" strokeWidth="11" />
              <path d="M518 0c-13 77-57 105-83 123" fill="none" stroke="#bc8371" strokeWidth="2" />
            </svg>
          </>
        )}
      </div>
      <figcaption className="hero-piece__caption">
        <div>
          <span>{showPhoto ? "From the collection" : "A little inspiration"}</span>
          <p>{showPhoto && product ? product.name : "Start with their name."}</p>
          {showPhoto && product ? <small>From {formatPrice(product.price)}</small> : null}
        </div>
        <Link href={href} aria-label={showPhoto && product ? `Personalize ${product.name}` : "Choose a piece to personalize"}>
          {showPhoto ? "Make it theirs" : "Choose your piece"} <ArrowUpRight />
        </Link>
      </figcaption>
    </figure>
  );
}
