import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { generateTicketNumber } from "@/lib/order-number";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "No orderId in metadata" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order || order.status !== "PENDING") {
      return NextResponse.json({ received: true });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.orderItems) {
        const ticketType = await tx.ticketType.findUniqueOrThrow({
          where: { id: item.ticketTypeId },
        });
        if (ticketType.soldCount + item.quantity > ticketType.quantity) {
          throw new Error(`票种库存不足`);
        }
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { soldCount: { increment: item.quantity } },
        });
      }

      const tickets = [];
      for (const item of order.orderItems) {
        for (let i = 0; i < item.quantity; i++) {
          tickets.push({
            orderId: order.id,
            ticketNumber: generateTicketNumber(),
            qrCode: crypto.randomUUID(),
          });
        }
      }
      await tx.ticket.createMany({ data: tickets });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          stripePaymentId: session.payment_intent as string,
        },
      });
    });
  }

  return NextResponse.json({ received: true });
}
