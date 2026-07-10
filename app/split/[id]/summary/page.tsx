import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SummaryContent } from "@/components/SummaryContent";
import {
  calculateSplit,
  getAssignedTotal,
  getUnassignedItems,
} from "@/lib/splitCalculator";
import { getSession } from "@/lib/sessionStore";
import { buildUpiLink, generateQrCodeDataUrl } from "@/lib/upiLink";

interface SummaryPageProps {
  params: Promise<{ id: string }>;
}

function SummaryPageSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="h-8 w-56 animate-pulse rounded-xl bg-white/10" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-white/10" />
    </div>
  );
}

async function SummaryPageContent({ id }: { id: string }) {
  const session = await getSession(id);

  if (!session) {
    notFound();
  }

  const results = calculateSplit(session.members, session.items);
  const unassignedItems = getUnassignedItems(session.items);
  const assignedTotal = getAssignedTotal(session.items);
  const billTotal = session.items.reduce(
    (sum, item) => sum + item.totalAmount,
    0,
  );

  const payerMember = session.members.find(
    (member) => member.id === session.payerMemberId,
  );

  if (!session.payerVpa || !session.payerMemberId || !payerMember) {
    return (
      <div className="space-y-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
        <p className="font-medium">Payer details are missing.</p>
        <p className="text-amber-100/80">
          Go back to the split page and select who paid along with their UPI VPA
          before generating payment links.
        </p>
        <Link
          href={`/split/${id}`}
          className="inline-block font-medium text-emerald-300 underline"
        >
          Back to split
        </Link>
      </div>
    );
  }

  const debtors = results.filter(
    (result) =>
      result.amountOwed > 0 && result.memberId !== session.payerMemberId,
  );

  const paymentCards = await Promise.all(
    debtors.map(async (result) => {
      const upiLink = buildUpiLink(
        session.payerVpa!,
        result.amountOwed,
        payerMember.name,
      );
      const qrCodeDataUrl = await generateQrCodeDataUrl(upiLink);

      return {
        ...result,
        upiLink,
        qrCodeDataUrl,
      };
    }),
  );

  return (
    <SummaryContent
      sessionId={session.id}
      payerName={payerMember.name}
      payerMemberId={session.payerMemberId}
      results={results}
      billTotal={billTotal}
      assignedTotal={assignedTotal}
      unassignedItems={unassignedItems}
      paymentCards={paymentCards}
    />
  );
}

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { id } = await params;

  return (
    <main className="flex flex-1 flex-col py-4">
      <Suspense fallback={<SummaryPageSkeleton />}>
        <SummaryPageContent id={id} />
      </Suspense>
    </main>
  );
}
