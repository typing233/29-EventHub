import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const where = user.role === "ADMIN" ? {} : { event: { organizerId: user.userId } };

  const [revenue, orderCount, ticketCount] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "PAID", ...where },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.count({ where: { status: "PAID", ...where } }),
    prisma.ticket.count({ where: { order: { status: "PAID", ...where } } }),
  ]);

  return NextResponse.json({
    totalRevenue: revenue._sum.totalAmount || 0,
    orderCount,
    ticketCount,
  });
}
