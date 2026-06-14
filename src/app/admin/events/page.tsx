"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";

interface Event {
  id: string;
  name: string;
  location: string;
  startTime: string;
  endTime: string;
  status: string;
  ticketTypes: { id: string; name: string; price: number; quantity: number; soldCount: number }[];
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events?all=true")
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .finally(() => setLoading(false));
  }, []);

  const togglePublish = async (id: string) => {
    await fetch(`/api/events/${id}/publish`, { method: "PATCH" });
    const res = await fetch("/api/events?all=true");
    const data = await res.json();
    setEvents(data.events || []);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("确定要删除此活动吗？")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setEvents(events.filter((e) => e.id !== id));
  };

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "destructive" }> = {
    DRAFT: { label: "草稿", variant: "secondary" },
    PUBLISHED: { label: "已发布", variant: "success" },
    CANCELLED: { label: "已取消", variant: "destructive" },
    ENDED: { label: "已结束", variant: "default" },
  };

  if (loading) return <div className="p-6">加载中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">活动管理</h1>
        <Link href="/admin/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            创建活动
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>暂无活动，点击上方按钮创建第一个活动</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">活动名称</th>
                <th className="text-left p-3 text-sm font-medium">时间</th>
                <th className="text-left p-3 text-sm font-medium">地点</th>
                <th className="text-left p-3 text-sm font-medium">状态</th>
                <th className="text-left p-3 text-sm font-medium">票种/已售</th>
                <th className="text-right p-3 text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const status = statusMap[event.status] || statusMap.DRAFT;
                const totalTickets = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);
                const totalSold = event.ticketTypes.reduce((s, t) => s + t.soldCount, 0);
                return (
                  <tr key={event.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{event.name}</div>
                      {event.ticketTypes.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatPrice(Math.min(...event.ticketTypes.map((t) => t.price)))} 起
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-sm">{formatDate(event.startTime)}</td>
                    <td className="p-3 text-sm">{event.location}</td>
                    <td className="p-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="p-3 text-sm">{totalSold}/{totalTickets}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePublish(event.id)}
                          title={event.status === "PUBLISHED" ? "取消发布" : "发布"}
                        >
                          {event.status === "PUBLISHED" ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/events/${event.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
