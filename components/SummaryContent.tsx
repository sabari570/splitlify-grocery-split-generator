"use client";

import Link from "next/link";

import { PaymentLinkCard } from "@/components/PaymentLinkCard";
import { SplitSummary } from "@/components/SplitSummary";
import { FadeIn } from "@/components/ui/FadeIn";
import { StaggerItem, StaggerList } from "@/components/ui/StaggerList";
import { formatRupee } from "@/lib/formatRupee";
import type { InvoiceItem, SplitResult } from "@/lib/types";

interface SummaryContentProps {
  sessionId: string;
  payerName: string;
  payerMemberId: string;
  results: SplitResult[];
  billTotal: number;
  assignedTotal: number;
  unassignedItems: InvoiceItem[];
  paymentCards: Array<
    SplitResult & { upiLink: string; qrCodeDataUrl: string }
  >;
}

export function SummaryContent({
  sessionId,
  payerName,
  payerMemberId,
  results,
  billTotal,
  assignedTotal,
  unassignedItems,
  paymentCards,
}: SummaryContentProps) {
  return (
    <div className="space-y-6">
      <FadeIn>
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Payment summary
          </h1>
          <p className="text-sm text-zinc-400">
            Paid by <span className="text-emerald-300">{payerName}</span>
            <span className="mx-1.5 text-zinc-600">·</span>
            <span className="font-mono text-xs text-zinc-500">{sessionId}</span>
          </p>
        </header>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Bill total
            </p>
            <p className="mt-1 text-xl font-bold text-zinc-100">
              {formatRupee(billTotal)}
            </p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Assigned
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-300">
              {formatRupee(assignedTotal)}
            </p>
          </div>
        </div>
      </FadeIn>

      {unassignedItems.length > 0 ? (
        <FadeIn delay={0.08}>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            <p className="font-medium">
              {unassignedItems.length} item(s) are not assigned to anyone:
            </p>
            <ul className="mt-1 list-disc pl-5 text-amber-100/80">
              {unassignedItems.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </div>
        </FadeIn>
      ) : null}

      <FadeIn delay={0.1}>
        <SplitSummary results={results} payerMemberId={payerMemberId} />
      </FadeIn>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-100">UPI payments</h2>
        {paymentCards.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No payments are owed by other members.
          </p>
        ) : (
          <StaggerList className="space-y-3">
            {paymentCards.map((card) => (
              <StaggerItem key={card.memberId}>
                <PaymentLinkCard
                  memberName={card.memberName}
                  amount={card.amountOwed}
                  upiLink={card.upiLink}
                  qrCodeDataUrl={card.qrCodeDataUrl}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>

      <div className="flex gap-4 pt-2">
        <Link
          href={`/split/${sessionId}`}
          className="text-sm text-zinc-400 underline transition hover:text-zinc-200"
        >
          Back to split
        </Link>
        <Link
          href="/"
          className="text-sm text-zinc-400 underline transition hover:text-zinc-200"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
