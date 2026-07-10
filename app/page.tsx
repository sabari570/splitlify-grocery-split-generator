import { FadeIn } from "@/components/ui/FadeIn";
import { MemberSetupForm } from "@/components/MemberSetupForm";

const STEPS = [
  { label: "Add friends", emoji: "👥" },
  { label: "Upload bill", emoji: "📄" },
  { label: "Pay via UPI", emoji: "💸" },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center py-8">
      <FadeIn className="mb-8 space-y-5 text-center">
        <h1 className="gradient-text text-4xl font-bold tracking-tight sm:text-5xl">
          Splitlify
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-zinc-400">
          Split grocery bills with friends. Upload an invoice, assign items, and
          settle up with UPI — no awkward math.
        </p>

        <div className="mx-auto flex max-w-sm items-center justify-between gap-2">
          {STEPS.map((step, index) => (
            <div key={step.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg">
                {step.emoji}
              </span>
              <span className="text-[11px] font-medium text-zinc-400">
                {index + 1}. {step.label}
              </span>
            </div>
          ))}
        </div>
      </FadeIn>

      <MemberSetupForm />
    </main>
  );
}
