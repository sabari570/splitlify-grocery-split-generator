"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { nanoid } from "nanoid";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MotionCard } from "@/components/ui/MotionCard";
import { Spinner } from "@/components/ui/Spinner";
import type { InvoiceItem } from "@/lib/types";

interface InvoiceUploaderProps {
  onParsed: (items: InvoiceItem[]) => void;
  onManualItem: (item: InvoiceItem) => void;
}

export function InvoiceUploader({
  onParsed,
  onManualItem,
}: InvoiceUploaderProps) {
  const reduceMotion = useReducedMotion();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualQuantity, setManualQuantity] = useState("1");
  const [manualAmount, setManualAmount] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setError(null);
    setShowSuccess(false);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-invoice", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to parse invoice.");
      }

      const payload = (await response.json()) as { items: InvoiceItem[] };
      onParsed(payload.items);
      setShowSuccess(true);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to parse invoice.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setManualError(null);

    const name = manualName.trim();
    const quantity = Number.parseInt(manualQuantity, 10);
    const totalAmount = Number.parseFloat(manualAmount);

    if (!name) {
      setManualError("Item name is required.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity < 1) {
      setManualError("Quantity must be at least 1.");
      return;
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      setManualError("Total amount must be greater than 0.");
      return;
    }

    onManualItem({
      id: nanoid(),
      name,
      quantity,
      totalAmount: Math.round(totalAmount * 100) / 100,
      sharedBy: [],
    });

    setManualName("");
    setManualQuantity("1");
    setManualAmount("");
    setShowManualForm(false);
  }

  return (
    <MotionCard title="Upload invoice">
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          Upload a Zepto PDF invoice to extract items, or add items manually.
        </p>

        <label
          className={`group relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center transition hover:border-emerald-400/40 hover:bg-emerald-500/5 ${
            isUploading ? "shimmer" : ""
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 text-2xl">
            📄
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-200">
              {isUploading ? "Parsing invoice..." : "Drop or tap to upload PDF"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">Zepto invoice PDFs work best</p>
          </div>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>

        {fileName ? (
          <p className="text-sm text-zinc-400">Selected: {fileName}</p>
        ) : null}

        {isUploading ? <Spinner label="Extracting line items..." /> : null}

        <AnimatePresence>
          {showSuccess ? (
            <motion.p
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm font-medium text-emerald-300"
            >
              ✓ Items extracted successfully
            </motion.p>
          ) : null}
        </AnimatePresence>

        {error ? <p className="text-sm text-rose-400">{error}</p> : null}

        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowManualForm((current) => !current)}
        >
          {showManualForm ? "Cancel manual entry" : "+ Add item manually"}
        </Button>

        <AnimatePresence initial={false}>
          {showManualForm ? (
            <motion.form
              key="manual-form"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              onSubmit={handleManualSubmit}
              className="space-y-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <Input
                label="Item name"
                type="text"
                value={manualName}
                onChange={(event) => setManualName(event.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Quantity"
                  type="number"
                  min={1}
                  value={manualQuantity}
                  onChange={(event) => setManualQuantity(event.target.value)}
                  required
                />
                <Input
                  label="Total (₹)"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={manualAmount}
                  onChange={(event) => setManualAmount(event.target.value)}
                  required
                />
              </div>
              <Button type="submit">Add item</Button>
              {manualError ? (
                <p className="text-sm text-rose-400">{manualError}</p>
              ) : null}
            </motion.form>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionCard>
  );
}
