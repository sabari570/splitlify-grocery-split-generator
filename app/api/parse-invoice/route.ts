import { extractText, getDocumentProxy } from "unpdf";
import { NextResponse } from "next/server";

import { InvoiceParseError, parseInvoiceText } from "@/lib/invoiceParser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A PDF file is required." },
        { status: 400 },
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    const items = parseInvoiceText(text);

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof InvoiceParseError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json(
      { error: "Failed to parse invoice." },
      { status: 500 },
    );
  }
}
