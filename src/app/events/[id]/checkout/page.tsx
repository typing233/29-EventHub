"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  soldCount: number;
}

interface Event {
  id: string;
  name: string;
  location: string;
  startTime: string;
  ticketTypes: TicketType[];
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.event) {
          setEvent(data.event);
          const q: Record<string, number> = {};
          data.event.ticketTypes.forEach((tt: TicketType) => { q[tt.id] = 0; });
          setQuantities(q);
        }
      });
  }, [params.id]);

  if (!event) return <div className="container mx-auto px-4 py-8">加载中...</div>;

  const updateQuantity = (id: string, delta: number) => {
    setQuantities((prev) => {
      const tt = event.ticketTypes.find((t) => t.id === id)!;
      const available = tt.quantity - tt.soldCount;
      const newVal = Math.max(0, Math.min(available, (prev[id] || 0) + delta));
      return { ...prev, [id]: newVal };
    });
  };

  const totalAmount = event.ticketTypes.reduce(
    (sum, tt) => sum + tt.price * (quantities[tt.id] || 0),
    0
  );

  const hasItems = Object.values(quantities).some((q) => q > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasItems) {
      setError("请至少选择一种票");
      return;
    }
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
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/orders/${data.orderId}/success`);
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">购买门票</h1>
        <p className="text-muted-foreground mb-8">{event.name}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>
          )}

          {/* Ticket Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">选择票种</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.ticketTypes.map((tt) => {
                const available = tt.quantity - tt.soldCount;
                return (
                  <div key={tt.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <div className="font-medium">{tt.name}</div>
                      {tt.description && (
                        <div className="text-xs text-muted-foreground">{tt.description}</div>
                      )}
                      <div className="text-sm font-semibold text-primary mt-1">
                        {tt.price === 0 ? "免费" : formatPrice(tt.price)}
                      </div>
                      <div className="text-xs text-muted-foreground">剩余 {available} 张</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(tt.id, -1)}
                        disabled={!quantities[tt.id]}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{quantities[tt.id] || 0}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(tt.id, 1)}
                        disabled={available <= (quantities[tt.id] || 0)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Buyer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">购票人信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">姓名 *</label>
                <Input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="输入姓名"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">邮箱 *</label>
                <Input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">手机号</label>
                <Input
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="可选"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">订单摘要</CardTitle>
            </CardHeader>
            <CardContent>
              {event.ticketTypes
                .filter((tt) => quantities[tt.id] > 0)
                .map((tt) => (
                  <div key={tt.id} className="flex justify-between py-2 text-sm">
                    <span>{tt.name} × {quantities[tt.id]}</span>
                    <span>{formatPrice(tt.price * quantities[tt.id])}</span>
                  </div>
                ))}
              <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                <span>合计</span>
                <span className="text-primary text-lg">{formatPrice(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={loading || !hasItems}>
            {loading ? "处理中..." : totalAmount === 0 ? "确认获取" : `支付 ${formatPrice(totalAmount)}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
