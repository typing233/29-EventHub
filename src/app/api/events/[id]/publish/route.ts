import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(
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

  const newStatus = event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  const updated = await prisma.event.update({
    where: { id },
    data: { status: newStatus },
  });

  return NextResponse.json({ event: updated });
}
