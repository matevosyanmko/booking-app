import type { Booking, BookingInput } from "@/domain/booking/types";
import { ApiError, ConflictError, NotFoundError, ValidationError } from "./errors";

const BASE = "/api/bookings"; // swap for a real API base URL

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  } catch {
    throw new ApiError(0, "Network error. Check your connection and try again.");
  }
  if (res.ok) return (res.status === 204 ? undefined : await res.json()) as T;
  const body = await res.json().catch(() => ({}));
  if (res.status === 409) throw new ConflictError(body.conflicts ?? []);
  if (res.status === 404) throw new NotFoundError();
  if (res.status === 422 || res.status === 400) throw new ValidationError(body.errors ?? []);
  throw new ApiError(res.status);
}

export const bookingsClient = {
  list: (date: string) => request<Booking[]>(`${BASE}?date=${encodeURIComponent(date)}`),
  create: (input: BookingInput) => request<Booking>(BASE, { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: BookingInput) => request<Booking>(`${BASE}/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`${BASE}/${id}`, { method: "DELETE" }),
};
