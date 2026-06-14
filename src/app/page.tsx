import { prisma } from "@/lib/prisma";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Ticket, Shield } from "lucide-react";

export default async function HomePage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED" },
    include: { ticketTypes: { orderBy: { sortOrder: "asc" } } },
    orderBy: { startTime: "asc" },
    take: 6,
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            发现精彩活动，轻松购票
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            EventHub 为您提供一站式活动管理与票务解决方案，轻松创建活动、销售门票、管理订单
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/events">
              <Button size="lg">浏览活动</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline" size="lg">创建活动</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">活动管理</h3>
            <p className="text-sm text-muted-foreground">轻松创建和发布活动，支持多种票种定制</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">在线售票</h3>
            <p className="text-sm text-muted-foreground">安全支付，即时出票，电子二维码验证入场</p>
          </div>
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">嵌入组件</h3>
            <p className="text-sm text-muted-foreground">一行代码嵌入任何网站，无缝售票体验</p>
          </div>
        </div>
      </section>

      {/* Event Listing */}
      {events.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">即将举办</h2>
              <Link href="/events">
                <Button variant="ghost">查看全部 →</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
