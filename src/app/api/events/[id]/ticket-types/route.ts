import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { ticketTypeSchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ticketTypes = await prisma.ticketType.findMany({
    where: { eventId: id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ ticketTypes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "活动不存在" }, { status: 404 });
  }

  if (user.role !== "ADMIN" && event.organizerId !== user.userId) {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = ticketTypeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const ticketType = await prisma.ticketType.create({
      data: {
        ...result.data,
        eventId: id,
      },
    });

    return NextResponse.json({ ticketType }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建票种失败" }, { status: 500 });
  }
}
