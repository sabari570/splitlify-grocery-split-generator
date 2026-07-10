import type { SplitSession } from "@/lib/types";

const CACHE_PREFIX = "splitlify:session:";

function cacheKey(sessionId: string): string {
  return `${CACHE_PREFIX}${sessionId}`;
}

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function readSessionCache(sessionId: string): SplitSession | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(cacheKey(sessionId));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SplitSession;
    if (!parsed || parsed.id !== sessionId || !Array.isArray(parsed.members)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeSessionCache(session: SplitSession): void {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    sessionStorage.setItem(cacheKey(session.id), JSON.stringify(session));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function clearSessionCache(sessionId: string): void {
  if (!canUseSessionStorage()) {
    return;
  }

  try {
    sessionStorage.removeItem(cacheKey(sessionId));
  } catch {
    // Ignore.
  }
}
