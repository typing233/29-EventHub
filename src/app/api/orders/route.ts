import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all");

  let where: Record<string, unknown> = { userId: user.userId };

  if (all === "true" && (user.role === "ADMIN" || user.role === "ORGANIZER")) {
    if (user.role === "ADMIN") {
      where = {};
    } else {
      const events = await prisma.event.findMany({
        where: { organizerId: user.userId },
        select: { id: true },
      });
      where = { eventId: { in: events.map((e) => e.id) } };
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      event: { select: { id: true, name: true } },
      orderItems: {
        include: { ticketType: { select: { name: true } } },
      },
      tickets: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}
