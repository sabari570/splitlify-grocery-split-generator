"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-emerald-500 to-violet-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-violet-400 disabled:from-zinc-600 disabled:to-zinc-600 disabled:shadow-none",
  secondary:
    "border border-white/15 bg-white/5 text-zinc-100 hover:bg-white/10 disabled:opacity-50",
  ghost:
    "bg-transparent text-zinc-300 hover:bg-white/5 disabled:text-zinc-600",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  type = "button",
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
