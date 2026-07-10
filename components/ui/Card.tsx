import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ title, children, className = "", glow = false }: CardProps) {
  return (
    <section
      className={`glass-card rounded-2xl p-4 ${
        glow ? "ring-1 ring-emerald-400/40 shadow-[0_0_24px_var(--glow)]" : ""
      } ${className}`}
    >
      {title ? (
        <h2 className="mb-3 text-base font-semibold text-zinc-100">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}
