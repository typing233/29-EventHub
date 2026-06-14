import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EmbedWidget } from "@/components/embed/EmbedWidget";

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { ticketTypes: { orderBy: { sortOrder: "asc" } } },
  });

  if (!event || event.status !== "PUBLISHED") {
    notFound();
  }

  return <EmbedWidget event={event} />;
}
