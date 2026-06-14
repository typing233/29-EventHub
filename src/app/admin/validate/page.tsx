"use client";

import { useState, useRef } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);

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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    let extractedToken = token.trim();
    const urlMatch = extractedToken.match(/token=([^&]+)/);
    if (urlMatch) {
      extractedToken = urlMatch[1];
    }

    validate(extractedToken);
  };

  const startCamera = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setResult({ valid: false, error: "无法访问摄像头" });
      setScanning(false);
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">扫码验票</h1>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Mode Switch */}
        <div className="flex gap-2">
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            onClick={() => { setMode("manual"); stopCamera(); }}
          >
            <Keyboard className="h-4 w-4 mr-2" />
            手动输入
          </Button>
          <Button
            variant={mode === "camera" ? "default" : "outline"}
            onClick={() => { setMode("camera"); startCamera(); }}
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

        {/* Camera */}
        {mode === "camera" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">摄像头扫码</CardTitle>
            </CardHeader>
            <CardContent>
              {scanning ? (
                <div className="space-y-4">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-md" />
                  <p className="text-sm text-muted-foreground text-center">
                    将二维码对准摄像头（需安装 html5-qrcode 实现实时解码）
                  </p>
                  <Button variant="outline" onClick={stopCamera} className="w-full">
                    停止扫描
                  </Button>
                </div>
              ) : (
                <Button onClick={startCamera} className="w-full">
                  开始扫描
                </Button>
              )}
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
                    <p className="text-xs text-red-400 mt-1">使用时间：{result.usedAt}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
