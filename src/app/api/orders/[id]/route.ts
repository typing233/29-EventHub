import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

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

  // Only order owner or admin can view
  if (user.role !== "ADMIN" && order.userId !== user.userId) {
    // Organizer can see orders for their events
    if (user.role === "ORGANIZER") {
      const event = await prisma.event.findUnique({ where: { id: order.eventId } });
      if (!event || event.organizerId !== user.userId) {
        return NextResponse.json({ error: "权限不足" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }
  }

  return NextResponse.json({ order });
}
