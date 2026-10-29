import { NextResponse } from "next/server";
import { findConflicts, validateBooking } from "@/domain/booking/rules";
import type { Booking, BookingInput } from "@/domain/booking/types";
import { byDate } from "./store";

/** Demo hook: a title containing "!conflict" makes the server answer 409 even if the slot is free. */
export const FORCE_CONFLICT = "!conflict";

export function checkBooking(input: BookingInput, excludeId?: string): NextResponse | null {
  const existing = byDate(input.date);
  const errors = validateBooking(input, existing, { excludeId });
  if (errors.includes("OVERLAP")) {
    const conflicts: Booking[] = findConflicts(input, existing, excludeId);
    return NextResponse.json({ code: "CONFLICT", message: "Time slot is already booked", conflicts }, { status: 409 });
  }
  if (errors.length) return NextResponse.json({ code: "VALIDATION", errors }, { status: 422 });
  if (input.title?.includes(FORCE_CONFLICT))
    return NextResponse.json({ code: "CONFLICT", message: "Simulated conflict", conflicts: [] }, { status: 409 });
  return null;
}
