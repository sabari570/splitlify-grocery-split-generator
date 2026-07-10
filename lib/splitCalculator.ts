import type { InvoiceItem, Member, SplitResult } from "@/lib/types";

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateSplit(
  members: Member[],
  items: InvoiceItem[],
): SplitResult[] {
  const totals = new Map<string, number>();

  for (const member of members) {
    totals.set(member.id, 0);
  }

  for (const item of items) {
    if (item.sharedBy.length === 0) {
      continue;
    }

    const share = item.totalAmount / item.sharedBy.length;

    for (const memberId of item.sharedBy) {
      const current = totals.get(memberId) ?? 0;
      totals.set(memberId, current + share);
    }
  }

  const rawResults = members.map((member) => ({
    memberId: member.id,
    memberName: member.name,
    rawAmount: totals.get(member.id) ?? 0,
  }));

  const rounded = rawResults.map((result) => ({
    ...result,
    amountOwed: roundToTwoDecimals(result.rawAmount),
  }));

  const targetTotal = roundToTwoDecimals(
    items
      .filter((item) => item.sharedBy.length > 0)
      .reduce((sum, item) => sum + item.totalAmount, 0),
  );

  const roundedTotal = roundToTwoDecimals(
    rounded.reduce((sum, result) => sum + result.amountOwed, 0),
  );

  const remainder = roundToTwoDecimals(targetTotal - roundedTotal);
  const remainderCents = Math.round(remainder * 100);

  if (remainderCents !== 0) {
    const fractionalParts = rawResults
      .map((result, index) => ({
        index,
        fraction: result.rawAmount - Math.floor(result.rawAmount * 100) / 100,
      }))
      .sort((a, b) => b.fraction - a.fraction);

    const step = remainderCents > 0 ? 0.01 : -0.01;
    const steps = Math.abs(remainderCents);

    for (let i = 0; i < steps; i += 1) {
      const targetIndex = fractionalParts[i % fractionalParts.length].index;
      rounded[targetIndex].amountOwed = roundToTwoDecimals(
        rounded[targetIndex].amountOwed + step,
      );
    }
  }

  return rounded.map((result) => ({
    memberId: result.memberId,
    memberName: result.memberName,
    amountOwed: result.amountOwed,
  }));
}

export function getUnassignedItems(items: InvoiceItem[]): InvoiceItem[] {
  return items.filter((item) => item.sharedBy.length === 0);
}

export function getAssignedTotal(items: InvoiceItem[]): number {
  return items
    .filter((item) => item.sharedBy.length > 0)
    .reduce((sum, item) => sum + item.totalAmount, 0);
}
