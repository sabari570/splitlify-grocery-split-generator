import { describe, expect, it } from "vitest";

import { InvoiceParseError, parseInvoiceText } from "@/lib/invoiceParser";

/** Older Zepto layout: Name HSN Qty ... Total (no MRP before HSN) */
const ZEPTO_LEGACY_FIXTURE = `
TAX INVOICE/BILL OF SUPPLY
Invoice No. : D270524-977303 Order No : 7C9B2PKDK70165
SR No Item & Description HSN Qty Rate Disc. Taxable Amt. CGST SGST Cess Total Amt.
1 Khetika Urad Gota White 500 g 07133910 1 147.62 34.19% 97.14 2.5% 2.5% 2.43 2.43 0.0 0.0 102.00
2 Tata Sampann Unpolished Toor Dal 500 g 07139090 1 128.57 11.11% 114.29 2.5% 2.5% 2.85 2.85 0.0 0.0 120.00
Item Total 222.0
Delivery Fee (Inclusive of Taxes) 28.49
Platform Fee (Inclusive of Taxes) 3.0
`;

/**
 * Real Geddit/Zepto PDF text (MRP sits between description and HSN).
 * Extracted from zepto_invoice_019e9c58-...pdf
 */
const REAL_ZEPTO_FIXTURE = `
Seller Name: Geddit Convenience Private Limited Kulapurakkal Building, Sy no 292/3-3-2, Padamugal, Kakkanad, Kochi - 682030 GSTIN: 32AAJCG0980D1ZX FSSAI: 11521998000248 TAX INVOICE/BILL OF SUPPLY Invoice No.: 260632G000099185 Order No.: KPOVSKKAJ23559A Place Of Supply : KERALA (32) Date : 06-06-2026 Bill To Ship To Sabari Krishna R C1, CY Hut Residency, 288J+573, Vazhakkala, Kakkanad, Kochi, Kerala 682021, India C1, CY Hut Residency, 288J+573, Vazhakkala, Kakkanad, Kochi, Kerala 682021, India SR No Item & Description Unit MRP/RSP HSN Qty Product Rate Disc. Taxable Amt. CGST S/UT GST CGST Amt. S/UT GST Amt. Cess Cess Amt. Total Amt. 1 Appy Fizz Apple Soft Drink | Pet | Fizzy & Refreshing 1 pc (250 ml) 20.00 22021010 1 14.29 0.00% 14.29 20.00% 20.00% 2.86 2.86 0.00% + 0.00 0.00 20.00 2 Cheetos Masala Balls | Crunchy Corn Snacks 1 pack (84 g) 48.00 21069099 1 45.72 31.25% 31.43 2.50% 2.50% 0.79 0.79 0.00% + 0.00 0.00 33.00 3 Cheetos Masala Balls | Crunchy Corn Snacks 1 pack (28 g) 10.00 21069099 1 9.52 0.00% 9.52 2.50% 2.50% 0.24 0.24 0.00% + 0.00 0.00 10.00 4 MTR Masala - Puliogare Powder (Pouch) 1 pack (100 g) 75.00 09109100 1 71.42 14.66% 60.95 2.50% 2.50% 1.52 1.52 0.00% + 0.00 0.00 64.00 116.19 5.41 5.41 0.00 127.01 Item Total 127.01 Invoice Value 127.01
`;

describe("parseInvoiceText", () => {
  it("extracts clean names and totals from a real Zepto PDF", () => {
    const items = parseInvoiceText(REAL_ZEPTO_FIXTURE);

    expect(items).toHaveLength(4);

    expect(items[0]).toMatchObject({
      name: "Appy Fizz Apple Soft Drink | Pet | Fizzy & Refreshing 1 pc (250 ml)",
      quantity: 1,
      totalAmount: 20,
    });

    expect(items[1]).toMatchObject({
      name: "Cheetos Masala Balls | Crunchy Corn Snacks 1 pack (84 g)",
      quantity: 1,
      totalAmount: 33,
    });

    expect(items[2]).toMatchObject({
      name: "Cheetos Masala Balls | Crunchy Corn Snacks 1 pack (28 g)",
      quantity: 1,
      totalAmount: 10,
    });

    expect(items[3]).toMatchObject({
      name: "MTR Masala - Puliogare Powder (Pouch) 1 pack (100 g)",
      quantity: 1,
      totalAmount: 64,
    });

    const sum = items.reduce((total, item) => total + item.totalAmount, 0);
    // Printed line totals sum to 127; invoice value is 127.01 due to tax rounding.
    expect(sum).toBe(127);

    for (const item of items) {
      expect(item.name).not.toMatch(/\d+\.\d{2}$/);
      expect(item.name).not.toMatch(/seller name|gstin|bill to/i);
    }
  });

  it("still extracts fees from invoices that include them", () => {
    const items = parseInvoiceText(ZEPTO_LEGACY_FIXTURE);
    const delivery = items.find((item) => item.name === "Delivery Fee");
    const platform = items.find((item) => item.name === "Platform Fee");

    expect(delivery?.totalAmount).toBe(28.49);
    expect(platform?.totalAmount).toBe(3);
  });

  it("throws when no items can be parsed", () => {
    expect(() => parseInvoiceText("Thank you for shopping")).toThrow(
      InvoiceParseError,
    );
  });

  it("throws on empty text", () => {
    expect(() => parseInvoiceText("   ")).toThrow(InvoiceParseError);
  });
});
