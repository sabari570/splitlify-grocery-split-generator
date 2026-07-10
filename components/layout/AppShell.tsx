"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div className="gradient-bg" aria-hidden />

      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        {showNav ? (
          <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-5">
            <Link href="/" className="group flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-violet-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
                S
              </span>
              <span className="text-lg font-semibold tracking-tight text-zinc-100 group-hover:text-white">
                Splitlify
              </span>
            </Link>
          </header>
        ) : null}

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-10">
          {children}
        </div>
      </div>
    </div>
  );
}
