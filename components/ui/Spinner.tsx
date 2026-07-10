"use client";

import { motion, useReducedMotion } from "framer-motion";

interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className = "", label }: SpinnerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <motion.span
        className="inline-block h-4 w-4 rounded-full border-2 border-emerald-300/30 border-t-emerald-300"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 0.8, repeat: Infinity, ease: "linear" }
        }
        aria-hidden
      />
      {label ? <span className="text-sm text-zinc-400">{label}</span> : null}
    </span>
  );
}
