"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { InvoiceUploader } from "@/components/InvoiceUploader";
import { ItemList } from "@/components/ItemList";
import { PayerSetupForm } from "@/components/PayerSetupForm";
import { SplitProgress } from "@/components/SplitProgress";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  readSessionCache,
  writeSessionCache,
} from "@/lib/clientSessionCache";
import type { InvoiceItem, SplitSession } from "@/lib/types";

interface SplitWorkspaceProps {
  session: SplitSession;
}

/** Longer debounce — chip toggles stay local; Redis writes are batched. */
const SAVE_DEBOUNCE_MS = 1500;

function getSummaryBlockers(session: SplitSession, items: InvoiceItem[]): string[] {
  const blockers: string[] = [];

  if (items.length === 0) {
    blockers.push("Add at least one item.");
  }

  if (items.some((item) => item.sharedBy.length === 0)) {
    blockers.push("Assign every item to at least one member.");
  }

  if (!session.payerMemberId) {
    blockers.push("Select who paid.");
  }

  if (!session.payerVpa) {
    blockers.push("Enter the payer UPI VPA.");
  }

  return blockers;
}

function buildLocalSession(
  base: SplitSession,
  items: InvoiceItem[],
  overrides?: Partial<SplitSession>,
): SplitSession {
  return {
    ...base,
    items,
    ...overrides,
  };
}

