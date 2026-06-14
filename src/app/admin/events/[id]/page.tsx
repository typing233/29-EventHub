"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EventForm } from "@/components/events/EventForm";
import { TicketTypeManager } from "@/components/events/TicketTypeManager";

interface EventData {
  id: string;
  name: string;
  description: string;
  location: string;
  coverImage: string;
  startTime: string;
  endTime: string;
}

export default function EditEventPage() {
  const params = useParams();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.event) {
          setEvent({
            ...data.event,
            startTime: new Date(data.event.startTime).toISOString().slice(0, 16),
            endTime: new Date(data.event.endTime).toISOString().slice(0, 16),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-6">加载中...</div>;
  if (!event) return <div className="p-6">活动不存在</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">编辑活动</h1>
        <EventForm
          eventId={event.id}
          initialData={{
            name: event.name,
            description: event.description || "",
            location: event.location,
            coverImage: event.coverImage || "",
            startTime: event.startTime,
            endTime: event.endTime,
          }}
        />
      </div>

      <hr />

      <div>
        <h2 className="text-xl font-bold mb-4">票种管理</h2>
        <TicketTypeManager eventId={event.id} />
      </div>
    </div>
  );
}
