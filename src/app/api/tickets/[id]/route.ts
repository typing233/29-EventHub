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

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          userId: true,
          buyerName: true,
          buyerEmail: true,
          event: { select: { name: true, location: true, startTime: true, organizerId: true } },
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "票券不存在" }, { status: 404 });
  }

  // Only ticket owner, admin, or event organizer can view
  if (user.role !== "ADMIN") {
    if (ticket.order.userId !== user.userId) {
      if (user.role === "ORGANIZER" && ticket.order.event.organizerId === user.userId) {
        // organizer can view
      } else {
        return NextResponse.json({ error: "权限不足" }, { status: 403 });
      }
    }
  }

  return NextResponse.json({ ticket });
}
