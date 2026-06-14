"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { CheckCircle, Ticket } from "lucide-react";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
  event: { id: string; name: string; location: string; startTime: string };
  orderItems: { quantity: number; unitPrice: number; ticketType: { name: string } }[];
  tickets: { id: string; ticketNumber: string; status: string }[];
}

export default function OrderSuccessPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderData | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((data) => setOrder(data.order || null));
  }, [params.id]);

  if (!order) return <div className="container mx-auto px-4 py-8">加载中...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">购票成功！</h1>
        <p className="text-muted-foreground mb-8">订单号：{order.orderNumber}</p>

        <Card className="text-left mb-6">
          <CardHeader>
            <CardTitle className="text-lg">订单详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">活动</span>
              <span className="font-medium">{order.event.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">时间</span>
              <span>{formatDate(order.event.startTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">地点</span>
              <span>{order.event.location}</span>
            </div>
            <div className="border-t pt-3">
              {order.orderItems.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>{item.ticketType.name} × {item.quantity}</span>
                  <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>合计</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {order.tickets.length > 0 && (
          <Card className="text-left mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                电子票券
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <span className="font-mono text-sm">{ticket.ticketNumber}</span>
                  <Badge variant="success">有效</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 justify-center">
          <Link href="/events">
            <Button variant="outline">浏览更多活动</Button>
          </Link>
          <Link href="/orders">
            <Button>查看我的订单</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
