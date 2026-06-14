import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { eventSchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: { orderBy: { sortOrder: "asc" } },
      organizer: { select: { id: true, name: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "活动不存在" }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PUT(
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
    const result = eventSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...result.data,
        startTime: new Date(result.data.startTime),
        endTime: new Date(result.data.endTime),
      },
    });

    return NextResponse.json({ event: updated });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
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

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
