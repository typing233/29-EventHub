"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRCodeDisplay({ token }: { token: string }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/api/tickets/validate?token=${token}`;
    QRCode.toDataURL(url, { width: 280, margin: 2 }).then(setDataUrl);
  }, [token]);

  if (!dataUrl) return <div className="w-[280px] h-[280px] bg-muted animate-pulse rounded" />;

  return <img src={dataUrl} alt="票券二维码" className="w-[280px] h-[280px]" />;
}
