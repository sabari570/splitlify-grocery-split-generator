"use client";

import { memo, useCallback } from "react";

import { MemberChip } from "@/components/ui/MemberChip";
import { formatRupee } from "@/lib/formatRupee";
import type { InvoiceItem, Member } from "@/lib/types";

interface ItemCardProps {
  item: InvoiceItem;
  members: Member[];
  index: number;
  onSharedByChange: (itemId: string, memberIds: string[]) => void;
}

const ACCENT_COLORS = [
  "#10b981",
  "#8b5cf6",
  "#38bdf8",
  "#f59e0b",
  "#f43f5e",
  "#6366f1",
];

export const ItemCard = memo(function ItemCard({
  item,
  members,
  index,
  onSharedByChange,
}: ItemCardProps) {
  const isAssigned = item.sharedBy.length > 0;
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

  const toggleMember = useCallback(
    (memberId: string) => {
      const nextSharedBy = item.sharedBy.includes(memberId)
        ? item.sharedBy.filter((id) => id !== memberId)
        : [...item.sharedBy, memberId];

      onSharedByChange(item.id, nextSharedBy);
    },
    [item.id, item.sharedBy, onSharedByChange],
  );

  return (
    <section
      className={`item-card relative overflow-hidden rounded-2xl border p-4 pl-5 transition-[border-color,box-shadow] duration-150 ${
        isAssigned
          ? "border-emerald-400/35 bg-zinc-900/80"
          : "border-white/8 bg-zinc-900/70"
      }`}
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: accentColor }}
        aria-hidden
      />

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isAssigned ? "bg-emerald-400" : "bg-amber-400"
                }`}
                aria-hidden
              />
              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                {isAssigned ? "Assigned" : "Needs assignment"}
              </span>
            </div>
            <h3 className="line-clamp-2 font-medium text-zinc-100">
              {item.name}
            </h3>
            <p className="mt-0.5 text-sm text-zinc-400">Qty {item.quantity}</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-sm font-semibold text-emerald-300">
            {formatRupee(item.totalAmount)}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-300">Shared by</p>
          <div className="flex flex-wrap gap-2">
            {members.map((member, memberIndex) => (
              <MemberChip
                key={member.id}
                name={member.name}
                selected={item.sharedBy.includes(member.id)}
                onToggle={() => toggleMember(member.id)}
                colorIndex={memberIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});
