import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { eventSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const all = searchParams.get("all");

  const user = getUserFromRequest(request);

  let where: Record<string, unknown> = { status: "PUBLISHED" };

  if (all === "true" && user && (user.role === "ADMIN" || user.role === "ORGANIZER")) {
    where = user.role === "ADMIN" ? {} : { organizerId: user.userId };
    if (status) where.status = status;
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      ticketTypes: { orderBy: { sortOrder: "asc" } },
      organizer: { select: { id: true, name: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user || (user.role !== "ADMIN" && user.role !== "ORGANIZER")) {
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

    const event = await prisma.event.create({
      data: {
        ...result.data,
        startTime: new Date(result.data.startTime),
        endTime: new Date(result.data.endTime),
        organizerId: user.userId,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建活动失败" }, { status: 500 });
  }
}
