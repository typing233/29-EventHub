import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User } from "lucide-react";
import Link from "next/link";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: { orderBy: { sortOrder: "asc" } },
      organizer: { select: { name: true } },
    },
  });

  if (!event || event.status === "DRAFT") {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Cover Image */}
        <div className="aspect-[21/9] bg-muted rounded-xl overflow-hidden mb-8">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🎉
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-3xl font-bold">{event.name}</h1>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>{formatDate(event.startTime)} - {formatDate(event.endTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-5 w-5" />
                <span>主办方：{event.organizer.name}</span>
              </div>
            </div>

            {event.description && (
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold mb-3">活动详情</h2>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Ticket Section */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4 sticky top-4">
              <h2 className="font-semibold text-lg mb-4">票种</h2>
              {event.ticketTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无票种</p>
              ) : (
                <div className="space-y-3">
                  {event.ticketTypes.map((tt) => {
                    const available = tt.quantity - tt.soldCount;
                    return (
                      <div key={tt.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <div>
                          <div className="font-medium text-sm">{tt.name}</div>
                          {tt.description && (
                            <div className="text-xs text-muted-foreground">{tt.description}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-primary">
                            {tt.price === 0 ? "免费" : formatPrice(tt.price)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {available > 0 ? `剩余 ${available}` : "已售罄"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {event.ticketTypes.some((tt) => tt.quantity - tt.soldCount > 0) && (
                <Link href={`/events/${event.id}/checkout`} className="block mt-4">
                  <Button className="w-full" size="lg">
                    立即购票
                  </Button>
                </Link>
              )}

              {event.ticketTypes.every((tt) => tt.quantity - tt.soldCount <= 0) && event.ticketTypes.length > 0 && (
                <Badge variant="destructive" className="w-full justify-center mt-4 py-2">
                  已售罄
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
