"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { InvoiceItem, SplitSession } from "@/lib/types";

interface SplitProgressProps {
  session: SplitSession;
  items: InvoiceItem[];
}

const STEPS = ["Upload", "Assign", "Payer", "Summary"] as const;

function getActiveStep(session: SplitSession, items: InvoiceItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  if (items.some((item) => item.sharedBy.length === 0)) {
    return 1;
  }

  if (!session.payerMemberId || !session.payerVpa) {
    return 2;
  }

  return 3;
}

export function SplitProgress({ session, items }: SplitProgressProps) {
  const reduceMotion = useReducedMotion();
  const activeStep = getActiveStep(session, items);
  const progress = ((activeStep + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const isActive = index === activeStep;
          const isDone = index < activeStep;

          return (
            <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "bg-gradient-to-br from-emerald-400 to-violet-500 text-white shadow-[0_0_12px_var(--glow)]"
                      : "bg-white/10 text-zinc-500"
                }`}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isActive || isDone ? "text-zinc-200" : "text-zinc-500"
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-500"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }
          }
        />
      </div>
    </div>
  );
}
