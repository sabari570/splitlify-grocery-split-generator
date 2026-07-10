"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MemberChip } from "@/components/ui/MemberChip";
import { MotionCard } from "@/components/ui/MotionCard";
import { Spinner } from "@/components/ui/Spinner";
import { writeSessionCache } from "@/lib/clientSessionCache";
import type { Member, SplitSession } from "@/lib/types";

interface PayerSetupFormProps {
  sessionId: string;
  members: Member[];
  payerMemberId: string | null;
  payerVpa: string | null;
  /** Full working copy so PATCH can SET without a Redis GET. */
  sessionSnapshot: SplitSession;
  onSaved: (session: SplitSession) => void;
}

export function PayerSetupForm({
  sessionId,
  members,
  payerMemberId,
  payerVpa,
  sessionSnapshot,
  onSaved,
}: PayerSetupFormProps) {
  const reduceMotion = useReducedMotion();
  const [selectedMemberId, setSelectedMemberId] = useState(
    payerMemberId ?? members[0]?.id ?? "",
  );
  const [vpa, setVpa] = useState(payerVpa ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(Boolean(payerMemberId && payerVpa));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    setSaved(false);

    try {
      const snapshot: SplitSession = {
        ...sessionSnapshot,
        payerMemberId: selectedMemberId,
        payerVpa: vpa,
      };

      const response = await fetch(`/api/session/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: snapshot.members,
          items: snapshot.items,
          payerVpa: snapshot.payerVpa,
          payerMemberId: snapshot.payerMemberId,
          createdAt: snapshot.createdAt,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to save payer details.");
      }

      const session = (await response.json()) as SplitSession;
      writeSessionCache(session);
      onSaved(session);
      setSaved(true);
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save payer details.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <MotionCard title="Who paid?" glow={saved}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-300">Member who paid</p>
          <div className="flex flex-wrap gap-2">
            {members.map((member, index) => (
              <MemberChip
                key={member.id}
                name={member.name}
                selected={selectedMemberId === member.id}
                onToggle={() => setSelectedMemberId(member.id)}
                colorIndex={index}
              />
            ))}
          </div>
        </div>

        <Input
          label="UPI VPA"
          type="text"
          value={vpa}
          onChange={(event) => setVpa(event.target.value)}
          placeholder="name@upi"
          required
        />

        <Button type="submit" variant="secondary" disabled={isSaving}>
          {isSaving ? <Spinner label="Saving..." /> : "Save payer details"}
        </Button>

        <AnimatePresence>
          {saved ? (
            <motion.p
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-medium text-emerald-300"
            >
              ✓ Payer details saved
            </motion.p>
          ) : null}
        </AnimatePresence>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      </form>
    </MotionCard>
  );
}
