import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { createSession } from "@/lib/sessionStore";
import type { CreateSessionInput, Member } from "@/lib/types";
import { validateMemberNames, ValidationError } from "@/lib/validation";

function isCreateSessionInput(value: unknown): value is CreateSessionInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (!Array.isArray(record.members)) {
    return false;
  }

  return record.members.every(
    (member) =>
      member &&
      typeof member === "object" &&
      typeof (member as Record<string, unknown>).name === "string",
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isCreateSessionInput(body)) {
      return NextResponse.json(
        {
          error:
            "Invalid request body. Expected { members: { name: string }[] }.",
        },
        { status: 400 },
      );
    }

    const trimmedNames = validateMemberNames(
      body.members.map((member) => member.name),
    );

    const members: Member[] = trimmedNames.map((name) => ({
      id: nanoid(),
      name,
    }));

    const session = await createSession(members);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create session." },
      { status: 500 },
    );
  }
}
