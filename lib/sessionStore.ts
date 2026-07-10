import { nanoid } from "nanoid";

import { getRedisClient } from "@/lib/redis";
import type { Member, SplitSession, UpdateSessionInput } from "@/lib/types";
import { validateMembers, validateSessionUpdate } from "@/lib/validation";

const SESSION_KEY_PREFIX = "session:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const globalForSessionStore = globalThis as unknown as {
  memoryStore: Map<string, SplitSession> | undefined;
};

function getMemoryStore(): Map<string, SplitSession> {
  if (!globalForSessionStore.memoryStore) {
    globalForSessionStore.memoryStore = new Map<string, SplitSession>();
  }
  return globalForSessionStore.memoryStore;
}

function sessionKey(id: string): string {
  return `${SESSION_KEY_PREFIX}${id}`;
}

async function persistSession(session: SplitSession): Promise<void> {
  const redis = getRedisClient();

  if (redis) {
    await redis.set(sessionKey(session.id), session, {
      ex: SESSION_TTL_SECONDS,
    });
    return;
  }

  getMemoryStore().set(session.id, session);
}

async function readSession(id: string): Promise<SplitSession | null> {
  const redis = getRedisClient();

  if (redis) {
    const session = await redis.get<SplitSession>(sessionKey(id));
    return session ?? null;
  }

  return getMemoryStore().get(id) ?? null;
}

export async function createSession(members: Member[]): Promise<SplitSession> {
  validateMembers(members);

  const session: SplitSession = {
    id: nanoid(),
    members,
    items: [],
    payerVpa: null,
    payerMemberId: null,
    createdAt: new Date().toISOString(),
  };

  await persistSession(session);
  return session;
}

export async function getSession(id: string): Promise<SplitSession | null> {
  return readSession(id);
}

/**
 * Persist a full session snapshot without a prior Redis GET.
 * Used by clients that already hold the working copy locally.
 */
export async function saveSession(session: SplitSession): Promise<SplitSession> {
  const validated = validateSessionUpdate(session, {
    members: session.members,
    items: session.items,
    payerVpa: session.payerVpa,
    payerMemberId: session.payerMemberId,
  });

  const next: SplitSession = {
    id: session.id,
    createdAt: session.createdAt,
    members: validated.members ?? session.members,
    items: validated.items ?? session.items,
    payerVpa: validated.payerVpa ?? null,
    payerMemberId: validated.payerMemberId ?? null,
  };

  await persistSession(next);
  return next;
}

export async function updateSession(
  id: string,
  partial: UpdateSessionInput,
): Promise<SplitSession | null> {
  const existing = await readSession(id);

  if (!existing) {
    return null;
  }

  const validated = validateSessionUpdate(existing, partial);

  const updated: SplitSession = {
    ...existing,
    members: validated.members ?? existing.members,
    items: validated.items ?? existing.items,
    payerVpa: validated.payerVpa ?? null,
    payerMemberId: validated.payerMemberId ?? null,
  };

  await persistSession(updated);
  return updated;
}

export async function deleteSession(id: string): Promise<boolean> {
  const redis = getRedisClient();

  if (redis) {
    const deleted = await redis.del(sessionKey(id));
    return deleted > 0;
  }

  return getMemoryStore().delete(id);
}
