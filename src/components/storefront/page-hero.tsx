import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  aside?: ReactNode;
};

export function PageHero({ eyebrow, title, description, aside }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="ambient ambient--one" />
      <div className="container page-hero__grid">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="page-hero__description">{description}</p>
        </div>
        {aside ? <div className="page-hero__aside">{aside}</div> : null}
      </div>
    </section>
  );
}
