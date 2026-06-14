"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  soldCount: number;
  sortOrder: number;
}

export function TicketTypeManager({ eventId }: { eventId: string }) {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", quantity: "", sortOrder: "0" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTicketTypes = () => {
    fetch(`/api/events/${eventId}/ticket-types`)
      .then((r) => r.json())
      .then((data) => setTicketTypes(data.ticketTypes || []));
  };

  useEffect(() => { fetchTicketTypes(); }, [eventId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}/ticket-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          price: Math.round(parseFloat(form.price) * 100),
          quantity: parseInt(form.quantity),
          sortOrder: parseInt(form.sortOrder) || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "创建失败");
        return;
      }

      setForm({ name: "", description: "", price: "", quantity: "", sortOrder: "0" });
      setShowForm(false);
      fetchTicketTypes();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (typeId: string) => {
    if (!confirm("确定要删除此票种吗？")) return;
    await fetch(`/api/events/${eventId}/ticket-types/${typeId}`, { method: "DELETE" });
    fetchTicketTypes();
  };

  return (
    <div className="space-y-4">
      {ticketTypes.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">票种名称</th>
                <th className="text-left p-3 text-sm font-medium">价格</th>
                <th className="text-left p-3 text-sm font-medium">总量</th>
                <th className="text-left p-3 text-sm font-medium">已售</th>
                <th className="text-right p-3 text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {ticketTypes.map((tt) => (
                <tr key={tt.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{tt.name}</div>
                    {tt.description && (
                      <div className="text-xs text-muted-foreground">{tt.description}</div>
                    )}
                  </td>
                  <td className="p-3 text-sm">{formatPrice(tt.price)}</td>
                  <td className="p-3 text-sm">{tt.quantity}</td>
                  <td className="p-3 text-sm">{tt.soldCount}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tt.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!showForm ? (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加票种
        </Button>
      ) : (
        <form onSubmit={handleAdd} className="border rounded-lg p-4 space-y-4 max-w-lg">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium">票种名称 *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如：普通票、VIP票"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">描述</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="票种说明（可选）"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">价格（元）*</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">数量 *</label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="100"
                required
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "添加中..." : "添加票种"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              取消
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
