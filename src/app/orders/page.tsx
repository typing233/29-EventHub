"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  buyerName: string;
  createdAt: string;
  event: { id: string; name: string };
  orderItems: { quantity: number; ticketType: { name: string } }[];
  tickets: { id: string }[];
}

const statusMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  PENDING: { label: "待支付", variant: "warning" },
  PAID: { label: "已支付", variant: "success" },
  CANCELLED: { label: "已取消", variant: "destructive" },
  REFUNDED: { label: "已退款", variant: "default" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-8">加载中...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>暂无订单</p>
          <Link href="/events" className="text-primary hover:underline text-sm mt-2 inline-block">
            浏览活动
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusMap[order.status] || statusMap.PENDING;
            return (
              <Link key={order.id} href={`/orders/${order.id}/success`}>
                <div className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {order.orderNumber}
                    </span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="font-medium">{order.event.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {order.orderItems.map((item) => `${item.ticketType.name} × ${item.quantity}`).join(", ")}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
                    <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
