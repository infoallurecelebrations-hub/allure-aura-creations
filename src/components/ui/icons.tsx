type IconProps = { className?: string };

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.6,
  viewBox: "0 0 24 24",
};

export function ArrowUpRight({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="M7 17 17 7M8 7h9v9" /></svg>;
}

export function ArrowRight({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="M5 12h14m-5-5 5 5-5 5" /></svg>;
}

export function Check({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="m5 12 4 4L19 6" /></svg>;
}

export function Clock({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

export function Gift({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="M4 10h16v10H4zM3 6h18v4H3zM12 6v14M12 6H8.5A2.5 2.5 0 1 1 11 3.5ZM12 6h3.5A2.5 2.5 0 1 0 13 3.5Z" /></svg>;
}

export function Heart({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>;
}

export function Mail({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m4 7 8 6 8-6" /></svg>;
}

export function Menu({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

export function MessageCircle({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.8-4.7A8.5 8.5 0 1 1 21 11.5Z" /></svg>;
}

export function Package({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="m12 3 8 4-8 4-8-4 8-4Z" /><path d="m4 7 8 4 8-4v10l-8 4-8-4Z" /><path d="M12 11v10" /></svg>;
}

export function Phone({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></svg>;
}

export function Sparkle({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Zm14-2 .8 2.2 2.2.8-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13Z" /></svg>;
}

export function X({ className }: IconProps) {
  return <svg aria-hidden="true" className={className} {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
}
