import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { DollarSign, ShoppingCart, Ticket, TrendingUp } from "lucide-react";

export default async function StatsPage() {
  const [revenue, orderCount, ticketsSold, eventStats] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.ticket.count(),
    prisma.event.findMany({
      include: {
        orders: {
          where: { status: "PAID" },
          select: { totalAmount: true },
        },
        ticketTypes: {
          select: { name: true, soldCount: true, quantity: true, price: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalRevenue = revenue._sum.totalAmount || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">销售统计</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已付订单数</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">售出票数</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketsSold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均客单价</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orderCount > 0 ? formatPrice(Math.round(totalRevenue / orderCount)) : "¥0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Event Stats */}
      <Card>
        <CardHeader>
          <CardTitle>按活动统计</CardTitle>
        </CardHeader>
        <CardContent>
          {eventStats.length === 0 ? (
            <p className="text-muted-foreground">暂无数据</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">活动</th>
                    <th className="text-left p-3 text-sm font-medium">票种</th>
                    <th className="text-right p-3 text-sm font-medium">已售/总量</th>
                    <th className="text-right p-3 text-sm font-medium">收入</th>
                  </tr>
                </thead>
                <tbody>
                  {eventStats.map((event) => {
                    const eventRevenue = event.orders.reduce((s, o) => s + o.totalAmount, 0);
                    const totalSold = event.ticketTypes.reduce((s, t) => s + t.soldCount, 0);
                    const totalQty = event.ticketTypes.reduce((s, t) => s + t.quantity, 0);
                    return (
                      <tr key={event.id} className="border-t">
                        <td className="p-3 font-medium">{event.name}</td>
                        <td className="p-3 text-sm">
                          {event.ticketTypes.map((t) => (
                            <div key={t.name} className="text-muted-foreground">
                              {t.name}: {t.soldCount}/{t.quantity}
                            </div>
                          ))}
                        </td>
                        <td className="p-3 text-right text-sm">{totalSold}/{totalQty}</td>
                        <td className="p-3 text-right text-sm font-medium">{formatPrice(eventRevenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
