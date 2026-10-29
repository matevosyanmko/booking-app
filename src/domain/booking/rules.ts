import type { Booking, BookingInput } from "./types";
import { isDateBefore, isSameDate, isValidDate, minutesOfDay, toDateStr, toMinutes } from "./time";

export { isValidDate } from "./time";

export const WORK_START = 9 * 60;
export const WORK_END = 18 * 60;
export const MIN_DURATION = 30;
export const MAX_DURATION = 120;
export const STEP = 30;
export const MAX_TITLE = 100;

export type ErrorCode =
  | "INVALID_FORMAT"
  | "OUT_OF_WORKDAY"
  | "END_BEFORE_START"
  | "TOO_SHORT"
  | "TOO_LONG"
  | "PAST"
  | "OVERLAP"
  | "TITLE_TOO_LONG";

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_FORMAT: "Date or time has an invalid format.",
  OUT_OF_WORKDAY: "Booking must be within 09:00–18:00.",
  END_BEFORE_START: "End time must be after start time.",
  TOO_SHORT: "Minimum duration is 30 minutes.",
  TOO_LONG: "Maximum duration is 2 hours.",
  PAST: "Past time cannot be booked.",
  OVERLAP: "This time overlaps with another booking.",
  TITLE_TOO_LONG: `Title must be at most ${MAX_TITLE} characters.`,
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Half-open intervals: touching boundaries (11:00 / 11:00) do not overlap. */
export const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) =>
  toMinutes(a.start) < toMinutes(b.end) && toMinutes(a.end) > toMinutes(b.start);

/** Bookings that collide with `candidate`. Pass `excludeId` when editing so a booking never conflicts with itself. */
export const findConflicts = (candidate: BookingInput, existing: Booking[], excludeId?: string): Booking[] =>
  existing.filter((b) => b.id !== excludeId && b.date === candidate.date && overlaps(candidate, b));

export const isPastSlot = (date: string, start: string, now: Date = new Date()): boolean => {
  const today = toDateStr(now);
  if (isDateBefore(date, today)) return true;
  return isSameDate(date, today) && toMinutes(start) < minutesOfDay(now);
};

export function validateBooking(
  input: BookingInput,
  existing: Booking[],
  opts: { now?: Date; excludeId?: string } = {},
): ErrorCode[] {
  if (!isValidDate(input.date) || !TIME_RE.test(input.start) || !TIME_RE.test(input.end)) return ["INVALID_FORMAT"];
  const errors: ErrorCode[] = [];
  const s = toMinutes(input.start);
  const e = toMinutes(input.end);
  if (s < WORK_START || e > WORK_END) errors.push("OUT_OF_WORKDAY");
  if (s >= e) errors.push("END_BEFORE_START");
  else {
    if (e - s < MIN_DURATION) errors.push("TOO_SHORT");
    if (e - s > MAX_DURATION) errors.push("TOO_LONG");
  }
  if (isPastSlot(input.date, input.start, opts.now)) errors.push("PAST");
  if ((input.title ?? "").length > MAX_TITLE) errors.push("TITLE_TOO_LONG");
  if (s < e && findConflicts(input, existing, opts.excludeId).length) errors.push("OVERLAP");
  return errors;
}

/** Existing bookings whose start has passed are read-only. */
export const isEditable = (b: Booking, now: Date = new Date()) => !isPastSlot(b.date, b.start, now);
