import QRCode from "qrcode";

const TRANSACTION_NOTE = "Splitlify split";

export function buildUpiLink(
  vpa: string,
  amount: number,
  name: string,
): string {
  const params = new URLSearchParams();
  params.set("pa", vpa.trim());
  params.set("pn", name.trim());
  params.set("am", amount.toFixed(2));
  params.set("cu", "INR");
  params.set("tn", TRANSACTION_NOTE);

  return `upi://pay?${params.toString()}`;
}

export async function generateQrCodeDataUrl(
  payload: string,
): Promise<string> {
  return QRCode.toDataURL(payload, {
    margin: 2,
    width: 280,
    errorCorrectionLevel: "M",
  });
}
