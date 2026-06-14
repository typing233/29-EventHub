import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ShoppingCart, Ticket, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default async function AdminDashboard() {
  const [eventCount, orderCount, ticketCount, revenue] = await Promise.all([
    prisma.event.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.ticket.count({ where: { status: "VALID" } }),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { totalAmount: true },
    }),
  ]);

  const stats = [
    { label: "活动总数", value: eventCount, icon: Calendar },
    { label: "已付订单", value: orderCount, icon: ShoppingCart },
    { label: "有效票券", value: ticketCount, icon: Ticket },
    { label: "总收入", value: formatPrice(revenue._sum.totalAmount || 0), icon: DollarSign },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理后台</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
