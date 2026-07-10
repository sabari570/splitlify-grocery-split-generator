import { NextResponse } from "next/server";

import { getSession, saveSession, updateSession } from "@/lib/sessionStore";
import type { InvoiceItem, Member, SplitSession, UpdateSessionInput } from "@/lib/types";
import { ValidationError } from "@/lib/validation";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isMember(value: unknown): value is Member {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Member).id === "string" &&
    typeof (value as Member).name === "string"
  );
}

function isInvoiceItem(value: unknown): value is InvoiceItem {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as InvoiceItem).id === "string" &&
    typeof (value as InvoiceItem).name === "string" &&
    typeof (value as InvoiceItem).quantity === "number" &&
    typeof (value as InvoiceItem).totalAmount === "number" &&
    Array.isArray((value as InvoiceItem).sharedBy) &&
    (value as InvoiceItem).sharedBy.every((entry) => typeof entry === "string")
  );
}

function isUpdateSessionInput(value: unknown): value is UpdateSessionInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (record.members !== undefined) {
    if (!Array.isArray(record.members) || !record.members.every(isMember)) {
      return false;
    }
  }

  if (record.items !== undefined) {
    if (!Array.isArray(record.items) || !record.items.every(isInvoiceItem)) {
      return false;
    }
  }

  if (
    record.payerVpa !== undefined &&
    record.payerVpa !== null &&
    typeof record.payerVpa !== "string"
  ) {
    return false;
  }

  if (
    record.payerMemberId !== undefined &&
    record.payerMemberId !== null &&
    typeof record.payerMemberId !== "string"
  ) {
    return false;
  }

  return true;
}

/** Full client snapshot — allows Redis SET without a prior GET. */
function isFullSessionSnapshot(
  value: unknown,
): value is Omit<SplitSession, "id"> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    Array.isArray(record.members) &&
    record.members.every(isMember) &&
    Array.isArray(record.items) &&
    record.items.every(isInvoiceItem) &&
    typeof record.createdAt === "string" &&
    (record.payerVpa === null || typeof record.payerVpa === "string") &&
    (record.payerMemberId === null || typeof record.payerMemberId === "string")
  );
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const session = await getSession(id);

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch session." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();

    if (isFullSessionSnapshot(body)) {
      const session = await saveSession({
        id,
        members: body.members,
        items: body.items,
        payerVpa: body.payerVpa,
        payerMemberId: body.payerMemberId,
        createdAt: body.createdAt,
      });

      return NextResponse.json(session);
    }

    if (!isUpdateSessionInput(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const session = await updateSession(id, body);

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update session." },
      { status: 500 },
    );
  }
}
