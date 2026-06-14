import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { ticketTypeSchema } from "@/lib/validators";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  const { id, typeId } = await params;
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

    const ticketType = await prisma.ticketType.update({
      where: { id: typeId },
      data: result.data,
    });

    return NextResponse.json({ ticketType });
  } catch {
    return NextResponse.json({ error: "更新票种失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  const { id, typeId } = await params;
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

  await prisma.ticketType.delete({ where: { id: typeId } });
  return NextResponse.json({ success: true });
}
