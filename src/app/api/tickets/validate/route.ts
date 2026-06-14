import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ valid: false, error: "缺少验证码" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode: token },
    include: {
      order: {
        include: {
          event: { select: { id: true, name: true, organizerId: true } },
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ valid: false, error: "无效票券" }, { status: 404 });
  }

  if (user.role === "ORGANIZER" && ticket.order.event.organizerId !== user.userId) {
    return NextResponse.json({ valid: false, error: "权限不足" }, { status: 403 });
  }

  if (ticket.status === "USED") {
    return NextResponse.json({
      valid: false,
      error: "票券已使用",
      usedAt: ticket.usedAt,
      ticketNumber: ticket.ticketNumber,
      event: ticket.order.event.name,
    });
  }

  if (ticket.status === "CANCELLED") {
    return NextResponse.json({ valid: false, error: "票券已取消" });
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "USED", usedAt: new Date() },
  });

  return NextResponse.json({
    valid: true,
    ticketNumber: ticket.ticketNumber,
    event: ticket.order.event.name,
    buyerName: ticket.order.buyerName,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "缺少token" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { qrCode: token },
    select: { id: true, ticketNumber: true, status: true },
  });

  if (!ticket) {
    return NextResponse.json({ valid: false, error: "无效票券" });
  }

  return NextResponse.json({
    valid: ticket.status === "VALID",
    status: ticket.status,
    ticketNumber: ticket.ticketNumber,
  });
}
