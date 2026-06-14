"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { QRCodeDisplay } from "@/components/tickets/QRCodeDisplay";

interface TicketData {
  id: string;
  ticketNumber: string;
  qrCode: string;
  status: string;
  usedAt: string | null;
  order: {
    buyerName: string;
    buyerEmail: string;
    event: { name: string; location: string; startTime: string };
  };
}

export default function TicketPage() {
  const params = useParams();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tickets/${params.id}`)
      .then((r) => r.json())
      .then((data) => setTicket(data.ticket || null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">加载中...</div>;
  if (!ticket) return <div className="container mx-auto px-4 py-8 text-center">票券不存在</div>;

  const statusMap: Record<string, { label: string; variant: "success" | "destructive" | "default" }> = {
    VALID: { label: "有效", variant: "success" },
    USED: { label: "已使用", variant: "default" },
    CANCELLED: { label: "已取消", variant: "destructive" },
  };
  const status = statusMap[ticket.status] || statusMap.VALID;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">电子票券</CardTitle>
            <Badge variant={status.variant} className="mx-auto mt-2">
              {status.label}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <QRCodeDisplay token={ticket.qrCode} />
            </div>

            {/* Ticket Number */}
            <div className="text-center">
              <div className="font-mono text-lg font-bold">{ticket.ticketNumber}</div>
            </div>

            {/* Event Info */}
            <div className="space-y-2 text-sm border-t pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">活动</span>
                <span className="font-medium">{ticket.order.event.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">时间</span>
                <span>{formatDate(ticket.order.event.startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">地点</span>
                <span>{ticket.order.event.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">持票人</span>
                <span>{ticket.order.buyerName}</span>
              </div>
            </div>

            {ticket.usedAt && (
              <div className="text-center text-sm text-muted-foreground border-t pt-4">
                使用时间：{formatDate(ticket.usedAt)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
