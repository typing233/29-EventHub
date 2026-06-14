import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = getUserFromRequest(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  const { action } = await request.json();
  if (!action || !["cancel", "refund"].includes(action)) {
    return NextResponse.json({ error: "无效操作，支持: cancel, refund" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { event: true, orderItems: true },
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  // Organizer can only manage their own events' orders
  if (user.role === "ORGANIZER" && order.event.organizerId !== user.userId) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  if (action === "cancel") {
    if (order.status !== "PENDING" && order.status !== "PAID") {
      return NextResponse.json(
        { error: `无法取消状态为"${order.status}"的订单` },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // If order was paid, restore ticket type inventory
      if (order.status === "PAID") {
        for (const item of order.orderItems) {
          await tx.ticketType.update({
            where: { id: item.ticketTypeId },
            data: { soldCount: { decrement: item.quantity } },
          });
        }
      }

      // Cancel all associated tickets
      await tx.ticket.updateMany({
        where: { orderId: id, status: "VALID" },
        data: { status: "CANCELLED" },
      });

      // Update order status
      await tx.order.update({
        where: { id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
    });

    return NextResponse.json({ success: true, status: "CANCELLED" });
  }

  if (action === "refund") {
    if (order.status !== "PAID") {
      return NextResponse.json(
        { error: "只能退款已支付的订单" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Restore ticket type inventory
      for (const item of order.orderItems) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { soldCount: { decrement: item.quantity } },
        });
      }

      // Cancel all associated tickets (both VALID and USED)
      await tx.ticket.updateMany({
        where: { orderId: id, status: { in: ["VALID", "USED"] } },
        data: { status: "CANCELLED" },
      });

      // Update order status
      await tx.order.update({
        where: { id },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true, status: "REFUNDED" });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
