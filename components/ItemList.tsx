"use client";

import { useCallback } from "react";

import { ItemCard } from "@/components/ItemCard";
import { MotionCard } from "@/components/ui/MotionCard";
import type { InvoiceItem, Member } from "@/lib/types";

interface ItemListProps {
  items: InvoiceItem[];
  members: Member[];
  onItemsChange: (items: InvoiceItem[]) => void;
}

export function ItemList({ items, members, onItemsChange }: ItemListProps) {
  const handleSharedByChange = useCallback(
    (itemId: string, memberIds: string[]) => {
      const nextItems = items.map((item) =>
        item.id === itemId ? { ...item, sharedBy: memberIds } : item,
      );

      onItemsChange(nextItems);
    },
    [items, onItemsChange],
  );

  if (items.length === 0) {
    return (
      <MotionCard static>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-2xl">
            🧾
          </span>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">No items yet</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Upload an invoice to get started.
            </p>
          </div>
        </div>
      </MotionCard>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-100">Items</h2>
        <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
          {items.length}
        </span>
      </div>

      <ul className="item-list space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="item-list-row"
            style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
          >
            <ItemCard
              item={item}
              members={members}
              index={index}
              onSharedByChange={handleSharedByChange}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
