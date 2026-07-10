"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { MotionCard } from "@/components/ui/MotionCard";
import { Spinner } from "@/components/ui/Spinner";
import { writeSessionCache } from "@/lib/clientSessionCache";
import type { SplitSession } from "@/lib/types";

const CHIP_COLORS = [
  "from-emerald-500 to-teal-400",
  "from-violet-500 to-fuchsia-400",
  "from-sky-500 to-cyan-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
];

export function MemberSetupForm() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [names, setNames] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateName(index: number, value: string) {
    setNames((current) =>
      current.map((name, i) => (i === index ? value : name)),
    );
  }

  function addMemberField() {
    setNames((current) => [...current, ""]);
  }

  function removeMemberField(index: number) {
    if (names.length <= 2) {
      return;
    }

    setNames((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: names.map((name) => ({ name })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to create session.");
      }

      const session = (await response.json()) as SplitSession;
      writeSessionCache(session);
      router.push(`/split/${session.id}`);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to create session.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FadeIn delay={0.15}>
      <MotionCard title="Who is splitting?">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {names.map((name, index) => (
                <motion.div
                  key={index}
                  layout={!reduceMotion}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${CHIP_COLORS[index % CHIP_COLORS.length]}`}
                  >
                    {(name.trim().charAt(0) || String(index + 1)).toUpperCase()}
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => updateName(index, event.target.value)}
                    placeholder={`Member ${index + 1}`}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                    required
                  />
                  {names.length > 2 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeMemberField(index)}
                      aria-label={`Remove member ${index + 1}`}
                      className="shrink-0 px-2"
                    >
                      ✕
                    </Button>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" onClick={addMemberField}>
              + Add member
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <Spinner label="Creating..." />
              ) : (
                "Start split →"
              )}
            </Button>
          </div>

          {error ? (
            <p className="text-sm text-rose-400">{error}</p>
          ) : null}
        </form>
      </MotionCard>
    </FadeIn>
  );
}
