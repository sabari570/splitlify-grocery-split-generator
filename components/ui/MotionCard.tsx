"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface MotionCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  glow?: boolean;
  accentColor?: string;
  /** Skip entrance animation — use for list items that scroll frequently */
  static?: boolean;
}

export function MotionCard({
  children,
  title,
  className = "",
  glow = false,
  accentColor,
  static: isStatic = false,
}: MotionCardProps) {
  const reduceMotion = useReducedMotion();
  const cardClassName = `glass-card relative overflow-hidden rounded-2xl p-4 ${
    glow ? "ring-1 ring-emerald-400/40" : ""
  } ${className}`;

  const content = (
    <>
      {accentColor ? (
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: accentColor }}
          aria-hidden
        />
      ) : null}
      {title ? (
        <h2 className="mb-3 text-base font-semibold text-zinc-100">{title}</h2>
      ) : null}
      {children}
    </>
  );

  if (isStatic || reduceMotion) {
    return <section className={cardClassName}>{content}</section>;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cardClassName}
    >
      {content}
    </motion.section>
  );
}
