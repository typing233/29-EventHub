import { prisma } from "@/lib/prisma";
import { EventCard } from "@/components/events/EventCard";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    include: { ticketTypes: { orderBy: { sortOrder: "asc" } } },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">活动列表</h1>

      {events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">暂无活动</p>
          <p className="text-sm mt-2">敬请期待更多精彩活动</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
