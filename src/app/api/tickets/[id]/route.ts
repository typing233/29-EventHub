import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          buyerName: true,
          buyerEmail: true,
          event: { select: { name: true, location: true, startTime: true } },
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "票券不存在" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}
