"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Camera, Keyboard } from "lucide-react";

interface ValidationResult {
  valid: boolean;
  error?: string;
  ticketNumber?: string;
  event?: string;
  buyerName?: string;
  usedAt?: string;
}

export default function ValidatePage() {
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const validate = async (qrToken: string) => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: qrToken }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, error: "网络错误" });
    } finally {
      setLoading(false);
    }
  };

  const extractToken = (text: string): string => {
    const urlMatch = text.match(/token=([^&]+)/);
    if (urlMatch) return urlMatch[1];
    const uuidMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch) return uuidMatch[0];
    return text.trim();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    validate(extractToken(token));
  };

  const startCamera = async () => {
    setScanning(true);
    setResult(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scannerId = "qr-reader";

      await new Promise((resolve) => setTimeout(resolve, 100));

      const html5QrCode = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          const extractedToken = extractToken(decodedText);
          html5QrCode.stop().then(() => {
            html5QrCodeRef.current = null;
            setScanning(false);
            validate(extractedToken);
          });
        },
        () => {}
      );
    } catch (err) {
      console.error("Camera error:", err);
      setResult({ valid: false, error: "无法访问摄像头，请检查权限设置" });
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    const scanner = html5QrCodeRef.current as { stop: () => Promise<void> } | null;
    if (scanner) {
      try {
        await scanner.stop();
      } catch { /* already stopped */ }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      const scanner = html5QrCodeRef.current as { stop: () => Promise<void> } | null;
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  const switchMode = (newMode: "manual" | "camera") => {
    if (newMode === mode) return;
    if (mode === "camera") stopCamera();
    setMode(newMode);
    setResult(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">扫码验票</h1>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Mode Switch */}
        <div className="flex gap-2">
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            onClick={() => switchMode("manual")}
          >
            <Keyboard className="h-4 w-4 mr-2" />
            手动输入
          </Button>
          <Button
            variant={mode === "camera" ? "default" : "outline"}
            onClick={() => switchMode("camera")}
          >
            <Camera className="h-4 w-4 mr-2" />
            摄像头扫码
          </Button>
        </div>

        {/* Manual Input */}
        {mode === "manual" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">输入票券信息</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="输入票券二维码内容或 token"
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "验证中..." : "验证"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Camera QR Scanner */}
        {mode === "camera" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">摄像头扫码</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  id="qr-reader"
                  ref={scannerRef}
                  className="w-full overflow-hidden rounded-md"
                />
                {!scanning ? (
                  <Button onClick={startCamera} className="w-full">
                    开始扫描
                  </Button>
                ) : (
                  <Button variant="outline" onClick={stopCamera} className="w-full">
                    停止扫描
                  </Button>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  将票券二维码对准摄像头，识别后自动验票
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card className={result.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <CardContent className="p-6 text-center">
              {result.valid ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-green-700 mb-2">验证通过</h3>
                  <div className="space-y-1 text-sm text-green-600">
                    <p>票号：{result.ticketNumber}</p>
                    <p>活动：{result.event}</p>
                    <p>持票人：{result.buyerName}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-red-700 mb-2">验证失败</h3>
                  <p className="text-sm text-red-600">{result.error}</p>
                  {result.usedAt && (
                    <p className="text-xs text-red-400 mt-1">
                      使用时间：{new Date(result.usedAt).toLocaleString("zh-CN")}
                    </p>
                  )}
                </>
              )}

              {/* Allow scanning next ticket */}
              {mode === "camera" && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => { setResult(null); startCamera(); }}
                >
                  继续扫描下一张
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
