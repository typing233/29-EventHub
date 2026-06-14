import { EventForm } from "@/components/events/EventForm";

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">创建活动</h1>
      <EventForm />
    </div>
  );
}
