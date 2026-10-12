import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  centered?: boolean;
};

export function SectionHeading({ eyebrow, title, description, action, centered = false }: SectionHeadingProps) {
  return (
    <div className={`section-heading${centered ? " section-heading--centered" : ""}`}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="section-heading__description">{description}</p> : null}
      </div>
      {action ? <div className="section-heading__action">{action}</div> : null}
    </div>
  );
}
