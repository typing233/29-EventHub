import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
  name: z.string().min(1, "请输入姓名"),
});

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export const eventSchema = z.object({
  name: z.string().min(1, "请输入活动名称"),
  description: z.string().optional(),
  location: z.string().min(1, "请输入活动地点"),
  coverImage: z.string().optional(),
  startTime: z.string().min(1, "请选择开始时间"),
  endTime: z.string().min(1, "请选择结束时间"),
});

export const ticketTypeSchema = z.object({
  name: z.string().min(1, "请输入票种名称"),
  description: z.string().optional(),
  price: z.number().min(0, "价格不能为负数"),
  quantity: z.number().int().min(1, "数量至少为1"),
  sortOrder: z.number().int().optional(),
});

export const checkoutSchema = z.object({
  eventId: z.string().uuid(),
  buyerName: z.string().min(1, "请输入购票人姓名"),
  buyerEmail: z.string().email("请输入有效的邮箱"),
  buyerPhone: z.string().optional(),
  items: z.array(
    z.object({
      ticketTypeId: z.string().uuid(),
      quantity: z.number().int().min(1),
    })
  ).min(1, "请至少选择一种票"),
});
