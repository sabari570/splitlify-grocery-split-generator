import { describe, expect, it } from "vitest";

import { calculateSplit, getAssignedTotal, getUnassignedItems } from "@/lib/splitCalculator";
import type { InvoiceItem, Member } from "@/lib/types";

const members: Member[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
  { id: "c", name: "Carol" },
];

describe("calculateSplit", () => {
  it("splits equally between assigned members", () => {
    const items: InvoiceItem[] = [
      {
        id: "1",
        name: "Milk",
        quantity: 1,
        totalAmount: 90,
        sharedBy: ["a", "b"],
      },
    ];

    const results = calculateSplit(members, items);
    const alice = results.find((result) => result.memberId === "a");
    const bob = results.find((result) => result.memberId === "b");
    const carol = results.find((result) => result.memberId === "c");

    expect(alice?.amountOwed).toBe(45);
    expect(bob?.amountOwed).toBe(45);
    expect(carol?.amountOwed).toBe(0);
  });

  it("handles uneven splits across multiple items", () => {
    const items: InvoiceItem[] = [
      {
        id: "1",
        name: "Bread",
        quantity: 1,
        totalAmount: 100,
        sharedBy: ["a", "b", "c"],
      },
      {
        id: "2",
        name: "Coffee",
        quantity: 1,
        totalAmount: 50,
        sharedBy: ["a"],
      },
    ];

    const results = calculateSplit(members, items);
    const alice = results.find((result) => result.memberId === "a");
    const bob = results.find((result) => result.memberId === "b");
    const carol = results.find((result) => result.memberId === "c");
    const totalOwed = results.reduce((sum, result) => sum + result.amountOwed, 0);

    expect(alice!.amountOwed).toBeGreaterThan(bob!.amountOwed);
    expect(bob!.amountOwed).toBeCloseTo(carol!.amountOwed, 2);
    expect(totalOwed).toBe(150);
  });

  it("ignores unassigned items", () => {
    const items: InvoiceItem[] = [
      {
        id: "1",
        name: "Eggs",
        quantity: 1,
        totalAmount: 60,
        sharedBy: [],
      },
      {
        id: "2",
        name: "Rice",
        quantity: 1,
        totalAmount: 40,
        sharedBy: ["a", "b"],
      },
    ];

    const results = calculateSplit(members, items);
    const totalOwed = results.reduce((sum, result) => sum + result.amountOwed, 0);

    expect(totalOwed).toBe(40);
    expect(getUnassignedItems(items)).toHaveLength(1);
    expect(getAssignedTotal(items)).toBe(40);
  });

  it("distributes rounding remainder without losing cents", () => {
    const items: InvoiceItem[] = [
      {
        id: "1",
        name: "Snack",
        quantity: 1,
        totalAmount: 100,
        sharedBy: ["a", "b", "c"],
      },
    ];

    const results = calculateSplit(members, items);
    const totalOwed = results.reduce((sum, result) => sum + result.amountOwed, 0);

    expect(totalOwed).toBe(100);
  });
});
