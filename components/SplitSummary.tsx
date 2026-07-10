"use client";

import { motion, useReducedMotion } from "framer-motion";

import { MotionCard } from "@/components/ui/MotionCard";
import { formatRupee } from "@/lib/formatRupee";
import type { SplitResult } from "@/lib/types";

interface SplitSummaryProps {
  results: SplitResult[];
  payerMemberId?: string | null;
}

const CHIP_COLORS = [
  "from-emerald-500 to-teal-400",
  "from-violet-500 to-fuchsia-400",
  "from-sky-500 to-cyan-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
];

export function SplitSummary({ results, payerMemberId }: SplitSummaryProps) {
  const reduceMotion = useReducedMotion();

  return (
    <MotionCard title="Split summary">
      {results.length === 0 ? (
        <p className="text-sm text-zinc-400">No split results yet.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {results.map((result, index) => {
            const isPayer = result.memberId === payerMemberId;

            return (
              <li
                key={result.memberId}
                className={`flex items-center justify-between gap-3 py-3 ${
                  isPayer ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${CHIP_COLORS[index % CHIP_COLORS.length]}`}
                  >
                    {result.memberName.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      {result.memberName}
                    </p>
                    {isPayer ? (
                      <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-400">
                        Paid the bill
                      </span>
                    ) : null}
                  </div>
                </div>
                <motion.span
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="text-sm font-semibold text-zinc-200"
                >
                  {formatRupee(result.amountOwed)}
                </motion.span>
              </li>
            );
          })}
        </ul>
      )}
    </MotionCard>
  );
}
