import type { Booking } from "@/domain/booking/types";
// Module state is kept on globalThis so it survives Next.js dev hot reloads.
// NOTE: on serverless hosts (Vercel) instances do not share memory; see README.
const g = globalThis as unknown as { __bookings?: Map<string, Booking> };
export const store: Map<string, Booking> = (g.__bookings ??= new Map());
export const byDate = (date: string) =>
  [...store.values()].filter((b) => b.date === date).sort((a, b) => a.start.localeCompare(b.start));
export const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));
