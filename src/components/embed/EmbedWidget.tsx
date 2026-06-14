"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, formatDate } from "@/lib/utils";
import { Minus, Plus, MapPin, Clock } from "lucide-react";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  soldCount: number;
}

interface EventData {
  id: string;
  name: string;
  location: string;
  startTime: Date;
  endTime: Date;
  coverImage: string | null;
  ticketTypes: TicketType[];
}

export function EmbedWidget({ event }: { event: EventData }) {
  const [step, setStep] = useState<"select" | "info" | "done">("select");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const tt = event.ticketTypes.find((t) => t.id === id)!;
      const available = tt.quantity - tt.soldCount;
      const newVal = Math.max(0, Math.min(available, (prev[id] || 0) + delta));
      return { ...prev, [id]: newVal };
    });
  };

  const totalAmount = event.ticketTypes.reduce(
    (sum, tt) => sum + tt.price * (quantities[tt.id] || 0), 0
  );
  const hasItems = Object.values(quantities).some((q) => q > 0);

  const handleCheckout = async () => {
    setError("");
    setLoading(true);

    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          buyerName,
          buyerEmail,
          buyerPhone: buyerPhone || undefined,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "下单失败");
        return;
      }

      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
      }

      setOrderId(data.orderId);
      setStep("done");
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2">购票成功！</h2>
        <p className="text-sm text-gray-500 mb-4">请查看邮箱获取票券信息</p>
        <a
          href={`${window.location.origin}/orders/${orderId}/success`}
          target="_blank"
          className="text-blue-600 hover:underline text-sm"
        >
          查看订单详情 →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto font-sans">
      {/* Event Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold">{event.name}</h2>
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatDate(event.startTime)}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <MapPin className="h-3.5 w-3.5" />
          <span>{event.location}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4">{error}</div>
      )}

      {step === "select" && (
        <div className="space-y-3">
          {event.ticketTypes.map((tt) => {
            const available = tt.quantity - tt.soldCount;
            return (
              <div key={tt.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <div className="font-medium text-sm">{tt.name}</div>
                  <div className="text-sm text-blue-600 font-semibold">
                    {tt.price === 0 ? "免费" : formatPrice(tt.price)}
                  </div>
                  <div className="text-xs text-gray-400">剩余 {available}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => updateQuantity(tt.id, -1)} disabled={!quantities[tt.id]}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{quantities[tt.id] || 0}</span>
                  <Button type="button" variant="outline" size="icon" className="h-7 w-7"
                    onClick={() => updateQuantity(tt.id, 1)} disabled={available <= (quantities[tt.id] || 0)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}

          {hasItems && (
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold">合计：{formatPrice(totalAmount)}</span>
              <Button onClick={() => setStep("info")}>下一步</Button>
            </div>
          )}
        </div>
      )}

      {step === "info" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">姓名 *</label>
            <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="输入姓名" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">邮箱 *</label>
            <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">手机号</label>
            <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="可选" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("select")}>返回</Button>
            <Button onClick={handleCheckout} disabled={loading || !buyerName || !buyerEmail} className="flex-1">
              {loading ? "处理中..." : `支付 ${formatPrice(totalAmount)}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
