"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  buyerName: string;
  buyerEmail: string;
  createdAt: string;
  event: { name: string };
  orderItems: { quantity: number; ticketType: { name: string } }[];
  tickets: { id: string; ticketNumber: string; status: string }[];
}

const statusMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" }> = {
  PENDING: { label: "待支付", variant: "warning" },
  PAID: { label: "已支付", variant: "success" },
  CANCELLED: { label: "已取消", variant: "destructive" },
  REFUNDED: { label: "已退款", variant: "default" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/orders?all=true")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((order) => {
    const matchSearch = !search ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      order.buyerEmail.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">订单管理</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索订单号、买家姓名或邮箱"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {[
            { value: "", label: "全部" },
            { value: "PAID", label: "已支付" },
            { value: "PENDING", label: "待支付" },
            { value: "REFUNDED", label: "已退款" },
          ].map((f) => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">暂无订单</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">订单号</th>
                <th className="text-left p-3 text-sm font-medium">活动</th>
                <th className="text-left p-3 text-sm font-medium">买家</th>
                <th className="text-left p-3 text-sm font-medium">金额</th>
                <th className="text-left p-3 text-sm font-medium">状态</th>
                <th className="text-left p-3 text-sm font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const status = statusMap[order.status] || statusMap.PENDING;
                return (
                  <tr key={order.id} className="border-t">
                    <td className="p-3 font-mono text-sm">{order.orderNumber}</td>
                    <td className="p-3 text-sm">{order.event.name}</td>
                    <td className="p-3">
                      <div className="text-sm">{order.buyerName}</div>
                      <div className="text-xs text-muted-foreground">{order.buyerEmail}</div>
                    </td>
                    <td className="p-3 text-sm font-medium">{formatPrice(order.totalAmount)}</td>
                    <td className="p-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{formatDate(order.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        共 {filtered.length} 条订单
      </div>
    </div>
  );
}
