"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { MotionCard } from "@/components/ui/MotionCard";
import { formatRupee } from "@/lib/formatRupee";
import { downloadQrCode, sharePaymentQr } from "@/lib/sharePayment";

interface PaymentLinkCardProps {
  memberName: string;
  amount: number;
  upiLink: string;
  qrCodeDataUrl: string;
}

export function PaymentLinkCard({
  memberName,
  amount,
  upiLink,
  qrCodeDataUrl,
}: PaymentLinkCardProps) {
  const reduceMotion = useReducedMotion();
  const [isSharing, setIsSharing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (amount <= 0) {
    return null;
  }

  const amountLabel = formatRupee(amount);

  async function handleShare() {
    setIsSharing(true);
    setFeedback(null);

    try {
      const result = await sharePaymentQr({
        memberName,
        amountLabel,
        upiLink,
        qrCodeDataUrl,
      });

      if (result === "shared") {
        setFeedback("Shared");
      } else if (result === "whatsapp") {
        setFeedback("Opened WhatsApp");
      }
    } catch {
      setFeedback("Could not share. Try download instead.");
    } finally {
      setIsSharing(false);
    }
  }

  function handleDownload() {
    downloadQrCode(qrCodeDataUrl, memberName);
    setFeedback("QR downloaded");
  }

  return (
    <MotionCard title={memberName} glow>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div>
            <p className="text-sm text-zinc-400">Amount owed</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-emerald-300">
              {amountLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={upiLink}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-violet-400"
            >
              Pay via UPI →
            </a>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void handleShare()}
              disabled={isSharing}
            >
              {isSharing ? "Sharing..." : "Share"}
            </Button>
          </div>

          {feedback ? (
            <p className="text-sm text-emerald-300/90">{feedback}</p>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="rounded-2xl border border-white/10 bg-white/5 p-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeDataUrl}
              alt={`UPI QR code for ${memberName}`}
              className="h-32 w-32 rounded-xl"
            />
          </motion.div>
          <Button
            type="button"
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={handleDownload}
            aria-label={`Download QR code for ${memberName}`}
          >
            Download QR
          </Button>
        </div>
      </div>
    </MotionCard>
  );
}
