"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface MemberChipProps {
  name: string;
  selected: boolean;
  onToggle: () => void;
  colorIndex?: number;
}

const CHIP_COLORS = [
  "from-emerald-500 to-teal-400",
  "from-violet-500 to-fuchsia-400",
  "from-sky-500 to-cyan-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
  "from-indigo-500 to-blue-400",
];

export const MemberChip = memo(function MemberChip({
  name,
  selected,
  onToggle,
  colorIndex = 0,
}: MemberChipProps) {
  const reduceMotion = useReducedMotion();
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const gradient = CHIP_COLORS[colorIndex % CHIP_COLORS.length];

  return (
    <motion.button
      type="button"
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onClick={onToggle}
      aria-pressed={selected}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-[border-color,background-color,box-shadow,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
        selected
          ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${gradient}`}
      >
        {initial}
      </span>
      <span>{name}</span>
      {selected ? (
        <span className="text-emerald-300" aria-hidden>
          ✓
        </span>
      ) : null}
    </motion.button>
  );
});
