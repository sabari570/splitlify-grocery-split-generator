export async function dataUrlToFile(
  dataUrl: string,
  filename: string,
): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/png" });
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function buildShareMessage(
  memberName: string,
  amountLabel: string,
  upiLink: string,
): string {
  return [
    `Hi ${memberName}, please pay ${amountLabel} for our Splitlify grocery split.`,
    "",
    `Pay via UPI: ${upiLink}`,
  ].join("\n");
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export async function sharePaymentQr(input: {
  memberName: string;
  amountLabel: string;
  upiLink: string;
  qrCodeDataUrl: string;
}): Promise<"shared" | "whatsapp" | "cancelled"> {
  const { memberName, amountLabel, upiLink, qrCodeDataUrl } = input;
  const text = buildShareMessage(memberName, amountLabel, upiLink);
  const title = `Pay ${amountLabel}`;
  const safeName = memberName.trim().replace(/\s+/g, "-").toLowerCase() || "member";

  try {
    const file = await dataUrlToFile(
      qrCodeDataUrl,
      `${safeName}-upi-qr.png`,
    );

    const shareData: ShareData = {
      title,
      text,
      files: [file],
    };

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare(shareData)
    ) {
      await navigator.share(shareData);
      return "shared";
    }
  } catch (error) {
    if (isAbortError(error)) {
      return "cancelled";
    }
    // Fall through to WhatsApp text share.
  }

  if (typeof window !== "undefined") {
    window.open(buildWhatsAppShareUrl(text), "_blank", "noopener,noreferrer");
  }

  return "whatsapp";
}

export function downloadQrCode(
  qrCodeDataUrl: string,
  memberName: string,
): void {
  const safeName = memberName.trim().replace(/\s+/g, "-").toLowerCase() || "member";
  const link = document.createElement("a");
  link.href = qrCodeDataUrl;
  link.download = `${safeName}-upi-qr.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
