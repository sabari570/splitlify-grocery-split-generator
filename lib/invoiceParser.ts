import { nanoid } from "nanoid";

import type { InvoiceItem } from "@/lib/types";

export class InvoiceParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvoiceParseError";
  }
}

/**
 * Zepto / Geddit invoice row layout (after table headers):
 * SR No | Item & Description | MRP/RSP | HSN | Qty | Product Rate | Disc% |
 * Taxable Amt | CGST% | SGST% | CGST Amt | SGST Amt | Cess% | Cess Amt | Total Amt
 *
 * Example:
 * 1 Appy Fizz ... 1 pc (250 ml) 20.00 22021010 1 14.29 0.00% ... 20.00
 */
const ROW_REGEX =
  /(?:^|\s)(\d{1,2})\s+([A-Z][\s\S]*?)\s+(\d+\.\d{2})\s+(\d{8})\s+(\d+)\s+([\d.%+\s]+?)(?=\s+\d{1,2}\s+[A-Z]|\s+Item\s+Total|\s*$)/gi;

const FEE_PATTERNS = [
  { pattern: /delivery\s+fee[^0-9]*(\d+(?:\.\d{1,2})?)/i, label: "Delivery Fee" },
  { pattern: /platform\s+fee[^0-9]*(\d+(?:\.\d{1,2})?)/i, label: "Platform Fee" },
  {
    pattern: /(?:packaging|handling)\s+(?:fee|charge)[^0-9]*(\d+(?:\.\d{1,2})?)/i,
    label: "Packaging / Handling Fee",
  },
];

const HEADER_NOISE_REGEX =
  /seller name|gstin|fssai|tax invoice|invoice no|order no|place of supply|bill to|ship to|sr no|item & description|unit mrp|taxable amt|cess amt|total amt/i;

function normalizeText(rawText: string): string {
  return rawText.replace(/\s+/g, " ").trim();
}

function findItemTableBody(text: string): string {
  const totalAmtMatch = text.match(/Total\s*Amt\.?\s*/i);
  if (totalAmtMatch?.index !== undefined) {
    return text.slice(totalAmtMatch.index + totalAmtMatch[0].length);
  }

  const headerMatch = text.match(/SR\s*No\s+Item\s*&\s*Description/i);
  if (headerMatch?.index !== undefined) {
    return text.slice(headerMatch.index);
  }

  return text;
}

/**
 * Strip the column-summary totals that appear just before "Item Total",
 * e.g. "116.19 5.41 5.41 0.00 127.01 Item Total 127.01"
 */
function stripTrailingSummary(rowsSection: string): string {
  return rowsSection
    .replace(
      /\s+\d+\.\d{2}\s+\d+\.\d{2}\s+\d+\.\d{2}\s+\d+\.\d{2}\s+\d+\.\d{2}\s*$/,
      "",
    )
    .trim();
}

function extractLineTotal(numericTail: string): number {
  const amounts = [...numericTail.matchAll(/(\d+\.\d{2})/g)].map((match) =>
    Number.parseFloat(match[1]),
  );

  if (amounts.length === 0) {
    return 0;
  }

  return amounts[amounts.length - 1];
}

function cleanProductName(rawName: string): string {
  let name = rawName.trim().replace(/\s+/g, " ");

  // Drop any leftover header bleed before the real product name.
  if (HEADER_NOISE_REGEX.test(name)) {
    const afterHeader = name.split(/Total\s*Amt\.?\s*/i).pop() ?? name;
    name = afterHeader.replace(/^\d{1,2}\s+/, "").trim();
  }

  // Strip a trailing MRP that may have leaked into the name capture.
  name = name.replace(/\s+\d+\.\d{2}$/, "").trim();

  if (name.length > 120) {
    name = name.slice(0, 120).trim();
  }

  return name;
}

function isLikelyProductName(name: string): boolean {
  if (name.length < 2) {
    return false;
  }

  if (HEADER_NOISE_REGEX.test(name)) {
    return false;
  }

  return /[A-Za-z]{2,}/.test(name);
}

function parseItemRows(text: string): InvoiceItem[] {
  const tableBody = findItemTableBody(text);
  const itemTotalIndex = tableBody.search(/\bItem\s+Total\b/i);
  let rowsSection =
    itemTotalIndex >= 0 ? tableBody.slice(0, itemTotalIndex) : tableBody;
  rowsSection = stripTrailingSummary(rowsSection);

  const items: InvoiceItem[] = [];
  const rowMatches = [...rowsSection.matchAll(ROW_REGEX)];

  for (const match of rowMatches) {
    const rawName = match[2];
    const quantity = Number.parseInt(match[5], 10);
    const numericTail = match[6];
    const totalAmount = extractLineTotal(numericTail);
    const name = cleanProductName(rawName);

    if (totalAmount <= 0 || !isLikelyProductName(name)) {
      continue;
    }

    items.push({
      id: nanoid(),
      name,
      quantity: quantity > 0 ? quantity : 1,
      totalAmount: Math.round(totalAmount * 100) / 100,
      sharedBy: [],
    });
  }

  return items;
}

function parseFeeItems(text: string): InvoiceItem[] {
  const fees: InvoiceItem[] = [];

  for (const { pattern, label } of FEE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) {
      continue;
    }

    const amount = Number.parseFloat(match[1]);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 50_000) {
      continue;
    }

    fees.push({
      id: nanoid(),
      name: label,
      quantity: 1,
      totalAmount: Math.round(amount * 100) / 100,
      sharedBy: [],
    });
  }

  return fees;
}

export function parseInvoiceText(rawText: string): InvoiceItem[] {
  if (!rawText.trim()) {
    throw new InvoiceParseError("Invoice text is empty.");
  }

  const text = normalizeText(rawText);
  const itemRows = parseItemRows(text);
  const feeItems = parseFeeItems(text);
  const items = [...itemRows, ...feeItems];

  if (items.length === 0) {
    throw new InvoiceParseError(
      "Could not extract any line items from this invoice. Try adding items manually.",
    );
  }

  return items;
}
