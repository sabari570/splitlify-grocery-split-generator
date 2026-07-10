import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SplitWorkspace } from "@/components/SplitWorkspace";
import { getSession } from "@/lib/sessionStore";

interface SplitPageProps {
  params: Promise<{ id: string }>;
}

function SplitPageSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="h-8 w-48 animate-pulse rounded-xl bg-white/10" />
      <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
      <div className="h-40 animate-pulse rounded-2xl bg-white/10" />
      <div className="h-48 animate-pulse rounded-2xl bg-white/10" />
    </div>
  );
}

async function SplitPageContent({ id }: { id: string }) {
  const session = await getSession(id);

  if (!session) {
    notFound();
  }

  return <SplitWorkspace session={session} />;
}

export default async function SplitPage({ params }: SplitPageProps) {
  const { id } = await params;

  return (
    <main className="flex flex-1 flex-col py-4">
      <Suspense fallback={<SplitPageSkeleton />}>
        <SplitPageContent id={id} />
      </Suspense>

      <div className="mt-8">
        <Link
          href="/"
          className="text-sm text-zinc-400 underline transition hover:text-zinc-200"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
