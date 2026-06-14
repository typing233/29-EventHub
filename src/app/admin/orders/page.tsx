"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { Search, Ban, RotateCcw } from "lucide-react";

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = () => {
    fetch("/api/orders?all=true")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId: string, action: "cancel" | "refund") => {
    const confirmMsg = action === "cancel" ? "确定要取消此订单吗？关联票券将失效。" : "确定要退款此订单吗？关联票券将失效。";
    if (!confirm(confirmMsg)) return;

    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "操作失败");
        return;
      }

      fetchOrders();
    } catch {
      alert("网络错误");
    } finally {
      setActionLoading(null);
    }
  };

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
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
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
            { value: "CANCELLED", label: "已取消" },
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
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">订单号</th>
                <th className="text-left p-3 text-sm font-medium">活动</th>
                <th className="text-left p-3 text-sm font-medium">买家</th>
                <th className="text-left p-3 text-sm font-medium">金额</th>
                <th className="text-left p-3 text-sm font-medium">状态</th>
                <th className="text-left p-3 text-sm font-medium">时间</th>
                <th className="text-right p-3 text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const status = statusMap[order.status] || statusMap.PENDING;
                const isProcessing = actionLoading === order.id;
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
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {order.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleStatusChange(order.id, "cancel")}
                            title="取消订单"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            取消
                          </Button>
                        )}
                        {order.status === "PAID" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleStatusChange(order.id, "cancel")}
                              title="取消订单"
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              取消
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleStatusChange(order.id, "refund")}
                              title="退款"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              退款
                            </Button>
                          </>
                        )}
                        {(order.status === "CANCELLED" || order.status === "REFUNDED") && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
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
