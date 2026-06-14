import { nanoid } from "nanoid";
import { format } from "date-fns";

export function generateOrderNumber(): string {
  const date = format(new Date(), "yyyyMMdd");
  const random = nanoid(6).toUpperCase();
  return `EH-${date}-${random}`;
}

export function generateTicketNumber(): string {
  return `TKT-${nanoid(8).toUpperCase()}`;
}