export function SplitWorkspace({ session: serverSession }: SplitWorkspaceProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [session, setSession] = useState<SplitSession>(() => {
    const cached = readSessionCache(serverSession.id);
    return cached ?? serverSession;
  });
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    const cached = readSessionCache(serverSession.id);
    return cached?.items ?? serverSession.items;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(session);
  const itemsRef = useRef(items);
  const dirtyRef = useRef(false);
  const didSyncCacheRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
    writeSessionCache(session);
  }, [session]);

  useEffect(() => {
    itemsRef.current = items;
    writeSessionCache(buildLocalSession(sessionRef.current, items));
  }, [items]);

  const summaryBlockers = useMemo(
    () => getSummaryBlockers(session, items),
    [session, items],
  );

  const persistSessionSnapshot = useCallback(async (snapshot: SplitSession) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/session/${snapshot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: snapshot.members,
          items: snapshot.items,
          payerVpa: snapshot.payerVpa,
          payerMemberId: snapshot.payerMemberId,
          createdAt: snapshot.createdAt,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to save session.");
      }

      const updatedSession = (await response.json()) as SplitSession;
      setSession(updatedSession);
      setItems(updatedSession.items);
      writeSessionCache(updatedSession);
      dirtyRef.current = false;
      return updatedSession;
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save session.";
      setError(message);
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const schedulePersist = useCallback(
    (snapshot: SplitSession) => {
      dirtyRef.current = true;
      writeSessionCache(snapshot);

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        void persistSessionSnapshot(snapshot).catch(() => {
          // Error already surfaced in state.
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [persistSessionSnapshot],
  );

  const flushPersist = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    if (!dirtyRef.current) {
      return sessionRef.current;
    }

    const snapshot = buildLocalSession(sessionRef.current, itemsRef.current);
    return persistSessionSnapshot(snapshot);
  }, [persistSessionSnapshot]);

  // If we restored unsaved work from sessionStorage, push it to Redis once.
  useEffect(() => {
    if (didSyncCacheRef.current) {
      return;
    }
    didSyncCacheRef.current = true;

    const cached = readSessionCache(serverSession.id);
    if (!cached) {
      writeSessionCache(serverSession);
      return;
    }

    const cacheDiffers =
      JSON.stringify(cached.items) !== JSON.stringify(serverSession.items) ||
      cached.payerVpa !== serverSession.payerVpa ||
      cached.payerMemberId !== serverSession.payerMemberId;

    if (cacheDiffers) {
      schedulePersist(cached);
    }
  }, [schedulePersist, serverSession]);

  useEffect(() => {
    function snapshotBody(snapshot: SplitSession): string {
      return JSON.stringify({
        members: snapshot.members,
        items: snapshot.items,
        payerVpa: snapshot.payerVpa,
        payerMemberId: snapshot.payerMemberId,
        createdAt: snapshot.createdAt,
      });
    }

    function flushKeepalive() {
      if (!dirtyRef.current) {
        return;
      }

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      const snapshot = buildLocalSession(sessionRef.current, itemsRef.current);
      writeSessionCache(snapshot);

      void fetch(`/api/session/${snapshot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: snapshotBody(snapshot),
        keepalive: true,
      });
      dirtyRef.current = false;
    }

    function flushOnHide() {
      if (document.visibilityState === "hidden") {
        flushKeepalive();
      }
    }

    document.addEventListener("visibilitychange", flushOnHide);
    window.addEventListener("pagehide", flushKeepalive);

    return () => {
      document.removeEventListener("visibilitychange", flushOnHide);
      window.removeEventListener("pagehide", flushKeepalive);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const handleParsed = useCallback(
    (parsedItems: InvoiceItem[]) => {
      setItems(parsedItems);
      const snapshot = buildLocalSession(sessionRef.current, parsedItems);
      schedulePersist(snapshot);
    },
    [schedulePersist],
  );

  const handleManualItem = useCallback(
    (item: InvoiceItem) => {
      const nextItems = [...itemsRef.current, item];
      setItems(nextItems);
      const snapshot = buildLocalSession(sessionRef.current, nextItems);
      schedulePersist(snapshot);
    },
    [schedulePersist],
  );

  const handleItemsChange = useCallback(
    (nextItems: InvoiceItem[]) => {
      setItems(nextItems);
      const snapshot = buildLocalSession(sessionRef.current, nextItems);
      schedulePersist(snapshot);
    },
    [schedulePersist],
  );

  const handlePayerSaved = useCallback((updatedSession: SplitSession) => {
    setSession(updatedSession);
    setItems(updatedSession.items);
    writeSessionCache(updatedSession);
    dirtyRef.current = false;
  }, []);

  async function handleViewSummary() {
    setIsNavigating(true);
    setError(null);

    try {
      await flushPersist();
      router.push(`/split/${session.id}/summary`);
    } catch {
      setIsNavigating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Split session
          </h1>
          <p className="text-sm text-zinc-400">
            {session.members.length} members ·{" "}
            <span className="font-mono text-xs text-zinc-500">{session.id}</span>
          </p>
        </div>
        <SplitProgress session={session} items={items} />
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          1 · Upload
        </h2>
        <InvoiceUploader onParsed={handleParsed} onManualItem={handleManualItem} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          2 · Assign
        </h2>
        <ItemList
          items={items}
          members={session.members}
          onItemsChange={handleItemsChange}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          3 · Payer
        </h2>
        <PayerSetupForm
          sessionId={session.id}
          members={session.members}
          payerMemberId={session.payerMemberId}
          payerVpa={session.payerVpa}
          sessionSnapshot={buildLocalSession(session, items)}
          onSaved={handlePayerSaved}
        />
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {summaryBlockers.length === 0 ? (
          <Button
            type="button"
            onClick={() => void handleViewSummary()}
            disabled={isNavigating || isSaving}
          >
            {isNavigating ? "Saving..." : "View summary →"}
          </Button>
        ) : (
          <Button type="button" disabled>
            View summary →
          </Button>
        )}
        {isSaving ? <Spinner label="Saving..." /> : null}
        <Link
          href="/"
          className="text-sm text-zinc-500 underline hover:text-zinc-300 sm:ml-2"
        >
          Home
        </Link>
      </div>

      <AnimatePresence>
        {summaryBlockers.length > 0 ? (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100"
          >
            <p className="font-medium">Before viewing summary:</p>
            <ul className="mt-1 list-disc pl-5 text-amber-100/80">
              {summaryBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}
