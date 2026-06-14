import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";

interface TicketType {
  price: number;
}

interface Event {
  id: string;
  name: string;
  location: string;
  coverImage: string | null;
  startTime: string | Date;
  ticketTypes: TicketType[];
}

export function EventCard({ event }: { event: Event }) {
  const minPrice = event.ticketTypes.length > 0
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : null;

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <div className="aspect-[16/9] bg-muted relative overflow-hidden">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
              🎉
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1">{event.name}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDate(event.startTime)}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{event.location}</span>
          </div>
          {minPrice !== null && (
            <Badge variant="secondary" className="mt-2">
              {minPrice === 0 ? "免费" : `${formatPrice(minPrice)} 起`}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
