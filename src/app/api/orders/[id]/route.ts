import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      event: { select: { id: true, name: true, location: true, startTime: true } },
      orderItems: {
        include: { ticketType: { select: { name: true } } },
      },
      tickets: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  const user = getUserFromRequest(request);
  if (user && user.role !== "ADMIN" && order.userId !== user.userId) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  return NextResponse.json({ order });
}
