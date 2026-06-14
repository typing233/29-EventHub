import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@eventhub.com" },
    update: {},
    create: {
      email: "admin@eventhub.com",
      passwordHash: adminPassword,
      name: "管理员",
      role: "ADMIN",
    },
  });

  // Create organizer user
  const orgPassword = await bcrypt.hash("org123", 12);
  const organizer = await prisma.user.upsert({
    where: { email: "organizer@eventhub.com" },
    update: {},
    create: {
      email: "organizer@eventhub.com",
      passwordHash: orgPassword,
      name: "活动主办方",
      role: "ORGANIZER",
    },
  });

  // Create sample events
  const event1 = await prisma.event.create({
    data: {
      organizerId: organizer.id,
      name: "2024 技术大会",
      description: "汇聚行业顶尖技术专家，分享前沿技术趋势与实践经验。涵盖人工智能、云计算、区块链等热门话题。",
      location: "北京国际会议中心",
      startTime: new Date("2025-03-15T09:00:00"),
      endTime: new Date("2025-03-15T18:00:00"),
      status: "PUBLISHED",
      ticketTypes: {
        create: [
          { name: "普通票", price: 29900, quantity: 200, sortOrder: 0, description: "含午餐及会议资料" },
          { name: "VIP票", price: 59900, quantity: 50, sortOrder: 1, description: "含午餐、晚宴及VIP座位" },
          { name: "学生票", price: 9900, quantity: 100, sortOrder: 2, description: "需出示学生证" },
        ],
      },
    },
  });

  const event2 = await prisma.event.create({
    data: {
      organizerId: organizer.id,
      name: "周末音乐节",
      description: "享受一个充满音乐与欢乐的周末，多位知名音乐人现场演出。",
      location: "上海世博公园",
      startTime: new Date("2025-04-20T14:00:00"),
      endTime: new Date("2025-04-21T22:00:00"),
      status: "PUBLISHED",
      ticketTypes: {
        create: [
          { name: "单日票", price: 19900, quantity: 500, sortOrder: 0 },
          { name: "两日通票", price: 34900, quantity: 300, sortOrder: 1 },
          { name: "VIP通票", price: 88800, quantity: 50, sortOrder: 2, description: "含前排座位及后台参观" },
        ],
      },
    },
  });

  const event3 = await prisma.event.create({
    data: {
      organizerId: admin.id,
      name: "免费编程工作坊",
      description: "适合初学者的编程入门工作坊，手把手教你写出第一个程序。",
      location: "深圳科技园创客空间",
      startTime: new Date("2025-05-10T10:00:00"),
      endTime: new Date("2025-05-10T16:00:00"),
      status: "PUBLISHED",
      ticketTypes: {
        create: [
          { name: "免费入场", price: 0, quantity: 30, sortOrder: 0, description: "需自带笔记本电脑" },
        ],
      },
    },
  });

  console.log("Seed completed:");
  console.log(`  Admin: admin@eventhub.com / admin123`);
  console.log(`  Organizer: organizer@eventhub.com / org123`);
  console.log(`  Events: ${event1.name}, ${event2.name}, ${event3.name}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
